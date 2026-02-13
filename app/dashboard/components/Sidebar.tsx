'use client';
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Settings,
  LogOut,
  X,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminDetail } from '@/app/utils/type';
import { hasPermission } from '@/app/utils/permission';


const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    permissions: [
      "view_inventory",
      "view_expenses",
      "view_customer",
      "view_staff",
      "view_settings",
      "view_login_attempts",
    ]
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
    permissions: ["view_inventory"],
  },
  {
    name: "Sales",
    href: "/sales",
    icon: ShoppingCart,
    permissions: ["view_sales"],
  },
  {
    name: "Finance",
    href: "/expenses",
    icon: DollarSign,
    permissions: ["view_expenses"],
  },

  {
    name: "Customers",
    href: "/customers",
    icon: Users,
    permissions: ["view_customer"],
  },
  {
    name: "Staffs",
    href: "/staffs",
    icon: Workflow,
    permissions: ["view_staff"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    permissions: ["view_settings"],
  },
];




interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminDetail, setAdminDetail] = useState<AdminDetail | null>(null);
  const [initials, setInitials] = useState('AD');

  const adminPermissions = adminDetail?.permissions || [];

  const getInitials = (fullName?: string) => {
    if (!fullName) return 'AD';
    
    const names = fullName.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

 
  const getNames = (fullName?: string) => {
    if (!fullName) return { firstName: 'Admin', lastName: 'User' };
    
    const names = fullName.trim().split(/\s+/);
    return {
      firstName: names[0],
      lastName: names.length > 1 ? names[names.length - 1] : '',
    };
  };

  useEffect(() => {
    const adminDetailStr = localStorage.getItem('adminDetail');
    if (adminDetailStr) {
      try {
        const detail: AdminDetail = JSON.parse(adminDetailStr);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAdminDetail(detail);
        setInitials(getInitials(detail.full_name));
      } catch (error) {
        console.error('Failed to parse admin detail:', error);
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminDetail');
    onClose();
    router.push('/auth/login');
  };

  const names = getNames(adminDetail?.full_name);

  

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 bottom-0 z-50 w-64",
        "bg-gray-900 backdrop-blur-sm border-r border-gray-800",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:h-screen lg:sticky lg:top-0"
      )}
      style={{ height: '100vh' }} 
    >
      <div className="flex flex-col h-full">
        
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="h-8 w-8 bg-green-400 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">BMT</span>
            </div>
            <div>
              <div className="font-bold text-white text-lg">Big Men</div> 
              <div className="text-xs text-gray-400 -mt-1">Transaction Apparel</div>
            </div>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

       
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-4 space-y-1">
        {navigation
  .filter(item =>
    !item.permissions ||
    hasPermission(adminPermissions, item.permissions)
  )
  .map((item) => {
    const Icon = item.icon;
    const isActive = pathname.startsWith(item.href);


              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-green-400 text-black"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        
        <div className="p-4 border-t border-gray-800 shrink-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 rounded-full bg-green-400/10 flex items-center justify-center">
              <span className="text-green-400 font-bold text-sm">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {names.firstName} {names.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {adminDetail?.role || 'Administrator'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors mt-2"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}