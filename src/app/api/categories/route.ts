import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('获取分类错误:', error);
    return NextResponse.json(
      { error: '获取分类失败' },
      { status: 500 }
    );
  }
}
