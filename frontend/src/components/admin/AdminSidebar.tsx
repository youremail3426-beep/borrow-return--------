import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, ArrowLeftRight, LogOut, History as HistoryIcon } from 'lucide-react';

import logo from '../../assets/logo.png';

const AdminSidebar = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/equipment', icon: Package, label: 'จัดการอุปกรณ์' },
        { path: '/admin/reservations', icon: FileText, label: 'รายการจอง' },
        { path: '/admin/borrow-return', icon: ArrowLeftRight, label: 'ยืม/คืน' },
        { path: '/admin/history', icon: HistoryIcon, label: 'ประวัติ' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <div className="h-screen w-64 bg-white border-r shadow-sm fixed left-0 top-0 flex flex-col">
            <div className="p-6 border-b flex items-center gap-3">
                <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Icon size={20} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors"
                >
                    <LogOut size={20} />
                    ออกจากระบบ
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
