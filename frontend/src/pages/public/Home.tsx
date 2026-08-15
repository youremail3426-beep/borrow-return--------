import { useState, useEffect } from 'react';
import Navbar from '../../components/public/Navbar';
import api from '../../services/api';
import { Search, Info, ZoomIn, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Equipment {
    id: string;
    name: string;
    serialNumber: string;
    imageUrl?: string;
    status: 'AVAILABLE' | 'RESERVED' | 'BORROWED';
}

export default function Home() {
    const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [search, setSearch] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        fetchEquipments();
    }, []);

    useEffect(() => {
        if (!search) {
            setEquipments(allEquipments);
        } else {
            const query = search.toLowerCase();
            setEquipments(allEquipments.filter(item => 
                item.name.toLowerCase().includes(query) || 
                item.serialNumber.toLowerCase().includes(query)
            ));
        }
    }, [search, allEquipments]);

    const fetchEquipments = async () => {
        try {
            const res = await api.get('/equipments');
            setAllEquipments(res.data);
            setEquipments(res.data);
        } catch (error) {
            console.error('Error fetching equipments:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string, status: string) => {
        if (status !== 'AVAILABLE') return;

        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />

            {/* Hero / Search Section */}
            <div className="bg-primary pt-12 pb-24 px-4 text-center text-white">
                <h1 className="text-4xl font-bold mb-4">ระบบยืม-คืนอุปกรณ์</h1>
                <p className="text-lg opacity-90 mb-8">ค้นหาและจองอุปกรณ์ได้ง่ายๆ เวลาราชการ 8.00-16.00น.</p>

                <div className="max-w-2xl mx-auto relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่ออุปกรณ์, รหัส Serial Number..."
                        className="w-full pl-12 pr-4 py-4 rounded-xl shadow-lg text-gray-800 focus:outline-none focus:ring-4 focus:ring-secondary/30 transition-all font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Equipment List */}
            <div className="container mx-auto px-4 -mt-12">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">กำลังโหลดข้อมูล...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {equipments.map(item => (
                            <div
                                key={item.id}
                                className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all cursor-pointer relative group ${selectedItems.includes(item.id) ? 'ring-2 ring-primary border-primary' : 'border-gray-100'
                                    }`}
                                onClick={() => toggleSelection(item.id, item.status)}
                            >
                                {/* Status Badge */}
                                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm z-10 ${item.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                    item.status === 'RESERVED' ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {item.status === 'AVAILABLE' ? 'ว่าง' :
                                        item.status === 'RESERVED' ? 'ถูกจอง' : 'ถูกยืม'}
                                </div>

                                {/* Image */}
                                <div className="h-48 bg-gray-100 overflow-hidden relative">
                                    {item.imageUrl ? (
                                        <>
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            {/* Full screen preview button */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setPreviewImage(item.imageUrl || null); }}
                                                className="absolute top-3 left-3 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors z-20 shadow-md"
                                                title="ดูรูปภาพเต็ม"
                                            >
                                                <ZoomIn size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Info size={48} />
                                        </div>
                                    )}
                                    {/* Overlay for selection */}
                                    {item.status === 'AVAILABLE' && (
                                        <div className={`absolute inset-0 bg-primary/10 flex items-center justify-center transition-opacity ${selectedItems.includes(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <span className="bg-white text-primary font-bold px-4 py-2 rounded-full shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                                                {selectedItems.includes(item.id) ? 'ยกเลิกเลือก' : 'เลือกจอง'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{item.name}</h3>
                                    <p className="text-gray-500 text-sm">S/N: {item.serialNumber}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {equipments.length === 0 && !loading && (
                    <div className="text-center py-20 text-gray-500">ไม่พบอุปกรณ์ที่ค้นหา</div>
                )}
            </div>

            {/* Floating Action Bar */}
            {selectedItems.length > 0 && (
                <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 px-4">
                    <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-slideUp w-full max-w-md justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-400">รายการที่เลือก</span>
                            <span className="font-bold text-xl">{selectedItems.length} ชิ้น</span>
                        </div>
                        <Link
                            to={`/cart?items=${selectedItems.join(',')}`}
                            className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-primary/30"
                        >
                            ดำเนินการจอง
                        </Link>
                    </div>
                </div>
            )}

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
                        src={previewImage} 
                        alt="Preview" 
                        className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scaleIn" 
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
}
