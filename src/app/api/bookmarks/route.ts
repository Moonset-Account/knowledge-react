import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const [bookmarks, total] = await Promise.all([
            prisma.bookmark.findMany({
                where: { userId: user.id },
                include: {
                    document: {
                        include: {
                            author: { select: { id: true, name: true } },
                            category: { select: { id: true, name: true, slug: true } },
                            tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
                            _count: {
                                select: { likes: true, comments: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.bookmark.count({
                where: { userId: user.id },
            }),
        ]);

        return NextResponse.json({
            bookmarks: bookmarks.map(b => b.document),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error: any) {
        console.error('获取收藏列表失败:', error);
        if (error.message === '请先登录') {
            return NextResponse.json({ error: '请先登录' }, { status: 401 });
        }
        return NextResponse.json({ error: '获取收藏列表失败' }, { status: 500 });
    }
}
