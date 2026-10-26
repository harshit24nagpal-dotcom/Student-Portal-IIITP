import { PrismaClient } from '@prisma/client';
import { rankResponders } from './assignment.js';

const prisma = new PrismaClient();

// Configurable time limits in seconds (optimized for fast demo presentation and strict real-world SLAs)
export const ESCALATION_CONFIG = {
  RESPONDER_SLA_TIMEOUT: 25, // 25s: If responder does not accept, auto-expire & reassign to next responder
  LEVEL_1_TIMEOUT: 20,       // 20s: Level 1 - Escalate to Campus Security QRT
  LEVEL_2_TIMEOUT: 40,       // 40s: Level 2 - Escalate to Faculty Coordinator & Health Center
  LEVEL_3_TIMEOUT: 60,       // 60s: Level 3 - Red Alert: Escalate to Campus Director & All Security Units
};

export async function checkAndEscalate(io) {
  try {
    const now = new Date();

    // 1. Get all unresolved emergency requests
    const activeRequests = await prisma.emergencyRequest.findMany({
      where: {
        status: {
          notIn: ['RESOLVED'],
        },
      },
      include: {
        assignments: {
          include: {
            responder: {
              include: { user: { select: { id: true, name: true, contactNumber: true } } },
            },
          },
        },
      },
    });

    for (const req of activeRequests) {
      const elapsedSeconds = Math.floor((now.getTime() - new Date(req.createdAt).getTime()) / 1000);
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const actorId = adminUser ? adminUser.id : req.reporterId;

      // =====================================================================
      // PART A: UNRESPONSIVE RESPONDER TIMEOUT & AUTO-CASCADE REASSIGNMENT
      // =====================================================================
      // Check if there is a PENDING assignment that exceeded the 25s SLA
      const pendingAssignment = req.assignments?.find(a => a.status === 'PENDING');
      if (pendingAssignment) {
        const assignmentElapsed = Math.floor((now.getTime() - new Date(pendingAssignment.assignedAt).getTime()) / 1000);

        if (assignmentElapsed >= ESCALATION_CONFIG.RESPONDER_SLA_TIMEOUT) {
          console.log(`[CASCADE] Responder ${pendingAssignment.responder.user.name} missed 25s SLA on ${req.id}. Auto-cascading...`);

          // 1. Mark current assignment as EXPIRED
          await prisma.emergencyAssignment.update({
            where: { id: pendingAssignment.id },
            data: { status: 'EXPIRED' },
          });

          // 2. Log in status history
          await prisma.emergencyStatusHistory.create({
            data: {
              requestId: req.id,
              status: req.status,
              changedById: actorId,
              timestamp: now,
              note: `Responder ${pendingAssignment.responder.user.name} failed to accept within 25s SLA. Assignment auto-expired. Initiating emergency cascade...`,
            },
          });

          // 3. Find all available responders who haven't been assigned yet
          const assignedResponderIds = req.assignments.map(a => a.responderId);
          const candidateResponders = await prisma.responder.findMany({
            where: {
              id: { notIn: assignedResponderIds },
              availabilityStatus: 'AVAILABLE',
            },
            include: {
              user: { select: { id: true, name: true, contactNumber: true } },
              skills: true,
            },
          });

          const rankedCandidates = rankResponders(req.type, req.latitude, req.longitude, candidateResponders);
          const nextResponder = rankedCandidates[0];

          if (nextResponder) {
            console.log(`[CASCADE] Auto-assigning next best responder: ${nextResponder.user.name} for ${req.id}`);

            // Create new assignment
            const newAssignment = await prisma.emergencyAssignment.create({
              data: {
                requestId: req.id,
                responderId: nextResponder.id,
                status: 'PENDING',
                assignedAt: now,
              },
              include: {
                responder: {
                  include: { user: { select: { id: true, name: true, contactNumber: true } } },
                },
              },
            });

            // Update emergency status
            await prisma.emergencyRequest.update({
              where: { id: req.id },
              data: { status: 'RESPONDER_ASSIGNED' },
            });

            // Status history
            await prisma.emergencyStatusHistory.create({
              data: {
                requestId: req.id,
                status: 'RESPONDER_ASSIGNED',
                changedById: actorId,
                timestamp: now,
                note: `Emergency auto-cascaded to next ranked responder: ${nextResponder.user.name} (${nextResponder.role}, score: ${nextResponder.score}).`,
              },
            });

            // Critical notification to new responder
            await prisma.notification.create({
              data: {
                recipientId: nextResponder.userId,
                title: `🚨 EMERGENCY AUTO-CASCADED: ${req.id}`,
                message: `You have been auto-assigned a ${req.type} emergency at ${req.manualLocation || 'Campus Coordinates'}. Primary responder timed out!`,
                type: 'CRITICAL',
                category: 'EMERGENCY',
              },
            });

            // MULTI-CHANNEL TELEMETRY: Simulated Out-of-Band SMS Dispatch
            await prisma.notification.create({
              data: {
                recipientId: nextResponder.userId,
                title: `[SMS GATEWAY] Emergency Dispatch Transmitted`,
                message: `[SMS DISPATCH] Sent to ${nextResponder.user.name} (+${nextResponder.user.contactNumber}): "IIITP SOS: Critical ${req.type} emergency at ${req.manualLocation}. Respond within 25s!"`,
                type: 'INFO',
                category: 'SMS_GATEWAY',
              },
            });

            // MULTI-CHANNEL TELEMETRY: Simulated Out-of-Band IVR Call
            await prisma.notification.create({
              data: {
                recipientId: nextResponder.userId,
                title: `[IVR AUTO-DIALER] Priority Call Initiated`,
                message: `[IVR CALL] Emergency dispatch voice alert placed to ${nextResponder.user.name} (+${nextResponder.user.contactNumber}). Status: CONNECTED.`,
                type: 'INFO',
                category: 'IVR_DISPATCH',
              },
            });

            // Emit Socket event to notify all dashboards
            if (io) {
              io.emit('emergency_reassigned', {
                requestId: req.id,
                previousResponder: pendingAssignment.responder.user.name,
                newResponder: nextResponder.user.name,
                newResponderId: nextResponder.id,
                assignment: newAssignment,
                request: req,
              });
              io.emit('emergency_updated', {
                requestId: req.id,
                status: 'RESPONDER_ASSIGNED',
                request: req,
                assignment: newAssignment,
              });
            }
          } else {
            console.log(`[CASCADE] No individual candidate responders left for ${req.id}. Triggering ALL-CALL Red Alert!`);

            // Broadcast All-Call alert to all security staff
            const securityPersonnel = await prisma.user.findMany({
              where: { role: { in: ['SECURITY', 'ADMIN'] } },
            });

            for (const sec of securityPersonnel) {
              await prisma.notification.create({
                data: {
                  recipientId: sec.id,
                  title: `🚨 ALL-CALL SECURITY ALERT: ${req.id}`,
                  message: `No individual responders accepted ${req.id}! ALL ON-DUTY OFFICERS MUST IMMEDIATELY MOBILIZE TO: ${req.manualLocation || 'Campus Location'}!`,
                  type: 'CRITICAL',
                  category: 'EMERGENCY',
                },
              });
            }

            if (io) {
              io.emit('emergency_all_call', {
                requestId: req.id,
                message: `ALL-CALL DISPATCH: Immediate security mobilization required at ${req.manualLocation}!`,
                request: req,
              });
            }
          }
        }
      }

      // =====================================================================
      // PART B: TIMED ESCALATION LADDER (LEVELS 1, 2, AND 3)
      // =====================================================================
      let newLevel = req.escalationLevel;
      let reason = '';

      if (req.escalationLevel === 0 && elapsedSeconds >= ESCALATION_CONFIG.LEVEL_1_TIMEOUT) {
        newLevel = 1;
        reason = 'No responder acknowledged the emergency within initial 20s response SLA.';
      } else if (req.escalationLevel === 1 && elapsedSeconds >= ESCALATION_CONFIG.LEVEL_2_TIMEOUT) {
        newLevel = 2;
        reason = 'Emergency remains unaddressed past 40s. Escalated to Faculty Emergency Cell.';
      } else if (req.escalationLevel === 2 && elapsedSeconds >= ESCALATION_CONFIG.LEVEL_3_TIMEOUT) {
        newLevel = 3;
        reason = 'RED ALERT: 60s critical threshold exceeded without resolution. High emergency risk.';
      }

      if (newLevel !== req.escalationLevel) {
        console.log(`[ESCALATION] Escalating ${req.id} from Level ${req.escalationLevel} to ${newLevel}. Reason: ${reason}`);

        // Update Request
        const updatedRequest = await prisma.emergencyRequest.update({
          where: { id: req.id },
          data: {
            escalationLevel: newLevel,
            escalatedAt: now,
          },
        });

        // Add to Status History
        let escRoleName = 'Campus Security Quick Response Team';
        if (newLevel === 2) escRoleName = 'Faculty Emergency Coordinator & Medical Officer';
        if (newLevel === 3) escRoleName = 'Campus Director & All Security Units (RED ALERT)';

        await prisma.emergencyStatusHistory.create({
          data: {
            requestId: req.id,
            status: req.status,
            changedById: actorId,
            timestamp: now,
            note: `System escalated emergency to Level ${newLevel} (${escRoleName}). Reason: ${reason}`,
          },
        });

        // Target roles for notifications
        let targetRole = 'SECURITY';
        if (newLevel === 2) targetRole = 'FACULTY';
        if (newLevel === 3) targetRole = 'ADMIN';

        const targetUsers = await prisma.user.findMany({
          where: { role: targetRole },
        });

        for (const u of targetUsers) {
          await prisma.notification.create({
            data: {
              recipientId: u.id,
              title: `🚨 ESCALATED EMERGENCY [LEVEL ${newLevel}]: ${req.id}`,
              message: `Emergency type ${req.type} at ${req.manualLocation || 'GPS Coordinates'} has escalated to your attention. Elapsed time: ${elapsedSeconds}s.`,
              type: 'CRITICAL',
              category: 'EMERGENCY',
            },
          });
        }

        // Add to Audit Log
        await prisma.auditLog.create({
          data: {
            userId: actorId,
            action: `ESCALATION_LEVEL_${newLevel}`,
            details: `Emergency ID ${req.id} escalated to Level ${newLevel}. Elapsed time: ${elapsedSeconds} seconds.`,
          },
        });

        // Send WebSocket Notification
        if (io) {
          io.emit('emergency_escalated', {
            requestId: req.id,
            escalationLevel: newLevel,
            reason,
            elapsedSeconds,
            updatedRequest,
          });
          console.log(`[SOCKET] Emitted emergency_escalated for ${req.id}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in escalation check:', error);
  }
}

let intervalId = null;

export function startEscalationService(io) {
  if (intervalId) clearInterval(intervalId);
  // Check every 5 seconds for responsive real-time feel
  intervalId = setInterval(() => checkAndEscalate(io), 5000);
  console.log('[SYSTEM] Automated Escalation & Cascade Reassignment Service Started.');
}

export function stopEscalationService() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[SYSTEM] Automated Escalation Service Stopped.');
  }
}
