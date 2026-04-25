'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const isRegistered = searchParams.get('registered') === 'true';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(isRegistered ? '注册成功！请使用您的邮箱和密码登录。' : '');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('邮箱或密码错误');
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">欢迎回来</h1>
          <p className="text-text-secondary">登录您的账户以继续</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border p-8">
          {success && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                邮箱
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              还没有账户？{' '}
              <Link href="/register" className="text-primary hover:text-primary-hover font-medium">
                立即注册
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-sm text-text-secondary">
            <strong>测试账号：</strong><br />
            管理员: admin@example.com / admin123<br />
            普通用户: user@example.com / user123
          </p>
        </div>
      </div>
    </div>
  );
}
