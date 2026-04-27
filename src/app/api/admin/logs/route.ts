import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasPermission, PERMISSIONS } from '@/lib/auth';

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    if (!(await hasPermission(PERMISSIONS.READ_LOGS))) {
      return NextResponse.json(
        { error: '权限不足，无法查看日志' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const action = searchParams.get('action') || '';
    const entityType = searchParams.get('entityType') || '';
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const skip = (page - 1) * PAGE_SIZE;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const formattedLogs = logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return NextResponse.json({
      logs: formattedLogs,
      total,
      page,
      totalPages,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    console.error('获取日志列表错误:', error);
    return NextResponse.json(
      { error: '获取日志列表失败' },
      { status: 500 }
    );
  }
}
