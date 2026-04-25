import Link from 'next/link';
import { auth } from '@/auth';
import { signOut } from '@/auth';

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="font-bold text-xl text-text-primary">知识库</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                首页
              </Link>
              <Link
                href="/documents"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                文章列表
              </Link>
              <Link
                href="/search"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                搜索
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {session?.user ? (
              <div className="flex items-center space-x-4">
                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-text-secondary hover:text-primary transition-colors"
                  >
                    管理后台
                  </Link>
                )}
                <span className="text-text-secondary text-sm">
                  {session.user.name || session.user.email}
                </span>
                <form
                  action={async () => {
                    'use server';
                    await signOut({ redirectTo: '/' });
                  }}
                >
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-danger transition-colors"
                  >
                    退出
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
