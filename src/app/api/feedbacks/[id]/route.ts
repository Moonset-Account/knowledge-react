import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const validStatuses = ['pending', 'reviewing', 'resolved', 'rejected'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: '状态无效' },
                { status: 400 }
            );
        }

        const feedback = await prisma.feedback.findUnique({
            where: { id },
        });

        if (!feedback) {
            return NextResponse.json({ error: '反馈不存在' }, { status: 404 });
        }

        const updatedFeedback = await prisma.feedback.update({
            where: { id },
            data: { status },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return NextResponse.json({ feedback: updatedFeedback });
    } catch (error) {
        console.error('更新反馈状态失败:', error);
        return NextResponse.json({ error: '更新反馈状态失败' }, { status: 500 });
    }
}
