'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Role {
  id: string;
  name: string;
}

export default function NewDocumentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    categoryId: '',
    published: false,
    selectedTags: [] as string[],
    selectedRoles: [] as string[],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, tagRes, roleRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/tags'),
          fetch('/api/roles'),
        ]);
        if (catRes.ok) setCategories((await catRes.json()).categories || []);
        if (tagRes.ok) setTags((await tagRes.json()).tags || []);
        if (roleRes.ok) setRoles((await roleRes.json()).roles || []);
      } catch (err) {
        console.error('加载数据失败:', err);
      }
    }
    loadData();
  }, []);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter((id) => id !== tagId)
        : [...prev.selectedTags, tagId],
    }));
  };

  const handleRoleToggle = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter((id) => id !== roleId)
        : [...prev.selectedRoles, roleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.title.trim()) {
      setError('请输入文章标题');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug: formData.slug || generateSlug(formData.title),
          content: formData.content,
          excerpt: formData.excerpt,
          categoryId: formData.categoryId || null,
          published: formData.published,
          tagIds: formData.selectedTags,
          roleIds: formData.selectedRoles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '创建失败');
        return;
      }

      router.push('/admin/documents');
      router.refresh();
    } catch (err) {
      setError('创建失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">新建文章</h1>
        <p className="text-text-secondary">创建一篇新的知识库文章</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        <div className="bg-surface rounded-xl border border-border p-6 mb-6">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                标题 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="输入文章标题"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                别名 (Slug)
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="文章 URL 别名，留空将自动生成"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="excerpt"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                摘要
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={2}
                placeholder="文章简短摘要"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                内容 (Markdown)
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={20}
                placeholder="使用 Markdown 格式编写文章内容..."
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background font-mono text-sm resize-vertical"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  分类
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
                >
                  <option value="">选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-text-primary">立即发布</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                标签
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.selectedTags.includes(tag.id)
                        ? 'bg-primary text-white'
                        : 'bg-background text-text-secondary border border-border hover:border-primary'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                访问权限（不选则所有人可见）
              </label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleToggle(role.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.selectedRoles.includes(role.id)
                        ? 'bg-primary text-white'
                        : 'bg-background text-text-secondary border border-border hover:border-primary'
                    }`}
                  >
                    {role.name === 'ADMIN' ? '管理员' : role.name === 'USER' ? '普通用户' : role.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '创建中...' : '创建文章'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-background text-text-secondary border border-border rounded-lg hover:border-primary transition-colors font-medium"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
