
import React from 'react';
import { ConsultationRecord, PharmacyConfig } from '../types';

interface RecordDetailModalProps {
  record: ConsultationRecord;
  config: PharmacyConfig;
  onClose: () => void;
}

const PersonalizedLogo = ({ className = "" }: { className?: string }) => (
  <div className={`w-16 h-16 rounded-full border-[3px] border-teal-500 flex flex-col items-center justify-center bg-white shadow-sm overflow-hidden relative print:w-14 print:h-14 ${className}`}>
    <div className="text-[8px] font-black text-orange-500 leading-none print:text-[7px]">맞춤형</div>
    <div className="text-[7px] font-bold text-teal-600 leading-none mt-1 print:text-[6px]">건강기능식품</div>
    <div className="absolute bottom-0 w-full bg-teal-500 text-white text-[5px] font-bold py-1 text-center leading-none">식품의약품안전처</div>
  </div>
);

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, config, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[200] backdrop-blur-md print:bg-white print:p-0 print:block print:static print-modal-overlay overflow-y-auto">
      {/* 인쇄 메인 컨테이너 - print:p-4로 여백 축소 */}
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl min-h-[90vh] p-12 shadow-2xl relative print:shadow-none print:p-4 print:rounded-none print:w-full print:block print:static print-record-content">
        
        <button onClick={onClose} className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors text-3xl font-bold print:hidden">✕</button>
        
        <div className="mb-6 text-center flex flex-col items-center print:mb-4">
            <PersonalizedLogo className="mb-2" />
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter print:text-xl">맞춤형 건강기능식품 상담 및 소분·조합 기록지</h3>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1 print:text-[8px]">RECORD ID: {record.id}</p>
        </div>

        {/* 판매 영업소 정보 섹션 - 높이 축소 */}
        <div className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center print:bg-white print:border-slate-300 print:p-3 print:mb-3">
            <div className="flex-1">
                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1">판매 영업소 정보</p>
                <div className="text-xs font-black text-slate-800">
                    <span className="inline-block mr-2">{config.pharmacyName}</span>
                    <span className="text-slate-400 font-medium print:text-slate-600 text-[10px]">| {config.businessAddress}</span>
                </div>
            </div>
            <div className="text-right border-l border-slate-200 pl-4 ml-4 print:border-slate-300">
                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1">소분 관리사</p>
                <p className="text-xs font-black text-slate-800">{config.managerName} (인/서명)</p>
            </div>
        </div>

        {/* 고객 정보 및 상태 - 콤팩트하게 변경 */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 print:bg-white print:border-slate-300 print:p-3 print:mb-3">
            <div className="space-y-1.5">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-1">소비자 및 상담 정보</h4>
                <div className="space-y-1 text-[11px] print:text-[10px]">
                    <p className="flex justify-between items-center"><span className="text-slate-400">성함:</span> <span className="font-black text-slate-800">{record.customerName} ({record.surveyData.ageGroup}{record.surveyData.isOver35 ? ', 35세↑' : ''})</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">연락처:</span> <span className="font-bold text-slate-800">{record.surveyData.phone}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">임신 단계:</span> <span className="font-black text-teal-600">{record.surveyData.stage}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">상담 일시:</span> <span className="font-bold text-slate-800">{new Date(record.date).toLocaleDateString()}</span></p>
                </div>
            </div>
            <div className="space-y-1.5">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-1">건강 상태 요약</h4>
                <div className="space-y-1 text-[11px] print:text-[10px]">
                    <p className="flex justify-between items-center"><span className="text-slate-400">비타민D 수치:</span> <span className="font-black text-slate-800">{record.surveyData.vitaminDLevel}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">Hb(빈혈):</span> <span className="font-black text-slate-800">{record.surveyData.hbLevel}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">불편 증상:</span> <span className="font-black text-slate-800 truncate max-w-[120px]">{record.surveyData.symptoms.join(', ') || '없음'}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">관리 약사:</span> <span className="font-black text-slate-800">{record.pharmacistName}</span></p>
                </div>
            </div>
        </div>

        {/* 제품 리스트 - 행 간격 및 폰트 축소 */}
        <div className="mb-4">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">소분 조합 제품 상세 내역</h4>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 print:bg-white print:border-slate-300">
                        <tr className="text-[9px] font-black text-slate-400 uppercase">
                            <th className="p-2 pl-4">제품명 / 상세 함량</th>
                            <th className="p-2">유효기간</th>
                            <th className="p-2">복용 방법</th>
                            <th className="p-2 pr-4 text-right">금액</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                        {record.selectedProducts.map((p, idx) => (
                            <tr key={idx} className="text-[10px] print:text-[9px]">
                                <td className="p-2 pl-4">
                                    <div className="font-black text-slate-800">{p.name}</div>
                                    <div className="text-[8px] text-slate-400 leading-tight mt-0.5">{p.ingredients.map(i => `${i.name}${i.amount}${i.unit}`).join(', ')}</div>
                                </td>
                                <td className="p-2 font-bold text-amber-600">{p.expirationDate}</td>
                                <td className="p-2 font-bold text-slate-600">{p.usage || '1일 1회'}</td>
                                <td className="p-2 pr-4 text-right font-black text-slate-800">{p.price.toLocaleString()}원</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-teal-50/30 font-black print:bg-white print:border-t print:border-slate-300">
                        <tr>
                            <td colSpan={3} className="p-2 text-right text-slate-500 text-[10px]">총 결제 합계:</td>
                            <td className="p-2 pr-4 text-right text-teal-600 text-sm print:text-black">{record.totalPrice.toLocaleString()}원</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        {/* 주의사항 및 비고 - 1장에 담기 위해 간결화 */}
        <div className="bg-slate-50 p-4 rounded-xl mb-6 text-[10px] text-slate-600 border border-slate-100 print:bg-white print:border-slate-300 print:p-3 print:mb-2 print:text-[9px]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <p className="font-black text-slate-800 mb-1">섭취 주의사항</p>
                  <p className="leading-tight text-slate-500">
                    직사광선을 피하고 서늘한 곳에 보관하십시오. 소분된 제품은 가급적 2개월 이내에 모두 섭취하는 것을 권장합니다.
                  </p>
              </div>
              <div className="border-l border-slate-200 pl-4">
                  <p className="font-black text-slate-800 mb-1">전문 약사 가이드</p>
                  <p className="leading-tight text-slate-500">
                    {record.surveyData.stage} 맞춤 설계입니다. {record.surveyData.notes ? `비고: ${record.surveyData.notes}` : '균형 잡힌 영양 공급에 집중하였습니다.'}
                  </p>
              </div>
            </div>
        </div>

        <div className="flex gap-4 print:hidden">
          <button onClick={handlePrint} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
             <span>🖨️</span> 상담 기록지 인쇄하기 (PDF 저장)
          </button>
          <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-3xl hover:bg-slate-200 transition-all">닫기</button>
        </div>

        {/* 인쇄 전용 직인 영역 - 위치 조정 */}
        <div className="hidden print:flex flex-col items-center mt-6 pt-4 border-t border-slate-300">
            <p className="text-base font-black text-slate-900 tracking-[0.2em]">{config.pharmacyName}</p>
            <p className="text-[9px] text-slate-500 mt-1 font-bold">맞춤형 건강기능식품 소분 관리사: {config.managerName} (인)</p>
        </div>
      </div>

      <style>{`
        @media print {
            /* 1. 인쇄 방해 요소 원천 차단 */
            html, body, #root, #root > div {
              visibility: hidden !important;
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: none !important;
              display: block !important;
            }
            
            /* 2. 기록지 모달만 절대 좌표로 노출 */
            .print-modal-overlay {
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              display: block !important;
              padding: 0 !important;
            }

            .print-record-content {
              visibility: visible !important;
              position: static !important;
              margin: 0 !important;
              padding: 10mm !important; /* A4 여백 설정 */
              width: 100% !important;
              max-width: none !important;
              border: none !important;
              box-shadow: none !important;
            }

            /* 하위 모든 텍스트 강제 노출 */
            .print-record-content * {
              visibility: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @page {
              size: A4;
              margin: 0; /* @page 여백은 CSS에서 p-4로 대체 */
            }
            
            .print\\:hidden { 
              display: none !important; 
            }
        }
      `}</style>
    </div>
  );
};

export default RecordDetailModal;
