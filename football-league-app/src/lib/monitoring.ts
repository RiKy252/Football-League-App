import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function logAction(
  userId: number,
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  entity: string,
  entityId?: number,
  details?: string
) {
  try {
    await prisma.log.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
      },
    });
  } catch (error) {
    console.error('Error logging action:', error);
  }
}

export async function checkUserActivity() {
  const ONE_DAY_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get all users
  const users = await prisma.user.findMany({
    include: {
      logs: {
        where: {
          createdAt: {
            gte: ONE_DAY_AGO,
          },
          // Only include non-READ operations
          action: {
            in: ['CREATE', 'UPDATE', 'DELETE']
          }
        },
      },
    },
  });

  // Calculate thresholds
  const ACTION_THRESHOLD = 50; // Maximum CREATE/UPDATE/DELETE actions per day
  const DELETE_THRESHOLD = 20;  // Maximum deletes per day
  const CREATE_THRESHOLD = 30;  // Maximum creates per day
  const UPDATE_THRESHOLD = 40;  // Maximum updates per day

  console.log(`Checking activity for ${users.length} users...`);

  for (const user of users) {
    const totalModifyActions = user.logs.length;
    const deleteActions = user.logs.filter((log: any) => log.action === 'DELETE').length;
    const createActions = user.logs.filter((log: any) => log.action === 'CREATE').length;
    const updateActions = user.logs.filter((log: any) => log.action === 'UPDATE').length;

    // Log the counts for debugging
    if (totalModifyActions > 0) {
      console.log(`User ${user.id}: ${totalModifyActions} modify actions, ${createActions} creates, ${updateActions} updates, ${deleteActions} deletes`);
    }

    // Check if user exceeds thresholds
    let isSuspicious = false;
    const suspiciousReasons = [];

    if (totalModifyActions > ACTION_THRESHOLD) {
      isSuspicious = true;
      suspiciousReasons.push(`${totalModifyActions} total modify actions (threshold: ${ACTION_THRESHOLD})`);
    }
    
    if (deleteActions > DELETE_THRESHOLD) {
      isSuspicious = true;
      suspiciousReasons.push(`${deleteActions} DELETE actions (threshold: ${DELETE_THRESHOLD})`);
    }

    if (createActions > CREATE_THRESHOLD) {
      isSuspicious = true;
      suspiciousReasons.push(`${createActions} CREATE actions (threshold: ${CREATE_THRESHOLD})`);
    }

    if (updateActions > UPDATE_THRESHOLD) {
      isSuspicious = true;
      suspiciousReasons.push(`${updateActions} UPDATE actions (threshold: ${UPDATE_THRESHOLD})`);
    }

    if (isSuspicious) {
      console.log(`Marking user ${user.id} as monitored due to: ${suspiciousReasons.join(', ')}`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { isMonitored: true },
      });
    }
  }
}

// Function to get monitored users (admin only)
export async function getMonitoredUsers() {
  return prisma.user.findMany({
    where: { isMonitored: true },
    select: {
      id: true,
      email: true,
      role: true,
      isMonitored: true,
      logs: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          // Only include non-READ operations for monitoring
          action: {
            in: ['CREATE', 'UPDATE', 'DELETE']
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
} 