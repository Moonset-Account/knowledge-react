import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasPermission, PERMISSIONS } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('获取角色错误:', error);
    return NextResponse.json(
      { error: '获取角色失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    if (!(await hasPermission(PERMISSIONS.CREATE_ROLES))) {
      return NextResponse.json(
        { error: '权限不足，无法创建角色' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { error: '角色名称不能为空' },
        { status: 400 }
      );
    }

    const existingRole = await prisma.role.findUnique({
      where: { name: name.toUpperCase() },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: '角色名称已存在' },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        name: name.toUpperCase(),
        description,
        permissions: JSON.stringify(permissions || []),
      },
    });

    return NextResponse.json({ role, message: '角色创建成功' });
  } catch (error) {
    console.error('创建角色错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建角色失败' },
      { status: 500 }
    );
  }
}
