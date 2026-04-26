import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const body = await request.json();
        const { oldPassword, newPassword } = body;

        if (!oldPassword || !newPassword) {
            return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: '新密码至少需要6个字符' }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { password: true },
        });

        if (!dbUser) {
            return NextResponse.json({ error: '用户不存在' }, { status: 404 });
        }

        if (!dbUser.password) {
            return NextResponse.json({ error: '该账户使用第三方登录，无法修改密码' }, { status: 400 });
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, dbUser.password);
        if (!isOldPasswordValid) {
            return NextResponse.json({ error: '旧密码不正确' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码失败:', error);
        return NextResponse.json({ error: '修改密码失败' }, { status: 500 });
    }
}
