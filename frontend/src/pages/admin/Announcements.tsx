import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Plus, Trash2, Megaphone } from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    isActive: boolean;
    createdAt: string;
}

export default function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลประกาศได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAnnouncement = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'เพิ่มประกาศใหม่',
            html: `
                <div class="text-left mb-4">
                    <label class="block text-sm font-bold mb-1">หัวข้อประกาศ <span class="text-red-500">*</span></label>
                    <input id="swal-title" class="swal2-input m-0 w-full" placeholder="หัวข้อ..." required>
                </div>
                <div class="text-left">
                    <label class="block text-sm font-bold mb-1">เนื้อหาประกาศ <span class="text-red-500">*</span></label>
                    <textarea id="swal-content" class="swal2-textarea m-0 w-full" placeholder="เนื้อหา..." rows="4" required></textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'เพิ่มประกาศ',
            confirmButtonColor: '#10B981',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const title = (document.getElementById('swal-title') as HTMLInputElement).value;
                const content = (document.getElementById('swal-content') as HTMLTextAreaElement).value;
                if (!title || !content) {
                    Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
                    return false;
                }
                return { title, content };
            }
        });

        if (formValues) {
            try {
                await api.post('/announcements', {
                    title: formValues.title,
                    content: formValues.content,
                    isActive: true
                });
                Swal.fire('สำเร็จ', 'เพิ่มประกาศเรียบร้อยแล้ว', 'success');
                fetchAnnouncements();
            } catch (error: any) {
                Swal.fire('ผิดพลาด', error.response?.data?.message || 'ไม่สามารถเพิ่มประกาศได้', 'error');
            }
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ',
            text: 'คุณต้องการลบประกาศนี้ใช่หรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบเลย',
            confirmButtonColor: '#d33',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/announcements/${id}`);
                Swal.fire('สำเร็จ', 'ลบประกาศเรียบร้อยแล้ว', 'success');
                fetchAnnouncements();
            } catch (error: any) {
                Swal.fire('ผิดพลาด', error.response?.data?.message || 'ไม่สามารถลบประกาศได้', 'error');
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <AdminSidebar />
            <div className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 max-w-full overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <Megaphone className="text-primary" /> จัดการประกาศ (Announcements)
                    </h1>
                    <button
                        onClick={handleAddAnnouncement}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Plus size={20} /> เพิ่มประกาศ
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                    <div className="min-w-[800px]">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-600">วันที่</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">หัวข้อ</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">เนื้อหา</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            กำลังโหลดข้อมูล...
                                        </td>
                                    </tr>
                                ) : announcements.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            ไม่มีประกาศในขณะนี้
                                        </td>
                                    </tr>
                                ) : (
                                    announcements.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                {new Date(item.createdAt).toLocaleString('th-TH')}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800">
                                                {item.title}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-pre-wrap">
                                                {item.content}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1"
                                                    title="ลบประกาศ"
                                                >
                                                    <Trash2 size={18} /> ลบ
                                                </button>
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
