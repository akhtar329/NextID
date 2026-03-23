// app/admin/components/Topbar.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  RefreshCw,
  Shield,
  Mail,
  Calendar,
  Clock,
  Camera,
  UserCircle,
  Wifi,
  Database,
  Cpu,
  FileText,
  GraduationCap,
  Building2,
  Newspaper,
  CalendarDays,
  Users,
  Activity,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

// Types
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  link?: string;
  icon?: string;
  action?: {
    label: string;
    url: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  lastLogin: Date;
  joinDate: Date;
  permissions: string[];
}

interface SystemStats {
  activeUsers: number;
  totalUsers: number;
  totalSessions: number;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  apiLatency: number;
  lastUpdated: Date;
}

// Sample real-time notifications (these would come from your API)
const generateSampleNotifications = (): Notification[] => [
  {
    id: '1',
    type: 'success',
    title: 'New Admission Created',
    message: 'BS Computer Science admission has been added for Fall 2026',
    time: new Date(Date.now() - 2 * 60 * 1000),
    read: false,
    icon: '🎓',
    link: '/admin/admissions',
    action: { label: 'View Admission', url: '/admin/admissions' }
  },
  {
    id: '2',
    type: 'info',
    title: 'New Program Added',
    message: 'Artificial Intelligence program has been added to Engineering category',
    time: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    icon: '💻',
    link: '/admin/programs',
    action: { label: 'View Program', url: '/admin/programs' }
  },
  {
    id: '3',
    type: 'warning',
    title: 'Low Disk Space',
    message: 'Server disk space is running low (85% used). Please clean up old files.',
    time: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
    icon: '⚠️',
    action: { label: 'Check Storage', url: '/admin/settings' }
  },
  {
    id: '4',
    type: 'success',
    title: 'Results Announced',
    message: 'BS Computer Science results for Fall 2025 have been announced',
    time: new Date(Date.now() - 120 * 60 * 1000),
    read: true,
    icon: '📊',
    link: '/admin/results',
    action: { label: 'View Results', url: '/admin/results' }
  },
  {
    id: '5',
    type: 'info',
    title: 'New Institute Registered',
    message: 'FAST NUCES has been added to the institutes list',
    time: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: true,
    icon: '🏛️',
    link: '/admin/institutes',
    action: { label: 'View Institute', url: '/admin/institutes' }
  },
];

