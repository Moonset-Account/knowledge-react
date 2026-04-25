import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDate, truncateText } from '@/lib/utils';
import { getDocumentVisibilityFilter } from '@/lib/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '首页 - 知识库系统',
  description: '探索知识，发现洞见。浏览我们精选的知识库文章。',
};

async function getLatestDocuments() {
  const visibilityFilter = await getDocumentVisibilityFilter();
  return prisma.document.findMany({
    where: { published: true, ...visibilityFilter },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });
}

async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: {
        select: { documents: { where: { published: true } } },
      },
    },
  });
}

async function getTags() {
  return prisma.tag.findMany({
    include: {
      _count: {
        select: { documents: true },
      },
    },
    orderBy: { documents: { _count: 'desc' } },
    take: 10,
  });
}

export default async function Home() {
  const [documents, categories, tags] = await Promise.all([
    getLatestDocuments(),
    getCategories(),
    getTags(),
  ]);

  return (
    <div>
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            探索知识，发现洞见
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            一个功能完善的全栈知识库管理系统，支持文章发布、分类管理、标签系统和权限控制。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/documents"
              className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              浏览文章
            </Link>
            <Link
              href="/search"
              className="px-8 py-3 bg-surface text-text-primary border border-border rounded-lg hover:border-primary transition-colors font-medium"
            >
              搜索内容
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-text-primary">最新文章</h2>
            <Link
              href="/documents"
              className="text-primary hover:text-primary-hover text-sm font-medium"
            >
              查看全部 →
            </Link>
          </div>

          {documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.slug}`}
                  className="bg-surface rounded-xl border border-border p-6 hover:shadow-lg transition-all group"
                >
                  {doc.category && (
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-3">
                      {doc.category.name}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                    {doc.title}
                  </h3>
                  {doc.excerpt && (
                    <p className="text-text-secondary text-sm mb-4">
                      {truncateText(doc.excerpt, 120)}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{formatDate(doc.createdAt)}</span>
                    <span>{doc.viewCount} 次阅读</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-surface rounded-xl border border-border">
              <p className="text-text-secondary">暂无文章</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">分类</h2>
              {categories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/documents?category=${cat.slug}`}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-primary transition-colors"
                    >
                      <div>
                        <h3 className="font-medium text-text-primary">{cat.name}</h3>
                        {cat.description && (
                          <p className="text-sm text-text-secondary mt-1">
                            {truncateText(cat.description, 30)}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-text-secondary">
                        {cat._count.documents} 篇
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-background rounded-lg border border-border">
                  <p className="text-text-secondary">暂无分类</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">热门标签</h2>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/documents?tag=${tag.slug}`}
                      className="inline-flex items-center px-4 py-2 bg-background border border-border rounded-full text-sm text-text-secondary hover:bg-primary hover:text-white hover:border-primary transition-colors"
                    >
                      <span>{tag.name}</span>
                      <span className="ml-2 text-xs opacity-75">
                        ({tag._count.documents})
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-background rounded-lg border border-border">
                  <p className="text-text-secondary">暂无标签</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
