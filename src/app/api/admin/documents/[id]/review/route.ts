import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin, hasPermission, PERMISSIONS } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    if (!(await hasPermission(PERMISSIONS.REVIEW_DOCUMENTS))) {
      return NextResponse.json(
        { error: '权限不足，无法审核文章' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reviewNote } = body;

    if (!action || !['APPROVE', 'REJECT', 'PENDING_REVIEW'].includes(action)) {
      return NextResponse.json(
        { error: '无效的审核操作' },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }

    let status: any;
    let published = document.published;

    switch (action) {
      case 'APPROVE':
        status = 'APPROVED';
        published = true;
        break;
      case 'REJECT':
        status = 'REJECTED';
        published = false;
        break;
      case 'PENDING_REVIEW':
        status = 'PENDING_REVIEW';
        published = false;
        break;
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status,
        published,
        reviewNote: reviewNote || null,
        reviewedBy: currentUser?.id || null,
        reviewedAt: new Date(),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
      },
    });

    if (document.authorId) {
      const notificationData = {
        documentId: document.id,
        documentTitle: document.title,
        documentSlug: document.slug,
        reviewerId: currentUser?.id,
        reviewerName: currentUser?.name || '管理员',
        action,
        reviewNote: reviewNote || null,
      };

      await prisma.notification.create({
        data: {
          userId: document.authorId,
          type: action === 'APPROVE' ? 'DOCUMENT_APPROVED' : action === 'REJECT' ? 'DOCUMENT_REJECTED' : 'DOCUMENT_SUBMITTED',
          isRead: false,
          data: JSON.stringify(notificationData),
        },
      });
    }

    return NextResponse.json({
      document: updatedDocument,
      message: action === 'APPROVE' 
        ? '文章审核通过' 
        : action === 'REJECT' 
        ? '文章已拒绝' 
        : '文章已提交审核',
    });
  } catch (error) {
    console.error('审核文章错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '审核失败' },
      { status: 500 }
    );
  }
}
