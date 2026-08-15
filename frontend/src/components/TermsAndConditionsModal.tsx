import React, { useState } from 'react';
import { X, Info } from 'lucide-react';

interface TermsAndConditionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ isOpen, onClose, onAccept }) => {
    const [isAgreed, setIsAgreed] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="bg-primary/10 px-6 py-4 border-b border-primary/20 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Info className="text-primary" size={24} />
                        ระเบียบและข้อตกลงในการยืม-คืนอุปกรณ์
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-700 leading-relaxed bg-gray-50/50">
                    <div className="text-center mb-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-1">ระเบียบว่าด้วยการยืม–คืนอุปกรณ์ และการกำหนดโทษกรณีฝ่าฝืน</h3>
                        <p className="text-gray-500">(สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม)</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-gray-800">ข้อ ๑ ฐานะของทรัพย์สิน</h4>
                            <p>อุปกรณ์และครุภัณฑ์ที่อยู่ในความดูแลของสโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม ให้ถือเป็น "ทรัพย์สินของทางราชการ" ตามระเบียบของมหาวิทยาลัย ผู้ยืมมีหน้าที่ต้องดูแลรักษาและส่งคืนตามกำหนดเวลาโดยเคร่งครัด</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800">ข้อ ๒ การคืนอุปกรณ์ล่าช้า</h4>
                            <p>ในกรณีที่ผู้ยืมไม่คืนอุปกรณ์ภายในระยะเวลาที่กำหนดไว้ในแบบฟอร์มการยืม ให้ถือว่าเป็นการฝ่าฝืนระเบียบการยืมอุปกรณ์ของสโมสร สโมสรมีอำนาจดำเนินการอย่างหนึ่งอย่างใดหรือหลายอย่าง ดังต่อไปนี้</p>
                            <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
                                <li>ตักเตือนเป็นวาจาหรือเป็นลายลักษณ์อักษร</li>
                                <li>ระงับสิทธิ์การยืมอุปกรณ์เป็นการชั่วคราว</li>
                                <li>ระงับสิทธิ์การจองอุปกรณ์เป็นการชั่วคราว</li>
                                <li>หากคืนล่าช้าจะถูกปรับวันละ 20 บาท เว้นวันหยุดราชการ</li>
                            </ul>
                            <p className="mt-2 text-gray-500 text-xs italic">
                                * ยืมของได้ไม่เกิน 3 วัน<br/>
                                * ทั้งนี้ให้เป็นไปตามดุลยพินิจของสโมสร
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800">ข้อ ๓ อุปกรณ์ชำรุดเสียหาย</h4>
                            <p>ในกรณีที่อุปกรณ์เกิดความชำรุดเสียหายระหว่างการยืม:</p>
                            <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
                                <li>หากตรวจสอบแล้วพบว่าเกิดจากการใช้งานที่ไม่เป็นไปตามวัตถุประสงค์ ผู้ยืมต้องรับผิดชอบ <strong>ชดใช้ค่าซ่อมแซมตามค่าใช้จ่ายที่เกิดขึ้นจริง</strong></li>
                                <li>หากอุปกรณ์ชำรุดเสียหายจนไม่สามารถซ่อมแซมได้ ผู้ยืมต้อง <strong>ชดใช้ค่าอุปกรณ์เต็มจำนวนตามราคาทรัพย์สินหรือราคาทดแทน</strong></li>
                            </ul>
                            <p className="mt-2 text-red-600/80 text-xs font-bold">สโมสรขอสงวนสิทธิ์ในการพิจารณางดให้ยืมอุปกรณ์ในอนาคต จนกว่าจะชดใช้ค่าเสียหายครบถ้วน</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800">ข้อ ๔ อุปกรณ์สูญหาย</h4>
                            <p>ในกรณีที่อุปกรณ์สูญหายไม่ว่าด้วยเหตุใดก็ตาม ผู้ยืมซึ่งเป็นผู้รับผิดชอบตามแบบฟอร์มการยืม:</p>
                            <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
                                <li>ต้อง <strong>ชดใช้ค่าอุปกรณ์ตามราคาจริงหรือราคาทดแทน</strong></li>
                                <li>สโมสรมีอำนาจ <strong>ระงับสิทธิ์การยืมอุปกรณ์ของบุคคลดังกล่าว</strong> จนกว่าจะมีการชดใช้ค่าเสียหายครบถ้วน</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800">ข้อ ๕ การฝ่าฝืนอย่างร้ายแรง</h4>
                            <p>การกระทำใด ๆ อันเข้าลักษณะ: เจตนาไม่คืนอุปกรณ์ / หลบเลี่ยงหรือเพิกเฉยต่อการติดตามทวงคืน / ไม่แสดงความรับผิดชอบต่อทรัพย์สินของทางราชการ <strong>ให้ถือว่าเป็นการฝ่าฝืนระเบียบอย่างร้ายแรง</strong></p>
                            <p className="mt-2">หากผู้ยืมครอบครองอุปกรณ์เกิน ๓๐ วันนับแต่วันครบกำหนดคืน สโมสรมีอำนาจดำเนินการดังต่อไปนี้:</p>
                            <ul className="list-decimal list-inside pl-4 mt-2 space-y-1">
                                <li>รายงานเรื่องต่อคณะ เพื่อพิจารณาดำเนินการตามข้อบังคับมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ ว่าด้วยวินัยนักศึกษา</li>
                                <li>การกระทำดังกล่าวอาจเข้าข่ายเป็นการประพฤติผิดวินัยนักศึกษา และอาจถูกพิจารณาว่าเป็นการยักยอกหรือครอบครองทรัพย์สินของทางราชการโดยมิชอบ</li>
                                <li>ส่งเรื่องต่อคณะหรือหน่วยงานกิจการนักศึกษา เพื่อดำเนินการตามขั้นตอนและบทลงโทษที่มหาวิทยาลัยกำหนด</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800">ข้อ ๖ บททั่วไป</h4>
                            <p>การพิจารณาดำเนินการตามระเบียบนี้ ให้เป็นไปตาม ข้อบังคับ ระเบียบ และประกาศของมหาวิทยาลัย และอยู่ภายใต้ดุลยพินิจของสโมสรโดยคำนึงถึงความเหมาะสมและประโยชน์ส่วนรวมเป็นสำคัญ</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800">ข้อ ๗ การบันทึกและการใช้ข้อมูลส่วนบุคคลของผู้ยืม (PDPA)</h4>
                            <p>เพื่อประโยชน์ในการบริหารจัดการ การควบคุมดูแล และการดำเนินการตามระเบียบการยืม–คืนอุปกรณ์ สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม มีสิทธิ์ในการเก็บรวบรวม บันทึก และใช้ข้อมูลส่วนบุคคลของผู้ยืม เท่าที่จำเป็นและเกี่ยวข้องกับการยืมอุปกรณ์ โดยจะไม่เปิดเผยข้อมูลต่อบุคคลภายนอก เว้นแต่เป็นกรณีที่ต้องดำเนินการตามระเบียบของมหาวิทยาลัย หรือกฎหมายที่เกี่ยวข้อง</p>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="bg-white px-6 py-5 border-t shadow-[0_-4px_6px_-6px_rgba(0,0,0,0.1)]">
                    <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors mb-4">
                        <div className="pt-0.5">
                            <input
                                type="checkbox"
                                className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer accent-primary"
                                checked={isAgreed}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                            />
                        </div>
                        <span className="text-sm font-medium text-gray-800 select-none">
                            ข้าพเจ้าได้อ่าน รับทราบ และทำความเข้าใจข้อตกลงและเงื่อนไขตามระเบียบการยืม-คืนอุปกรณ์ข้างต้นโดยละเอียดแล้ว ข้าพเจ้ายินยอมปฏิบัติตามอย่างเคร่งครัด และขอรับรองว่าข้อมูลที่ใช้ประกอบการทำรายการเป็นความจริงทุกประการ พร้อมทั้งยินยอมให้สโมสรฯ เก็บรวบรวมและใช้ข้อมูลส่วนบุคคลตามวัตถุประสงค์ที่ระบุไว้
                        </span>
                    </label>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (isAgreed) {
                                    onAccept();
                                    onClose(); // Optional: close modal on accept or let parent handle it. Let's let parent handle it or keep it simple.
                                }
                            }}
                            disabled={!isAgreed}
                            className={`px-8 py-2.5 rounded-lg font-bold transition-all shadow-sm ${isAgreed
                                ? 'bg-primary text-white hover:bg-secondary hover:shadow-md'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            ยืนยันและยอมรับเงื่อนไข
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TermsAndConditionsModal;
