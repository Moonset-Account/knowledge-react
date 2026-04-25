import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
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
            </div>
            <p className="text-text-secondary text-sm max-w-md">
              一个功能完善的全栈知识库管理系统，支持文章发布、分类管理、标签系统和权限控制。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-text-primary mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-text-secondary hover:text-primary text-sm transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link href="/documents" className="text-text-secondary hover:text-primary text-sm transition-colors">
                  文章列表
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-text-secondary hover:text-primary text-sm transition-colors">
                  搜索
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-text-primary mb-4">账号</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-text-secondary hover:text-primary text-sm transition-colors">
                  登录
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-text-secondary hover:text-primary text-sm transition-colors">
                  注册
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-text-secondary text-sm text-center">
            &copy; {new Date().getFullYear()} 知识库系统. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  );
}
