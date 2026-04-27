'use client';

import { useState, useEffect } from 'react';
import { PERMISSIONS } from '@/lib/auth';

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
  };
}

const PERMISSION_GROUPS = [
  {
    name: '文章管理',
    permissions: [
      { key: PERMISSIONS.READ_DOCUMENTS, label: '查看文章' },
      { key: PERMISSIONS.CREATE_DOCUMENTS, label: '创建文章' },
      { key: PERMISSIONS.EDIT_DOCUMENTS, label: '编辑文章' },
      { key: PERMISSIONS.DELETE_DOCUMENTS, label: '删除文章' },
      { key: PERMISSIONS.PUBLISH_DOCUMENTS, label: '发布文章' },
      { key: PERMISSIONS.REVIEW_DOCUMENTS, label: '审核文章' },
    ],
  },
  {
    name: '评论管理',
    permissions: [
      { key: PERMISSIONS.READ_COMMENTS, label: '查看评论' },
      { key: PERMISSIONS.CREATE_COMMENTS, label: '发表评论' },
      { key: PERMISSIONS.DELETE_OWN_COMMENTS, label: '删除自己的评论' },
      { key: PERMISSIONS.DELETE_ALL_COMMENTS, label: '删除所有评论' },
    ],
  },
  {
    name: '用户管理',
    permissions: [
      { key: PERMISSIONS.READ_USERS, label: '查看用户' },
      { key: PERMISSIONS.CREATE_USERS, label: '创建用户' },
      { key: PERMISSIONS.EDIT_USERS, label: '编辑用户' },
      { key: PERMISSIONS.DELETE_USERS, label: '删除用户' },
    ],
  },
  {
    name: '角色管理',
    permissions: [
      { key: PERMISSIONS.READ_ROLES, label: '查看角色' },
      { key: PERMISSIONS.CREATE_ROLES, label: '创建角色' },
      { key: PERMISSIONS.EDIT_ROLES, label: '编辑角色' },
      { key: PERMISSIONS.DELETE_ROLES, label: '删除角色' },
    ],
  },
  {
    name: '分类管理',
    permissions: [
      { key: PERMISSIONS.READ_CATEGORIES, label: '查看分类' },
      { key: PERMISSIONS.CREATE_CATEGORIES, label: '创建分类' },
      { key: PERMISSIONS.EDIT_CATEGORIES, label: '编辑分类' },
      { key: PERMISSIONS.DELETE_CATEGORIES, label: '删除分类' },
    ],
  },
  {
    name: '标签管理',
    permissions: [
      { key: PERMISSIONS.READ_TAGS, label: '查看标签' },
      { key: PERMISSIONS.CREATE_TAGS, label: '创建标签' },
      { key: PERMISSIONS.EDIT_TAGS, label: '编辑标签' },
      { key: PERMISSIONS.DELETE_TAGS, label: '删除标签' },
    ],
  },
  {
    name: '其他权限',
    permissions: [
      { key: PERMISSIONS.READ_LOGS, label: '查看日志' },
      { key: PERMISSIONS.READ_FEEDBACKS, label: '查看反馈' },
      { key: PERMISSIONS.ADMIN_DASHBOARD, label: '访问管理后台' },
    ],
  },
];

const PERMISSION_LABELS: Record<string, string> = {};
for (const group of PERMISSION_GROUPS) {
  for (const perm of group.permissions) {
    PERMISSION_LABELS[perm.key] = perm.label;
  }
}

