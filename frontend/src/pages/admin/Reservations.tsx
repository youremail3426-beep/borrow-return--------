import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Check, X, Clock, Trash2 } from 'lucide-react';

interface Reservation {
    id: string;
    borrowerName: string;
    borrowerEmail: string;
    yearLevel?: string;
    department?: string;
    faculty?: string;
    phoneNumber?: string;
    borrowDate: string;
    returnDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    items: {
        equipment: {
            name: string;
            serialNumber: string;
        }
    }[];
}

interface ApiError {
    response?: {
        data?: {
            error?: string;
        };
        status?: number;
    };
    message?: string;
}

export default function AdminReservations() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loadingActionId, setLoadingActionId] = useState<string | null>(null); // Track which item is processing
    const [isBulkDeleting, setIsBulkDeleting] = useState(false); // Bulk delete loading state

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            const res = await api.get('/reservations');
            setReservations(res.data);
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(reservations.map(r => r.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        const action = status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ';

        const result = await Swal.fire({
            title: `ยืนยันการ${action}?`,
            text: `คุณต้องการ${action}รายการจองนี้ใช่หรือไม่`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: status === 'APPROVED' ? '#198754' : '#d33',
            confirmButtonText: `ใช่, ${action}`,
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            setLoadingActionId(id);
            try {
                await api.put(`/reservations/${id}/status`, { status });
                Swal.fire('สำเร็จ', `รายการจองได้รับการ${action}แล้ว`, 'success');
                fetchReservations();
            } catch (error) {
                const err = error as ApiError;
                Swal.fire('เกิดข้อผิดพลาด', err.response?.data?.error || 'ไม่สามารถทำรายการได้', 'error');
            } finally {
                setLoadingActionId(null);
            }
        }
    };

    const handleConfirmPickup = async (id: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการรับของ?',
            text: "ผู้จองได้รับอุปกรณ์เรียบร้อยแล้วใช่หรือไม่ Status จะเปลี่ยนเป็น 'ถูกยืม'",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#0d6efd',
            confirmButtonText: 'ใช่, รับของแล้ว',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            setLoadingActionId(id);
            try {
                await api.post(`/reservations/${id}/pickup`);
                Swal.fire('สำเร็จ', 'บันทึกการรับของเรียบร้อย', 'success');
                fetchReservations();
            } catch (error) {
                console.error("Pickup Error:", error);
                const err = error as ApiError;
                const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
                const status = err.response?.status ? ` (Status: ${err.response.status})` : '';
                Swal.fire('เกิดข้อผิดพลาด', `${errorMessage}${status}`, 'error');
            } finally {
                setLoadingActionId(null);
            }
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณต้องการลบรายการจองนี้ใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            setLoadingActionId(id);
            try {
                await api.delete(`/reservations/${id}`);
                Swal.fire('ลบสำเร็จ', 'ลบรายการจองเรียบร้อยแล้ว', 'success');
                fetchReservations();
            } catch (error) {
                console.error("Delete Error:", error);
                const err = error as ApiError;
                const errorMessage = err.response?.data?.error || err.message || 'ไม่สามารถลบข้อมูลได้';
                const status = err.response?.status ? ` (Status: ${err.response.status})` : '';
                Swal.fire('เกิดข้อผิดพลาด', `${errorMessage}${status}`, 'error');
            } finally {
                setLoadingActionId(null);
            }
        }
    };

    const handleBulkDelete = async () => {
        const result = await Swal.fire({
            title: `ยืนยันการลบ ${selectedIds.size} รายการ?`,
            text: "รายการที่ถูกลบจะไม่สามารถกู้คืนได้",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ยืนยันลบทั้งหมด',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            setIsBulkDeleting(true);
            try {
                await api.post('/reservations/delete', { ids: Array.from(selectedIds) });
                Swal.fire('ลบสำเร็จ', 'ลบรายการที่เลือกเรียบร้อยแล้ว', 'success');
                fetchReservations();
            } catch (error) {
                console.error("Bulk Delete Error:", error);
                const err = error as ApiError;
                const errorMessage = err.response?.data?.error || err.message || 'ลบข้อมูลไม่สำเร็จ';
                const status = err.response?.status ? ` (Status: ${err.response.status})` : '';
                Swal.fire('เกิดข้อผิดพลาด', `${errorMessage}${status}`, 'error');
            } finally {
                setIsBulkDeleting(false);
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <AdminSidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">รายการจอง</h1>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors shadow-md ${isBulkDeleting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            {isBulkDeleting ? (
                                <>
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    กำลังลบ...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    ลบ {selectedIds.size} รายการที่เลือก
                                </>
                            )}
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={reservations.length > 0 && selectedIds.size === reservations.length}
                                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                        />
                                    </th>
                                    <th className="px-6 py-4 font-bold text-gray-600">ผู้ยืม</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">อุปกรณ์</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">วันที่ยืม-คืน</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 text-center">สถานะ</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 text-right">การอนุมัติ</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
                                ) : reservations.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">ไม่มีรายการจอง</td></tr>
                                ) : (
                                    reservations.map(res => (
                                        <tr key={res.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(res.id) ? 'bg-blue-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(res.id)}
                                                    onChange={() => handleSelectOne(res.id)}
                                                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{res.borrowerName}</div>
                                                <div className="text-sm text-gray-500">{res.borrowerEmail}</div>
                                                <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                                                    ปี {res.yearLevel || '-'} | {res.department || '-'} | {res.faculty || '-'}<br/>
                                                    โทร: {res.phoneNumber || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <ul className="text-sm text-gray-600 list-disc list-inside">
                                                    {res.items.map((item, idx) => (
                                                        <li key={idx}>{item.equipment.name} <span className="text-xs text-gray-400">({item.equipment.serialNumber})</span></li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div>{new Date(res.borrowDate).toLocaleDateString()}</div>
                                                <div className="text-gray-400">ถึง</div>
                                                <div>{new Date(res.returnDate).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${res.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    res.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                        res.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {
                                                        res.status === 'APPROVED' ? 'อนุมัติแล้ว' :
                                                            res.status === 'REJECTED' ? 'ถูกปฏิเสธ' :
                                                                res.status === 'COMPLETED' ? 'รับของแล้ว' :
                                                                    'รออนุมัติ'
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right"> {/* This column now handles approval/pickup actions */}
                                                {res.status === 'PENDING' && (
                                                    <div className="flex justify-end gap-2">
                                                        {loadingActionId === res.id ? (
                                                            <span className="text-gray-400 text-sm animate-pulse">⏳ กำลังประมวลผล...</span>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(res.id, 'APPROVED')}
                                                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                                                    title="อนุมัติ"
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(res.id, 'REJECTED')}
                                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                                    title="ปฏิเสธ"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                {res.status === 'APPROVED' && (
                                                    <button
                                                        onClick={() => handleConfirmPickup(res.id)}
                                                        disabled={loadingActionId === res.id}
                                                        className={`px-3 py-1.5 text-sm rounded-lg shadow-md transition-all flex items-center gap-2 ml-auto 
                                                            ${loadingActionId === res.id
                                                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700'}`
                                                        }
                                                    >
                                                        {loadingActionId === res.id ? (
                                                            <>⏳ กำลังบันทึก...</>
                                                        ) : (
                                                            <>
                                                                <Clock size={16} /> ยืนยันรับของ
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right"> {/* New column for delete button */}
                                                <button
                                                    onClick={() => handleDelete(res.id)}
                                                    disabled={loadingActionId === res.id}
                                                    className={`p-2 rounded-lg transition-colors 
                                                        ${loadingActionId === res.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`
                                                    }
                                                    title="ลบรายการจอง"
                                                >
                                                    {loadingActionId === res.id ? (
                                                        <span className="text-xs">⏳</span>
                                                    ) : (
                                                        <Trash2 size={18} />
                                                    )}
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
