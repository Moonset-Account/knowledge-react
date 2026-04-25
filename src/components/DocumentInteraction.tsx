'use client';

import { useState, useEffect } from 'react';

interface DocumentInteractionProps {
  documentId: string;
  isAuthenticated: boolean;
}

export function DocumentInteraction({ documentId, isAuthenticated }: DocumentInteractionProps) {
  const [bookmarkState, setBookmarkState] = useState({ isBookmarked: false, count: 0 });
  const [likeState, setLikeState] = useState({ isLiked: false, count: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const [bookmarkRes, likeRes] = await Promise.all([
          fetch(`/api/documents/${documentId}/bookmark`),
          fetch(`/api/documents/${documentId}/like`),
        ]);

        if (bookmarkRes.ok) {
          const data = await bookmarkRes.json();
          setBookmarkState({ isBookmarked: data.isBookmarked, count: data.count });
        }

        if (likeRes.ok) {
          const data = await likeRes.json();
          setLikeState({ isLiked: data.isLiked, count: data.count });
        }
      } catch (err) {
        console.error('Failed to fetch interaction states:', err);
      }
    };

    fetchStates();
  }, [documentId]);

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setBookmarkState({ isBookmarked: data.isBookmarked, count: data.count });
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!isAuthenticated || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setLikeState({ isLiked: data.isLiked, count: data.count });
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleLikeToggle}
        disabled={!isAuthenticated || loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          likeState.isLiked
            ? 'bg-primary/10 text-primary'
            : 'bg-background text-text-secondary hover:bg-primary/5 hover:text-primary'
        } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <svg
          className="w-5 h-5"
          fill={likeState.isLiked ? 'currentColor' : 'none'}
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
        <span className="font-medium">{likeState.count}</span>
        <span className="text-sm hidden sm:inline">{likeState.isLiked ? '已点赞' : '点赞'}</span>
      </button>

      <button
        onClick={handleBookmarkToggle}
        disabled={!isAuthenticated || loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          bookmarkState.isBookmarked
            ? 'bg-warning/10 text-warning'
            : 'bg-background text-text-secondary hover:bg-warning/5 hover:text-warning'
        } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <svg
          className="w-5 h-5"
          fill={bookmarkState.isBookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <span className="font-medium">{bookmarkState.count}</span>
        <span className="text-sm hidden sm:inline">
          {bookmarkState.isBookmarked ? '已收藏' : '收藏'}
        </span>
      </button>
    </div>
  );
}
