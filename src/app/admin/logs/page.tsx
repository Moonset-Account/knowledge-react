'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 50;

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const getActionConfig = (action: string) => {
  const configs: Record<string, { label: string; className: string }> = {
    CREATE: { label: '创建', className: 'bg-success/10 text-success' },
    READ: { label: '读取', className: 'bg-info/10 text-info' },
    UPDATE: { label: '更新', className: 'bg-warning/10 text-warning' },
    DELETE: { label: '删除', className: 'bg-danger/10 text-danger' },
    LOGIN: { label: '登录', className: 'bg-primary/10 text-primary' },
    LOGOUT: { label: '登出', className: 'bg-secondary/10 text-secondary' },
    APPROVE: { label: '通过', className: 'bg-success/10 text-success' },
    REJECT: { label: '拒绝', className: 'bg-danger/10 text-danger' },
  };
  return configs[action] || { label: action, className: 'bg-gray-100 text-gray-600' };
};

const getEntityTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    Document: '文章',
    Comment: '评论',
    User: '用户',
    Role: '角色',
    Category: '分类',
    Tag: '标签',
    Feedback: '反馈',
    Notification: '通知',
    Bookmark: '书签',
    Like: '点赞',
    System: '系统',
  };
  return labels[type] || type;
};

export default function LogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page') || '';
  const actionFilter = searchParams.get('action') || '';
  const entityTypeFilter = searchParams.get('entityType') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const currentPage = parseInt(pageParam || '1');
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  useEffect(() => {
    loadLogs();
  }, [pageParam, actionFilter, entityTypeFilter, startDate, endDate]);

  async function loadLogs() {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (pageParam) params.set('page', pageParam);
      if (actionFilter) params.set('action', actionFilter);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } else {
        setError('加载日志失败');
      }
    } catch (err) {
      console.error('加载日志失败:', err);
      setError('加载日志失败');
    } finally {
      setIsLoading(false);
    }
  }

  const getQueryString = (overrides: Record<string, string | number>) => {
    const params: Record<string, string> = {};
    if (actionFilter) params.action = actionFilter;
    if (entityTypeFilter) params.entityType = entityTypeFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
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

  const handleFilterChange = (key: string, value: string) => {
    router.push(`/admin/logs${getQueryString({ page: 1, [key]: value })}`);
  };

  const handleClearFilters = () => {
    router.push('/admin/logs');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">日志管理</h1>
          <p className="text-text-secondary">共 {total} 条日志</p>
        </div>
        {(actionFilter || entityTypeFilter || startDate || endDate) && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            清除筛选
          </button>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary">操作类型</label>
            <select
              value={actionFilter}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-text-primary text-sm"
            >
              <option value="">全部</option>
              <option value="CREATE">创建</option>
              <option value="READ">读取</option>
              <option value="UPDATE">更新</option>
              <option value="DELETE">删除</option>
              <option value="LOGIN">登录</option>
              <option value="LOGOUT">登出</option>
              <option value="APPROVE">通过</option>
              <option value="REJECT">拒绝</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary">实体类型</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-text-primary text-sm"
            >
              <option value="">全部</option>
              <option value="Document">文章</option>
              <option value="Comment">评论</option>
              <option value="User">用户</option>
              <option value="Role">角色</option>
              <option value="Category">分类</option>
              <option value="Tag">标签</option>
              <option value="Feedback">反馈</option>
              <option value="System">系统</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-text-primary text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-text-primary text-sm"
            />
          </div>
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
        ) : logs.length > 0 ? (
          <div className="divide-y divide-border">
            {logs.map((log) => {
              const actionConfig = getActionConfig(log.action);
              return (
                <div key={log.id} className="p-4 hover:bg-background/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${actionConfig.className}`}
                        >
                          {actionConfig.label}
                        </span>
                        <span className="text-sm text-text-secondary">
                          {getEntityTypeLabel(log.entityType)}
                        </span>
                        {log.userName && (
                          <span className="text-sm text-text-secondary">
                            | 用户: {log.userName}
                          </span>
                        )}
                        {log.userRole && (
                          <span className="text-sm text-text-secondary">
                            | 角色: {log.userRole}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-text-secondary mb-2">
                        <span>{formatDateTime(new Date(log.createdAt))}</span>
                        {log.ipAddress && <span className="ml-4">IP: {log.ipAddress}</span>}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div>
                          <button
                            onClick={() =>
                              setExpandedLog(expandedLog === log.id ? null : log.id)
                            }
                            className="text-xs text-primary hover:underline"
                          >
                            {expandedLog === log.id ? '收起详情' : '查看详情'}
                          </button>
                          {expandedLog === log.id && (
                            <pre className="mt-2 p-3 bg-background rounded-lg text-xs text-text-secondary overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                    {log.entityId && (
                      <div className="text-right">
                        <span className="text-xs text-text-secondary">
                          实体ID: {log.entityId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-text-secondary">暂无日志</div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              第 {currentPage} 页，共 {totalPages} 页 (每页 {PAGE_SIZE} 条)
            </div>
            <div className="flex items-center gap-2">
              {hasPrev && (
                <button
                  onClick={() =>
                    router.push(`/admin/logs${getQueryString({ page: currentPage - 1 })}`)
                  }
                  className="px-4 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors text-text-secondary text-sm"
                >
                  上一页
                </button>
              )}
              {hasNext && (
                <button
                  onClick={() =>
                    router.push(`/admin/logs${getQueryString({ page: currentPage + 1 })}`)
                  }
                  className="px-4 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors text-text-secondary text-sm"
                >
                  下一页
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
