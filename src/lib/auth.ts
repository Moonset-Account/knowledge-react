import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

  if (!currentUser) {
    return {
      accessRoles: {
        none: {},
      },
    };
  }

  return {
    OR: [
      {
        accessRoles: {
          none: {},
        },
      },
      {
        accessRoles: {
          some: {
            id: currentUser.roleId || '',
          },
        },
      },
    ],
  };
}

export async function canAccessDocument(documentId: string) {
  const user = await getCurrentUser();
  
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { accessRoles: true },
  });

  if (!document) return false;

  if (document.accessRoles.length === 0) {
    return true;
  }

  if (!user) return false;

  return document.accessRoles.some(role => role.id === user.roleId);
}
