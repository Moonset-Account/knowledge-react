'use client';

import { useState, useEffect } from 'react';
import { formatDateTime } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  title: string;
  content: string | null;
  excerpt: string | null;
  slug: string;
  categoryId: string | null;
  published: boolean;
  tagIds: string;
  roleIds: string;
  diff: string | null;
  createdAt: string;
  authorId: string | null;
  author: User | null;
}

interface VersionHistoryProps {
  documentId: string;
  onRollback: (version: DocumentVersion) => void;
}

export function VersionHistory({ documentId, onRollback }: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [error, setError] = useState('');
  const [isRollingBack, setIsRollingBack] = useState(false);

  const loadVersions = async () => {
    if (!documentId) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/documents/${documentId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      } else {
        const err = await res.json();
        setError(err.error || '加载版本历史失败');
      }
    } catch (err) {
      setError('加载版本历史失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadVersions();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedVersion(null);
  };

  const handleRollback = async (version: DocumentVersion) => {
    if (!confirm(`确定要回滚到版本 ${version.version} 吗？当前未保存的更改将丢失。`)) {
      return;
    }

    setIsRollingBack(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/documents/${documentId}/versions/${version.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        alert(`已回滚到版本 ${version.version}，新版本号: ${data.version}`);
        onRollback(version);
        handleClose();
      } else {
        const err = await res.json();
        setError(err.error || '回滚失败');
      }
    } catch (err) {
      setError('回滚失败');
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleViewVersion = async (version: DocumentVersion) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/documents/${documentId}/versions/${version.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedVersion(data.version);
      } else {
        const err = await res.json();
        setError(err.error || '加载版本详情失败');
      }
    } catch (err) {
      setError('加载版本详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-background hover:border-primary transition-colors text-text-secondary font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        版本历史
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">版本历史</h2>
              <button
                onClick={handleClose}
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

            {error && (
              <div className="px-6 py-3 bg-danger/10 border-b border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-1 overflow-hidden">
              <div className="w-80 border-r border-border overflow-y-auto flex-shrink-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-text-secondary">
                    暂无版本记录
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {versions.map((version) => (
                      <button
                        key={version.id}
                        onClick={() => handleViewVersion(version)}
                        className={`w-full text-left p-4 hover:bg-background transition-colors ${
                          selectedVersion?.id === version.id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-text-primary">
                            版本 {version.version}
                          </span>
                          {version.author && (
                            <span className="text-xs text-text-secondary">
                              {version.author.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary truncate mb-1">
                          {version.title}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {formatDateTime(new Date(version.createdAt))}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {selectedVersion ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          版本 {selectedVersion.version}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                          {formatDateTime(new Date(selectedVersion.createdAt))}
                          {selectedVersion.author && (
                            <span className="ml-2">
                              由 {selectedVersion.author.name} 保存
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRollback(selectedVersion)}
                        disabled={isRollingBack}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors font-medium"
                      >
                        {isRollingBack ? '回滚中...' : '回滚到此版本'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          标题
                        </label>
                        <p className="text-text-primary">{selectedVersion.title}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          别名 (Slug)
                        </label>
                        <p className="text-text-primary font-mono text-sm">
                          {selectedVersion.slug}
                        </p>
                      </div>

                      {selectedVersion.excerpt && (
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            摘要
                          </label>
                          <p className="text-text-primary">{selectedVersion.excerpt}</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          状态
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            selectedVersion.published
                              ? 'bg-success/10 text-success'
                              : 'bg-warning/10 text-warning'
                          }`}
                        >
                          {selectedVersion.published ? '已发布' : '草稿'}
                        </span>
                      </div>

                      {selectedVersion.content && (
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            内容预览
                          </label>
                          <div className="bg-background rounded-lg p-4 border border-border max-h-80 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-sm text-text-primary">
                              {selectedVersion.content}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-secondary">
                    选择左侧的版本查看详情
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
