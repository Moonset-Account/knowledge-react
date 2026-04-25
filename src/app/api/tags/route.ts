import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('获取标签错误:', error);
    return NextResponse.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
}
