import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Props {
    params: Promise<{ id: string }>;
}

export async function GET(
    request: NextRequest,
    { params }: Props
) {
    try {
        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                image: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: '用户不存在' }, { status: 404 });
        }

        const [documents, documentCount] = await Promise.all([
            prisma.document.findMany({
                where: {
                    authorId: id,
                    published: true,
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    createdAt: true,
                    updatedAt: true,
                    viewCount: true,
                    category: { select: { id: true, name: true, slug: true } },
                    tags: {
                        include: { tag: { select: { id: true, name: true, slug: true } } },
                    },
                    _count: { select: { comments: true, likes: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.document.count({
                where: {
                    authorId: id,
                    published: true,
                },
            }),
        ]);

        return NextResponse.json({
            author: {
                id: user.id,
                name: user.name,
                image: user.image,
                createdAt: user.createdAt,
            },
            documents,
            documentCount,
        });
    } catch (error) {
        console.error('获取作者信息失败:', error);
        return NextResponse.json({ error: '获取作者信息失败' }, { status: 500 });
    }
}
