import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function createAuditLog({
  action,
  entityType,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT';
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const user = await getCurrentUser();

    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId: entityId || null,
        userId: user?.id || null,
        userName: user?.name || user?.email || null,
        userRole: user?.role?.name || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error('创建审计日志失败:', error);
  }
}

export const AuditLogActions = {
  CREATE: 'CREATE' as const,
  READ: 'READ' as const,
  UPDATE: 'UPDATE' as const,
  DELETE: 'DELETE' as const,
  LOGIN: 'LOGIN' as const,
  LOGOUT: 'LOGOUT' as const,
  APPROVE: 'APPROVE' as const,
  REJECT: 'REJECT' as const,
};

export const AuditLogEntityTypes = {
  DOCUMENT: 'Document',
  COMMENT: 'Comment',
  USER: 'User',
  ROLE: 'Role',
  CATEGORY: 'Category',
  TAG: 'Tag',
  FEEDBACK: 'Feedback',
  NOTIFICATION: 'Notification',
  BOOKMARK: 'Bookmark',
  LIKE: 'Like',
  SYSTEM: 'System',
};