export default function Topbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { data: session } = useSession();
  const user = session?.user;

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || 
      (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Fetch real data
  const fetchData = async () => {
    try {
      const profileRes = await fetch('/api/admin/profile');
      const profileData = await profileRes.json();
      if (profileData.success) {
        setProfile(profileData.profile);
        setEditedName(profileData.profile.name);
        setEditedEmail(profileData.profile.email);
      }

      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      const notifRes = await fetch('/api/admin/notifications?limit=20');
      const notifData = await notifRes.json();
      if (notifData.success && notifData.notifications?.length > 0) {
        setNotifications(notifData.notifications);
      } else {
        // Use sample notifications if no real data
        setNotifications(generateSampleNotifications());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use sample notifications on error
      setNotifications(generateSampleNotifications());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    toast.success("Stats updated!");
  };

  useEffect(() => {
    setMounted(true);
    fetchData();

    setCurrentTime(new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    }));
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      }));
    }, 60000);

    const statsInterval = setInterval(() => {
      fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
          if (data.success) setStats(data.stats);
        })
        .catch(console.error);
    }, 30000);

    const notifInterval = setInterval(() => {
      fetch('/api/admin/notifications?limit=20')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.notifications) {
            setNotifications(data.notifications);
          }
        })
        .catch(console.error);
    }, 60000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(statsInterval);
      clearInterval(notifInterval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowProfileModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Fixed dark mode toggle with localStorage
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      const loadingToastId = toast.loading("Logging out...");
      
      await signOut({ 
        redirect: false,
        callbackUrl: '/login'
      });
      
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      
      toast.dismiss(loadingToastId);
      toast.success("Logged out successfully!", {
        description: "Redirecting to login page..."
      });
      
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1500);
      
    } catch (error) {
      console.error("Logout error:", error);
      toast.dismiss();
      toast.error("Failed to logout. Please try again.", {
        description: "Check your connection and try again"
      });
    }
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'POST'
      });
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications/read-all', {
        method: 'POST'
      });
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error("Failed to mark all as read");
    }
  };

  const clearAllNotifications = async () => {
    try {
      await fetch('/api/admin/notifications/clear-all', {
        method: 'DELETE'
      });
      
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error("Failed to clear notifications");
    }
  };

  const handleProfileSave = async () => {
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          email: editedEmail
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setProfile(data.profile);
        setEditingProfile(false);
        toast.success("Profile updated successfully!");
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getUserInitials = (): string => {
    if (!profile?.name) return "U";
    return profile.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  };

  const getNotificationIcon = (type: string, customIcon?: string) => {
    if (customIcon) return <span className="text-xl">{customIcon}</span>;
    switch(type) {
      case 'success':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'warning':
        return <AlertCircle size={18} className="text-yellow-500" />;
      case 'error':
        return <X size={18} className="text-red-500" />;
      default:
        return <Info size={18} className="text-blue-500" />;
    }
  };

  if (loading || !profile || !stats) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div ref={modalRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal information</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-3xl">
                    {getUserInitials()}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                    <Camera size={16} />
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Profile Picture</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Upload a new photo (JPG, PNG, max 2MB)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <input type="email" value={editedEmail} onChange={(e) => setEditedEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                  <input type="text" value={profile.role} disabled className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member Since</label>
                  <input type="text" value={new Date(profile.joinDate).toLocaleDateString()} disabled className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Your Permissions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {profile.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <Shield size={16} className="text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button onClick={() => setShowProfileModal(false)} className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button onClick={handleProfileSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Topbar */}
      <div className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-6 flex-1">
          <div className="flex items-center space-x-3">
            <div className="hidden md:block">
              <button onClick={() => {/* Sidebar toggle */}} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Menu size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NextID Admin</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back, {profile.name.split(' ')[0]}</p>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="hidden lg:block flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users, reports, analytics..." className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 dark:text-white transition-all" />
            </div>
          </form>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative group">
            <RefreshCw size={20} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Refresh stats</div>
          </button>

          {/* ✅ Fixed Dark Mode Toggle */}
          <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative group">
            {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600 dark:text-gray-300" />}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {darkMode ? 'Light mode' : 'Dark mode'}
            </div>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative group">
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border dark:border-gray-800 z-50 overflow-hidden">
                <div className="p-4 border-b dark:border-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell size={18} className="text-blue-600" />
                        Notifications
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={markAllAsRead} className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">Mark all read</button>
                      <button onClick={clearAllNotifications} className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Clear</button>
                    </div>
                  </div>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto divide-y dark:divide-gray-800">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          handleNotificationClick(notification.id);
                          if (notification.link) router.push(notification.link);
                          if (notification.action) router.push(notification.action.url);
                          setShowNotifications(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type, notification.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                {notification.title}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                                {timeAgo(notification.time)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {notification.message}
                            </p>
                            {notification.action && (
                              <div className="mt-2">
                                <span className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
                                  {notification.action.label} →
                                </span>
                              </div>
                            )}
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later for updates</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <button
                      onClick={() => {
                        router.push("/admin/notifications");
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-lg shadow-md">
                  {getUserInitials()}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden lg:block text-left">
                <p className="font-semibold text-gray-800 dark:text-white">{profile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {profile.role}
                </p>
              </div>
              <ChevronDown size={18} className={`text-gray-500 dark:text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border dark:border-gray-800 py-2 z-50">
                <div className="px-4 py-4 border-b dark:border-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-xl shadow-md">
                      {getUserInitials()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-lg">{profile.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Mail size={14} /> {profile.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} /> Joined {new Date(profile.joinDate).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-b dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">System Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1"><Wifi size={14} /><span className="text-xs font-medium">Live</span></div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.activeUsers}</p>
                      <p className="text-xs text-gray-500">Active Users</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1"><Clock size={14} /><span className="text-xs font-medium">Uptime</span></div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatUptime(stats.uptime)}</p>
                      <p className="text-xs text-gray-500">Server</p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button onClick={() => { setShowDropdown(false); setShowProfileModal(true); }} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                      <UserCircle size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div><p className="font-medium text-gray-800 dark:text-white">My Profile</p><p className="text-xs text-gray-500 dark:text-gray-400">Edit your profile</p></div>
                  </button>
                  <button onClick={() => { setShowDropdown(false); router.push("/admin/settings"); }} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                      <Settings size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div><p className="font-medium text-gray-800 dark:text-white">Settings</p><p className="text-xs text-gray-500 dark:text-gray-400">Account & preferences</p></div>
                  </button>
                </div>

                <div className="px-4 py-3 border-t dark:border-gray-800">
                  <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-lg transition-all group">
                    <LogOut size={18} className="group-hover:animate-pulse" />
                    <span>Sign Out</span>
                  </button>
                  {mounted && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                      <Clock size={12} /> Last login: {new Date(profile.lastLogin).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-4 py-3">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 dark:text-white" />
          </div>
        </form>
      </div>

      {/* Status Bar */}
      {mounted && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 px-6 py-2 text-sm border-b border-blue-200 dark:border-blue-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                System Status: <span className="font-semibold">Operational</span>
              </span>
              <span className="text-gray-600 dark:text-gray-400 hidden md:flex items-center gap-2">
                <User size={14} /> <span>{stats.activeUsers} active users</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <Cpu size={14} /> <span>CPU: {stats.cpuUsage}%</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <Database size={14} /> <span>RAM: {stats.memoryUsage}%</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <RefreshCw size={14} className={stats.apiLatency > 200 ? 'text-yellow-500' : 'text-green-500'} />
                <span>{stats.apiLatency}ms</span>
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-xs flex items-center gap-1">
              <Clock size={12} /> Updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}