import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { UserX, UserCheck, Search, ShieldAlert } from 'lucide-react';

interface Borrower {
    id: string;
    name: string;
    email: string;
    studentId: string;
    department?: string;
    phoneNumber?: string;
    isSuspended: boolean;
    suspensionType?: string;
    suspensionReason?: string;
    suspendedUntil?: string;
}

export default function AdminBorrowers() {
    const [borrowers, setBorrowers] = useState<Borrower[]>([]);
    const [filtered, setFiltered] = useState<Borrower[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchBorrowers();
    }, []);

    const fetchBorrowers = async () => {
        try {
            const res = await api.get('/borrowers');
            setBorrowers(res.data);
            setFiltered(res.data);
        } catch (error) {
            console.error('Error fetching borrowers:', error);
            Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลผู้ยืมได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        if (!query) {
            setFiltered(borrowers);
        } else {
            const result = borrowers.filter(b => 
                (b.name && b.name.toLowerCase().includes(query)) ||
                (b.email && b.email.toLowerCase().includes(query)) ||
                (b.studentId && b.studentId.toLowerCase().includes(query))
            );
            setFiltered(result);
        }
    };

    const handleSuspend = async (borrower: Borrower) => {
        const { value: formValues } = await Swal.fire({
            title: `ระงับสิทธิ์: ${borrower.name}`,
            html: `
                <div class="text-left mb-4">
                    <label class="block text-sm font-bold mb-1">เหตุผลการระงับสิทธิ์ <span class="text-red-500">*</span></label>
                    <input id="swal-reason" class="swal2-input m-0 w-full" placeholder="ระบุเหตุผล..." required>
                </div>
                <div class="text-left">
                    <label class="block text-sm font-bold mb-1">ระงับถึงวันที่ <span class="text-gray-400 font-normal">(เว้นว่างหากไม่มีกำหนด)</span></label>
                    <input id="swal-date" type="date" class="swal2-input m-0 w-full" min="${new Date().toISOString().split('T')[0]}">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการระงับสิทธิ์',
            confirmButtonColor: '#d33',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const reason = (document.getElementById('swal-reason') as HTMLInputElement).value;
                const date = (document.getElementById('swal-date') as HTMLInputElement).value;
                if (!reason) {
                    Swal.showValidationMessage('กรุณาระบุเหตุผลการระงับสิทธิ์');
                    return false;
                }
                return { reason, date };
            }
        });

        if (formValues) {
            try {
                await api.post(`/borrowers/${borrower.id}/suspend`, {
                    reason: formValues.reason,
                    suspendedUntil: formValues.date || null
                });
                Swal.fire('สำเร็จ', 'ระงับสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว', 'success');
                fetchBorrowers();
            } catch (error: any) {
                Swal.fire('ผิดพลาด', error.response?.data?.message || error.response?.data?.error || 'ไม่สามารถทำรายการได้', 'error');
            }
        }
    };

    const handleUnsuspend = async (borrower: Borrower) => {
        const result = await Swal.fire({
            title: 'ยืนยันปลดระงับสิทธิ์',
            text: `คุณต้องการคืนสิทธิ์การใช้งานให้กับ ${borrower.name} ใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, คืนสิทธิ์',
            confirmButtonColor: '#10B981',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/borrowers/${borrower.id}/unsuspend`);
                Swal.fire('สำเร็จ', 'ปลดระงับสิทธิ์เรียบร้อยแล้ว', 'success');
                fetchBorrowers();
            } catch (error: any) {
                Swal.fire('ผิดพลาด', error.response?.data?.message || error.response?.data?.error || 'ไม่สามารถทำรายการได้', 'error');
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <AdminSidebar />
            <div className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 max-w-full overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">จัดการรายชื่อผู้ยืม (Borrowers)</h1>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, อีเมล, รหัสนักศึกษา..."
                            className="w-full border rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                    <div className="min-w-[800px]">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-600">รหัสนักศึกษา</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">ชื่อ-นามสกุล / อีเมล</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">ข้อมูลติดต่อ</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">สถานะ</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">ไม่พบรายชื่อผู้ยืม</td></tr>
                                ) : (
                                    filtered.map(b => (
                                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600">{b.studentId || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                                    {b.name}
                                                    {b.isSuspended && <ShieldAlert size={16} className="text-red-500" />}
                                                </div>
                                                <div className="text-sm text-gray-500">{b.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div>ภาค: {b.department || '-'}</div>
                                                <div>โทร: {b.phoneNumber || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {b.isSuspended ? (
                                                    <div className="bg-red-50 border border-red-100 rounded p-2 text-xs">
                                                        <div className="text-red-600 font-bold mb-1">ถูกระงับสิทธิ์ ({b.suspensionType || 'MANUAL'})</div>
                                                        <div className="text-gray-600 text-[10px]">สาเหตุ: {b.suspensionReason || '-'}</div>
                                                        <div className="text-gray-500 text-[10px]">ถึง: {b.suspendedUntil ? new Date(b.suspendedUntil).toLocaleDateString('th-TH') : 'ไม่มีกำหนด'}</div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        ปกติ
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {b.isSuspended ? (
                                                    <button
                                                        onClick={() => handleUnsuspend(b)}
                                                        className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1 border border-green-200"
                                                    >
                                                        <UserCheck size={16} /> ปลดระงับ
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSuspend(b)}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1 border border-red-200"
                                                    >
                                                        <UserX size={16} /> ระงับสิทธิ์
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
