import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import { History as HistoryIcon, Trash2, Printer, Search, ImagePlus, X } from 'lucide-react';
import Swal from 'sweetalert2';

interface Transaction {
    id: string;
    borrowerName: string;
    borrowerEmail: string;
    yearLevel?: string;
    department?: string;
    faculty?: string;
    phoneNumber?: string;
    borrowDate: string;
    dueDate: string;
    returnedDate?: string;
    items: {
        id: string; // BorrowItem ID
        equipment: {
            name: string;
            serialNumber: string;
        };
        returnedAt?: string;
    }[];
    admin: {
        email: string;
    };
    conditionImageUrl?: string;
    notes?: string;
}

const formatSerialNumbers = (serials: string[]) => {
    if (!serials || serials.length === 0) return '';
    const uniqueSerials = Array.from(new Set(serials));
    if (uniqueSerials.length === 1) return uniqueSerials[0];

    const groups: { [key: string]: { numStr: string, num: number }[] } = {};
    const noPrefix: string[] = [];

    uniqueSerials.forEach((s: string) => {
        const match = s.match(/^(.*?[^\d])?(\d+)$/);
        if (match) {
            const prefix = match[1] || '';
            const numStr = match[2];
            if (!groups[prefix]) groups[prefix] = [];
            groups[prefix].push({ numStr, num: parseInt(numStr, 10) });
        } else {
            noPrefix.push(s);
        }
    });

    const resultParts: string[] = [];

    Object.keys(groups).forEach(prefix => {
        const items = groups[prefix];
        items.sort((a, b) => a.num - b.num);

        const chunks: typeof items[] = [];
        let currentChunk: typeof items = [];

        items.forEach(item => {
            if (currentChunk.length === 0) {
                currentChunk.push(item);
            } else {
                const prev = currentChunk[currentChunk.length - 1];
                if (item.num === prev.num + 1) {
                    currentChunk.push(item);
                } else {
                    chunks.push(currentChunk);
                    currentChunk = [item];
                }
            }
        });
        if (currentChunk.length > 0) chunks.push(currentChunk);

        const formattedChunks = chunks.map(chunk => {
            if (chunk.length === 1) return chunk[0].numStr;
            return `${chunk[0].numStr}-${chunk[chunk.length - 1].numStr}`;
        });

        if (items.length === 1) {
            resultParts.push(`${prefix}${items[0].numStr}`);
        } else {
            resultParts.push(`${prefix}(${formattedChunks.join(', ')})`);
        }
    });

    return [...resultParts, ...noPrefix].join(', ');
};

const isOverdue = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateString) < today;
};

