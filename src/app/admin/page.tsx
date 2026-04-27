import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';

async function getStats() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalDocuments,
    publishedDocuments,
    draftDocuments,
    pendingReviewDocuments,
    approvedDocuments,
    rejectedDocuments,
    totalCategories,
    totalTags,
    totalUsers,
    totalViews,
    totalComments,
    recentDocuments,
    recentComments,
    topCategories,
    documentStatsByStatus,
    newUsersLast7Days,
    newDocumentsLast7Days,
  ] = await Promise.all([
    prisma.document.count(),
    prisma.document.count({ where: { published: true } }),
    prisma.document.count({ where: { status: 'DRAFT' } }),
    prisma.document.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.document.count({ where: { status: 'APPROVED' } }),
    prisma.document.count({ where: { status: 'REJECTED' } }),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.user.count(),
    prisma.document.aggregate({ _sum: { viewCount: true } }),
    prisma.comment.count({ where: { isDeleted: false } }),
    prisma.document.findMany({
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.comment.findMany({
      where: { isDeleted: false },
      include: {
        user: { select: { name: true, image: true } },
        document: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.category.findMany({
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { documents: { _count: 'desc' } },
      take: 5,
    }),
    prisma.document.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.document.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  return {
    totalDocuments,
    publishedDocuments,
    draftDocuments,
    pendingReviewDocuments,
    approvedDocuments,
    rejectedDocuments,
    totalCategories,
    totalTags,
    totalUsers,
    totalViews: totalViews._sum.viewCount || 0,
    totalComments,
    recentDocuments,
    recentComments,
    topCategories,
    documentStatsByStatus,
    newUsersLast7Days,
    newDocumentsLast7Days,
  };
}

const statsCards = [
  {
    label: '总文章数',
    key: 'totalDocuments',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    color: 'primary',
    link: '/admin/documents',
  },
  {
    label: '已发布',
    key: 'publishedDocuments',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    color: 'success',
    link: '/admin/documents?status=PUBLISHED',
  },
  {
    label: '待审核',
    key: 'pendingReviewDocuments',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    color: 'warning',
    link: '/admin/documents?status=PENDING_REVIEW',
  },
  {
    label: '用户数',
    key: 'totalUsers',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    color: 'primary',
    link: '/admin/users',
  },
  {
    label: '评论数',
    key: 'totalComments',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    color: 'primary',
    link: '/admin/comments',
  },
  {
    label: '总阅读量',
    key: 'totalViews',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
    color: 'primary',
    link: null,
  },
];

const colorClasses: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: '草稿',
    PENDING_REVIEW: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    PUBLISHED: '已发布',
  };
  return labels[status] || status;
};

const getStatusBadgeClass = (status: string, published: boolean) => {
  if (published && status !== 'PUBLISHED') {
    return 'bg-primary/10 text-primary';
  }
  const classes: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PENDING_REVIEW: 'bg-warning/10 text-warning',
    APPROVED: 'bg-success/10 text-success',
    REJECTED: 'bg-danger/10 text-danger',
    PUBLISHED: 'bg-primary/10 text-primary',
  };
  return classes[status] || 'bg-gray-100 text-gray-600';
};

export default async function AdminDashboard() {
  const stats = await getStats();

  const statusChartData = [
    { status: '草稿', count: stats.draftDocuments, color: 'bg-gray-500' },
    { status: '待审核', count: stats.pendingReviewDocuments, color: 'bg-warning' },
    { status: '已通过', count: stats.approvedDocuments, color: 'bg-success' },
    { status: '已拒绝', count: stats.rejectedDocuments, color: 'bg-danger' },
    { status: '已发布', count: stats.publishedDocuments, color: 'bg-primary' },
  ];

  const totalForChart = statusChartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">仪表盘</h1>
        <p className="text-text-secondary">概览知识库的各项数据</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((card) => (
          <div
            key={card.key}
            className="bg-surface rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[card.color]}`}>
                {card.icon}
              </div>
              {card.link && (
                <Link
                  href={card.link}
                  className="text-xs text-primary hover:underline"
                >
                  查看全部
                </Link>
              )}
            </div>
            <div className="text-3xl font-bold text-text-primary mb-1">
              {stats[card.key as keyof typeof stats]}
            </div>
            <div className="text-sm text-text-secondary">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">文章状态统计</h2>
          <div className="space-y-4">
            {statusChartData.map((item) => {
              const percentage = totalForChart > 0 ? (item.count / totalForChart) * 100 : 0;
              return (
                <div key={item.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{item.status}</span>
                    <span className="text-text-primary font-medium">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">热门分类</h2>
          {stats.topCategories.length > 0 ? (
            <div className="space-y-3">
              {stats.topCategories.map((cat, index) => {
                const maxCount = stats.topCategories[0]?._count.documents || 1;
                const percentage = (cat._count.documents / maxCount) * 100;
                const rankColors = ['bg-primary', 'bg-success', 'bg-warning'];
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${rankColors[index] || 'bg-gray-400'}`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-primary font-medium">{cat.name}</span>
                        <span className="text-text-secondary">{cat._count.documents} 篇</span>
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-primary/60 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-text-secondary py-8">暂无分类数据</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">最近文章</h2>
              <Link
                href="/admin/documents"
                className="text-sm text-primary hover:text-primary-hover transition-colors"
              >
                查看全部 →
              </Link>
            </div>
          </div>
          {stats.recentDocuments.length > 0 ? (
            <div className="divide-y divide-border">
              {stats.recentDocuments.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-background/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/documents/${doc.id}`}
                        className="font-medium text-text-primary hover:text-primary transition-colors truncate block"
                      >
                        {doc.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                        <span>{doc.category?.name || '未分类'}</span>
                        <span>•</span>
                        <span>{doc.author?.name || '未知作者'}</span>
                        <span>•</span>
                        <span>{formatDateTime(doc.createdAt)}</span>
                      </div>
                    </div>
                    <span
                      className={`ml-3 inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusBadgeClass(doc.status as string, doc.published)}`}
                    >
                      {doc.published ? '已发布' : getStatusLabel(doc.status as string)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-text-secondary">暂无文章</div>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">最近评论</h2>
              <Link
                href="/admin/comments"
                className="text-sm text-primary hover:text-primary-hover transition-colors"
              >
                查看全部 →
              </Link>
            </div>
          </div>
          {stats.recentComments.length > 0 ? (
            <div className="divide-y divide-border">
              {stats.recentComments.map((comment) => (
                <div key={comment.id} className="p-4 hover:bg-background/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs font-medium">
                        {(comment.user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary">
                          {comment.user?.name || '匿名用户'}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {formatDateTime(new Date(comment.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                        {comment.content}
                      </p>
                      {comment.document && (
                        <Link
                          href={`/documents/${comment.document.slug}`}
                          className="text-xs text-primary hover:underline mt-1 block"
                        >
                          来自文章: {comment.document.title}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-text-secondary">暂无评论</div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{stats.newDocumentsLast7Days}</div>
              <div className="text-sm text-text-secondary">近7天新增文章</div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{stats.newUsersLast7Days}</div>
              <div className="text-sm text-text-secondary">近7天新增用户</div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{stats.pendingReviewDocuments}</div>
              <div className="text-sm text-text-secondary">待审核文章</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
