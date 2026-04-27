'use client';

import { useState, useEffect } from 'react';
import { formatDateTime } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  documentId: string;
  userId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  likeCount: number;
  isLiked: boolean;
  isDeleted?: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  documentId: string;
  isAuthenticated: boolean;
  currentUserId?: string;
}

export function CommentSection({ documentId, isAuthenticated, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const filteredComments = data.comments?.filter((c: Comment) => !c.isDeleted) || [];
        if (page === 1) {
          setComments(filteredComments);
        } else {
          setComments((prev) => [...prev, ...filteredComments]);
        }
        setTotal(data.total || 0);
      }
    } catch (err) {
      setError('加载评论失败');
    }
  };

  useEffect(() => {
    fetchComments();
  }, [documentId, page]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment('');
        setTotal((prev) => prev + 1);
      } else {
        const errorData = await res.json();
        setError(errorData.error || '发布评论失败');
      }
    } catch (err) {
      setError('发布评论失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim() || !isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, parentId: commentId }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, replies: [...(c.replies || []), data.comment] }
              : c
          )
        );
        setReplyContent('');
        setReplyingTo(null);
      } else {
        const errorData = await res.json();
        setError(errorData.error || '发布回复失败');
      }
    } catch (err) {
      setError('发布回复失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string, isReply: boolean = false, parentCommentId?: string) => {
    if (!confirm('确定要删除这条评论吗？')) {
      return;
    }

    setDeletingId(commentId);
    setError(null);

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (isReply && parentCommentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentCommentId
                ? {
                    ...c,
                    replies: (c.replies || []).filter((r) => r.id !== commentId),
                  }
                : c
            )
          );
        } else {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          setTotal((prev) => Math.max(0, prev - 1));
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || '删除评论失败');
      }
    } catch (err) {
      setError('删除评论失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLikeComment = async (commentId: string, isReply: boolean = false) => {
    if (!isAuthenticated) return;

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return { ...c, isLiked: data.isLiked, likeCount: data.count };
            }
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId ? { ...r, isLiked: data.isLiked, likeCount: data.count } : r
                ),
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error('点赞失败');
    }
  };

  const loadMoreComments = () => {
    setPage((prev) => prev + 1);
  };

  const hasMore = comments.length < total;

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden mt-8">
      <div className="p-6 md:p-8">
        <h3 className="text-xl font-bold text-text-primary mb-6">
          评论 ({total})
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 text-danger rounded-lg text-sm">
            {error}
          </div>
        )}

        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="写下你的评论..."
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none text-text-primary bg-surface"
              rows={3}
              disabled={loading}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? '发布中...' : '发布评论'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-background rounded-lg text-center">
            <p className="text-text-secondary">
              请先
              <a href="/login" className="text-primary hover:underline mx-1">
                登录
              </a>
              后发表评论
            </p>
          </div>
        )}

        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-center text-text-secondary py-8">
              暂无评论，快来发表第一条评论吧！
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                onLike={handleLikeComment}
                onReplyStart={(id) => {
                  setReplyingTo(id);
                  setReplyContent('');
                }}
                onDelete={handleDeleteComment}
                replyingTo={replyingTo}
                replyContent={replyContent}
                onReplyChange={setReplyContent}
                onSubmitReply={handleSubmitReply}
                onCancelReply={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                loading={loading}
                deletingId={deletingId}
              />
            ))
          )}
        </div>

        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMoreComments}
              className="px-6 py-2 border border-border text-text-secondary rounded-lg hover:bg-background transition-colors"
            >
              加载更多评论
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  isAuthenticated: boolean;
  currentUserId?: string;
  onLike: (id: string, isReply: boolean) => void;
  onReplyStart: (id: string) => void;
  onDelete: (id: string, isReply: boolean, parentCommentId?: string) => void;
  replyingTo: string | null;
  replyContent: string;
  onReplyChange: (val: string) => void;
  onSubmitReply: (id: string) => void;
  onCancelReply: () => void;
  loading: boolean;
  deletingId: string | null;
}

function CommentItem({
  comment,
  isAuthenticated,
  currentUserId,
  onLike,
  onReplyStart,
  onDelete,
  replyingTo,
  replyContent,
  onReplyChange,
  onSubmitReply,
  onCancelReply,
  loading,
  deletingId,
}: CommentItemProps) {
  const canDelete = currentUserId === comment.userId;
  const isDeleting = deletingId === comment.id;

  return (
    <div className="border-b border-border last:border-b-0 pb-6 last:pb-0">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          {comment.user.image ? (
            <img
              src={comment.user.image}
              alt="头像"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-primary text-sm font-medium">
              {comment.user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-medium text-text-primary">
              {comment.user.name || '匿名用户'}
            </span>
            <span className="text-xs text-text-secondary">
              {formatDateTime(new Date(comment.createdAt))}
            </span>
          </div>
          <p className="text-text-primary whitespace-pre-wrap break-words mb-3">
            {comment.content}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => onLike(comment.id, false)}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1 transition-colors ${
                comment.isLiked
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-primary'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg
                className="w-4 h-4"
                fill={comment.isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{comment.likeCount}</span>
            </button>
            {isAuthenticated && (
              <button
                onClick={() => onReplyStart(comment.id)}
                className="text-text-secondary hover:text-primary transition-colors"
              >
                回复
              </button>
            )}
            {isAuthenticated && canDelete && (
              <button
                onClick={() => onDelete(comment.id, false)}
                disabled={isDeleting}
                className="text-danger hover:text-danger-hover transition-colors disabled:opacity-50"
              >
                {isDeleting ? '删除中...' : '删除'}
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-4">
              <textarea
                value={replyContent}
                onChange={(e) => onReplyChange(e.target.value)}
                placeholder="写下你的回复..."
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none text-text-primary bg-surface text-sm"
                rows={2}
                disabled={loading}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={loading || !replyContent.trim()}
                  className="px-4 py-1 bg-primary text-white text-sm rounded hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  发送
                </button>
                <button
                  onClick={onCancelReply}
                  className="px-4 py-1 text-text-secondary text-sm rounded hover:bg-background transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-14 mt-4 space-y-4">
          {comment.replies.filter(r => !r.isDeleted).map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-secondary text-xs font-medium">
                  {reply.user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-text-primary text-sm">
                    {reply.user.name || '匿名用户'}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {formatDateTime(new Date(reply.createdAt))}
                  </span>
                </div>
                <p className="text-text-primary text-sm whitespace-pre-wrap break-words mb-2">
                  {reply.content}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <button
                    onClick={() => onLike(reply.id, true)}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-1 transition-colors ${
                      reply.isLiked
                        ? 'text-primary'
                        : 'text-text-secondary hover:text-primary'
                    } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill={reply.isLiked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{reply.likeCount}</span>
                  </button>
                  {isAuthenticated && currentUserId === reply.userId && (
                    <button
                      onClick={() => onDelete(reply.id, true, comment.id)}
                      disabled={deletingId === reply.id}
                      className="text-danger hover:text-danger-hover transition-colors disabled:opacity-50"
                    >
                      {deletingId === reply.id ? '删除中...' : '删除'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
