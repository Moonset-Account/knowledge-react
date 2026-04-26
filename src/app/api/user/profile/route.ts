import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const [documents, bookmarkCount] = await Promise.all([
            prisma.document.findMany({
                where: {
                    authorId: user.id,
                    published: true,
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    createdAt: true,
                    viewCount: true,
                    category: { select: { id: true, name: true, slug: true } },
                    _count: { select: { comments: true, likes: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.bookmark.count({
                where: { userId: user.id },
            }),
        ]);

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                createdAt: user.createdAt,
                role: user.role?.name,
            },
            documents,
            bookmarkCount,
            documentCount: documents.length,
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await requireAuth();
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const contentType = request.headers.get('content-type') || '';

        let name: string | undefined;
        let image: string | undefined;

        if (contentType.includes('application/json')) {
            const body = await request.json();
            name = body.name;
            image = body.image;
        } else if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            name = formData.get('name') as string | undefined;
            image = formData.get('image') as string | undefined;
        }

        const updateData: any = {};

        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                return NextResponse.json({ error: '昵称不能为空' }, { status: 400 });
            }
            updateData.name = name.trim();
        }

        if (image !== undefined) {
            if (image === null || image === '') {
                updateData.image = null;
            } else {
                updateData.image = image;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            include: { role: true },
        });

        return NextResponse.json({
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                image: updatedUser.image,
                role: updatedUser.role?.name,
            },
        });
    } catch (error) {
        console.error('更新用户信息失败:', error);
        return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 });
    }
}
