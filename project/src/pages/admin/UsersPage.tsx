import { useEffect, useState } from 'react';
import { Search, Shield, UserX, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserRole } from '../../types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const fetchUsers = async () => {
    let q = supabase.from('users').select('*').order('created_at', { ascending: false });
    if (roleFilter !== 'all') q = q.eq('role', roleFilter);
    const { data } = await q;
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const updateRole = async (userId: string, role: UserRole) => {
    await supabase.from('users').update({ role }).eq('id', userId);
    await fetchUsers();
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await supabase.from('users').update({ status: newStatus }).eq('id', userId);
    await fetchUsers();
  };

  const filtered = search
    ? users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    : users;

  const roleBadge: Record<string, string> = {
    client: 'bg-blue-100 text-blue-700',
    moderator: 'bg-yellow-100 text-yellow-700',
    admin: 'bg-green-100 text-green-700',
    super_admin: 'bg-red-100 text-red-700',
  };

  return (
    <DashboardLayout title="Manage Users">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="client">Client</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <span className="font-semibold text-gray-900">{filtered.length} users</span>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {u.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${roleBadge[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                    {u.role.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.status}
                  </span>
                  {u.id !== currentUser?.id && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <select
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value as UserRole)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="client">client</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                      <button
                        onClick={() => toggleStatus(u.id, u.status)}
                        className={`p-1.5 rounded-lg transition ${u.status === 'active' ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={u.status === 'active' ? 'Suspend' : 'Activate'}
                      >
                        {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