export default function AdminHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modal States
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [selectedTxForNote, setSelectedTxForNote] = useState<Transaction | null>(null);
    const [noteText, setNoteText] = useState('');
    const [conditionImage, setConditionImage] = useState<File | null>(null);
    const [conditionImageUrlPreview, setConditionImageUrlPreview] = useState<string | null>(null);
    const [conditionImageBase64, setConditionImageBase64] = useState<string | null>(null);
    const [isUploadingNote, setIsUploadingNote] = useState(false);
    
    // --- Filters ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'BORROWED' | 'RETURNED'>('ALL');

    const filteredTransactions = transactions.filter(tx => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = tx.borrowerName.toLowerCase().includes(q) || 
                              tx.borrowerEmail.toLowerCase().includes(q);
        
        if (!matchesSearch) return false;

        if (filterStatus === 'BORROWED') return !tx.returnedDate;
        if (filterStatus === 'RETURNED') return !!tx.returnedDate;
        return true;
    });

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/borrow');
            console.log("History Data:", res.data);
            setTransactions(res.data);
            setSelectedIds(new Set()); // Reset selection
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
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

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณต้องการลบประวัติรายการนี้ใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/borrow/${id}`);
                Swal.fire('ลบสำเร็จ', 'ลบประวัติเรียบร้อยแล้ว', 'success');
                fetchTransactions();
            } catch (error: any) {
                console.error("Delete Error:", error);
                Swal.fire('เกิดข้อผิดพลาด', 'ลบข้อมูลไม่สำเร็จ', 'error');
            }
        }
    };

    const handleBulkDelete = async () => {
        const result = await Swal.fire({
            title: `ยืนยันการลบ ${selectedIds.size} รายการ?`,
            text: "ประวัติที่ถูกลบจะไม่สามารถกู้คืนได้",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ยืนยันลบทั้งหมด',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await api.post('/borrow/delete', { ids: Array.from(selectedIds) });
                Swal.fire('ลบสำเร็จ', 'ลบรายการที่เลือกเรียบร้อยแล้ว', 'success');
                fetchTransactions();
            } catch (error: any) {
                console.error("Bulk Delete Error:", error);
                Swal.fire('เกิดข้อผิดพลาด', 'ลบข้อมูลไม่สำเร็จ', 'error');
            }
        }
    };

    const openNoteModal = (tx: Transaction) => {
        setSelectedTxForNote(tx);
        setNoteText(tx.notes || '');
        setConditionImageUrlPreview(tx.conditionImageUrl || null);
        setConditionImage(null);
        setConditionImageBase64(null);
        setIsNoteModalOpen(true);
    };

    const handleSaveNote = async () => {
        if (!selectedTxForNote) return;
        setIsUploadingNote(true);
        try {
            const payload: any = {
                notes: noteText
            };
            
            if (conditionImageBase64) {
                payload.conditionImageBase64 = conditionImageBase64;
            } else if (conditionImageUrlPreview) {
                payload.conditionImageUrl = conditionImageUrlPreview;
            }

            await api.put(`/borrow/${selectedTxForNote.id}/notes`, payload);

            Swal.fire('สำเร็จ', 'บันทึกรูปและหมายเหตุเรียบร้อยแล้ว', 'success');
            setIsNoteModalOpen(false);
            fetchTransactions();
        } catch (error) {
            console.error("Save Note Error:", error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกได้', 'error');
        } finally {
            setIsUploadingNote(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <AdminSidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <HistoryIcon size={32} className="text-primary" />
                        <h1 className="text-3xl font-bold text-gray-800">ประวัติการยืม-คืน</h1>
                    </div>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                        >
                            <Trash2 size={18} />
                            ลบ {selectedIds.size} รายการที่เลือก
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Filter & Search Bar */}
                    <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อ หรืออีเมลผู้ยืม..." 
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <span className="text-sm text-gray-600 whitespace-nowrap">สถานะ:</span>
                            <select 
                                className="border rounded-lg px-3 py-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                            >
                                <option value="ALL">ทั้งหมด (All)</option>
                                <option value="BORROWED">กำลังยืม (Borrowed)</option>
                                <option value="RETURNED">คืนแล้ว (Returned)</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b">
                                <tr>
                                    <th className="px-6 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length}
                                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                        />
                                    </th>
                                    <th className="px-6 py-4 font-bold text-gray-600">ผู้ยืม</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">อุปกรณ์</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">วันที่ยืม</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">กำหนดคืน</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">สถานะคืน</th>
                                    <th className="px-6 py-4 font-bold text-gray-600">ผู้ทำรายการ</th>
                                    <th className="px-6 py-4 font-bold text-gray-600 text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">ไม่มีประวัติการทำรายการที่ค้นหา</td></tr>
                                ) : (
                                    filteredTransactions.map(tx => (
                                        <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(tx.id) ? 'bg-blue-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(tx.id)}
                                                    onChange={() => handleSelectOne(tx.id)}
                                                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{tx.borrowerName}</div>
                                                <div className="text-sm text-gray-500">{tx.borrowerEmail}</div>
                                                <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                                                    ปี {tx.yearLevel || '-'} | {tx.department || '-'} | {tx.faculty || '-'}<br/>
                                                    โทร: {tx.phoneNumber || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <ul className="text-sm text-gray-600 list-none space-y-1">
                                                    {(() => {
                                                        const groupedItems = tx.items.reduce((acc: any[], item: any) => {
                                                            const isReturned = !!item.returnedAt;
                                                            const existing = acc.find((i: any) => i.name === item.equipment.name && i.isReturned === isReturned);
                                                            if (existing) {
                                                                existing.serialNumbers.push(item.equipment.serialNumber);
                                                            } else {
                                                                acc.push({
                                                                    name: item.equipment.name,
                                                                    serialNumbers: [item.equipment.serialNumber],
                                                                    isReturned: isReturned
                                                                });
                                                            }
                                                            return acc;
                                                        }, []);
                                                        return groupedItems.map((group: any, idx: number) => (
                                                            <li key={idx} className="flex items-start md:items-center justify-between gap-3 mb-1">
                                                                <span>
                                                                    {group.name} <span className="text-xs text-gray-400">({formatSerialNumbers(group.serialNumbers)})</span>
                                                                </span>
                                                                {group.isReturned ? (
                                                                    <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full whitespace-nowrap">คืนแล้ว</span>
                                                                ) : (
                                                                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full whitespace-nowrap">ยังไม่คืน</span>
                                                                )}
                                                            </li>
                                                        ));
                                                    })()}
                                                </ul>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(tx.borrowDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(tx.dueDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tx.returnedDate ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        คืนแล้ว ({new Date(tx.returnedDate).toLocaleDateString()})
                                                    </span>
                                                ) : (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOverdue(tx.dueDate) ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {isOverdue(tx.dueDate) ? 'เลยกำหนด' : 'กำลังยืม'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {tx.admin?.email || 'System'}
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                {!tx.returnedDate && (
                                                    <button
                                                        onClick={() => openNoteModal(tx)}
                                                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="แนบรูป/หมายเหตุเพิ่มเติม"
                                                    >
                                                        <ImagePlus size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => window.open(`/admin/print/${tx.id}`, '_blank')}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="พิมพ์ใบยืม"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tx.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="ลบประวัติ"
                                                >
                                                    <Trash2 size={18} />
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

            {/* Note Modal */}
            {isNoteModalOpen && selectedTxForNote && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <ImagePlus size={24} className="text-primary" />
                                แนบรูป/หมายเหตุเพิ่มเติม
                            </h2>
                            <button onClick={() => setIsNoteModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <strong>ผู้ยืม:</strong> {selectedTxForNote.borrowerName} <br/>
                                <span className="text-xs text-blue-600">หมายเหตุและรูปนี้จะถูกลบอัตโนมัติเมื่อทำการคืนของทั้งหมดเรียบร้อยแล้ว</span>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพเพิ่มเติม</label>
                                <div className="border border-gray-300 rounded-lg p-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                setConditionImage(file);
                                                
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setConditionImageBase64(reader.result as string);
                                                    setConditionImageUrlPreview(reader.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            } else {
                                                setConditionImage(null);
                                                setConditionImageBase64(null);
                                                setConditionImageUrlPreview(null);
                                            }
                                        }}
                                    />
                                    {conditionImageUrlPreview && (
                                        <div className="mt-3 relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
                                            <img src={conditionImageUrlPreview} className="w-full h-full object-contain" alt="preview" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                                    placeholder="เพิ่มหมายเหตุที่นี่..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 mt-auto">
                            <button
                                onClick={() => setIsNoteModalOpen(false)}
                                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveNote}
                                disabled={isUploadingNote}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploadingNote ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
