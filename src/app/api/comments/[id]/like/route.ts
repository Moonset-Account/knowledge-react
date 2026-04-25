import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';

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

        const comment = await prisma.comment.findUnique({
            where: { id },
        });

        if (!comment) {
            return NextResponse.json({ error: '评论不存在' }, { status: 404 });
        }

        const existingLike = await prisma.commentLike.findUnique({
            where: {
                userId_commentId: {
                    userId: user.id,
                    commentId: id,
                },
            },
        });

        if (existingLike) {
            await prisma.commentLike.delete({
                where: {
                    userId_commentId: {
                        userId: user.id,
                        commentId: id,
                    },
                },
            });

            const count = await prisma.commentLike.count({
                where: { commentId: id },
            });

            return NextResponse.json({
                isLiked: false,
                count,
                message: '已取消点赞'
            });
        }

        await prisma.commentLike.create({
            data: {
                userId: user.id,
                commentId: id,
            },
        });

        const count = await prisma.commentLike.count({
            where: { commentId: id },
        });

        return NextResponse.json({
            isLiked: true,
            count,
            message: '已点赞'
        });
    } catch (error: any) {
        console.error('切换评论点赞状态失败:', error);
        if (error.message === '请先登录') {
            return NextResponse.json({ error: '请先登录' }, { status: 401 });
        }
        return NextResponse.json({ error: '操作失败' }, { status: 500 });
    }
}
