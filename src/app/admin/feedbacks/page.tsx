'use client';

import { useState, useEffect } from 'react';
import { formatDateTime } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface Feedback {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: User | null;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  bug: { label: 'Bug 反馈', color: 'bg-danger/10 text-danger' },
  feature: { label: '功能建议', color: 'bg-primary/10 text-primary' },
  improvement: { label: '改进建议', color: 'bg-success/10 text-success' },
  other: { label: '其他', color: 'bg-secondary/10 text-secondary' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-warning/10 text-warning' },
  reviewing: { label: '审核中', color: 'bg-primary/10 text-primary' },
  resolved: { label: '已解决', color: 'bg-success/10 text-success' },
  rejected: { label: '已拒绝', color: 'bg-danger/10 text-danger' },
};

const PAGE_SIZE = 10;

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadFeedbacks = async (page: number = 1, status: string = '') => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/feedbacks?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
        setTotal(data.total || 0);
      } else {
        const err = await response.json();
        setError(err.error || '加载失败');
      }
    } catch (err) {
      setError('加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks(currentPage, filterStatus);
  }, [currentPage, filterStatus]);

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    setUpdatingId(feedbackId);
    setError('');

    try {
      const response = await fetch(`/api/feedbacks/${feedbackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === feedbackId ? data.feedback : f))
        );
        if (selectedFeedback?.id === feedbackId) {
          setSelectedFeedback(data.feedback);
        }
      } else {
        const err = await response.json();
        setError(err.error || '更新失败');
      }
    } catch (err) {
      setError('更新失败，请稍后重试');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">反馈管理</h1>
          <p className="text-text-secondary">共 {total} 条反馈</p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        >
          <option value="">全部状态</option>
          {Object.entries(statusLabels).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : feedbacks.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      标题
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      类型
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      状态
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      提交者
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      提交时间
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {feedbacks.map((feedback) => {
                    const typeInfo = typeLabels[feedback.type] || typeLabels.other;
                    const statusInfo = statusLabels[feedback.status] || statusLabels.pending;

                    return (
                      <tr key={feedback.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-text-primary line-clamp-1">
                            {feedback.title}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={feedback.status}
                            onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                            disabled={updatingId === feedback.id}
                            className={`px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-primary/50 outline-none ${statusInfo.color} disabled:opacity-50`}
                          >
                            {Object.entries(statusLabels).map(([key, value]) => (
                              <option key={key} value={key}>
                                {value.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {feedback.user ? (
                            <span>{feedback.user.name || feedback.user.email}</span>
                          ) : (
                            <span className="italic">匿名</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {formatDateTime(new Date(feedback.createdAt))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelectedFeedback(feedback)}
                            className="text-primary hover:text-primary-hover transition-colors"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  第 {currentPage} 页，共 {totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  {hasPrev && (
                    <button
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="px-4 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors text-text-secondary text-sm"
                    >
                      上一页
                    </button>
                  )}
                  {hasNext && (
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="px-4 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors text-text-secondary text-sm"
                    >
                      下一页
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 text-border mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <h3 className="text-lg font-medium text-text-primary mb-2">暂无反馈</h3>
            <p className="text-text-secondary">
              {filterStatus ? `当前筛选条件下没有反馈` : '还没有收到任何反馈'}
            </p>
          </div>
        )}
      </div>

      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold text-text-primary">反馈详情</h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      typeLabels[selectedFeedback.type]?.color || typeLabels.other.color
                    }`}
                  >
                    {typeLabels[selectedFeedback.type]?.label || '其他'}
                  </span>
                  <select
                    value={selectedFeedback.status}
                    onChange={(e) => handleStatusChange(selectedFeedback.id, e.target.value)}
                    disabled={updatingId === selectedFeedback.id}
                    className={`px-3 py-1 text-sm font-medium rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-primary/50 outline-none ${
                      statusLabels[selectedFeedback.status]?.color || statusLabels.pending.color
                    } disabled:opacity-50`}
                  >
                    {Object.entries(statusLabels).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    标题
                  </label>
                  <p className="text-text-primary font-medium">{selectedFeedback.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    内容
                  </label>
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <pre className="whitespace-pre-wrap text-sm text-text-primary font-normal">
                      {selectedFeedback.content}
                    </pre>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      提交者
                    </label>
                    <p className="text-text-primary">
                      {selectedFeedback.user
                        ? selectedFeedback.user.name || selectedFeedback.user.email
                        : '匿名'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      提交时间
                    </label>
                    <p className="text-text-primary">
                      {formatDateTime(new Date(selectedFeedback.createdAt))}
                    </p>
                  </div>
                </div>

                {selectedFeedback.updatedAt !== selectedFeedback.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      最后更新
                    </label>
                    <p className="text-text-primary">
                      {formatDateTime(new Date(selectedFeedback.updatedAt))}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
