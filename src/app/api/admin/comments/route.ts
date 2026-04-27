import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasPermission, PERMISSIONS } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    if (!(await hasPermission(PERMISSIONS.READ_COMMENTS))) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const documentId = searchParams.get('documentId');
    const userId = searchParams.get('userId');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const skip = (page - 1) * limit;

    const where: any = {
      parentId: null,
    };

    if (!includeDeleted) {
      where.isDeleted = false;
    }

    if (documentId) {
      where.documentId = documentId;
    }

    if (userId) {
      where.userId = userId;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          document: {
            select: { id: true, title: true, slug: true },
          },
          _count: {
            select: { replies: true, likes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    return NextResponse.json(
      { error: '获取评论列表失败' },
      { status: 500 }
    );
  }
}
