'use client';

import { useState, useEffect } from 'react';
import { generateSlug } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { documents: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('加载分类失败:', err);
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
      setError('请输入分类名称');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '创建失败');
        return;
      }

      setFormData({ name: '', slug: '', description: '' });
      setShowForm(false);
      loadCategories();
    } catch (err) {
      setError('创建失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此分类吗？')) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadCategories();
      }
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">分类管理</h1>
          <p className="text-text-secondary">共 {categories.length} 个分类</p>
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
          新建分类
        </button>
      </div>

      {showForm && (
        <div className="bg-surface rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">新建分类</h2>
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                分类名称 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="输入分类名称"
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
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="分类描述（可选）"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background resize-none"
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

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-secondary">加载中...</div>
        ) : categories.length > 0 ? (
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  名称
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  别名
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  文章数
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-background/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-text-primary">{cat.name}</div>
                    {cat.description && (
                      <div className="text-sm text-text-secondary">{cat.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{cat.slug}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{cat._count.documents}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-danger hover:text-danger/80 transition-colors"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-text-secondary">暂无分类</div>
        )}
      </div>
    </div>
  );
}
