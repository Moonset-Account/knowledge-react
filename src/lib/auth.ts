import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const PERMISSIONS = {
  READ_DOCUMENTS: 'read:documents',
  CREATE_DOCUMENTS: 'create:documents',
  EDIT_DOCUMENTS: 'edit:documents',
  DELETE_DOCUMENTS: 'delete:documents',
  PUBLISH_DOCUMENTS: 'publish:documents',
  REVIEW_DOCUMENTS: 'review:documents',

  READ_COMMENTS: 'read:comments',
  CREATE_COMMENTS: 'create:comments',
  DELETE_OWN_COMMENTS: 'delete:own_comments',
  DELETE_ALL_COMMENTS: 'delete:all_comments',

  READ_USERS: 'read:users',
  CREATE_USERS: 'create:users',
  EDIT_USERS: 'edit:users',
  DELETE_USERS: 'delete:users',

  READ_ROLES: 'read:roles',
  CREATE_ROLES: 'create:roles',
  EDIT_ROLES: 'edit:roles',
  DELETE_ROLES: 'delete:roles',

  READ_CATEGORIES: 'read:categories',
  CREATE_CATEGORIES: 'create:categories',
  EDIT_CATEGORIES: 'edit:categories',
  DELETE_CATEGORIES: 'delete:categories',

  READ_TAGS: 'read:tags',
  CREATE_TAGS: 'create:tags',
  EDIT_TAGS: 'edit:tags',
  DELETE_TAGS: 'delete:tags',

  READ_LOGS: 'read:logs',
  READ_FEEDBACKS: 'read:feedbacks',

  ADMIN_DASHBOARD: 'admin:dashboard',
};

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });

  return user;
}

export async function isAdmin(user?: any) {
  const currentUser = user || await getCurrentUser();
  return currentUser?.role?.name === 'ADMIN';
}

export async function getUserPermissions(user?: any) {
  const currentUser = user || await getCurrentUser();
  if (!currentUser?.role) return [];

  try {
    return JSON.parse(currentUser.role.permissions || '[]');
  } catch {
    return [];
  }
}

export async function hasPermission(permission: string, user?: any) {
  const currentUser = user || await getCurrentUser();

  if (await isAdmin(currentUser)) {
    return true;
  }

  const permissions = await getUserPermissions(currentUser);
  return permissions.includes(permission) || permissions.includes('*');
}

export async function requirePermission(permission: string) {
  const hasPerm = await hasPermission(permission);
  if (!hasPerm) {
    throw new Error(`权限不足，需要: ${permission}`);
  }
  return true;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('请先登录');
  }
  return session;
}

export async function requireAdmin() {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    throw new Error('需要管理员权限');
  }
  return true;
}

export async function getDocumentVisibilityFilter(user?: any) {
  const currentUser = user || await getCurrentUser();

  if (await isAdmin(currentUser)) {
    return {};
  }

  const baseFilter: any = {
    OR: [
      {
        accessRoles: {
          none: {},
        },
      },
    ],
  };

  if (currentUser?.roleId) {
    baseFilter.OR.push({
      accessRoles: {
        some: {
          id: currentUser.roleId,
        },
      },
    });
  }

  if (currentUser) {
    baseFilter.AND = [
      {
        OR: [
          { published: true },
          { status: 'PUBLISHED' },
          { authorId: currentUser.id },
        ],
      },
    ];
  } else {
    baseFilter.AND = [
      {
        OR: [
          { published: true },
          { status: 'PUBLISHED' },
        ],
      },
    ];
  }

  return baseFilter;
}

export async function canAccessDocument(documentId: string) {
  const user = await getCurrentUser();

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { accessRoles: true },
  });

  if (!document) return false;

  if (await isAdmin(user)) {
    return true;
  }

  if (document.accessRoles.length === 0) {
    if (document.status === 'PUBLISHED' || document.published) {
      return true;
    }
    if (user && document.authorId === user.id) {
      return true;
    }
    return false;
  }

  if (!user) return false;

  return document.accessRoles.some(role => role.id === user.roleId);
}

export async function canDeleteComment(commentId: string) {
  const user = await getCurrentUser();
  if (!user) return false;

  if (await hasPermission(PERMISSIONS.DELETE_ALL_COMMENTS, user)) {
    return true;
  }

  if (await hasPermission(PERMISSIONS.DELETE_OWN_COMMENTS, user)) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    return comment?.userId === user.id;
  }

  return false;
}
