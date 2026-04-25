'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: string | null;
  image: string | null;
  createdAt: string;
  role: { id: string; name: string } | null;
  _count: { documents: number };
}

interface Role {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/roles'),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);
      }
    } catch (err) {
      console.error('加载用户失败:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleRoleChange = async (userId: string, roleId: string | null) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId }),
      });

      if (response.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error('更新角色失败:', err);
    }
  };

  const getRoleName = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return '管理员';
      case 'USER':
        return '普通用户';
      default:
        return roleName;
    }
  };

  const getRoleBadgeClass = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return 'bg-danger/10 text-danger';
      case 'USER':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-secondary/10 text-secondary';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">用户管理</h1>
        <p className="text-text-secondary">共 {users.length} 个用户</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-secondary">加载中...</div>
        ) : users.length > 0 ? (
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  用户
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  邮箱
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  角色
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  文章数
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  注册时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-background/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || ''}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-text-primary">
                          {user.name || '未设置'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role?.id || ''}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value || null)
                      }
                      className="px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-background"
                    >
                      <option value="">无角色</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {getRoleName(role.name)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {user._count.documents}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-text-secondary">暂无用户</div>
        )}
      </div>
    </div>
  );
}
