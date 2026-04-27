import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, hasPermission, getCurrentUser, PERMISSIONS, isAdmin } from '@/lib/auth';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.READ_DOCUMENTS);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * PAGE_SIZE;

    const currentUser = await getCurrentUser();
    const isAdminUser = await isAdmin(currentUser);
    const canEditAllDocuments = await hasPermission(PERMISSIONS.EDIT_DOCUMENTS, currentUser);

    const where: any = {};

    if (!isAdminUser && !canEditAllDocuments) {
      where.authorId = currentUser?.id;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          author: { select: { name: true } },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.document.count({ where }),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return NextResponse.json({
      documents,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('获取文章列表错误:', error);
    return NextResponse.json(
      { error: '获取文章列表失败' },
      { status: 500 }
    );
  }
}
