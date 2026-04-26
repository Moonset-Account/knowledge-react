'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/lib/utils';
import { VersionHistory } from '@/components/VersionHistory';
import MDEditor from '@uiw/react-md-editor';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

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

interface Document {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  categoryId: string | null;
  published: boolean;
  tagIds: string[];
  roleIds: string[];
}

interface EditDocumentPageProps {
  params: Promise<{ id: string }>;
}

export default function EditDocumentPage({ params }: EditDocumentPageProps) {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    async function init() {
      const { id } = await params;
      setDocumentId(id);
      loadData(id);
    }
    init();
  }, [params]);

  async function loadData(id: string) {
    setIsLoading(true);
    setError('');
    try {
      const [docRes, catRes, tagRes, roleRes] = await Promise.all([
        fetch(`/api/admin/documents/${id}`),
        fetch('/api/categories'),
        fetch('/api/tags'),
        fetch('/api/roles'),
      ]);

      if (!docRes.ok) {
        const err = await docRes.json();
        throw new Error(err.error || '加载文章失败');
      }

      const docData = await docRes.json();
      const doc: Document = docData.document;

      setFormData({
        title: doc.title,
        slug: doc.slug,
        content: doc.content || '',
        excerpt: doc.excerpt || '',
        categoryId: doc.categoryId || '',
        published: doc.published,
        selectedTags: doc.tagIds || [],
        selectedRoles: doc.roleIds || [],
      });

      if (catRes.ok) setCategories((await catRes.json()).categories || []);
      if (tagRes.ok) setTags((await tagRes.json()).tags || []);
      if (roleRes.ok) setRoles((await roleRes.json()).roles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
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
    if (!documentId) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('请输入文章标题');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'PUT',
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
        setError(data.error || '更新失败');
        return;
      }

      setSuccess('更新成功！');
      setTimeout(() => {
        router.push('/admin/documents');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError('更新失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!documentId) return;
    if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/documents');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError('删除失败，请稍后重试');
    } finally {
      setIsSaving(false);
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

  const handleContentChange = useCallback((value?: string) => {
    setFormData((prev) => ({ ...prev, content: value || '' }));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !documentId) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={() => router.back()}
          className="text-primary hover:text-primary-hover"
        >
          返回上一页
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">编辑文章</h1>
          <p className="text-text-secondary">修改文章内容和设置</p>
        </div>
        <div className="flex items-center gap-3">
          {documentId && (
            <VersionHistory
              documentId={documentId}
              onRollback={(version) => {
                setFormData({
                  title: version.title,
                  slug: version.slug,
                  content: version.content || '',
                  excerpt: version.excerpt || '',
                  categoryId: version.categoryId || '',
                  published: version.published,
                  selectedTags: JSON.parse(version.tagIds || '[]'),
                  selectedRoles: JSON.parse(version.roleIds || '[]'),
                });
                setSuccess(`已回滚到版本 ${version.version}，请保存更改`);
              }}
            />
          )}
          <button
            onClick={handleDelete}
            disabled={isSaving}
            className="px-4 py-2 text-danger border border-danger/30 rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50"
          >
            删除文章
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl">
        {success && (
          <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
            {success}
          </div>
        )}
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
              <div className="w-full">
                <MDEditor
                  value={formData.content}
                  onChange={handleContentChange}
                  height={600}
                  preview="live"
                  textareaProps={{
                    name: 'content',
                    id: 'content',
                    placeholder: '使用 Markdown 格式编写文章内容...',
                  }}
                />
              </div>
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
                  <span className="text-sm font-medium text-text-primary">已发布</span>
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
            disabled={isSaving}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '保存更改'}
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
