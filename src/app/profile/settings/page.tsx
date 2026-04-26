'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [currentName, setCurrentName] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');

  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setCurrentName(data.user.name || '');
          setCurrentImage(data.user.image || null);
          setName(data.user.name || '');
        }
      } catch (err) {
        console.error('加载失败:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('图片大小不能超过 5MB');
      return;
    }

    setImageError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateImage = async () => {
    if (!previewImage) {
      setImageError('请先选择图片');
      return;
    }

    setSaving(true);
    setImageError('');
    setImageSuccess('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: previewImage }),
      });

      if (res.ok) {
        const data = await res.json();
        setImageSuccess('头像更新成功！');
        setCurrentImage(data.user.image);
        setPreviewImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTimeout(() => setImageSuccess(''), 3000);
      } else {
        const data = await res.json();
        setImageError(data.error || '更新失败');
      }
    } catch (err) {
      setImageError('更新失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImage && !previewImage) return;

    setSaving(true);
    setImageError('');
    setImageSuccess('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      });

      if (res.ok) {
        setImageSuccess('头像已移除！');
        setCurrentImage(null);
        setPreviewImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTimeout(() => setImageSuccess(''), 3000);
      } else {
        const data = await res.json();
        setImageError(data.error || '操作失败');
      }
    } catch (err) {
      setImageError('操作失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');

    if (!name.trim()) {
      setNameError('昵称不能为空');
      return;
    }

    if (name.trim() === currentName) {
      setNameError('昵称未修改');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        setNameSuccess('昵称修改成功！');
        setCurrentName(name.trim());
        setTimeout(() => setNameSuccess(''), 3000);
      } else {
        const data = await res.json();
        setNameError(data.error || '修改失败');
      }
    } catch (err) {
      setNameError('修改失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('请填写所有必填字段');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('新密码至少需要6个字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (res.ok) {
        setPasswordSuccess('密码修改成功！');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        const data = await res.json();
        setPasswordError(data.error || '修改失败');
      }
    } catch (err) {
      setPasswordError('修改失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  const displayImage = previewImage || currentImage;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回个人主页
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-8">账号设置</h1>

      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">设置头像</h2>
        {imageError && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
            {imageError}
          </div>
        )}
        {imageSuccess && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
            {imageSuccess}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="头像"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-primary text-2xl font-bold">
                  {currentName?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-white
                  hover:file:bg-primary-hover
                  cursor-pointer"
              />
              <p className="mt-1 text-xs text-text-secondary">
                支持 JPG、PNG、GIF 格式，最大 5MB
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleUpdateImage}
                disabled={!previewImage || saving}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存头像'}
              </button>
              {(currentImage || previewImage) && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={saving}
                  className="px-4 py-2 border border-danger text-danger rounded-lg hover:bg-danger/5 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  移除头像
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">修改昵称</h2>
        <form onSubmit={handleUpdateName}>
          {nameError && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {nameError}
            </div>
          )}
          {nameSuccess && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
              {nameSuccess}
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              昵称
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入昵称"
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">修改密码</h2>
        <form onSubmit={handleUpdatePassword}>
          {passwordError && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
              {passwordSuccess}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="oldPassword"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                旧密码
              </label>
              <input
                type="password"
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入旧密码"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                新密码
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6个字符）"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                确认新密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '修改中...' : '修改密码'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
