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
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notification.count({
                where: { userId: user.id },
            }),
            prisma.notification.count({
                where: { userId: user.id, isRead: false },
            }),
        ]);

        const formattedNotifications = notifications.map(n => ({
            ...n,
            data: JSON.parse(n.data),
        }));

        return NextResponse.json({
            notifications: formattedNotifications,
            total,
            unreadCount,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('获取通知列表失败:', error);
        return NextResponse.json({ error: '获取通知列表失败' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await requireAuth();
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const body = await request.json();
        const { id, markAllAsRead } = body;

        if (markAllAsRead) {
            await prisma.notification.updateMany({
                where: { userId: user.id, isRead: false },
                data: { isRead: true },
            });
            return NextResponse.json({ message: '已全部标记为已读' });
        }

        if (!id) {
            return NextResponse.json({ error: '缺少通知ID' }, { status: 400 });
        }

        const notification = await prisma.notification.findFirst({
            where: { id, userId: user.id },
        });

        if (!notification) {
            return NextResponse.json({ error: '通知不存在' }, { status: 404 });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        return NextResponse.json({
            notification: {
                ...updated,
                data: JSON.parse(updated.data),
            },
        });
    } catch (error) {
        console.error('更新通知状态失败:', error);
        return NextResponse.json({ error: '更新通知状态失败' }, { status: 500 });
    }
}
