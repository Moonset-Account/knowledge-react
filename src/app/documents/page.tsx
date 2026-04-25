import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDate, truncateText } from '@/lib/utils';
import { getDocumentVisibilityFilter } from '@/lib/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '文章列表 - 知识库系统',
  description: '浏览知识库中的所有文章',
};

const PAGE_SIZE = 10;

async function getDocuments(params: {
  search?: string;
  category?: string;
  tag?: string;
  page?: string;
}) {
  const { search, category, tag, page } = params;
  const currentPage = parseInt(page || '1');
  const skip = (currentPage - 1) * PAGE_SIZE;

  const visibilityFilter = await getDocumentVisibilityFilter();
  const where: any = { published: true, ...visibilityFilter };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    const categoryRecord = await prisma.category.findUnique({
      where: { slug: category },
    });
    if (categoryRecord) {
      where.categoryId = categoryRecord.id;
    }
  }

  if (tag) {
    const tagRecord = await prisma.tag.findUnique({
      where: { slug: tag },
    });
    if (tagRecord) {
      where.tags = {
        some: {
          tagId: tagRecord.id,
        },
      };
    }
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.document.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return { documents, totalPages, currentPage, total };
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
    take: 15,
  });
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    tag?: string;
    page?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams?.search || '';
  const categorySlug = resolvedSearchParams?.category || '';
  const tagSlug = resolvedSearchParams?.tag || '';
  const pageParam = resolvedSearchParams?.page || '';

  const [{ documents, totalPages, currentPage, total }, categories, tags] =
    await Promise.all([
      getDocuments({
        search: searchQuery,
        category: categorySlug,
        tag: tagSlug,
        page: pageParam,
      }),
      getCategories(),
      getTags(),
    ]);

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const getQueryString = (overrides: Record<string, string | number>) => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (categorySlug) params.category = categorySlug;
    if (tagSlug) params.tag = tagSlug;
    if (pageParam && !overrides.page) params.page = pageParam;
    
    Object.entries(overrides).forEach(([key, value]) => {
      if (value) {
        params[key] = String(value);
      } else {
        delete params[key];
      }
    });
    
    const searchString = new URLSearchParams(params).toString();
    return searchString ? `?${searchString}` : '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">文章列表</h1>
        <p className="text-text-secondary">共 {total} 篇文章</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {documents.length > 0 ? (
            <>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.slug}`}
                    className="block bg-surface rounded-xl border border-border p-6 hover:shadow-lg transition-all group"
                  >
                    <div className="flex flex-wrap gap-2 mb-3">
                      {doc.category && (
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                          {doc.category.name}
                        </span>
                      )}
                      {doc.tags.map((dt) => (
                        <span
                          key={dt.tagId}
                          className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full"
                        >
                          {dt.tag.name}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                      {doc.title}
                    </h2>
                    {doc.excerpt && (
                      <p className="text-text-secondary mb-4">{truncateText(doc.excerpt, 200)}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-text-secondary">
                      <div className="flex items-center gap-4">
                        {doc.author && <span>作者: {doc.author.name}</span>}
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                      <span>{doc.viewCount} 次阅读</span>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {hasPrev && (
                    <Link
                      href={`/documents${getQueryString({ page: currentPage - 1 })}`}
                      className="px-4 py-2 bg-surface border border-border rounded-lg hover:border-primary transition-colors text-text-secondary"
                    >
                      上一页
                    </Link>
                  )}
                  <span className="px-4 py-2 text-text-secondary">
                    {currentPage} / {totalPages}
                  </span>
                  {hasNext && (
                    <Link
                      href={`/documents${getQueryString({ page: currentPage + 1 })}`}
                      className="px-4 py-2 bg-surface border border-border rounded-lg hover:border-primary transition-colors text-text-secondary"
                    >
                      下一页
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-surface rounded-xl border border-border">
              <svg
                className="w-16 h-16 text-border mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-text-primary mb-2">暂无文章</h3>
              <p className="text-text-secondary">还没有任何文章被发布</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold text-text-primary mb-4">分类</h3>
            <div className="space-y-2">
              <Link
                href="/documents"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  !categorySlug
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-secondary hover:bg-background'
                }`}
              >
                全部分类
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/documents${getQueryString({ category: cat.slug, page: '' })}`}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    categorySlug === cat.slug
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-background'
                  }`}
                >
                  <div className="flex justify-between">
                    <span>{cat.name}</span>
                    <span className="opacity-60">({cat._count.documents})</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold text-text-primary mb-4">热门标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/documents${getQueryString({ tag: tag.slug, page: '' })}`}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs transition-colors ${
                    tagSlug === tag.slug
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-secondary hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <span>{tag.name}</span>
                  <span className="ml-1 opacity-75">({tag._count.documents})</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
