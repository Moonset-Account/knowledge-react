import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      include: {
        role: true,
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('获取用户错误:', error);
    if (error.message === '需要管理员权限') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }
    return NextResponse.json(
      { error: '获取用户失败' },
      { status: 500 }
    );
  }
}
