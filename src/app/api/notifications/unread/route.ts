import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ unreadCount: 0 });
        }

        const unreadCount = await prisma.notification.count({
            where: { userId: user.id, isRead: false },
        });

        return NextResponse.json({ unreadCount });
    } catch (error) {
        console.error('获取未读通知数量失败:', error);
        return NextResponse.json({ unreadCount: 0, error: '获取失败' }, { status: 500 });
    }
}
