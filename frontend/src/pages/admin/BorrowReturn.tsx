import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import TermsAndConditionsModal from '../../components/TermsAndConditionsModal';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { ArrowRight, RotateCcw, User, Box, Search, CheckSquare, Square, ZoomIn, X } from 'lucide-react';
import { getDisplayImageUrl } from '../../utils/image';

export default function AdminBorrowReturn() {
    const [activeTab, setActiveTab] = useState<'BORROW' | 'RETURN'>('BORROW');

    // --- BORROW FORM STATE ---
    const [borrowData, setBorrowData] = useState(() => {
        const today = new Date();
        const borrowDateValue = today.toISOString().split('T')[0];
        const due = new Date(today);
        due.setDate(due.getDate() + 3);
        const dueDateValue = due.toISOString().split('T')[0];

        return {
            borrowerName: '',
            borrowerEmail: '',
            studentId: '',
            yearLevel: '',
            department: '',
            faculty: '',
            phoneNumber: '',
            borrowDate: borrowDateValue,
            dueDate: dueDateValue,
        };
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showBorrowTermsModal, setShowBorrowTermsModal] = useState(false);
    const [allEquipments, setAllEquipments] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedEquipments, setSelectedEquipments] = useState<any[]>([]);

    // --- RETURN FORM STATE (User-Based) ---
    const [activeBorrows, setActiveBorrows] = useState<any[]>([]); // All active borrowers
    const [filteredBorrowers, setFilteredBorrowers] = useState<any[]>([]); // Search results
    const [borrowerSearchQuery, setBorrowerSearchQuery] = useState('');
    const [selectedBorrower, setSelectedBorrower] = useState<any | null>(null); // Selected User
    const [selectedReturnItemIds, setSelectedReturnItemIds] = useState<string[]>([]); // Serial numbers to return
    const [returnAdminName, setReturnAdminName] = useState(''); // Admin who received the items
    const [isLoading, setIsLoading] = useState(false); // Loading State
    const [previewImage, setPreviewImage] = useState<string | null>(null); // Full Screen Image Preview

    // --- INITIAL DATA FETCHING ---
    useEffect(() => {
        if (activeTab === 'RETURN') {
            fetchActiveBorrows();
        } else if (activeTab === 'BORROW') {
            fetchAllEquipments();
        }
    }, [activeTab]);

    const fetchAllEquipments = async () => {
        try {
            const res = await api.get('/equipments');
            setAllEquipments(res.data);
        } catch (error) {
            console.error("Failed to fetch equipments", error);
        }
    };

    const fetchActiveBorrows = async () => {
        try {
            const res = await api.get('/borrow/active');
            
            // Filter out items that have already been returned
            const activeData = res.data.map((tx: any) => ({
                ...tx,
                items: tx.items.filter((item: any) => !item.returnedAt)
            })).filter((tx: any) => tx.items.length > 0);

            setActiveBorrows(activeData);
            setFilteredBorrowers(activeData); // Initial list
            setBorrowerSearchQuery('');
            setSelectedBorrower(null);
            setSelectedReturnItemIds([]);
        } catch (error) {
            console.error("Failed to fetch active borrows", error);
            Swal.fire('Error', 'Failed to load active borrows', 'error');
        }
    };

    // --- BORROW HANDLERS ---
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        if (query.length > 0) {
            const filtered = allEquipments.filter(eq => 
                eq && (
                    (eq.name && String(eq.name).toLowerCase().includes(query)) || 
                    (eq.serialNumber && String(eq.serialNumber).toLowerCase().includes(query))
                )
            );
            setSearchResults(filtered);
        } else { 
            setSearchResults([]); 
        }
    };

    const addEquipment = (equipment: any) => {
        if (!selectedEquipments.find(e => e.id === equipment.id)) {
            setSelectedEquipments([...selectedEquipments, equipment]);
        }
        // Keep search results open for multi-select
    };

    const removeEquipment = (id: string) => {
        setSelectedEquipments(selectedEquipments.filter(e => e.id !== id));
    };

    const handleBorrow = () => {
        if (!borrowData.borrowerName || !borrowData.borrowerEmail || !borrowData.dueDate || !borrowData.phoneNumber) return Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning');
        if (selectedEquipments.length === 0) return Swal.fire('แจ้งเตือน', 'เลือกอุปกรณ์อย่างน้อย 1 ชิ้น', 'warning');

        setShowBorrowTermsModal(true);
    };

    const executeBorrow = async () => {
        setIsLoading(true);
        try {
            const res = await api.post('/borrow/borrow', { ...borrowData, equipmentIds: selectedEquipments.map(e => e.id) });
            
            const result = await Swal.fire({
                title: 'สำเร็จ',
                text: 'บันทึกการยืมเรียบร้อย ต้องการพิมพ์ใบยืมหรือไม่?',
                icon: 'success',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#aaa',
                confirmButtonText: 'พิมพ์ใบยืม',
                cancelButtonText: 'ปิด'
            });

            if (result.isConfirmed && res.data?.id) {
                window.open(`/admin/print/${res.data.id}`, '_blank');
            }

            setBorrowData(() => {
                const today = new Date();
                const due = new Date(today);
                due.setDate(due.getDate() + 3);
                return {
                    borrowerName: '', borrowerEmail: '', studentId: '', yearLevel: '', department: '', faculty: '', phoneNumber: '',
                    borrowDate: today.toISOString().split('T')[0],
                    dueDate: due.toISOString().split('T')[0]
                };
            });
            setSelectedEquipments([]);
        } catch (error: any) {
            Swal.fire('ผิดพลาด', error.response?.data?.error || 'Failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleInputChange = (field: keyof typeof borrowData, value: string) => {
        setBorrowData(prev => ({ ...prev, [field]: value }));

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            let searchType: 'name' | 'email' | 'studentId' | '' = '';
            if (field === 'studentId') searchType = 'studentId';

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
                setBorrowData(prev => ({
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
                    let untilText = res.data.suspendedUntil ? new Date(res.data.suspendedUntil).toLocaleDateString('th-TH') : 'ไม่มีกำหนด';
                    Swal.fire({
                        icon: 'warning',
                        title: 'แจ้งเตือน: ผู้ใช้นี้ถูกระงับสิทธิ์',
                        html: `
                            <p class="text-red-600 font-bold mb-2">บัญชีนี้อยู่ระหว่างถูกระงับสิทธิ์การจอง/ยืม</p>
                            <p><strong>สาเหตุ:</strong> ${res.data.suspensionReason || 'ไม่ระบุ'}</p>
                            <p><strong>ปลดระงับวันที่:</strong> ${untilText}</p>
                        `,
                        confirmButtonColor: '#f97316'
                    });
                } else {
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
            if (error.response?.status !== 404) {
                console.error('Failed to fetch borrower info:', error);
            }
        }
    };

    // --- RETURN HANDLERS (New Logic) ---
    const handleBorrowerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setBorrowerSearchQuery(query);

        if (!query) {
            setFilteredBorrowers(activeBorrows);
        } else {
            const filtered = activeBorrows.filter(b =>
                b && (
                    String(b.borrowerName || '').toLowerCase().includes(query) ||
                    String(b.borrowerEmail || '').toLowerCase().includes(query)
                )
            );
            setFilteredBorrowers(filtered);
        }
    };

    const selectBorrower = (borrower: any) => {
        setSelectedBorrower(borrower);
        setBorrowerSearchQuery(`${borrower.borrowerName} (${borrower.borrowerEmail})`);
        setFilteredBorrowers([]); // Hide dropdown
        setSelectedReturnItemIds([]); // Reset selection
        setReturnAdminName(''); // Reset admin name
    };

    const toggleReturnItem = (serialNumber: string) => {
        setSelectedReturnItemIds(prev =>
            prev.includes(serialNumber)
                ? prev.filter(s => s !== serialNumber)
                : [...prev, serialNumber]
        );
    };

    const toggleSelectAll = () => {
        if (!selectedBorrower) return;
        if (selectedReturnItemIds.length === selectedBorrower.items.length) {
            setSelectedReturnItemIds([]);
        } else {
            setSelectedReturnItemIds(selectedBorrower.items.map((i: any) => i.serialNumber));
        }
    };

    const handleReturn = async () => {
        if (selectedReturnItemIds.length === 0) return Swal.fire('แจ้งเตือน', 'กรุณาเลือกอุปกรณ์ที่จะคืน', 'warning');

        if (!returnAdminName.trim()) return Swal.fire('แจ้งเตือน', 'กรุณากรอกชื่อแอดมินผู้รับคืน', 'warning');

        setIsLoading(true);
        try {
            await api.post('/borrow/return', { 
                serialNumbers: selectedReturnItemIds,
                returnAdminName: returnAdminName.trim()
            });
            Swal.fire('สำเร็จ', 'บันทึกการคืนเรียบร้อย', 'success');

            // Refresh Data
            fetchActiveBorrows();
        } catch (error: any) {
            Swal.fire('ผิดพลาด', error.response?.data?.message || error.response?.data?.error || 'Failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const clearSelection = () => {
        setSelectedBorrower(null);
        setBorrowerSearchQuery('');
        setFilteredBorrowers(activeBorrows);
        setSelectedReturnItemIds([]);
        setReturnAdminName('');
    };

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <AdminSidebar />
            <div className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 max-w-full overflow-hidden">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">บันทึกการยืม - คืน</h1>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden max-w-4xl mx-auto">
                    {/* TABS */}
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('BORROW')}
                            className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'BORROW' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center justify-center gap-2"><ArrowRight size={20} /> บันทึกการยืม (Borrow)</div>
                        </button>
                        <button
                            onClick={() => setActiveTab('RETURN')}
                            className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'RETURN' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center justify-center gap-2"><RotateCcw size={20} /> บันทึกการคืน (Return)</div>
                        </button>
                    </div>

                    <div className="p-8">
                        {activeTab === 'BORROW' ? (
                            // --- BORROW UI (UNCHANGED MOSTLY) ---
                            <div className="space-y-5">
                                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-4">สำหรับการยืมแบบ Walk-in หรือ Admin ทำให้โดยตรง</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                            value={borrowData.borrowerName} onChange={e => handleInputChange('borrowerName', e.target.value)} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักศึกษา</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                            value={borrowData.studentId} onChange={e => handleInputChange('studentId', e.target.value)} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ชั้นปี</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                            value={borrowData.yearLevel} onChange={e => setBorrowData({ ...borrowData, yearLevel: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ภาควิชา</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                            value={borrowData.department} onChange={e => setBorrowData({ ...borrowData, department: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">คณะ/หน่วยงาน</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                            value={borrowData.faculty} onChange={e => setBorrowData({ ...borrowData, faculty: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                                        <input type="tel" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                            value={borrowData.phoneNumber} onChange={e => setBorrowData({ ...borrowData, phoneNumber: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล <span className="text-xs text-gray-400 font-normal">(สำหรับระบบแจ้งเตือนทางเมล)</span></label>
                                    <input type="email" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                        value={borrowData.borrowerEmail} onChange={e => handleInputChange('borrowerEmail', e.target.value)} />
                                    <div className="flex gap-2 mt-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentEmail = borrowData.borrowerEmail;
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
                                                const currentEmail = borrowData.borrowerEmail;
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
                                                const currentEmail = borrowData.borrowerEmail;
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ยืม</label>
                                        <input type="date" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                            value={borrowData.borrowDate}
                                            onChange={e => {
                                                const d = e.target.value;
                                                if (d) {
                                                    const date = new Date(d);
                                                    date.setDate(date.getDate() + 3);
                                                    setBorrowData({ ...borrowData, borrowDate: d, dueDate: date.toISOString().split('T')[0] });
                                                } else setBorrowData({ ...borrowData, borrowDate: d });
                                            }} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">กำหนดคืน <span className="text-gray-400 text-xs">(สูงสุด 3 วัน)</span></label>
                                        <input type="date" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                            value={borrowData.dueDate}
                                            min={borrowData.borrowDate}
                                            max={new Date(new Date(borrowData.borrowDate).setDate(new Date(borrowData.borrowDate).getDate() + 3)).toISOString().split('T')[0]}
                                            onChange={e => setBorrowData({ ...borrowData, dueDate: e.target.value })} />
                                    </div>
                                </div>

                                {/* Equipment Selection (Enhanced) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ค้นหาและเลือกอุปกรณ์ <span className="text-primary font-bold">(เลือกแล้ว: {selectedEquipments.length})</span>
                                    </label>

                                    {/* Selected Items Summary (Compact) */}
                                    {selectedEquipments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            {selectedEquipments.map(eq => (
                                                <div key={eq.id} className="bg-white text-primary border border-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                                                    <span className="font-bold">{eq.name}</span>
                                                    <span className="text-xs text-gray-500">({eq.serialNumber})</span>
                                                    <button type="button" onClick={() => removeEquipment(eq.id)} className="hover:text-red-500 text-gray-400 font-bold ml-1">
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setSelectedEquipments([])}
                                                className="text-xs text-red-500 hover:text-red-700 underline font-medium ml-2 self-center"
                                            >
                                                ล้างทั้งหมด
                                            </button>
                                        </div>
                                    )}

                                    {/* Search Input */}
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="พิมพ์ชื่อ, S/N หรือ R/N เพื่อค้นหา..."
                                            className="w-full border rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                            value={searchQuery}
                                            onChange={handleSearch}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Search Results (List/Grid) */}
                                    {searchResults.length > 0 ? (
                                        <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto bg-white shadow-sm">
                                            {searchResults.map(eq => {
                                                const isSelected = selectedEquipments.some(e => e.id === eq.id);
                                                const isAvailable = eq.status === 'AVAILABLE';

                                                return (
                                                    <div
                                                        key={eq.id}
                                                        onClick={() => {
                                                            if (isAvailable && !isSelected) addEquipment(eq);
                                                            else if (isSelected) removeEquipment(eq.id);
                                                        }}
                                                        className={`p-3 border-b last:border-0 flex items-center gap-3 transition-colors cursor-pointer
                                                            ${!isAvailable ? 'opacity-50 bg-gray-50 cursor-not-allowed' : 'hover:bg-blue-50'}
                                                            ${isSelected ? 'bg-blue-100/50' : ''}
                                                        `}
                                                    >
                                                        {/* Checkbox */}
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0
                                                            ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'}
                                                        `}>
                                                            {isSelected && <CheckSquare size={14} />}
                                                        </div>

                                                        {/* Image */}
                                                        <div 
                                                            className="relative w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 border group/img cursor-zoom-in"
                                                            onClick={(e) => {
                                                                if (eq.imageUrl) {
                                                                    e.stopPropagation();
                                                                    setPreviewImage(eq.imageUrl);
                                                                }
                                                            }}
                                                        >
                                                            {eq.imageUrl ? (
                                                                <div className="w-full h-full cursor-pointer relative group">
                                                                    <img src={getDisplayImageUrl(eq.imageUrl)} alt={eq.name} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <ZoomIn size={16} className="text-white" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><Box size={18} /></div>
                                                            )}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <p className="font-bold text-gray-800 text-sm">{eq.name}</p>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                                                                    ${eq.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                                                        eq.status === 'BORROWED' ? 'bg-blue-100 text-blue-700' :
                                                                            'bg-yellow-100 text-yellow-700'}`
                                                                }>
                                                                    {eq.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">S/N: {eq.serialNumber}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : searchQuery.length > 0 && (
                                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                            ไม่พบอุปกรณ์ที่ค้นหา
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleBorrow}
                                    disabled={isLoading}
                                    className={`w-full font-bold py-3 rounded-xl shadow-lg mt-2 transition-all
                                        ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-secondary text-white'}
                                    `}
                                >
                                    {isLoading ? '⏳ กำลังบันทึก... กรุณารอสักครู่' : 'ยืนยันการยืม'}
                                </button>
                            </div>
                        ) : (
                            // --- RETURN UI (NEW) ---
                            <div className="space-y-6">
                                <div className="bg-orange-50 p-4 rounded-lg text-sm text-orange-800 mb-4">
                                    1. ค้นหาชื่อผู้ยืม  2. เลือกรายการของที่ต้องการคืน  3. กดยืนยันการคืน
                                </div>

                                {/* Step 1: Search Borrower */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหาผู้ยืม (ชื่อ หรือ อีเมล)</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="พิมพ์ชื่อ หรือ อีเมล..."
                                            className="w-full border rounded-lg pl-10 pr-10 py-2 outline-none focus:ring-2 focus:ring-orange-500/50"
                                            value={borrowerSearchQuery}
                                            onChange={handleBorrowerSearch}
                                            onFocus={() => {
                                                if (!selectedBorrower) setFilteredBorrowers(activeBorrows);
                                            }}
                                        />
                                        {selectedBorrower && (
                                            <button onClick={clearSelection} className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500 font-bold">&times;</button>
                                        )}
                                    </div>

                                    {/* Borrower Dropdown */}
                                    {!selectedBorrower && filteredBorrowers.length > 0 && borrowerSearchQuery && (
                                        <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                                            {filteredBorrowers.map((b: any) => (
                                                <button
                                                    key={`${b.borrowerEmail}-${b.borrowerName}`}
                                                    onClick={() => selectBorrower(b)}
                                                    className="w-full text-left px-4 py-3 border-b hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{b.borrowerName}</p>
                                                        <p className="text-xs text-gray-500">{b.borrowerEmail}</p>
                                                        <div className="text-[10px] text-gray-400 mt-0.5">ปี {b.yearLevel || '-'} | {b.department || '-'} | โทร: {b.phoneNumber || '-'}</div>
                                                    </div>
                                                    <div className="ml-auto bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                                                        {b.items.length} รายการ
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Step 2: List Borrowed Items */}
                                {selectedBorrower && (
                                    <div className="border rounded-lg overflow-hidden animate-fade-in">
                                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                                <Box size={18} /> รายการที่ยืมอยู่
                                            </h3>
                                            <button
                                                onClick={toggleSelectAll}
                                                className="text-sm text-blue-600 hover:underline font-medium"
                                            >
                                                {selectedReturnItemIds.length === selectedBorrower.items.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                                            </button>
                                        </div>
                                        <div className="divide-y max-h-[400px] overflow-y-auto">
                                            {selectedBorrower.items.map((item: any) => {
                                                const isSelected = selectedReturnItemIds.includes(item.serialNumber);
                                                return (
                                                    <div
                                                        key={item.serialNumber}
                                                        className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                                                        onClick={() => toggleReturnItem(item.serialNumber)}
                                                    >
                                                        <div className={`p-1 rounded ${isSelected ? 'text-orange-600' : 'text-gray-300'}`}>
                                                            {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                                                        </div>
                                                        <div 
                                                            className="relative w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 group/img cursor-zoom-in"
                                                            onClick={(e) => {
                                                                if (item.imageUrl) {
                                                                    e.stopPropagation();
                                                                    setPreviewImage(item.imageUrl);
                                                                }
                                                            }}
                                                        >
                                                            {item.imageUrl ? (
                                                                <div className="w-full h-full cursor-pointer relative group/img">
                                                                    <img src={getDisplayImageUrl(item.imageUrl)} alt={item.equipmentName} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                                        <ZoomIn size={16} className="text-white" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><Box size={20} /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-gray-800">{item.equipmentName}</p>
                                                            <div className="flex gap-4 text-xs mt-1">
                                                                <span className="text-gray-500">S/N: {item.serialNumber}</span>
                                                                <span className={item.isOverdue ? 'text-red-500 font-bold' : 'text-green-600'}>
                                                                    กำหนดคืน: {new Date(item.dueDate).toLocaleDateString('th-TH')}
                                                                    {item.isOverdue && ' (เกินกำหนด!)'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Admin Name Input */}
                                {selectedBorrower && selectedReturnItemIds.length > 0 && (
                                    <div className="animate-fade-in mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแอดมินผู้รับคืน <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="กรอกชื่อแอดมินที่รับของ..."
                                            className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500/50"
                                            value={returnAdminName}
                                            onChange={(e) => setReturnAdminName(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Step 3: Action Button */}
                                <button
                                    onClick={handleReturn}
                                    disabled={selectedReturnItemIds.length === 0 || isLoading}
                                    className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all ${selectedReturnItemIds.length > 0 && !isLoading
                                        ? 'bg-orange-600 hover:bg-orange-700 text-white transform hover:scale-[1.02]'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {isLoading
                                        ? '⏳ กำลังบันทึก... กรุณารอสักครู่'
                                        : selectedReturnItemIds.length > 0
                                            ? `ยืนยันการคืน (${selectedReturnItemIds.length} รายการ)`
                                            : 'กรุณาเลือกรายการที่จะคืน'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <TermsAndConditionsModal
                isOpen={showBorrowTermsModal}
                onClose={() => setShowBorrowTermsModal(false)}
                onAccept={executeBorrow}
            />

            {/* Image Preview Modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-black/20 p-2 rounded-full backdrop-blur-md"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <img 
                        src={getDisplayImageUrl(previewImage)} 
                        alt="Preview" 
                        className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scaleIn" 
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
}
