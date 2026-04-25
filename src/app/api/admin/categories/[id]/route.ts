import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    if (category._count.documents > 0) {
      return NextResponse.json(
        { error: '该分类下还有文章，无法删除' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除分类错误:', error);
    if (error.message === '需要管理员权限') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }
    return NextResponse.json(
      { error: '删除失败，请稍后重试' },
      { status: 500 }
    );
  }
}
