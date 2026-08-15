import { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(''); // Clear previous errors
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);

            Swal.fire({
                icon: 'success',
                title: 'เข้าสู่ระบบสำเร็จ',
                showConfirmButton: false,
                timer: 1500
            });

            navigate('/admin/dashboard');
        } catch (err: any) {
            setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            Swal.fire({
                icon: 'error',
                title: 'เข้าสู่ระบบล้มเหลว',
                text: err.response?.data?.message || 'โปรดตรวจสอบข้อมูลอีกครั้ง'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-primary mb-2">SMO FTE</h1>
                    <p className="text-gray-500 text-sm font-medium">ระบบจัดการอุปกรณ์สำหรับเจ้าหน้าที่</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95
                            ${isLoading ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-secondary text-white shadow-primary/30'}
                        `}
                    >
                        {isLoading ? '⏳ กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="/" className="text-sm text-gray-400 hover:text-primary transition-colors">กลับหน้าหลัก</a>
                </div>
            </div>
        </div>
    );
}
