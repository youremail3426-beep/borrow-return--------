import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Settings as SettingsIcon, Save } from 'lucide-react';

interface SystemSettings {
    SYSTEM_STATUS: 'ACTIVE' | 'MAINTENANCE';
    MAINTENANCE_MESSAGE: string;
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<SystemSettings>({
        SYSTEM_STATUS: 'ACTIVE',
        MAINTENANCE_MESSAGE: 'ระบบปิดปรับปรุงชั่วคราว'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data) {
                setSettings({
                    SYSTEM_STATUS: res.data.SYSTEM_STATUS || 'ACTIVE',
                    MAINTENANCE_MESSAGE: res.data.MAINTENANCE_MESSAGE || 'ระบบปิดปรับปรุงชั่วคราว'
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            Swal.fire('Error', 'ไม่สามารถโหลดการตั้งค่าได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/settings', settings);
            Swal.fire('สำเร็จ', 'บันทึกการตั้งค่าเรียบร้อยแล้ว', 'success');
        } catch (error: any) {
            Swal.fire('ผิดพลาด', error.response?.data?.message || 'ไม่สามารถบันทึกการตั้งค่าได้', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <AdminSidebar />
            <div className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 max-w-full overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <SettingsIcon className="text-primary" /> ตั้งค่าระบบ (Settings)
                    </h1>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
                        กำลังโหลดการตั้งค่า...
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl">
                        <form onSubmit={handleSave} className="space-y-6">
                            
                            {/* System Status Toggle */}
                            <div className="bg-gray-50 p-4 rounded-lg border flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">สถานะระบบ</h3>
                                    <p className="text-gray-500 text-sm">เปิดหรือปิดระบบการจอง/ยืมอุปกรณ์ทั้งหมด</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={settings.SYSTEM_STATUS === 'ACTIVE'}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            SYSTEM_STATUS: e.target.checked ? 'ACTIVE' : 'MAINTENANCE'
                                        })}
                                    />
                                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                                    <span className={`ml-3 text-sm font-bold ${settings.SYSTEM_STATUS === 'ACTIVE' ? 'text-green-600' : 'text-red-500'}`}>
                                        {settings.SYSTEM_STATUS === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดปรับปรุง'}
                                    </span>
                                </label>
                            </div>

                            {/* Maintenance Message */}
                            {settings.SYSTEM_STATUS === 'MAINTENANCE' && (
                                <div className="space-y-2 animate-fadeIn">
                                    <label className="block text-sm font-bold text-gray-700">
                                        ข้อความแจ้งเตือนเมื่อปิดปรับปรุง
                                    </label>
                                    <textarea
                                        className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/50"
                                        rows={3}
                                        value={settings.MAINTENANCE_MESSAGE}
                                        onChange={(e) => setSettings({...settings, MAINTENANCE_MESSAGE: e.target.value})}
                                        placeholder="เช่น ระบบปิดปรับปรุงชั่วคราว ขออภัยในความไม่สะดวก"
                                    />
                                </div>
                            )}

                            <div className="pt-4 border-t flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                                >
                                    <Save size={20} /> 
                                    {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
