import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import logo from '../../assets/logo.png';

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

export default function PrintBorrowForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const response = await api.get(`/borrow/${id}`);
                setTransaction(response.data);
            } catch (error) {
                console.error("Error fetching transaction", error);
                alert("ไม่พบข้อมูลการยืม");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [id, navigate]);

    // Auto trigger print dialog when data is successfully loaded
    useEffect(() => {
        if (transaction) {
            const timer = setTimeout(() => {
                window.print();
            }, 800); // Small delay to ensure styles and images (logo) are fully applied
            return () => clearTimeout(timer);
        }
    }, [transaction]);

    if (loading) return <div className="text-center mt-20">กำลังโหลดเอกสาร...</div>;
    if (!transaction) return <div className="text-center mt-20">ไม่พบเอกสาร</div>;

    const groupedItems = transaction?.items?.reduce((acc: any[], item: any) => {
        const existing = acc.find((i: any) => i.name === item.equipment?.name);
        if (existing) {
            existing.serialNumbers.push(item.equipment?.serialNumber);
        } else {
            acc.push({
                name: item.equipment?.name,
                serialNumbers: [item.equipment?.serialNumber],
            });
        }
        return acc;
    }, []) || [];

    const MAX_ITEMS_PER_PAGE = 12;
    const pages = [];
    for (let i = 0; i < groupedItems.length; i += MAX_ITEMS_PER_PAGE) {
        pages.push(groupedItems.slice(i, i + MAX_ITEMS_PER_PAGE));
    }
    if (pages.length === 0) pages.push([]);

    return (
        <div className="bg-gray-200 text-black font-sans min-h-screen pb-10">
            <style>
                {`
                    @media print {
                        html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; overflow: hidden; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        @page { size: A4 portrait; margin: 0; }
                        .no-print { display: none !important; }
                        .form-page { margin: 0 !important; width: 210mm !important; height: 297mm !important; padding: 12mm 15mm !important; box-shadow: none !important; box-sizing: border-box !important; page-break-after: always; break-after: page; }
                    }
                `}
            </style>

            <div className="no-print p-4 bg-gray-100 flex justify-between items-center shadow-md mb-8 sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-bold">
                    &larr; กลับ
                </button>
                <div className="text-sm text-gray-600 bg-yellow-100 p-2 rounded text-center mx-4">
                    ปรับมาใช้โครงสร้าง HTML ตามต้นฉบับ เมื่อสั่งพิมพ์โปรดตั้งค่า <b>Paper size: A4</b>, <b>Margins: None</b> และเลือก <b>Background graphics</b>
                </div>
                <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    พิมพ์ใบยืม (Print)
                </button>
            </div>

            {/* Pages Area */}
            {pages.map((pageItems, pageIndex) => {
                const emptyRowsCount = Math.max(0, MAX_ITEMS_PER_PAGE - pageItems.length);
                const startIndex = pageIndex * MAX_ITEMS_PER_PAGE;
                
                return (
                    <div key={pageIndex} className="form-page w-[210mm] h-[297mm] mx-auto bg-white relative shadow-2xl overflow-hidden print:w-full print:h-full px-[15mm] py-[12mm] box-border mb-8 print:mb-0">

                {/* Watermark in center - Rotated 45 degrees, Fainter */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                    <img src={logo} alt="Watermark" className="w-[100%] max-w-none object-contain opacity-[0.07] grayscale -rotate-45 scale-125" />
                </div>

                <div className="relative z-10 text-[15px] leading-relaxed text-black" style={{ fontFamily: 'Sarabun, sans-serif' }}>

                    {/* Header line */}
                    <div className="flex items-center gap-2 mb-2">
                        <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
                        <div>
                            <div className="font-bold">สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม</div>
                            <div className="">มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</div>
                        </div>
                    </div>

                    <div className="text-center font-bold text-lg mb-4">ใบยืมทรัพย์สิน/อุปกรณ์</div>

                    {/* Info Rows - Fixed flex without wrapping, Data NOT bold */}
                    <div className="space-y-3 mb-4">
                        <div className="flex items-end flex-nowrap w-full">
                            <span className="whitespace-nowrap mr-2">ชื่อ – นามสกุล</span>
                            <div className="flex-1 border-b border-dotted border-gray-600 pb-0.5 text-center text-blue-900 truncate">{transaction.borrowerName || ''}</div>
                            <span className="whitespace-nowrap mx-2">รหัสนักศึกษา</span>
                            <div className="w-[140px] border-b border-dotted border-gray-600 pb-0.5 text-center text-blue-900">{transaction.studentId || ''}</div>
                            <span className="whitespace-nowrap mx-2">ชั้นปี</span>
                            <div className="w-[45px] border-b border-dotted border-gray-600 pb-0.5 text-center text-blue-900">{transaction.yearLevel || ''}</div>
                        </div>

                        <div className="flex items-end flex-nowrap w-full">
                            <span className="whitespace-nowrap mr-2">ภาควิชา</span>
                            <div className="w-[120px] border-b border-dotted border-gray-600 pb-0.5 text-center text-blue-900 truncate">{transaction.department || ''}</div>
                            <span className="whitespace-nowrap mx-2">คณะ/หน่วยงาน</span>
                            <div className="flex-1 border-b border-dotted border-gray-600 pb-0.5 text-center text-blue-900 truncate">{transaction.faculty || ''}</div>
                            <span className="whitespace-nowrap mx-2">เบอร์โทร</span>
                            <div className="w-[120px] border-b border-dotted border-gray-600 pb-0.5 text-center text-blue-900">{transaction.phoneNumber || ''}</div>
                        </div>

                        <div className="mt-1 text-[15px]">มีความประสงค์จะขอยืมวัสดุ อุปกรณ์ ดังรายการต่อไปนี้</div>
                    </div>

                    {/* Table - Removed Quantity column */}
                    <table className="w-full border-collapse border border-black text-[14px] mb-[10px] bg-transparent text-center">
                        <thead>
                            <tr className="bg-transparent">
                                <th className="border border-black font-normal py-1 px-2 w-[8%]">ลำดับ</th>
                                <th className="border border-black font-normal py-1 px-2 w-[42%]">รายการ</th>
                                <th className="border border-black font-normal py-1 px-2 w-[20%]">รหัส</th>
                                <th className="border border-black font-normal py-1 px-2 w-[10%]">จำนวน</th>
                                <th className="border border-black font-normal py-1 px-2 w-[20%]">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map((group: any, index: number) => (
                                <tr key={startIndex + index} className="h-[26px] bg-transparent">
                                    <td className="border border-black px-2">{startIndex + index + 1}</td>
                                    <td className="border border-black px-2 text-left text-blue-900">{group.name}</td>
                                    <td className="border border-black px-2 text-sm text-blue-900">{formatSerialNumbers(group.serialNumbers)}</td>
                                    <td className="border border-black px-2 text-blue-900">{group.serialNumbers.length}</td>
                                    <td className="border border-black px-2"></td>
                                </tr>
                            ))}
                            {Array.from({ length: emptyRowsCount }).map((_, i) => (
                                <tr key={`empty-${i}`} className="h-[26px] bg-transparent">
                                    <td className="border border-black px-2"></td>
                                    <td className="border border-black px-2"></td>
                                    <td className="border border-black px-2"></td>
                                    <td className="border border-black px-2"></td>
                                    <td className="border border-black px-2"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Summary */}
                    <div className="flex justify-end items-end mb-4 pr-2 text-[15px]">
                        <span>รวม</span>
                        <div className="w-[150px] border-b border-dotted border-gray-600 text-center mx-2 text-blue-900">{transaction.items?.length || 0}</div>
                        <span>รายการ</span>
                    </div>

                    {/* Dates - 3 Fields (Borrow Date | Due Date | Blank Return Date) */}
                    <div className="flex justify-between px-2 mb-8 text-[15px]">
                        <div className="flex items-end w-[30%]">
                            <span className="whitespace-nowrap mr-2">วันที่ยืม</span>
                            <div className="flex-1 border-b border-dotted border-gray-600 text-center text-blue-900 pb-0.5">
                                {transaction.borrowDate ? new Date(transaction.borrowDate).toLocaleDateString('th-TH') : '&nbsp;'}
                            </div>
                        </div>
                        <div className="flex items-end w-[32%]">
                            <span className="whitespace-nowrap mr-2">กำหนดส่งคืน</span>
                            <div className="flex-1 border-b border-dotted border-gray-600 text-center text-blue-900 pb-0.5">
                                {transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString('th-TH') : '&nbsp;'}
                            </div>
                        </div>
                        <div className="flex items-end flex-1 ml-4 text-[15px]">
                            <span className="whitespace-nowrap mr-2">วันที่รับคืน</span>
                            <div className="flex-1 border-b border-dotted border-gray-600 pb-0.5">
                                &nbsp;
                            </div>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-6 px-4 mx-auto mb-4 w-[95%] text-[15px]">
                        {/* Borrower (Yim Khong) */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-end w-[280px] mb-2">
                                <span className="w-[50px] text-right mr-2">(ลงชื่อ)</span>
                                <div className="flex-1 border-b border-dotted border-gray-600"></div>
                                <span className="w-[50px] text-left ml-2"></span>
                            </div>
                            <div className="flex items-end w-[280px] mb-2">
                                <span className="w-[50px] text-right mr-2">(</span>
                                <div className="flex-1 border-b border-dotted border-gray-600 text-center text-blue-900 pb-0.5">
                                    {transaction.borrowerName || <span className="text-transparent">พิมพ์ชื่อ</span>}
                                </div>
                                <span className="w-[50px] text-left ml-2">)</span>
                            </div>
                            <div>ผู้ยืมของ</div>
                        </div>

                        {/* Returner (Khuen Khong) */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-end w-[280px] mb-2">
                                <span className="w-[50px] text-right mr-2">(ลงชื่อ)</span>
                                <div className="flex-1 border-b border-dotted border-gray-600"></div>
                                <span className="w-[50px] text-left ml-2"></span>
                            </div>
                            <div className="flex items-end w-[280px] mb-2">
                                <span className="w-[50px] text-right mr-2">(</span>
                                <div className="flex-1 border-b border-dotted border-gray-600 pb-0.5"></div>
                                <span className="w-[50px] text-left ml-2">)</span>
                            </div>
                            <div>ผู้คืนของ</div>
                        </div>

                        {/* Lender (Hai Yim) */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-end w-[280px] mb-2">
                                <span className="w-[50px] text-right mr-2">(ลงชื่อ)</span>
                                <div className="flex-1 border-b border-dotted border-gray-600"></div>
                                <span className="w-[50px] text-left ml-2"></span>
                            </div>
                            <div className="flex items-end w-[280px] mb-2">
                                <span className="w-[50px] text-right mr-2">(</span>
                                <div className="flex-1 border-b border-dotted border-gray-600 text-center text-blue-900 pb-0.5">
                                    {transaction.admin?.name || transaction.admin?.email || <span className="text-transparent">พิมพ์ชื่อ</span>}
                                </div>
                                <span className="w-[50px] text-left ml-2">)</span>
                            </div>
                            <div>ผู้ให้ยืม</div>
                        </div>

                        {/* Receiver (Rub Khuen) */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-end w-[280px] mb-2">
                                <span className="w-[50px] text-right mr-2">(ลงชื่อ)</span>
                                <div className="flex-1 border-b border-dotted border-gray-600"></div>
                                <span className="w-[50px] text-left ml-2"></span>
                            </div>
                            <div className="flex items-end w-[280px] mb-2">
                                <span className="w-[50px] text-right mr-2">(</span>
                                <div className="flex-1 border-b border-dotted border-gray-600 text-center text-blue-900 pb-0.5">
                                    {transaction.returnAdminName || <span className="text-transparent">พิมพ์ชื่อ</span>}
                                </div>
                                <span className="w-[50px] text-left ml-2">)</span>
                            </div>
                            <div>ผู้รับคืน</div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="text-[13px] text-gray-800 leading-[1.4] mt-4">
                        <div className="font-bold mb-0.5">*** <span className="underline">หมายเหตุ</span></div>
                        <div className="flex gap-2"><span>-</span><span>กรุณาตรวจสอบรายการที่ยืมให้เรียบร้อย</span></div>
                        <div className="flex gap-2"><span>-</span><span>หากอุปกรณ์ดังกล่าวเกิดชำรุด เสียหาย ในขณะที่อยู่ในความรับผิดชอบ ผู้ยืมต้องรับผิดชอบทุกกรณี โดยไม่มีข้อยกเว้นใดๆ ทั้งสิ้น</span></div>
                        <div className="flex gap-2"><span>-</span><span>หลักฐานที่ใช้ในการยืมอุปกรณ์ต้องเป็นบัตรประจำตัวนักศึกษาฉบับจริง หรือบัตรประจำตัวประชาชนฉบับจริงเท่านั้น</span></div>
                        <div className="flex gap-2"><span>-</span><span>หากไม่คืนภายในวันที่กำหนด จะมีค่าปรับวันละ 20 บาท เริ่มนับตั้งแต่วันแรกที่เกินกำหนด</span></div>
                    </div>

                </div>
            </div>
            )})}
        </div>
    );
}
