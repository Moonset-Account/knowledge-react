import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        const { id } = await params;

        const document = await prisma.document.findUnique({
            where: { id },
        });

        if (!document) {
            return NextResponse.json({ error: '文档不存在' }, { status: 404 });
        }

        if (!user) {
            return NextResponse.json({ isBookmarked: false, count: 0 });
        }

        const [bookmark, count] = await Promise.all([
            prisma.bookmark.findUnique({
                where: {
                    userId_documentId: {
                        userId: user.id,
                        documentId: id,
                    },
                },
            }),
            prisma.bookmark.count({
                where: { documentId: id },
            }),
        ]);

        return NextResponse.json({
            isBookmarked: !!bookmark,
            count
        });
    } catch (error) {
        console.error('获取收藏状态失败:', error);
        return NextResponse.json({ error: '获取收藏状态失败' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const { id } = await params;

        const document = await prisma.document.findUnique({
            where: { id },
        });

        if (!document) {
            return NextResponse.json({ error: '文档不存在' }, { status: 404 });
        }

        const existingBookmark = await prisma.bookmark.findUnique({
            where: {
                userId_documentId: {
                    userId: user.id,
                    documentId: id,
                },
            },
        });

        if (existingBookmark) {
            await prisma.bookmark.delete({
                where: {
                    userId_documentId: {
                        userId: user.id,
                        documentId: id,
                    },
                },
            });

            const count = await prisma.bookmark.count({
                where: { documentId: id },
            });

            return NextResponse.json({
                isBookmarked: false,
                count,
                message: '已取消收藏'
            });
        }

        await prisma.bookmark.create({
            data: {
                userId: user.id,
                documentId: id,
            },
        });

        const count = await prisma.bookmark.count({
            where: { documentId: id },
        });

        return NextResponse.json({
            isBookmarked: true,
            count,
            message: '已收藏'
        });
    } catch (error: any) {
        console.error('切换收藏状态失败:', error);
        if (error.message === '请先登录') {
            return NextResponse.json({ error: '请先登录' }, { status: 401 });
        }
        return NextResponse.json({ error: '操作失败' }, { status: 500 });
    }
}
