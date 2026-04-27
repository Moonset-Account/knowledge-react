import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasPermission, PERMISSIONS } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: '角色不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('获取角色错误:', error);
    return NextResponse.json(
      { error: '获取角色失败' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    if (!(await hasPermission(PERMISSIONS.EDIT_ROLES))) {
      return NextResponse.json(
        { error: '权限不足，无法编辑角色' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, permissions } = body;

    const existingRole = await prisma.role.findUnique({
      where: { id: params.id },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: '角色不存在' },
        { status: 404 }
      );
    }

    if (existingRole.name === 'ADMIN' && name && name.toUpperCase() !== 'ADMIN') {
      return NextResponse.json(
        { error: '不能修改管理员角色名称' },
        { status: 400 }
      );
    }

    const role = await prisma.role.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(permissions !== undefined && { permissions: JSON.stringify(permissions) }),
      },
    });

    return NextResponse.json({ role, message: '角色更新成功' });
  } catch (error) {
    console.error('更新角色错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新角色失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    if (!(await hasPermission(PERMISSIONS.DELETE_ROLES))) {
      return NextResponse.json(
        { error: '权限不足，无法删除角色' },
        { status: 403 }
      );
    }

    const existingRole = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: '角色不存在' },
        { status: 404 }
      );
    }

    if (existingRole.name === 'ADMIN') {
      return NextResponse.json(
        { error: '不能删除管理员角色' },
        { status: 400 }
      );
    }

    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { error: '该角色下还有用户，无法删除' },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: '角色删除成功' });
  } catch (error) {
    console.error('删除角色错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除角色失败' },
      { status: 500 }
    );
  }
}
