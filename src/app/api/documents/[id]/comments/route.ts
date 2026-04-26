import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const document = await prisma.document.findUnique({
            where: { id },
        });

        if (!document) {
            return NextResponse.json({ error: '文档不存在' }, { status: 404 });
        }

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where: {
                    documentId: id,
                    parentId: null,
                },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    replies: {
                        include: {
                            user: { select: { id: true, name: true, image: true } },
                            _count: { select: { likes: true } },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                    _count: { select: { likes: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.comment.count({
                where: { documentId: id, parentId: null },
            }),
        ]);

        let likedCommentIds: string[] = [];
        if (user) {
            const allCommentIds = comments.flatMap(c => [c.id, ...c.replies.map(r => r.id)]);
            const likedComments = await prisma.commentLike.findMany({
                where: {
                    userId: user.id,
                    commentId: { in: allCommentIds },
                },
                select: { commentId: true },
            });
            likedCommentIds = likedComments.map(l => l.commentId);
        }

        const formatComment = (comment: any, isReply: boolean = false) => ({
            id: comment.id,
            content: comment.content,
            documentId: comment.documentId,
            userId: comment.userId,
            parentId: comment.parentId,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: comment.user,
            likeCount: comment._count?.likes || 0,
            isLiked: likedCommentIds.includes(comment.id),
            replies: isReply ? undefined : comment.replies?.map((r: any) => formatComment(r, true)),
        });

        return NextResponse.json({
            comments: comments.map(c => formatComment(c)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('获取评论列表失败:', error);
        return NextResponse.json({ error: '获取评论列表失败' }, { status: 500 });
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
        const body = await request.json();
        const { content, parentId } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
        }

        const document = await prisma.document.findUnique({
            where: { id },
            select: { id: true, title: true, slug: true, authorId: true },
        });

        if (!document) {
            return NextResponse.json({ error: '文档不存在' }, { status: 404 });
        }

        let parentComment: { id: string; userId: string; content: string; documentId: string } | null = null;

        if (parentId) {
            parentComment = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { id: true, userId: true, content: true, documentId: true },
            });

            if (!parentComment) {
                return NextResponse.json({ error: '回复的评论不存在' }, { status: 404 });
            }

            if (parentComment.documentId !== id) {
                return NextResponse.json({ error: '评论与文档不匹配' }, { status: 400 });
            }
        }

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                documentId: id,
                userId: user.id,
                parentId: parentId || null,
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
                _count: { select: { likes: true } },
            },
        });

        const notifications: Promise<any>[] = [];

        if (document.authorId && document.authorId !== user.id) {
            notifications.push(
                prisma.notification.create({
                    data: {
                        userId: document.authorId,
                        type: parentId ? 'REPLY' : 'COMMENT',
                        isRead: false,
                        data: JSON.stringify({
                            documentId: document.id,
                            documentTitle: document.title,
                            documentSlug: document.slug,
                            commentId: comment.id,
                            commentContent: content.trim(),
                            commenterId: user.id,
                            commenterName: user.name || user.email,
                            parentCommentId: parentId || null,
                            parentCommentContent: parentComment?.content || null,
                            parentCommenterId: parentComment?.userId || null,
                        }),
                    },
                })
            );
        }

        if (parentComment && parentComment.userId !== user.id && parentComment.userId !== document.authorId) {
            notifications.push(
                prisma.notification.create({
                    data: {
                        userId: parentComment.userId,
                        type: 'REPLY',
                        isRead: false,
                        data: JSON.stringify({
                            documentId: document.id,
                            documentTitle: document.title,
                            documentSlug: document.slug,
                            commentId: comment.id,
                            commentContent: content.trim(),
                            commenterId: user.id,
                            commenterName: user.name || user.email,
                            parentCommentId: parentComment.id,
                            parentCommentContent: parentComment.content,
                            parentCommenterId: parentComment.userId,
                        }),
                    },
                })
            );
        }

        if (notifications.length > 0) {
            await Promise.all(notifications);
        }

        return NextResponse.json({
            comment: {
                ...comment,
                likeCount: comment._count.likes,
                isLiked: false,
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error('创建评论失败:', error);
        if (error.message === '请先登录') {
            return NextResponse.json({ error: '请先登录' }, { status: 401 });
        }
        return NextResponse.json({ error: '创建评论失败' }, { status: 500 });
    }
}