function getPermissionLabel(key: string): string {
  return PERMISSION_LABELS[key] || key;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      } else {
        setError('加载角色列表失败');
      }
    } catch (err) {
      console.error('加载角色列表失败:', err);
      setError('加载角色列表失败');
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateRole = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
    });
    setShowModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    let permissions: string[] = [];
    try {
      permissions = JSON.parse(role.permissions);
    } catch {
      permissions = [];
    }
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions,
    });
    setShowModal(true);
  };

  const handleSaveRole = async () => {
    if (!formData.name.trim()) {
      alert('角色名称不能为空');
      return;
    }

    setSaving(true);
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim().toUpperCase(),
          description: formData.description.trim() || null,
          permissions: formData.permissions,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadRoles();
      } else {
        const data = await res.json();
        alert(data.error || '保存失败');
      }
    } catch (err) {
      console.error('保存角色失败:', err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.name === 'ADMIN') {
      alert('不能删除管理员角色');
      return;
    }

    if (role._count.users > 0) {
      alert(`该角色下还有 ${role._count.users} 个用户，无法删除`);
      return;
    }

    if (!confirm(`确定要删除角色 "${role.name}" 吗？`)) {
      return;
    }

    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadRoles();
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (err) {
      console.error('删除角色失败:', err);
      alert('删除失败');
    }
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const toggleGroupPermissions = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every((p) => formData.permissions.includes(p));
    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => !groupPermissions.includes(p)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...groupPermissions])],
      }));
    }
  };

  const getRoleBadgeClass = (name: string) => {
    switch (name) {
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">角色管理</h1>
          <p className="text-text-secondary">共 {roles.length} 个角色</p>
        </div>
        <button
          onClick={handleCreateRole}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          新建角色
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-secondary">加载中...</div>
        ) : roles.length > 0 ? (
          <div className="divide-y divide-border">
            {roles.map((role) => (
              <div key={role.id} className="p-6 hover:bg-background/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeClass(role.name)}`}
                      >
                        {role.name}
                      </span>
                      <span className="text-sm text-text-secondary">
                        ({role._count.users} 个用户)
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-sm text-text-secondary mb-2">{role.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        let permissions: string[] = [];
                        try {
                          permissions = JSON.parse(role.permissions);
                        } catch {
                          permissions = [];
                        }
                        if (permissions.includes('*')) {
                          return (
                            <span className="inline-flex px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                              全部权限
                            </span>
                          );
                        }
                        return permissions.slice(0, 5).map((p) => (
                          <span
                            key={p}
                            className="inline-flex px-2 py-1 text-xs bg-background text-text-secondary rounded"
                            title={p}
                          >
                            {getPermissionLabel(p)}
                          </span>
                        ));
                      })()}
                      {(() => {
                        let permissions: string[] = [];
                        try {
                          permissions = JSON.parse(role.permissions);
                        } catch {
                          permissions = [];
                        }
                        if (!permissions.includes('*') && permissions.length > 5) {
                          return (
                            <span className="inline-flex px-2 py-1 text-xs bg-background text-text-secondary rounded">
                              +{permissions.length - 5} 更多
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      编辑
                    </button>
                    {role.name !== 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="px-3 py-1 text-sm text-danger hover:bg-danger/10 rounded transition-colors"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-text-secondary">暂无角色</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">
                {editingRole ? '编辑角色' : '新建角色'}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    角色名称 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入角色名称"
                    disabled={editingRole?.name === 'ADMIN'}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {editingRole?.name === 'ADMIN' && (
                    <p className="text-xs text-text-secondary mt-1">管理员角色名称不能修改</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    角色描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="输入角色描述（可选）"
                    rows={2}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-text-primary resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-text-primary">
                      权限分配
                    </label>
                    <span className="text-xs text-text-secondary">
                      已选择 {formData.permissions.length} 个权限
                    </span>
                  </div>
                  <div className="space-y-4">
                    {PERMISSION_GROUPS.map((group) => {
                      const groupPermissionKeys = group.permissions.map((p) => p.key);
                      const allSelected = groupPermissionKeys.every((p) =>
                        formData.permissions.includes(p)
                      );
                      const someSelected = groupPermissionKeys.some((p) =>
                        formData.permissions.includes(p)
                      );

                      return (
                        <div
                          key={group.name}
                          className="border border-border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-text-primary">{group.name}</h3>
                            <button
                              onClick={() => toggleGroupPermissions(groupPermissionKeys)}
                              className="text-xs text-primary hover:underline"
                            >
                              {allSelected ? '取消全选' : '全选'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {group.permissions.map((permission) => (
                              <label
                                key={permission.key}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(permission.key)}
                                  onChange={() => togglePermission(permission.key)}
                                  className="rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-text-secondary">
                                  {permission.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-4 py-2 text-text-secondary hover:bg-background rounded-lg transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveRole}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
