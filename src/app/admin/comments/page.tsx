'use client';

import { useState, useEffect } from 'react';
import { formatDateTime } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Document {
  id: string;
  title: string;
  slug: string;
}

interface Comment {
  id: string;
  content: string;
  documentId: string;
  userId: string;
  parentId: string | null;
  isDeleted: boolean;
  deletedBy: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  document: Document;
  _count: {
    replies: number;
    likes: number;
  };
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [page, includeDeleted]);

  async function loadComments() {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/admin/comments?page=${page}&limit=${limit}&includeDeleted=${includeDeleted}`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setTotal(data.total || 0);
      } else {
        setError('加载评论失败');
      }
    } catch (err) {
      console.error('加载评论失败:', err);
      setError('加载评论失败');
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) {
      return;
    }

    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadComments();
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (err) {
      console.error('删除评论失败:', err);
      alert('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">评论管理</h1>
          <p className="text-text-secondary">共 {total} 条评论</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => {
              setIncludeDeleted(e.target.checked);
              setPage(1);
            }}
            className="rounded border-border"
          />
          显示已删除评论
        </label>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-secondary">加载中...</div>
        ) : comments.length > 0 ? (
          <div className="divide-y divide-border">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-6 ${comment.isDeleted ? 'bg-gray-50 opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {comment.user.image ? (
                          <img
                            src={comment.user.image}
                            alt={comment.user.name || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-primary text-sm font-medium">
                            {(comment.user.name || comment.user.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">
                            {comment.user.name || '未设置'}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {comment.user.email}
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary">
                          {formatDateTime(new Date(comment.createdAt))}
                          {comment.isDeleted && (
                            <span className="ml-2 text-danger">
                              (已删除 - {comment.deletedBy === 'admin' ? '管理员' : '用户'})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-text-primary whitespace-pre-wrap break-words mb-3 ml-13">
                      {comment.isDeleted ? '[此评论已删除]' : comment.content}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-text-secondary ml-13">
                      <span>文章: {comment.document.title}</span>
                      <span>回复数: {comment._count.replies}</span>
                      <span>点赞数: {comment._count.likes}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/documents/${comment.document.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      查看文章
                    </a>
                    {!comment.isDeleted && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingId === comment.id}
                        className="px-3 py-1 text-sm text-danger hover:bg-danger/10 rounded transition-colors disabled:opacity-50"
                      >
                        {deletingId === comment.id ? '删除中...' : '删除'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-text-secondary">暂无评论</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <span className="text-text-secondary">
            第 {page} 页 / 共 {totalPages} 页
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
