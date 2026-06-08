'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiCheckCircle,
  FiAlertCircle, FiSearch, FiX, FiShield, FiUserCheck,
  FiUserX, FiRefreshCw, FiMoreVertical, FiEye, FiEyeOff
} from 'react-icons/fi';

// ==================== TYPES ====================
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  roleId: number;
  roleName?: string;
  status: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
}

// ==================== CONSTANTS ====================
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status', icon: '🔄' },
  { value: 'active', label: 'Active', icon: '✅' },
  { value: 'inactive', label: 'Inactive', icon: '❌' },
];

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles', icon: '👥' },
  { value: 'super_admin', label: 'Super Admin', icon: '👑' },
  { value: 'editor', label: 'Editor', icon: '✍️' },
  { value: 'author', label: 'Content Manager', icon: '📝' },
  { value: 'contributor', label: 'SEO Manager', icon: '🔍' },
  { value: 'viewer', label: 'Analytics Viewer', icon: '👀' },
];

// ==================== COMPONENTS ====================

// Stat Card Component
const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// User Row Component (Single Declaration)
const UserRow = ({ user, onEdit, onDelete, onToggleStatus }: { 
  user: User; 
  onEdit: (user: User) => void; 
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, status: boolean) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const getRoleDisplay = (role: string) => {
    // Super Admin check
    if (role === 'Super Admin' || role === 'super_admin' || role === 'admin') {
      return { label: 'Super Admin', color: 'bg-purple-100 text-purple-700', icon: <FiShield className="w-3 h-3" /> };
    }
    // Editor check
    if (role === 'editor' || role === 'Editor') {
      return { label: 'Editor', color: 'bg-blue-100 text-blue-700', icon: <FiEdit2 className="w-3 h-3" /> };
    }
    // Content Manager / Author check
    if (role === 'author' || role === 'Content Manager') {
      return { label: 'Content Manager', color: 'bg-green-100 text-green-700', icon: <FiUserCheck className="w-3 h-3" /> };
    }
    // SEO Manager / Contributor check
    if (role === 'contributor' || role === 'SEO Manager') {
      return { label: 'SEO Manager', color: 'bg-yellow-100 text-yellow-700', icon: <FiSearch className="w-3 h-3" /> };
    }
    // Default Viewer / Analytics Viewer
    return { label: 'Analytics Viewer', color: 'bg-gray-100 text-gray-700', icon: <FiEye className="w-3 h-3" /> };
  };
  
  const roleDisplay = getRoleDisplay(user.role);
  
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleDisplay.color}`}>
          {roleDisplay.icon}
          {roleDisplay.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          user.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {user.status ? <FiCheckCircle className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
          {user.status ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiMoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="py-1">
                  <button
                    onClick={() => { onEdit(user); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit User
                  </button>
                  <button
                    onClick={() => { onToggleStatus(user.id, !user.status); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {user.status ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                    {user.status ? 'Deactivate' : 'Activate'}
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => { onDelete(user.id); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete User
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// Add/Edit User Modal
const UserModal = ({ isOpen, onClose, onSave, user, loading }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: { name: string; email: string; role: string; password?: string }) => void; 
  user: User | null;
  loading: boolean;
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'editor',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          role: user.role === 'Super Admin' ? 'super_admin' : user.role,
          password: '',
          confirmPassword: '',
        });
      } else {
        setFormData({
          name: '',
          email: '',
          role: 'editor',
          password: '',
          confirmPassword: '',
        });
      }
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, user]);
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!user) {
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    } else {
      if (formData.password && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const submitData: { name: string; email: string; role: string; password?: string } = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };
    
    if (formData.password) {
      submitData.password = formData.password;
    }
    
    onSave(submitData);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user ? 'Edit User' : 'Add New User'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {user ? 'Update user information' : 'Create a new user account'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="user@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.filter(r => r.value !== 'all').map((role) => (
                <option key={role.value} value={role.value}>
                  {role.icon} {role.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {user ? 'New Password (Optional)' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={user ? 'Leave blank to keep current password' : 'Enter password (min 6 characters)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {user ? 'Confirm New Password' : 'Confirm Password *'}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {user ? <FiEdit2 className="w-4 h-4" /> : <FiUserPlus className="w-4 h-4" />}
                  {user ? 'Update User' : 'Add User'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, onConfirm, userName, loading }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  userName: string;
  loading: boolean;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <FiAlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete User</h3>
          <p className="text-sm text-gray-500 text-center">
            Are you sure you want to delete <span className="font-medium text-gray-900">{userName}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiTrash2 className="w-4 h-4" />
                  Delete User
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/admin-users');
      const data = await res.json();
      
      if (data.success) {
        const formattedUsers = data.users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.roleName || (user.roleId === 9 ? 'Super Admin' : user.roleId === 2 ? 'editor' : user.roleId === 10 ? 'author' : user.roleId === 11 ? 'contributor' : 'viewer'),
          roleId: user.roleId,
          status: user.status,
          lastLogin: user.lastLogin || null,
          createdAt: user.createdAt,
        }));
        setUsers(formattedUsers);
      } else {
        console.error('Failed to fetch users:', data.error);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.status) ||
                         (statusFilter === 'inactive' && !user.status);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });
  
  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status).length,
    inactive: users.filter(u => !u.status).length,
    admins: users.filter(u => u.role === 'Super Admin' || u.role === 'admin').length,
  };
  
  // Handlers
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };
  
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };
  
  const handleSaveUser = async (userData: { name: string; email: string; role: string; password?: string }) => {
    setModalLoading(true);
    try {
      let url = '/api/admin/admin-users';
      let method = 'POST';
      
      if (selectedUser) {
        url = `/api/admin/admin-users/${selectedUser.id}`;
        method = 'PATCH';
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setShowModal(false);
        fetchUsers();
        alert(selectedUser ? 'User updated successfully!' : 'User created successfully!');
      } else {
        alert(data.error || 'Failed to save user');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      alert('Something went wrong');
    } finally {
      setModalLoading(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/admin-users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setShowDeleteModal(false);
        fetchUsers();
        alert('User deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Something went wrong');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const handleToggleStatus = async (id: number, newStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/admin-users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Failed to update status');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Bar */}
      <div className="bg-gray-900 text-white px-4 py-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-sm font-medium hover:text-gray-300">
              Dashboard
            </Link>
            <Link href="/admin/post" className="text-sm font-medium hover:text-gray-300">
              Posts
            </Link>
            <Link href="/admin/users" className="text-sm font-medium text-blue-400">
              Users
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-blue-600 px-2 py-1 rounded">Admin</span>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiUsers className="w-6 h-6" />
              Users
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your team members and their roles</p>
          </div>
          <button
            onClick={handleAddUser}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium"
          >
            <FiUserPlus className="w-4 h-4" />
            Add New User
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Users" value={stats.total} icon={<FiUsers className="w-5 h-5 text-white" />} color="bg-blue-500" />
          <StatCard title="Active Users" value={stats.active} icon={<FiUserCheck className="w-5 h-5 text-white" />} color="bg-green-500" />
          <StatCard title="Inactive Users" value={stats.inactive} icon={<FiUserX className="w-5 h-5 text-white" />} color="bg-red-500" />
          <StatCard title="Admins" value={stats.admins} icon={<FiShield className="w-5 h-5 text-white" />} color="bg-purple-500" />
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
              }}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition flex items-center gap-1"
            >
              <FiRefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
        
        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onEdit={handleEditUser}
                      onDelete={() => handleDeleteClick(user)}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-400">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
      
      {/* Modals */}
      <UserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        loading={modalLoading}
      />
      
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        userName={selectedUser?.name || ''}
        loading={deleteLoading}
      />
    </div>
  );
}