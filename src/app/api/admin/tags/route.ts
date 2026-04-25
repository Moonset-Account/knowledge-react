import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, slug } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '标签名称不能为空' },
        { status: 400 }
      );
    }

    const tagSlug = slug?.trim() || generateSlug(name.trim());

    const existingTag = await prisma.tag.findUnique({
      where: { slug: tagSlug },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: '标签已存在' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        slug: tagSlug,
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error: any) {
    console.error('创建标签错误:', error);
    if (error.message === '需要管理员权限') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }
    return NextResponse.json(
      { error: '创建失败，请稍后重试' },
      { status: 500 }
    );
  }
}
