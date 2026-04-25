import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { roleId } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        roleId: roleId || null,
      },
      include: { role: true },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('更新用户错误:', error);
    if (error.message === '需要管理员权限') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }
    return NextResponse.json(
      { error: '更新失败，请稍后重试' },
      { status: 500 }
    );
  }
}
