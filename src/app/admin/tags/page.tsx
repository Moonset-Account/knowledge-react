'use client';

import { useState, useEffect } from 'react';
import { generateSlug } from '@/lib/utils';

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count: { documents: number };
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error('加载标签失败:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!formData.name.trim()) {
      setError('请输入标签名称');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug || generateSlug(formData.name),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '创建失败');
        return;
      }

      setFormData({ name: '', slug: '' });
      setShowForm(false);
      loadTags();
    } catch (err) {
      setError('创建失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此标签吗？')) return;

    try {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadTags();
      }
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">标签管理</h1>
          <p className="text-text-secondary">共 {tags.length} 个标签</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
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
          新建标签
        </button>
      </div>

      {showForm && (
        <div className="bg-surface rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">新建标签</h2>
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                标签名称 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="输入标签名称"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">别名 (Slug)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="URL 别名，留空将自动生成"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50"
              >
                {submitting ? '创建中...' : '创建'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-background text-text-secondary border border-border rounded-lg hover:border-primary transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border p-6">
        {isLoading ? (
          <div className="p-8 text-center text-text-secondary">加载中...</div>
        ) : tags.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-full group"
              >
                <span className="text-text-primary font-medium">{tag.name}</span>
                <span className="text-text-secondary text-sm">({tag._count.documents})</span>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="opacity-0 group-hover:opacity-100 text-danger hover:text-danger/80 transition-all ml-1"
                  title="删除标签"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-text-secondary">暂无标签</div>
        )}
      </div>
    </div>
  );
}
