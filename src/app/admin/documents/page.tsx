'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 20;

interface Document {
  id: string;
  title: string;
  slug: string;
  status: string;
  published: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  author: { name: string | null } | null;
  category: { name: string | null } | null;
}

const getStatusConfig = (status: string, published: boolean) => {
  const configs: Record<string, { label: string; className: string }> = {
    DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
    PENDING_REVIEW: { label: '待审核', className: 'bg-warning/10 text-warning' },
    APPROVED: { label: '已通过', className: 'bg-success/10 text-success' },
    REJECTED: { label: '已拒绝', className: 'bg-danger/10 text-danger' },
    PUBLISHED: { label: '已发布', className: 'bg-primary/10 text-primary' },
  };

  if (published && status !== 'PUBLISHED') {
    return { label: '已发布', className: 'bg-primary/10 text-primary' };
  }

  return configs[status] || { label: '未知', className: 'bg-gray-100 text-gray-600' };
};

export default function AdminDocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page') || '';
  const searchQuery = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';

  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentPage = parseInt(pageParam || '1');
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  useEffect(() => {
    loadDocuments();
  }, [pageParam, searchQuery, statusFilter]);

  async function loadDocuments() {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (pageParam) params.set('page', pageParam);
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/documents/list?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setTotal(data.total || 0);
      } else {
        setError('加载文章失败');
      }
    } catch (err) {
      console.error('加载文章失败:', err);
      setError('加载文章失败');
    } finally {
      setIsLoading(false);
    }
  }

  const getQueryString = (overrides: Record<string, string | number>) => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (statusFilter) params.status = statusFilter;
    if (pageParam && !overrides.page) params.page = pageParam;

    Object.entries(overrides).forEach(([key, value]) => {
      if (value) {
        params[key] = String(value);
      } else {
        delete params[key];
      }
    });

    const searchString = new URLSearchParams(params).toString();
    return searchString ? `?${searchString}` : '';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/admin/documents${getQueryString({ page: 1, search: searchInput })}`);
  };

  const handleStatusFilter = (status: string) => {
    router.push(`/admin/documents${getQueryString({ page: 1, status: status || '' })}`);
  };

  const handleReviewAction = async (documentId: string, action: string, reviewNote?: string) => {
    setActionLoading(`${documentId}-${action}`);
    try {
      const res = await fetch(`/api/admin/documents/${documentId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewNote,
        }),
      });

      if (res.ok) {
        loadDocuments();
      } else {
        const data = await res.json();
        alert(data.error || '操作失败');
      }
    } catch (err) {
      console.error('审核操作失败:', err);
      alert('操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (documentId: string) => {
    handleReviewAction(documentId, 'APPROVE');
  };

  const handleReject = async (documentId: string) => {
    const note = prompt('请输入拒绝原因（可选）:');
    if (note !== null) {
      handleReviewAction(documentId, 'REJECT', note);
    }
  };

  const handleSubmitForReview = async (documentId: string) => {
    handleReviewAction(documentId, 'PENDING_REVIEW');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">文章管理</h1>
          <p className="text-text-secondary">共 {total} 篇文章</p>
        </div>
        <Link
          href="/admin/documents/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          新建文章
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索文章标题或内容..."
            className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-text-primary"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            搜索
          </button>
        </form>

        <div className="flex gap-2">
          <button
            onClick={() => handleStatusFilter('')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              !statusFilter
                ? 'bg-primary text-white'
                : 'bg-background text-text-secondary hover:bg-primary/10'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => handleStatusFilter('PENDING_REVIEW')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              statusFilter === 'PENDING_REVIEW'
                ? 'bg-warning text-white'
                : 'bg-background text-text-secondary hover:bg-warning/10'
            }`}
          >
            待审核
          </button>
          <button
            onClick={() => handleStatusFilter('APPROVED')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              statusFilter === 'APPROVED'
                ? 'bg-success text-white'
                : 'bg-background text-text-secondary hover:bg-success/10'
            }`}
          >
            已通过
          </button>
          <button
            onClick={() => handleStatusFilter('REJECTED')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              statusFilter === 'REJECTED'
                ? 'bg-danger text-white'
                : 'bg-background text-text-secondary hover:bg-danger/10'
            }`}
          >
            已拒绝
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-secondary">加载中...</div>
        ) : documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    标题
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    分类
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    作者
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    阅读量
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    更新时间
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map((doc) => {
                  const statusConfig = getStatusConfig(doc.status, doc.published);
                  return (
                    <tr key={doc.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/admin/documents/${doc.id}`}
                            className="font-medium text-text-primary hover:text-primary transition-colors"
                          >
                            {doc.title}
                          </Link>
                          {doc.reviewNote && (
                            <p className="text-xs text-danger mt-1">
                              审核备注: {doc.reviewNote}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {doc.category?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {doc.author?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {doc.viewCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {formatDateTime(new Date(doc.updatedAt))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap items-center gap-1">
                          <Link
                            href={`/admin/documents/${doc.id}`}
                            className="px-2 py-1 text-primary hover:bg-primary/10 rounded transition-colors"
                          >
                            编辑
                          </Link>
                          <Link
                            href={`/documents/${doc.slug}`}
                            className="px-2 py-1 text-text-secondary hover:bg-background rounded transition-colors"
                            target="_blank"
                          >
                            查看
                          </Link>

                          {doc.status === 'DRAFT' && !doc.published && (
                            <button
                              onClick={() => handleSubmitForReview(doc.id)}
                              disabled={actionLoading === `${doc.id}-PENDING_REVIEW`}
                              className="px-2 py-1 text-warning hover:bg-warning/10 rounded transition-colors disabled:opacity-50"
                            >
                              {actionLoading === `${doc.id}-PENDING_REVIEW` ? '提交中...' : '提交审核'}
                            </button>
                          )}

                          {doc.status === 'PENDING_REVIEW' && (
                            <>
                              <button
                                onClick={() => handleApprove(doc.id)}
                                disabled={actionLoading === `${doc.id}-APPROVE`}
                                className="px-2 py-1 text-success hover:bg-success/10 rounded transition-colors disabled:opacity-50"
                              >
                                {actionLoading === `${doc.id}-APPROVE` ? '处理中...' : '通过'}
                              </button>
                              <button
                                onClick={() => handleReject(doc.id)}
                                disabled={actionLoading === `${doc.id}-REJECT`}
                                className="px-2 py-1 text-danger hover:bg-danger/10 rounded transition-colors disabled:opacity-50"
                              >
                                {actionLoading === `${doc.id}-REJECT` ? '处理中...' : '拒绝'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-text-secondary">暂无文章</div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              第 {currentPage} 页，共 {totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              {hasPrev && (
                <Link
                  href={`/admin/documents${getQueryString({ page: currentPage - 1 })}`}
                  className="px-4 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors text-text-secondary text-sm"
                >
                  上一页
                </Link>
              )}
              {hasNext && (
                <Link
                  href={`/admin/documents${getQueryString({ page: currentPage + 1 })}`}
                  className="px-4 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors text-text-secondary text-sm"
                >
                  下一页
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
