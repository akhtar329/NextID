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
  Moon
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

// Define types
interface Notification {
  id: number;
  message: string;
  time: string;
  read?: boolean;
}

export default function Topbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, message: "New user registered", time: "2 min ago" },
    { id: 2, message: "System backup completed", time: "1 hour ago" },
    { id: 3, message: "Payment received", time: "3 hours ago" },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { data: session } = useSession();
  const user = session?.user;

  // Client-side only mount
  useEffect(() => {
    setMounted(true);
    
    // Set initial time
    setCurrentTime(new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      toast.success("Logged out successfully!");
      
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1500);
      
    } catch (error) {
      console.error("Logout error:", error);
      toast.dismiss();
      toast.error("Failed to logout. Please try again.");
    }
  };

  const handleNotificationClick = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
    setShowNotifications(false);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadNotifications(0);
    toast.success("All notifications cleared");
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    router.push("/admin/profile");
  };

  const handleSettingsClick = () => {
    setShowDropdown(false);
    router.push("/admin/settings");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for: ${searchQuery}`);
    }
  };

  // Get user initials
  const getUserInitials = (): string => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        {/* Left side - Logo & Search */}
        <div className="flex items-center space-x-6 flex-1">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:block">
              <button 
                onClick={() => {/* Add sidebar toggle functionality */}}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Welcome back, {user?.name || "Administrator"}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:block flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users, reports, analytics..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 dark:text-white transition-all"
              />
            </div>
          </form>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative group"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} className="text-gray-600 dark:text-gray-300" />
            )}
            <div className="absolute -top-2 -right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {darkMode ? "Light mode" : "Dark mode"}
            </div>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative group"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {unreadNotifications}
                </span>
              )}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Notifications
              </div>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border dark:border-gray-800 z-50 overflow-hidden">
                <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-800 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell size={40} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No notifications</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-4 border-t dark:border-gray-800">
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

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors group"
              aria-label="User menu"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                  {getUserInitials()}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
              </div>
              
              <div className="hidden lg:block text-left">
                <p className="font-semibold text-gray-800 dark:text-white">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role || "Super Admin"}
                </p>
              </div>
              
              <ChevronDown 
                size={18} 
                className={`text-gray-500 dark:text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border dark:border-gray-800 py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b dark:border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-xl">
                      {getUserInitials()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-white truncate">
                        {user?.name || "Administrator"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user?.email || "admin@example.com"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                      <User size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">My Profile</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">View & edit profile</p>
                    </div>
                  </button>

                  <button
                    onClick={handleSettingsClick}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                      <Settings size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Settings</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Account settings</p>
                    </div>
                  </button>
                </div>

                {/* Logout Section */}
                <div className="px-4 py-3 border-t dark:border-gray-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-lg transition-all group"
                  >
                    <LogOut size={18} className="group-hover:animate-pulse" />
                    <span>Sign Out</span>
                  </button>
                  
                  {/* Last login - CLIENT SIDE ONLY */}
                  {mounted && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                      Last login: Today, {currentTime}
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
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 dark:text-white"
            />
          </div>
        </form>
      </div>

      {/* Status Bar - CLIENT SIDE ONLY */}
      {mounted && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 px-6 py-2 text-sm border-b border-blue-200 dark:border-blue-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                🟢 System Status: <span className="font-semibold">Operational</span>
              </span>
              <span className="text-gray-600 dark:text-gray-400 hidden md:inline">
                👤 245 active users • ⏰ Uptime: 99.8%
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-xs">
              Last updated: {currentTime}
            </div>
          </div>
        </div>
      )}
    </>
  );
}