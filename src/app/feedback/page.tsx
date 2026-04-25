'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const feedbackTypes = [
  { value: 'bug', label: 'Bug 反馈', icon: '🐛', description: '报告系统问题或错误' },
  { value: 'feature', label: '功能建议', icon: '💡', description: '建议添加新功能' },
  { value: 'improvement', label: '改进建议', icon: '✨', description: '对现有功能的改进建议' },
  { value: 'other', label: '其他', icon: '💬', description: '其他问题或建议' },
];

export default function FeedbackPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleTypeChange = (type: string) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type) {
      setError('请选择反馈类型');
      return;
    }

    if (!formData.title.trim()) {
      setError('请输入反馈标题');
      return;
    }

    if (!formData.content.trim()) {
      setError('请输入反馈内容');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title.trim(),
          content: formData.content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '提交失败，请稍后重试');
        return;
      }

      setSuccess(true);
      setFormData({ type: '', title: '', content: '' });
    } catch (err) {
      setError('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            反馈提交成功！
          </h2>
          <p className="text-text-secondary mb-6">
            感谢您的反馈，我们会尽快处理。
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              继续提交反馈
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 border border-border text-text-secondary rounded-lg hover:bg-background transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">提交反馈</h1>
        <p className="text-text-secondary">
          您的反馈对我们很重要，请告诉我们您遇到的问题或建议。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-3">
            反馈类型 <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {feedbackTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeChange(type.value)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  formData.type === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{type.icon}</span>
                  <span
                    className={`font-medium ${
                      formData.type === type.value
                        ? 'text-primary'
                        : 'text-text-primary'
                    }`}
                  >
                    {type.label}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            反馈标题 <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="请简要描述您的反馈"
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
            maxLength={100}
          />
          <p className="mt-1 text-xs text-text-secondary">
            {formData.title.length}/100 字符
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            详细内容 <span className="text-danger">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={6}
            placeholder="请详细描述您遇到的问题或建议。如果是 Bug 反馈，请提供复现步骤和期望行为。"
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background resize-vertical"
            maxLength={2000}
          />
          <p className="mt-1 text-xs text-text-secondary">
            {formData.content.length}/2000 字符
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '提交中...' : '提交反馈'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-border text-text-secondary rounded-lg hover:bg-background transition-colors font-medium"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
