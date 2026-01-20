
import React from 'react';
import { ConsultationRecord, PharmacyConfig } from '../types';

interface RecordDetailModalProps {
  record: ConsultationRecord;
  config: PharmacyConfig;
  onClose: () => void;
}

const PersonalizedLogo = ({ className = "" }: { className?: string }) => (
  <div className={`w-20 h-20 rounded-full border-4 border-teal-500 flex flex-col items-center justify-center bg-white shadow-md overflow-hidden relative ${className}`}>
    <div className="text-[10px] font-black text-orange-500 leading-none">맞춤형</div>
    <div className="text-[8px] font-bold text-teal-600 leading-none mt-1">건강기능식품</div>
    <div className="absolute bottom-0 w-full bg-teal-500 text-white text-[6px] font-bold py-1 text-center leading-none">식품의약품안전처</div>
  </div>
);

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, config, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[200] backdrop-blur-md print:static print:bg-white print:p-0 print:block overflow-y-auto">
      {/* 인쇄 메인 컨테이너 */}
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl min-h-[90vh] p-12 shadow-2xl relative print:shadow-none print:p-0 print:rounded-none print:w-full print:block print:min-h-0 print-content">
        
        <button onClick={onClose} className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors text-3xl font-bold print:hidden">✕</button>
        
        <div className="mb-10 text-center flex flex-col items-center">
            <PersonalizedLogo className="mb-4" />
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">맞춤형 건강기능식품 상담 및 소분·조합 기록지</h3>
            <p className="text-slate-400 font-black text-sm uppercase tracking-widest mt-2">RECORD ID: {record.id}</p>
        </div>

        {/* 판매 영업소 정보 섹션 */}
        <div className="mb-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-wrap justify-between items-center print:bg-white print:border-slate-300 print:mb-4">
            <div className="flex-1">
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1.5">판매 영업소 정보</p>
                <div className="text-sm font-black text-slate-800 leading-snug">
                    <span className="inline-block mr-2 text-base">{config.pharmacyName}</span>
                    <span className="text-slate-400 font-medium print:text-slate-600">| {config.businessAddress}</span>
                </div>
            </div>
            <div className="text-right border-l border-slate-200 pl-6 ml-6 print:border-slate-300 print:ml-4">
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1.5">소분 관리사</p>
                <p className="text-sm font-black text-slate-800">{config.managerName} (인/서명)</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 print:bg-white print:border-slate-300 print:p-4 print:mb-4">
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">소비자 및 상담 정보</h4>
                <div className="space-y-2 text-sm">
                    <p className="flex justify-between items-center"><span className="text-slate-400">성함:</span> <span className="font-black text-slate-800">{record.customerName} ({record.surveyData.ageGroup}{record.surveyData.isOver35 ? ', 35↑' : ''})</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">연락처:</span> <span className="font-bold text-slate-800">{record.surveyData.phone}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">상담 일시:</span> <span className="font-bold text-slate-800">{new Date(record.date).toLocaleString()}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">임신 단계:</span> <span className="font-black text-teal-600">{record.surveyData.stage}</span></p>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">기초 상태 및 증상</h4>
                <div className="space-y-2 text-sm">
                    <p className="flex justify-between items-center"><span className="text-slate-400">비타민D 수치:</span> <span className="font-black text-slate-800">{record.surveyData.vitaminDLevel}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">헤모글로빈(Hb):</span> <span className="font-black text-slate-800">{record.surveyData.hbLevel}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">불편 증상:</span> <span className="font-black text-slate-800 truncate max-w-[150px]">{record.surveyData.symptoms.join(', ') || '없음'}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">관리 약사:</span> <span className="font-black text-slate-800">{record.pharmacistName}</span></p>
                </div>
            </div>
        </div>

        <div className="mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-4">소분 제품 및 상세 함량</h4>
            <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden print:border-slate-300 print:rounded-xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 print:bg-white print:border-slate-300">
                        <tr className="text-[10px] font-black text-slate-400 uppercase">
                            <th className="p-4">제품명 / 상세 성분</th>
                            <th className="p-4">유효기간</th>
                            <th className="p-4">복용 방법 안내</th>
                            <th className="p-4 text-right">금액</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                        {record.selectedProducts.map((p, idx) => (
                            <tr key={idx} className="text-sm">
                                <td className="p-4">
                                    <div className="font-black text-slate-800">{p.name}</div>
                                    <div className="text-[9px] text-slate-400 leading-tight mt-1">{p.ingredients.map(i => `${i.name}${i.amount}${i.unit}`).join(', ')}</div>
                                </td>
                                <td className="p-4 font-bold text-amber-600 print:text-amber-800">{p.expirationDate}</td>
                                <td className="p-4 font-black text-slate-700">{p.usage || '1일 1회 식후'}</td>
                                <td className="p-4 text-right font-black text-slate-800">{p.price.toLocaleString()}원</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-teal-50/50 font-black print:bg-white print:border-t-2 print:border-slate-300">
                        <tr>
                            <td colSpan={3} className="p-4 text-right text-slate-500">전체 상담 합계:</td>
                            <td className="p-4 text-right text-teal-600 text-xl print:text-black">{record.totalPrice.toLocaleString()}원</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-[1.5rem] mb-10 text-xs text-slate-600 space-y-4 border border-slate-100 print:bg-white print:border-slate-300 print:p-4 print:mb-4">
            <h5 className="font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-2 print:border-slate-400">복약 지도 및 주의사항</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              <p className="leading-relaxed">
                  <span className="font-black text-slate-400 print:text-slate-600">[맞춤 설계 가이드]</span><br />
                  귀하의 {record.surveyData.stage}에 맞춰 영양소를 조합하였습니다. {record.surveyData.symptoms.length > 0 ? `불편하신 ${record.surveyData.symptoms.join(', ')} 증상 개선을 위한 성분이 포함되었습니다.` : '균형 잡힌 영양 공급을 위한 표준 설계입니다.'}
              </p>
              <p className="leading-relaxed font-bold">
                  <span className="text-teal-600 print:text-black">섭취 권장 기간:</span><br />
                  소분일로부터 <span className="underline">2개월 이내</span> 섭취하시기 바랍니다. 공기 접촉 시 산패 가능성이 있으므로 서늘하고 건조한 곳에 보관을 강력히 권장합니다.
              </p>
            </div>
            {record.surveyData.notes && (
               <p className="italic text-slate-400 pt-2 border-t border-slate-200 print:text-slate-600 font-medium">비고: "{record.surveyData.notes}"</p>
            )}
            <p className="text-[9px] text-slate-400 mt-4 italic font-medium">본 상담 기록은 개인정보 보호법 및 맞춤형 건강기능식품 가이드라인에 따라 3년간 보관됩니다.</p>
        </div>

        <div className="flex gap-4 print:hidden">
          <button onClick={handlePrint} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
             <span>🖨️</span> PDF 저장 및 인쇄하기
          </button>
          <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-3xl hover:bg-slate-200 transition-all">닫기</button>
        </div>

        {/* 인쇄 전용 하단 직인 영역 */}
        <div className="hidden print:flex flex-col items-center mt-10 pt-6 border-t border-slate-300">
            <p className="text-xl font-black text-slate-900 tracking-[0.2em]">{config.pharmacyName}</p>
            <p className="text-xs text-slate-500 mt-2 font-bold">{config.businessAddress}</p>
            <p className="text-sm text-slate-800 mt-4 font-black">맞춤형 건강기능식품 소분 관리사: {config.managerName} (인)</p>
        </div>
      </div>

      <style>{`
        @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body { 
              background: white !important; 
              color: black !important;
            }
            #root > div > header, 
            #root > div > footer,
            .print\\:hidden { 
              display: none !important; 
            }
            .fixed {
              position: static !important;
              display: block !important;
              background: white !important;
              padding: 0 !important;
              overflow: visible !important;
            }
            .print-content { 
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            /* 배경 이미지가 아닌 실제 색상 출력을 위해 */
            * { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              box-shadow: none !important;
            }
            /* 텍스트 줄바꿈 및 폰트 선명도 */
            h3, p, span, td {
              text-rendering: optimizeLegibility;
              letter-spacing: -0.01em;
            }
        }
      `}</style>
    </div>
  );
};

export default RecordDetailModal;
