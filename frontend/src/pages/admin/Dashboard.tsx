import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';

interface Transaction {
    id: string;
    borrowerName: string;
    borrowerEmail: string;
    borrowDate: string;
    dueDate: string;
    returnedDate?: string;
    items: {
        id: string;
        equipment: {
            name: string;
            serialNumber: string;
        };
        returnedAt?: string;
    }[];
    admin: {
        email: string;
    };
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

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        pendingReservations: 0,
        activeBorrows: 0,
        totalEquipment: 0,
        overdueItems: 0,
        availableEquipment: 0,
        reservedEquipment: 0,
        borrowedEquipment: 0
    });
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch dashboard stats from API
        api.get('/borrow/stats')
            .then(res => setStats(res.data))
            .catch(err => console.error('Failed to fetch stats:', err));

        // Fetch recent transactions
        api.get('/borrow')
            .then(res => {
                setRecentTransactions(res.data.slice(0, 5));
            })
            .catch(err => console.error('Failed to fetch recent transactions:', err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <AdminSidebar />
            <div className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 max-w-full overflow-hidden">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">Dashboard Review</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="รออนุมัติ" value={stats.pendingReservations} color="bg-orange-500" />
                    <StatCard title="กำลังถูกยืม" value={stats.activeBorrows} color="bg-blue-500" />
                    <StatCard title="อุปกรณ์ทั้งหมด" value={stats.totalEquipment} color="bg-green-500" />
                    <StatCard title="เกินกำหนดคืน" value={stats.overdueItems} color="bg-red-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <StatCard title="ว่าง" value={stats.availableEquipment} color="bg-emerald-500" />
                    <StatCard title="ถูกจอง" value={stats.reservedEquipment} color="bg-yellow-500" />
                    <StatCard title="ถูกยืมอยู่" value={stats.borrowedEquipment} color="bg-indigo-500" />
                </div>

                {/* Recent Activity Table */}
                <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border overflow-hidden">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">กิจกรรมล่าสุด</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-sm font-bold text-gray-600">ผู้ยืม</th>
                                    <th className="px-6 py-3 text-sm font-bold text-gray-600">อุปกรณ์</th>
                                    <th className="px-6 py-3 text-sm font-bold text-gray-600">วันที่ยืม</th>
                                    <th className="px-6 py-3 text-sm font-bold text-gray-600">กำหนดคืน</th>
                                    <th className="px-6 py-3 text-sm font-bold text-gray-600">สถานะคืน</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-400">
                                            กำลังโหลด...
                                        </td>
                                    </tr>
                                ) : recentTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-400">
                                            ไม่มีกิจกรรมล่าสุด
                                        </td>
                                    </tr>
                                ) : (
                                    recentTransactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{tx.borrowerName}</div>
                                                <div className="text-sm text-gray-500">{tx.borrowerEmail}</div>
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
                                                            <li key={idx} className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-700">
                                                                    {group.name}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    ({formatSerialNumbers(group.serialNumbers)})
                                                                </span>
                                                                {group.isReturned ? (
                                                                    <span className="text-[10px] bg-green-50 text-green-700 border border-green-200/50 px-1.5 py-0.5 rounded-full">คืนแล้ว</span>
                                                                ) : (
                                                                    <span className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200/50 px-1.5 py-0.5 rounded-full">ยังไม่คืน</span>
                                                                )}
                                                            </li>
                                                        ));
                                                    })()}
                                                </ul>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(tx.borrowDate).toLocaleDateString('th-TH')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(tx.dueDate).toLocaleDateString('th-TH')}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tx.returnedDate ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200/50">
                                                        คืนแล้ว ({new Date(tx.returnedDate).toLocaleDateString('th-TH')})
                                                    </span>
                                                ) : (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                        isOverdue(tx.dueDate)
                                                            ? 'bg-red-50 text-red-700 border-red-200/50'
                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-200/50'
                                                    }`}>
                                                        {isOverdue(tx.dueDate) ? 'เลยกำหนด' : 'กำลังยืม'}
                                                    </span>
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

const StatCard = ({ title, value, color }: { title: string, value: number, color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center justify-between">
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full ${color} opacity-20`}></div>
    </div>
);
