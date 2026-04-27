import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canDeleteComment, isAdmin, PERMISSIONS, hasPermission } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        replies: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 });
    }

    if (!(await canDeleteComment(id))) {
      return NextResponse.json({ error: '权限不足，无法删除该评论' }, { status: 403 });
    }

    const isAdminUser = await isAdmin();
    const canDeleteAll = await hasPermission(PERMISSIONS.DELETE_ALL_COMMENTS);
    const deletedBy = isAdminUser || canDeleteAll ? 'admin' : 'user';

    const deleteReplies = async (commentId: string) => {
      const replies = await prisma.comment.findMany({
        where: { parentId: commentId },
      });

      for (const reply of replies) {
        await deleteReplies(reply.id);
        await prisma.commentLike.deleteMany({
          where: { commentId: reply.id },
        });
        await prisma.comment.update({
          where: { id: reply.id },
          data: {
            isDeleted: true,
            deletedBy,
            deletedAt: new Date(),
          },
        });
      }
    };

    await deleteReplies(id);

    await prisma.commentLike.deleteMany({
      where: { commentId: id },
    });

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: '评论删除成功',
      comment: updatedComment,
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除评论失败' },
      { status: 500 }
    );
  }
}
