import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('获取版本列表失败:', error);
    return NextResponse.json({ error: '获取版本列表失败' }, { status: 500 });
  }
}
