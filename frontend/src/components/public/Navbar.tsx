import { Link } from 'react-router-dom';
import { ShoppingCart, LogIn } from 'lucide-react';

import logo from '../../assets/logo.png';

const Navbar = () => {
    return (
        <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-3 group">
                    <img src={logo} alt="SMO FTE Logo" className="h-12 w-auto object-contain" />
                    <span className="text-gray-600 text-sm font-medium">ระบบยืม-คืนอุปกรณ์</span>
                </Link>

                {/* Right Menu */}
                <div className="flex items-center gap-4">
                    <Link
                        to="/cart"
                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-full transition-all relative"
                    >
                        <ShoppingCart size={24} />
                        {/* Cart Badge - To be implemented with state */}
                    </Link>

                    <Link
                        to="/login"
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all text-sm font-medium"
                    >
                        <LogIn size={18} />
                        สำหรับเจ้าหน้าที่
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
