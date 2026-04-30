// src/app/admin/users/page.tsx
import { MoreVertical, UserPlus, Mail } from 'lucide-react';

const users = [
  { id: 1, name: 'Alex Murphy', email: 'alex@boardify.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Sarah Koenig', email: 'sarah@boardify.com', role: 'Member', status: 'Active' },
  { id: 3, name: 'Mike Torento', email: 'mike@boardify.com', role: 'Member', status: 'Inactive' },
];

export default function UsersPage() {
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
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Status</th>
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
              <td className="px-6 py-4"><span className="text-sm text-gray-700">{user.role}</span></td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{user.status}</span>
              </td>
              <td className="px-6 py-4 text-right text-gray-400 hover:text-gray-600 cursor-pointer"><MoreVertical size={18} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}