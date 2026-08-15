import { useEffect, useState, useRef } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Plus, Edit, Trash2, Search, Image as ImageIcon } from 'lucide-react';

interface Equipment {
    id: string;
    name: string;
    serialNumber: string;
    status: 'AVAILABLE' | 'RESERVED' | 'BORROWED';
    imageUrl?: string;
}

export default function AdminEquipment() {
    const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Equipment | null>(null);
    const [formData, setFormData] = useState({ name: '', serialNumber: '', imageUrl: '' });
    const [fileBase64, setFileBase64] = useState<string | null>(null);

    useEffect(() => {
        fetchEquipments();
    }, []);

    useEffect(() => {
        if (!search) {
            setEquipments(allEquipments);
        } else {
            const lowerSearch = search.toLowerCase();
            const filtered = allEquipments.filter(eq => 
                (eq.name && String(eq.name).toLowerCase().includes(lowerSearch)) || 
                (eq.serialNumber && String(eq.serialNumber).toLowerCase().includes(lowerSearch))
            );
            setEquipments(filtered);
        }
    }, [search, allEquipments]);

    const fetchEquipments = async () => {
        try {
            const res = await api.get(`/equipments`);
            setAllEquipments(res.data);
            setEquipments(res.data);
        } catch (error) {
            console.error('Error fetching equipments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "การกระทำนี้ไม่สามารถย้อนกลับได้",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/equipments/${id}`);
                Swal.fire('ลบสำเร็จ', '', 'success');
                fetchEquipments();
            } catch (error: any) {
                console.error("Delete failed:", error);
                Swal.fire('ลบไม่สำเร็จ', error.response?.data?.error || 'เกิดข้อผิดพลาดในการลบ', 'error');
            }
        }
    };

    const openModal = (item?: Equipment) => {
        if (item) {
            setEditingItem(item);
            setFormData({ name: item.name, serialNumber: item.serialNumber, imageUrl: item.imageUrl || '' });
        } else {
            setEditingItem(null);
            setFormData({ name: '', serialNumber: '', imageUrl: '' });
        }
        setFileBase64(null);
        setIsModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFileBase64(reader.result as string);
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        } else {
            setFileBase64(null);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            name: formData.name,
            serialNumber: formData.serialNumber,
            imageUrl: formData.imageUrl || ''
        };

        if (fileBase64) {
            payload.imageBase64 = fileBase64;
        }

        try {
            Swal.fire({
                title: 'กำลังบันทึก...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            if (editingItem) {
                payload.status = editingItem.status;
                await api.put(`/equipments/${editingItem.id}`, payload);
            } else {
                await api.post('/equipments', payload);
            }

            setIsModalOpen(false);
            Swal.fire('บันทึกสำเร็จ', '', 'success');
            fetchEquipments();
        } catch (error: any) {
            console.error("Save Error:", error);
            const errorMsg = error.response?.data?.message || 'เกิดข้อผิดพลาด';
            Swal.fire('บันทึกไม่สำเร็จ', errorMsg, 'error');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <AdminSidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">จัดการอุปกรณ์</h1>
                    <button
                        onClick={() => openModal()}
                        className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Plus size={20} /> เพิ่มอุปกรณ์
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex items-center gap-3">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ หรือ S/N..."
                        className="flex-1 outline-none text-gray-600"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600 w-20">รูปภาพ</th>
                                <th className="px-6 py-4 font-bold text-gray-600">ชื่ออุปกรณ์</th>
                                <th className="px-6 py-4 font-bold text-gray-600">S/N</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-center">สถานะ</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
                            ) : equipments.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-400">ไม่พบรายการ</td></tr>
                            ) : (
                                equipments.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center text-gray-400">
                                                {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-sm">{item.serialNumber}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                                                item.status === 'RESERVED' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scaleIn">
                            <h2 className="text-xl font-bold mb-6">{editingItem ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</h2>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่ออุปกรณ์</label>
                                    <input
                                        type="text" required
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                                    <input
                                        type="text" required
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                        value={formData.serialNumber}
                                        onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">อัพโหลดรูปภาพอุปกรณ์</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full border rounded-lg px-3 py-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                        onChange={handleFileChange}
                                    />
                                    {formData.imageUrl && (
                                        <div className="mt-3 relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border">
                                            <img src={formData.imageUrl} className="w-full h-full object-contain" alt="preview" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-bold shadow-md"
                                    >
                                        บันทึก
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
