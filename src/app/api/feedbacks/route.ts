import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin, requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const isAdminUser = await isAdmin(user);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;
        const status = searchParams.get('status');

        const where: any = {};
        if (status) {
            where.status = status;
        }

        if (!isAdminUser && user) {
            where.userId = user.id;
        }

        if (!isAdminUser && !user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const [feedbacks, total] = await Promise.all([
            prisma.feedback.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.feedback.count({ where }),
        ]);

        return NextResponse.json({
            feedbacks,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('获取反馈列表失败:', error);
        return NextResponse.json({ error: '获取反馈列表失败' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        const body = await request.json();
        const { type, title, content } = body;

        if (!type || !title || !content) {
            return NextResponse.json(
                { error: '反馈类型、标题和内容不能为空' },
                { status: 400 }
            );
        }

        const validTypes = ['bug', 'feature', 'improvement', 'other'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: '反馈类型无效' },
                { status: 400 }
            );
        }

        const feedback = await prisma.feedback.create({
            data: {
                type,
                title: title.trim(),
                content: content.trim(),
                userId: user?.id || null,
                status: 'pending',
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return NextResponse.json({ feedback }, { status: 201 });
    } catch (error) {
        console.error('提交反馈失败:', error);
        return NextResponse.json({ error: '提交反馈失败' }, { status: 500 });
    }
}
