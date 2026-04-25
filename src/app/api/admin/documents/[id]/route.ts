import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

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
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        accessRoles: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    return NextResponse.json({
      document: {
        ...document,
        tagIds: document.tags.map((t) => t.tagId),
        roleIds: document.accessRoles.map((r) => r.id),
      },
    });
  } catch (error) {
    console.error('获取文章失败:', error);
    return NextResponse.json({ error: '获取文章失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      categoryId,
      published,
      tagIds,
      roleIds,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: '请输入文章标题' }, { status: 400 });
    }

    const existingDoc = await prisma.document.findUnique({
      where: { id },
      include: { tags: true, accessRoles: true },
    });

    if (!existingDoc) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    const finalSlug = slug?.trim() || generateSlug(title);

    const slugDoc = await prisma.document.findUnique({
      where: { slug: finalSlug },
    });

    if (slugDoc && slugDoc.id !== id) {
      return NextResponse.json({ error: '别名已存在，请使用其他别名' }, { status: 400 });
    }

    const maxVersion = await prisma.documentVersion.aggregate({
      where: { documentId: id },
      _max: { version: true },
    });

    const nextVersion = (maxVersion._max.version || 0) + 1;

    const existingTagIds = existingDoc.tags.map((t) => t.tagId);
    const existingRoleIds = existingDoc.accessRoles.map((r) => r.id);

    await prisma.documentVersion.create({
      data: {
        documentId: id,
        version: nextVersion,
        title: existingDoc.title,
        content: existingDoc.content,
        excerpt: existingDoc.excerpt,
        slug: existingDoc.slug,
        categoryId: existingDoc.categoryId,
        published: existingDoc.published,
        tagIds: JSON.stringify(existingTagIds),
        roleIds: JSON.stringify(existingRoleIds),
        authorId: user.id,
      },
    });

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        title: title.trim(),
        slug: finalSlug,
        content,
        excerpt,
        categoryId: categoryId || null,
        published,
        tags: {
          deleteMany: {},
          create: tagIds?.map((tagId: string) => ({
            tagId,
          })) || [],
        },
        accessRoles: roleIds
          ? {
              set: roleIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        category: true,
        accessRoles: true,
      },
    });

    return NextResponse.json({ document: updatedDocument, version: nextVersion });
  } catch (error) {
    console.error('更新文章失败:', error);
    return NextResponse.json({ error: '更新文章失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.documentTag.deleteMany({
      where: { documentId: id },
    });

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文章失败:', error);
    return NextResponse.json({ error: '删除文章失败' }, { status: 500 });
  }
}
