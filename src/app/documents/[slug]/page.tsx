import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { canAccessDocument } from '@/lib/auth';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getDocument(slug: string) {
  const document = await prisma.document.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      accessRoles: { select: { id: true, name: true } },
    },
  });

  if (!document) {
    return null;
  }

  await prisma.document.update({
    where: { id: document.id },
    data: { viewCount: { increment: 1 } },
  });

  return document;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const document = await getDocument(slug);

  if (!document) {
    return {
      title: '文章未找到 - 知识库系统',
    };
  }

  return {
    title: `${document.title} - 知识库系统`,
    description: document.excerpt || document.title,
  };
}

export default async function DocumentPage({ params }: Props) {
  const { slug } = await params;
  const document = await getDocument(slug);

  if (!document) {
    notFound();
  }

  if (!document.published) {
    notFound();
  }

  const hasAccess = await canAccessDocument(document.id);
  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-surface rounded-xl border border-border p-12">
          <svg
            className="w-16 h-16 text-danger mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-text-primary mb-2">访问受限</h1>
          <p className="text-text-secondary mb-6">
            您没有权限查看此文档。请登录具有相应权限的账户后再试。
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <article className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-8 md:p-12">
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {document.category && (
                <Link
                  href={`/documents?category=${document.category.slug}`}
                  className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition-colors"
                >
                  {document.category.name}
                </Link>
              )}
              {document.tags.map((dt) => (
                <Link
                  key={dt.tagId}
                  href={`/documents?tag=${dt.tag.slug}`}
                  className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full hover:bg-secondary/20 transition-colors"
                >
                  {dt.tag.name}
                </Link>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              {document.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              {document.author && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary text-sm font-medium">
                      {document.author.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{document.author.name}</span>
                </div>
              )}
              <span>发布于 {formatDate(document.createdAt)}</span>
              <span>最后更新于 {formatDateTime(document.updatedAt)}</span>
              <span>{document.viewCount} 次阅读</span>
            </div>
          </header>

          {document.excerpt && (
            <div className="mb-8 p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
              <p className="text-text-secondary italic">{document.excerpt}</p>
            </div>
          )}

          {document.content && (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-background p-6 rounded-lg">
                {document.content}
              </pre>
            </div>
          )}
        </div>
      </article>

      <div className="mt-8 flex justify-between">
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回文章列表
        </Link>
      </div>
    </div>
  );
}
