'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/lib/utils';

interface Notification {
  id: string;
  userId: string;
  type: 'COMMENT' | 'REPLY';
  isRead: boolean;
  data: {
    documentId: string;
    documentTitle: string;
    documentSlug: string;
    commentId: string;
    commentContent: string;
    commenterId: string;
    commenterName: string;
    parentCommentId: string | null;
    parentCommentContent: string | null;
    parentCommenterId: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const limit = 20;

  async function loadNotifications(pageNum: number, append: boolean = false) {
    try {
      const res = await fetch(`/api/notifications?page=${pageNum}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setNotifications((prev) => [...prev, ...data.notifications]);
        } else {
          setNotifications(data.notifications);
        }
        setTotal(data.total);
        setUnreadCount(data.unreadCount);
        setHasMore(pageNum < data.totalPages);
      }
    } catch (err) {
      console.error('加载通知失败:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications(1);
  }, []);

  const handleMarkAsRead = async (notification: Notification, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (notification.isRead) return;

    setMarkingRead(notification.id);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notification.id }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => prev - 1);
      }
    } catch (err) {
      console.error('标记已读失败:', err);
    } finally {
      setMarkingRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('全部标记已读失败:', err);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage, true);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notification.id }),
        });
        setUnreadCount((prev) => prev - 1);
      } catch (err) {
        console.error('标记已读失败:', err);
      }
    }
    router.push(`/documents/${notification.data.documentSlug}#comments`);
  };

  const getNotificationText = (notification: Notification) => {
    const { type, data } = notification;
    if (type === 'COMMENT') {
      return `${data.commenterName} 评论了你的文章「${data.documentTitle}」`;
    }
    if (type === 'REPLY') {
      return `${data.commenterName} 回复了你的评论`;
    }
    return '新通知';
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">通知</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-text-secondary mt-1">
              你有 <span className="text-primary font-medium">{unreadCount}</span> 条未读通知
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            全部标为已读
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h2 className="text-lg font-semibold text-text-primary mb-2">暂无通知</h2>
          <p className="text-text-secondary">当有人评论你的文章或回复你的评论时，你会在这里收到通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                notification.isRead
                  ? 'bg-surface border-border hover:bg-background'
                  : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.isRead ? 'bg-background' : 'bg-primary/10'
                  }`}>
                    {notification.type === 'COMMENT' ? (
                      <svg className={`w-5 h-5 ${notification.isRead ? 'text-text-secondary' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    ) : (
                      <svg className={`w-5 h-5 ${notification.isRead ? 'text-text-secondary' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.isRead ? 'text-text-secondary' : 'text-text-primary'}`}>
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                    「{notification.data.commentContent}」
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {formatDateTime(new Date(notification.createdAt))}
                  </p>
                </div>

                {!notification.isRead && (
                  <button
                    onClick={(e) => handleMarkAsRead(notification, e)}
                    disabled={markingRead === notification.id}
                    className="text-xs text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
                  >
                    {markingRead === notification.id ? '处理中...' : '标为已读'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-background text-text-secondary border border-border rounded-lg hover:border-primary transition-colors"
          >
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}
