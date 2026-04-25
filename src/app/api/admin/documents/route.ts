import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const currentUser = await getCurrentUser();

    const body = await request.json();
    const { title, slug, content, excerpt, categoryId, published, tagIds, roleIds } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: '文章标题不能为空' },
        { status: 400 }
      );
    }

    let documentSlug = slug?.trim() || generateSlug(title.trim());

    const existingSlug = await prisma.document.findUnique({
      where: { slug: documentSlug },
    });

    if (existingSlug) {
      documentSlug = `${documentSlug}-${Date.now()}`;
    }

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        slug: documentSlug,
        content: content || null,
        excerpt: excerpt || null,
        categoryId: categoryId || null,
        published: published || false,
        authorId: currentUser?.id || null,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId: string) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
        accessRoles: roleIds && roleIds.length > 0
          ? { connect: roleIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    console.error('创建文章错误:', error);
    if (error.message === '需要管理员权限') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }
    return NextResponse.json(
      { error: '创建失败，请稍后重试' },
      { status: 500 }
    );
  }
}
