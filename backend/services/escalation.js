import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configurable time limits in seconds (shortened for demo presentation)
export const ESCALATION_CONFIG = {
  LEVEL_1_TIMEOUT: 20, // 20s: Escalate to Campus Security
  LEVEL_2_TIMEOUT: 40, // 40s: Escalate to Faculty Coordinator
  LEVEL_3_TIMEOUT: 60, // 60s: Escalate to Administrator
};

export async function checkAndEscalate(io) {
  try {
    const now = new Date();

    // Get all unresolved emergency requests
    const activeRequests = await prisma.emergencyRequest.findMany({
      where: {
        status: {
          notIn: ['RESOLVED'],
        },
      },
      include: {
        assignments: {
          where: { status: 'PENDING' },
          include: { responder: { include: { user: true } } },
        },
      },
    });

    for (const req of activeRequests) {
      const elapsedSeconds = Math.floor((now.getTime() - new Date(req.createdAt).getTime()) / 1000);
      let newLevel = req.escalationLevel;
      let reason = '';

      if (req.escalationLevel === 0 && elapsedSeconds >= ESCALATION_CONFIG.LEVEL_1_TIMEOUT) {
        newLevel = 1;
        reason = 'No responder accepted the emergency within the first response window.';
      } else if (req.escalationLevel === 1 && elapsedSeconds >= ESCALATION_CONFIG.LEVEL_2_TIMEOUT) {
        newLevel = 2;
        reason = 'Emergency remains unacknowledged or unaddressed by initial responders.';
      } else if (req.escalationLevel === 2 && elapsedSeconds >= ESCALATION_CONFIG.LEVEL_3_TIMEOUT) {
        newLevel = 3;
        reason = 'Critical time limit exceeded without resolution. High emergency response threat.';
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
        let escRoleName = 'Campus Security';
        if (newLevel === 2) escRoleName = 'Faculty Emergency Coordinator';
        if (newLevel === 3) escRoleName = 'Campus Administrator';

        await prisma.emergencyStatusHistory.create({
          data: {
            requestId: req.id,
            status: req.status, // keep current status but log escalation
            changedById: 3, // System Admin User ID (admin is user 3 in seed)
            timestamp: now,
            note: `System escalated emergency to level ${newLevel} (${escRoleName}). Reason: ${reason}`,
          },
        });

        // Create notification
        // Find users with the escalated roles
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
              title: `🚨 ESCALATED EMERGENCY: ${req.id}`,
              message: `Emergency type ${req.type} at ${req.manualLocation || 'Captured GPS'} has been escalated to you.`,
              type: 'CRITICAL',
            },
          });
        }

        // Add to Audit Log
        await prisma.auditLog.create({
          data: {
            userId: 3, // System Admin
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
  // Check every 5 seconds for responsive feel in demo
  intervalId = setInterval(() => checkAndEscalate(io), 5000);
  console.log('[SYSTEM] Automated Escalation Service Started.');
}

export function stopEscalationService() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[SYSTEM] Automated Escalation Service Stopped.');
  }
}
