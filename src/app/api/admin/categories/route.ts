import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    const categorySlug = slug?.trim() || generateSlug(name.trim());

    const existingCategory = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: '分类别名已存在' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: categorySlug,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('创建分类错误:', error);
    if (error.message === '需要管理员权限') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }
    return NextResponse.json(
      { error: '创建失败，请稍后重试' },
      { status: 500 }
    );
  }
}
