"use client";

// src/app/admin/users/page.tsx
import { useEffect, useState } from 'react';
import { MoreVertical, UserPlus, Mail } from 'lucide-react';

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  created_at?: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);

      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!isMounted) return;

      if (!response.ok) {
        console.error('Failed to load users:', data.error || response.statusText);
        setUsers([]);
      } else {
        setUsers(data.users ?? []);
      }

      setIsLoading(false);
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500">Manage your team members and their account roles.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <UserPlus size={18} /> Add User
        </button>
      </div>
      {isLoading ? (
        <div className="px-6 py-10 text-sm text-gray-500">
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div className="px-6 py-10 text-sm text-gray-500">
          No users found yet.
        </div>
      ) : (
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Created</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} /> {user.email}</div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-700">{user.email}</span>
              </td>
              <td className="px-6 py-4"><span className="text-sm text-gray-700 capitalize">{user.role}</span></td>
              <td className="px-6 py-4 text-sm text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
              <td className="px-6 py-4 text-right text-gray-400 hover:text-gray-600 cursor-pointer"><MoreVertical size={18} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}