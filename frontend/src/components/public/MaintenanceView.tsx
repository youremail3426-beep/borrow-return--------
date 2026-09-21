import { Wrench, ShieldAlert } from 'lucide-react';

interface MaintenanceViewProps {
    message?: string;
}

export default function MaintenanceView({ message }: MaintenanceViewProps) {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            
            {/* Main Content */}
            <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-14 rounded-[2.5rem] shadow-2xl max-w-2xl w-full text-center transform transition-all hover:scale-[1.01] duration-500">
                <div className="relative w-28 h-28 mx-auto mb-10">
                    <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] border border-white/20">
                        <Wrench size={48} className="text-white drop-shadow-md" />
                    </div>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight drop-shadow-sm">
                    ระบบปิดปรับปรุงชั่วคราว
                </h1>
                
                <p className="text-gray-300 mb-10 text-lg md:text-xl font-light leading-relaxed max-w-lg mx-auto">
                    {message || 'ขออภัยในความไม่สะดวก ระบบกำลังอยู่ในช่วงปิดปรับปรุง กรุณากลับมาใช้งานใหม่อีกครั้งในภายหลัง'}
                </p>
                
                <div className="inline-flex items-center gap-3 bg-black/40 px-6 py-3 rounded-full border border-white/10 shadow-inner mb-8">
                    <ShieldAlert size={18} className="text-emerald-400" />
                    <span className="text-sm text-emerald-100/90 font-mono tracking-widest uppercase">System Status : Maintenance</span>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col items-center gap-3">
                    <p className="text-sm md:text-base text-gray-400 font-light leading-relaxed">
                        ติดต่อสโมสรคณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ<br/>
                        ขออภัยในความไม่สะดวก
                    </p>
                </div>
            </div>

            {/* Footer Text */}
            <div className="absolute bottom-8 text-gray-500/50 text-sm font-mono tracking-[0.3em] uppercase">
                Borrow-Return System
            </div>
        </div>
    );
}
