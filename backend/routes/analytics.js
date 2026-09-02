import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req, res) => {
  try {
    // 1. Core Summary Cards
    const totalRequests = await prisma.emergencyRequest.count();
    const activeRequests = await prisma.emergencyRequest.count({
      where: { status: { not: 'RESOLVED' } },
    });
    const resolvedRequests = await prisma.emergencyRequest.count({
      where: { status: 'RESOLVED' },
    });
    const escalatedRequests = await prisma.emergencyRequest.count({
      where: { escalationLevel: { gt: 0 } },
    });

    // 2. Category Distribution
    const categories = ['MEDICAL', 'FIRE', 'SECURITY', 'ACCIDENT', 'HARASSMENT', 'OTHER'];
    const categoryCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await prisma.emergencyRequest.count({ where: { type: cat } });
        return { name: cat, value: count };
      })
    );

    // 3. Status Distribution
    const statuses = ['REPORTED', 'RESPONDER_ASSIGNED', 'RESPONDER_EN_ROUTE', 'RESPONDER_ARRIVED', 'RESOLVED'];
    const statusCounts = await Promise.all(
      statuses.map(async (stat) => {
        const count = await prisma.emergencyRequest.count({ where: { status: stat } });
        return { status: stat, count };
      })
    );

    // 4. Hotspots (by manualLocation name)
    const requests = await prisma.emergencyRequest.findMany({
      select: { manualLocation: true },
    });
    const locationFrequency = {};
    requests.forEach((req) => {
      const loc = req.manualLocation || 'Unknown Coordinates';
      locationFrequency[loc] = (locationFrequency[loc] || 0) + 1;
    });
    const hotspots = Object.keys(locationFrequency).map((loc) => ({
      location: loc,
      count: locationFrequency[loc],
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // 5. Hourly Distribution (Peak Hours)
    const timeRequests = await prisma.emergencyRequest.findMany({
      select: { createdAt: true },
    });
    const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, count: 0 }));
    timeRequests.forEach((req) => {
      const hour = new Date(req.createdAt).getHours();
      hourlyCounts[hour].count += 1;
    });

    // 6. Responder Performance Leaderboard
    const responders = await prisma.responder.findMany({
      include: {
        user: { select: { name: true } },
      },
    });

    const leaderboard = responders.map((r) => {
      const avgResponseSeconds = r.resolvedCount > 0 ? Math.round(r.responseTimeSum / r.resolvedCount) : 0;
      return {
        id: r.id,
        name: r.user.name,
        role: r.role,
        rating: r.rating,
        resolvedCount: r.resolvedCount,
        avgResponseMinutes: Math.round((avgResponseSeconds / 60) * 10) / 10,
      };
    }).sort((a, b) => b.resolvedCount - a.resolvedCount);

    // 7. Overall System Response Times
    const resolvedReqs = await prisma.emergencyRequest.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: { not: null },
      },
      include: {
        assignments: {
          where: { status: 'ACCEPTED' },
        },
      },
    });

    let totalResponseSec = 0;
    let minResponseSec = Infinity;
    let maxResponseSec = 0;
    let countedIncidents = 0;

    resolvedReqs.forEach((req) => {
      const acceptedAssignment = req.assignments[0];
      if (acceptedAssignment && req.resolvedAt) {
        const durationSec = Math.floor(
          (new Date(req.resolvedAt).getTime() - new Date(acceptedAssignment.assignedAt).getTime()) / 1000
        );
        totalResponseSec += durationSec;
        if (durationSec < minResponseSec) minResponseSec = durationSec;
        if (durationSec > maxResponseSec) maxResponseSec = durationSec;
        countedIncidents++;
      }
    });

    const avgResponseTimeMin = countedIncidents > 0 
      ? Math.round((totalResponseSec / countedIncidents / 60) * 10) / 10 
      : 0;

    res.json({
      summary: {
        totalRequests,
        activeRequests,
        resolvedRequests,
        escalatedRequests,
        avgResponseTimeMinutes: avgResponseTimeMin,
        fastestResponseMinutes: minResponseSec === Infinity ? 0 : Math.round((minResponseSec / 60) * 10) / 10,
        slowestResponseMinutes: Math.round((maxResponseSec / 60) * 10) / 10,
      },
      categoryDistribution: categoryCounts,
      statusDistribution: statusCounts,
      hotspots,
      hourlyDistribution: hourlyCounts,
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
