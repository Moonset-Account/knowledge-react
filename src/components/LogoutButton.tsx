'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ redirectTo: '/' });
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-danger transition-colors"
    >
      退出
    </button>
  );
}
