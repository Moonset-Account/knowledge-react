'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validateEmail, validatePassword } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.name.trim().length < 2) {
      setError('姓名至少需要 2 个字符');
      setIsLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('请输入有效的邮箱地址');
      setIsLoading(false);
      return;
    }

    const passwordCheck = validatePassword(formData.password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message || '密码格式不正确');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '注册失败');
        return;
      }

      router.push('/login?registered=true');
    } catch (err) {
      setError('注册失败，请稍后重试');
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">创建账户</h1>
          <p className="text-text-secondary">注册一个新的知识库账户</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border p-8">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                姓名
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="您的姓名"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>

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
                placeholder="至少 6 位字符"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                确认密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="再次输入密码"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '注册中...' : '创建账户'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              已有账户？{' '}
              <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
                立即登录
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
