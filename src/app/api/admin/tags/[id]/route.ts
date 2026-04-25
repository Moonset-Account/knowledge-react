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

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: '标签不存在' },
        { status: 404 }
      );
    }

    if (tag.documents.length > 0) {
      await prisma.documentTag.deleteMany({
        where: { tagId: id },
      });
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除标签错误:', error);
    if (error.message === '需要管理员权限') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }
    return NextResponse.json(
      { error: '删除失败，请稍后重试' },
      { status: 500 }
    );
  }
}
