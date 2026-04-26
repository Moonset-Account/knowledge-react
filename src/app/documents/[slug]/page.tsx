import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { canAccessDocument, getCurrentUser } from '@/lib/auth';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Metadata } from 'next';
import { CommentSection } from '@/components/CommentSection';
import { DocumentInteraction } from '@/components/DocumentInteraction';
import { DocumentContent } from '@/components/DocumentContent';

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
  const [document, currentUser] = await Promise.all([
    getDocument(slug),
    getCurrentUser(),
  ]);

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

  const isAuthenticated = !!currentUser;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <DocumentContent
        document={{
          id: document.id,
          title: document.title,
          content: document.content,
          excerpt: document.excerpt,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          viewCount: document.viewCount,
          author: document.author,
          category: document.category,
          tags: document.tags,
        }}
        isAuthenticated={isAuthenticated}
      />

      <div className="mt-6">
        <DocumentInteraction documentId={document.id} isAuthenticated={isAuthenticated} />
      </div>

      <CommentSection documentId={document.id} isAuthenticated={isAuthenticated} />

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
