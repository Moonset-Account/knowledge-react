import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDocumentVisibilityFilter } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ documents: [], message: '请输入搜索关键词' });
    }

    const searchQuery = query.trim();
    const visibilityFilter = await getDocumentVisibilityFilter();

    const documents = await prisma.document.findMany({
      where: {
        published: true,
        ...visibilityFilter,
        OR: [
          { title: { contains: searchQuery } },
          { content: { contains: searchQuery } },
          { excerpt: { contains: searchQuery } },
          {
            tags: {
              some: {
                tag: {
                  name: { contains: searchQuery },
                },
              },
            },
          },
          {
            category: {
              name: { contains: searchQuery },
            },
          },
        ],
      },
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 50,
    });

    return NextResponse.json({ documents, query: searchQuery });
  } catch (error) {
    console.error('搜索错误:', error);
    return NextResponse.json(
      { error: '搜索失败，请稍后重试', documents: [] },
      { status: 500 }
    );
  }
}
