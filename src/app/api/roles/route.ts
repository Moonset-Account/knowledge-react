import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
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
