import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/public/Navbar';
import TermsAndConditionsModal from '../../components/TermsAndConditionsModal';
import api from '../../services/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface Equipment {
    id: string;
    name: string;
    serialNumber: string;
    imageUrl?: string;
}

export default function CartPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [items, setItems] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isSuspended, setIsSuspended] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [formData, setFormData] = useState({
        borrowerName: '',
        borrowerEmail: '',
        studentId: '',
        yearLevel: '',
        department: '',
        faculty: '',
        phoneNumber: '',
        borrowDate: '',
        returnDate: '',
    });

    useEffect(() => {
        Swal.fire({
            icon: 'info',
            title: 'คำแนะนำการกรอกข้อมูล',
            html: `
                <div style="text-align: left; font-size: 14px; line-height: 1.6;">
                    <p>🔄 <strong>ผู้ที่เคยยืมแล้ว:</strong><br/>
                    กรอกเพียง <b style="color: #0F5132;">รหัสนักศึกษา</b> ระบบจะดึงข้อมูลอื่นๆ ของคุณมาให้อัตโนมัติ</p>
                    <hr style="margin: 12px 0; border: 0; border-top: 1px solid #eee;" />
                    <p>📝 <strong>ผู้ที่ยังไม่เคยยืม (ยืมครั้งแรก):</strong><br/>
                    กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง</p>
                </div>
            `,
            confirmButtonColor: '#0F5132',
            confirmButtonText: 'รับทราบ'
        });
    }, []);

    useEffect(() => {
        const itemIdsFromUrl = searchParams.get('items');
        let itemIds = '';
        
        if (itemIdsFromUrl) {
            itemIds = itemIdsFromUrl;
            localStorage.setItem('cartItems', JSON.stringify(itemIds.split(',')));
            window.dispatchEvent(new Event('cartUpdated'));
            setSearchParams({}, { replace: true }); // Clear from URL to prefer localStorage
        } else {
            try {
                const saved = localStorage.getItem('cartItems');
                itemIds = saved ? JSON.parse(saved).join(',') : '';
            } catch {
                itemIds = '';
            }
        }

        if (itemIds) {
            const currentIds = items.map(i => i.id).sort().join(',');
            const urlIds = itemIds.split(',').sort().join(',');

            if (currentIds !== urlIds) {
                setLoading(true);
                api.get(`/equipments?ids=${itemIds}`)
                    .then(res => setItems(res.data))
                    .catch(err => {
                        console.error(err);
                        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลอุปกรณ์ได้', 'error');
                    })
                    .finally(() => setLoading(false));
            }
        } else {
            setItems([]);
        }
    }, [searchParams]);

    const handleRemoveItem = (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        setItems(newItems);

        const newIdsArray = newItems.map(i => i.id);
        localStorage.setItem('cartItems', JSON.stringify(newIdsArray));
        window.dispatchEvent(new Event('cartUpdated'));

        // Update URL if it was being used
        const newIds = newIdsArray.join(',');
        if (searchParams.has('items')) {
            if (newIds) {
                setSearchParams({ items: newIds }, { replace: true });
            } else {
                setSearchParams({}, { replace: true });
            }
        }
    };

    const navigate = useNavigate();
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            let searchType: 'name' | 'email' | 'studentId' | '' = '';
            if (field === 'borrowerName') searchType = 'name';
            else if (field === 'borrowerEmail') searchType = 'email';
            else if (field === 'studentId') searchType = 'studentId';

            if (searchType) {
                fetchBorrowerInfo(searchType, value);
            }
        }, 800);
    };

    const fetchBorrowerInfo = async (type: 'email' | 'name' | 'studentId', value: string) => {
        if (!value) return;
        if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;

        try {
            let query = '';
            if (type === 'email') query = `email=${encodeURIComponent(value)}`;
            else if (type === 'name') query = `name=${encodeURIComponent(value)}`;
            else if (type === 'studentId') query = `studentId=${encodeURIComponent(value)}`;
            
            const res = await api.get(`/reservations/borrower/search?${query}`);
            if (res.data) {
                setFormData(prev => ({
                    ...prev,
                    borrowerName: res.data.borrowerName || prev.borrowerName,
                    borrowerEmail: res.data.borrowerEmail || prev.borrowerEmail,
                    studentId: res.data.studentId || prev.studentId,
                    yearLevel: res.data.yearLevel || prev.yearLevel,
                    department: res.data.department || prev.department,
                    faculty: res.data.faculty || prev.faculty,
                    phoneNumber: res.data.phoneNumber || prev.phoneNumber,
                }));

                if (res.data.isSuspended) {
                    setIsSuspended(true);
                    let untilText = res.data.suspendedUntil ? new Date(res.data.suspendedUntil).toLocaleDateString('th-TH') : 'ไม่มีกำหนด';
                    Swal.fire({
                        icon: 'error',
                        title: 'ระงับสิทธิ์การใช้งาน',
                        html: `
                            <p class="text-red-600 font-bold mb-2">ท่านถูกระงับสิทธิ์การจองและการยืม</p>
                            <p><strong>สาเหตุ:</strong> ${res.data.suspensionReason || 'ไม่ระบุ'}</p>
                            <p><strong>ปลดระงับวันที่:</strong> ${untilText}</p>
                            <p class="text-sm mt-4 text-gray-500">กรุณาติดต่อผู้ดูแลระบบหากมีข้อสงสัย</p>
                        `,
                        confirmButtonColor: '#d33'
                    });
                } else {
                    setIsSuspended(false);
                    Swal.fire({
                        icon: 'success',
                        title: 'เชื่อมโยงข้อมูลสำเร็จ',
                        text: 'ดึงข้อมูลประวัติผู้ยืมของคุณเรียบร้อยแล้ว',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000
                    });
                }
            }
        } catch (error: any) {
            // Ignore 404s, it just means they are a new borrower
            if (error.response?.status !== 404) {
                console.error('Failed to fetch borrower info:', error);
            }
            setIsSuspended(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side Validation for 3 Days Limit
        const start = new Date(formData.borrowDate);
        const end = new Date(formData.returnDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 3) {
            return Swal.fire('แจ้งเตือน', 'ยืมได้สูงสุดไม่เกิน 3 วัน', 'warning');
        }

        if (isSuspended) {
            return Swal.fire('ไม่สามารถจองได้', 'บัญชีของท่านอยู่ระหว่างถูกระงับสิทธิ์', 'error');
        }

        setShowTermsModal(true); // Open Modal instead of submitting directly
    };

    const executeSubmit = async () => {
        setSubmitting(true);
        try {
            await api.post('/reservations', {
                ...formData,
                equipmentIds: items.map(i => i.id)
            });

            await Swal.fire({
                icon: 'success',
                title: 'จองสำเร็จ!',
                text: 'กรุณารอการอนุมัติผ่านทางอีเมล',
                confirmButtonColor: '#0F5132'
            });

            // Clear cart and redirect
            setItems([]);
            setSearchParams({});
            localStorage.removeItem('cartItems');
            window.dispatchEvent(new Event('cartUpdated'));
            setFormData({
                borrowerName: '',
                borrowerEmail: '',
                studentId: '',
                yearLevel: '',
                department: '',
                faculty: '',
                phoneNumber: '',
                borrowDate: '',
                returnDate: '',
            });
            setIsSuspended(false);
            navigate('/');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'ไม่สามารถทำรายการได้ในขณะนี้';
            
            if (error.response?.data?.isSuspended) {
                setIsSuspended(true);
            }

            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: errorMessage,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">ยืนยันรายการจอง</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* List Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="font-bold text-lg mb-4">รายการอุปกรณ์ ({items.length})</h2>
                        {loading ? (
                            <p className="text-gray-400 text-center py-8">กำลังโหลด...</p>
                        ) : items.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">ไม่มีรายการที่เลือก</p>
                        ) : (
                            <ul className="space-y-4">
                                {items.map(item => (
                                    <li key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800">{item.name}</h4>
                                            <p className="text-xs text-gray-500">{item.serialNumber}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                            type="button"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Form Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border h-fit sticky top-24">
                        <h2 className="font-bold text-lg mb-4">ข้อมูลผู้ยืม</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.borrowerName}
                                    onChange={e => handleInputChange('borrowerName', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล (สถาบัน)</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.borrowerEmail}
                                    onChange={e => handleInputChange('borrowerEmail', e.target.value)}
                                />
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentEmail = formData.borrowerEmail;
                                            const atIndex = currentEmail.indexOf('@');
                                            const username = atIndex > -1 ? currentEmail.substring(0, atIndex) : currentEmail;
                                            handleInputChange('borrowerEmail', username + '@email.kmutnb.ac.th');
                                        }}
                                        className="text-xs bg-gray-100 hover:bg-primary/10 hover:text-primary border text-gray-600 px-2 py-1 rounded transition-colors"
                                    >
                                        + @email.kmutnb.ac.th
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentEmail = formData.borrowerEmail;
                                            const atIndex = currentEmail.indexOf('@');
                                            const username = atIndex > -1 ? currentEmail.substring(0, atIndex) : currentEmail;
                                            handleInputChange('borrowerEmail', username + '@fte.kmutnb.ac.th');
                                        }}
                                        className="text-xs bg-gray-100 hover:bg-primary/10 hover:text-primary border text-gray-600 px-2 py-1 rounded transition-colors"
                                    >
                                        + @fte.kmutnb.ac.th
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentEmail = formData.borrowerEmail;
                                            const atIndex = currentEmail.indexOf('@');
                                            const username = atIndex > -1 ? currentEmail.substring(0, atIndex) : currentEmail;
                                            handleInputChange('borrowerEmail', username + '@gmail.com');
                                        }}
                                        className="text-xs bg-gray-100 hover:bg-primary/10 hover:text-primary border text-gray-600 px-2 py-1 rounded transition-colors"
                                    >
                                        + @gmail.com
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักศึกษา</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.studentId}
                                    onChange={e => handleInputChange('studentId', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชั้นปี</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.yearLevel}
                                        onChange={e => setFormData({ ...formData, yearLevel: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ภาควิชา</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">คณะ/วิทยาลัย</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.faculty}
                                        onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ยืมวันที่ <span className="text-red-500 text-xs">(ล่วงหน้าไม่เกิน 7 วัน)</span></label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]} // Min today
                                        max={new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]} // Max 7 days
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.borrowDate}
                                        onChange={e => {
                                            const borrowDate = e.target.value;
                                            setFormData(prev => {
                                                let newReturnDate = prev.returnDate;
                                                // If borrow date changes, ensure return date is valid
                                                if (borrowDate) {
                                                    const maxReturn = new Date(new Date(borrowDate).setDate(new Date(borrowDate).getDate() + 3)).toISOString().split('T')[0];
                                                    // If current return date is invalid or after max, reset or cap it
                                                    if (!newReturnDate || newReturnDate < borrowDate || newReturnDate > maxReturn) {
                                                        newReturnDate = ''; // Reset to force user to pick, or set to max/min
                                                    }
                                                }
                                                return { ...prev, borrowDate, returnDate: newReturnDate };
                                            });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">คืนวันที่ <span className="text-red-500 text-xs">(ไม่เกิน 3 วัน)</span></label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                                        value={formData.returnDate}
                                        disabled={!formData.borrowDate}
                                        min={formData.borrowDate}
                                        max={formData.borrowDate ? new Date(new Date(formData.borrowDate).setDate(new Date(formData.borrowDate).getDate() + 3)).toISOString().split('T')[0] : undefined}
                                        onChange={e => setFormData({ ...formData, returnDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`w-full font-bold py-3 rounded-xl shadow-lg mt-4 transition-all
                                    ${submitting || isSuspended || items.length === 0 ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-secondary text-white shadow-primary/30'}
                                `}
                                disabled={items.length === 0 || submitting || isSuspended}
                            >
                                {submitting ? '⏳ กำลังบันทึก...' : isSuspended ? '🚫 ถูกระงับสิทธิ์' : 'ยืนยันการจอง'}
                            </button>
                            <p className="text-xs text-center text-gray-400 mt-2">
                                * กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน
                            </p>
                        </form>
                    </div>
                </div>
            </div>

            <TermsAndConditionsModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                onAccept={executeSubmit}
            />
        </div>
    );
}
