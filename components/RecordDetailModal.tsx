
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[200] backdrop-blur-md print:bg-white print:p-0 print:block">
      {/* 인쇄 시 이 div가 메인 컨테이너가 됨 */}
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[95vh] overflow-y-auto p-12 shadow-2xl relative print:max-h-none print:shadow-none print:p-0 print:rounded-none print:relative print:block print:w-full print-content">
        
        <button onClick={onClose} className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors text-3xl font-bold print:hidden">✕</button>
        
        <div className="mb-10 text-center space-y-2 flex flex-col items-center">
            <PersonalizedLogo className="mb-4" />
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">맞춤형 건강기능식품 상담 및 소분·조합 기록지</h3>
            <p className="text-slate-400 font-black text-sm uppercase tracking-widest">RECORD ID: {record.id}</p>
        </div>

        {/* 판매 영업소 정보 섹션 - 인쇄 시 겹침 방지를 위해 Grid 레이아웃 적용 */}
        <div className="mb-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6 items-center print:bg-white print:border-slate-300 print:grid-cols-4">
            <div className="md:col-span-3">
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1.5">판매 영업소 정보</p>
                <div className="text-sm font-black text-slate-800 leading-snug">
                    <span className="inline-block mr-2">{config.pharmacyName}</span>
                    <span className="text-slate-400 font-medium print:text-slate-500">| {config.businessAddress}</span>
                </div>
            </div>
            <div className="text-right md:col-span-1 border-l border-slate-200 pl-6 print:border-slate-300">
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1.5">소분 관리사</p>
                <p className="text-sm font-black text-slate-800">{config.managerName} (인)</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-10 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 print:bg-white print:border-slate-300">
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">소비자 및 상담 기본 정보</h4>
                <div className="space-y-2 text-sm">
                    <p className="flex justify-between items-center"><span className="text-slate-400">소비자명:</span> <span className="font-black text-slate-800">{record.customerName}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">연락처:</span> <span className="font-bold text-slate-800">{record.surveyData.phone}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">이메일:</span> <span className="font-bold text-teal-600">{record.surveyData.email}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">상담 일자:</span> <span className="font-bold text-slate-800">{new Date(record.date).toLocaleString()}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">상담 방법:</span> <span className="font-bold text-slate-800">{record.counselingMethod}</span></p>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">운영 및 상태 정보</h4>
                <div className="space-y-2 text-sm">
                    <p className="flex justify-between items-center"><span className="text-slate-400">상담 약사:</span> <span className="font-black text-slate-800">{record.pharmacistName}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">구매 여부:</span> <span className="font-black text-teal-600">{record.purchaseStatus}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">조제 일수:</span> <span className="font-bold text-slate-800">{record.dispensingDays}일분 (1개월)</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-400">임신 단계:</span> <span className="font-bold text-slate-800">{record.surveyData.stage}</span></p>
                </div>
            </div>
        </div>

        <div className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-4">상담 내용 및 결과 (상담 결과 / 소분 상세)</h4>
            <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden print:border-slate-300">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 print:bg-white print:border-slate-300">
                        <tr className="text-[10px] font-black text-slate-400 uppercase">
                            <th className="p-4">제품명</th>
                            <th className="p-4">유효기간</th>
                            <th className="p-4 text-center">복용 방법 안내</th>
                            <th className="p-4 text-right">단가</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                        {record.selectedProducts.map((p, idx) => (
                            <tr key={idx} className="text-sm">
                                <td className="p-4">
                                    <div className="font-black text-slate-800">{p.name}</div>
                                    <div className="text-[9px] text-slate-400">{p.ingredients.map(i => `${i.name}${i.amount}${i.unit}`).join(', ')}</div>
                                </td>
                                <td className="p-4 font-bold text-amber-600 print:text-amber-700">{p.expirationDate}</td>
                                <td className="p-4 text-center font-black text-slate-800">
                                  {p.usage || '1일 1회 복용'}
                                </td>
                                <td className="p-4 text-right font-black text-slate-800">{p.price.toLocaleString()}원</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-teal-50/50 font-black print:bg-white print:border-t-2 print:border-slate-300">
                        <tr>
                            <td colSpan={3} className="p-4 text-right text-slate-500">총 구매 합계:</td>
                            <td className="p-4 text-right text-teal-600 text-xl print:text-teal-700">{record.totalPrice.toLocaleString()}원</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-[1.5rem] mb-10 text-xs text-slate-600 space-y-4 border border-slate-100 print:bg-white print:border-slate-300 print:text-slate-800">
            <h5 className="font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-2 print:border-slate-300">상담 상세 기록 / 복약 지도</h5>
            <p className="leading-relaxed">
                <span className="font-black text-slate-400 print:text-slate-500">[상담 결과 요약]</span><br />
                대상자는 {record.surveyData.stage} 상태로, {record.recommendedProductNames.join(', ')}를 기반으로 한 개인 맞춤 영양 설계를 진행함. 
                {record.surveyData.symptoms.length > 0 ? `불편 증상(${record.surveyData.symptoms.join(', ')}) 완화를 위한 추가 함량 조정이 반영됨.` : '특별한 불편 증상 없는 건강 유지 목적의 조합임.'}
            </p>
            <p className="leading-relaxed font-bold">
                <span className="text-teal-600 print:text-teal-700">섭취 권장 기간:</span> 소분일({new Date(record.date).toLocaleDateString()})로부터 <span className="underline">2개월 이내</span> 섭취를 강력히 권장합니다. 
                개봉 및 소분 이후에는 습도 및 온도 변화에 취약하므로 서늘한 곳에 보관하시기 바랍니다.
            </p>
            {record.surveyData.notes && (
               <p className="italic text-slate-400 print:text-slate-500">비고: "{record.surveyData.notes}"</p>
            )}
            <p className="text-[10px] text-slate-400 mt-4 italic">본 기록은 관련 법령 및 운영 방침에 따라 상담일로부터 3년간 보관 후 자동 파기됩니다.</p>
        </div>

        <div className="flex gap-4 print:hidden">
          <button onClick={handlePrint} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
             <span>🖨️</span> 인쇄 및 PDF 저장
          </button>
          <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-3xl hover:bg-slate-200 transition-all">닫기</button>
        </div>

        {/* 인쇄 시에만 하단에 나타나는 직인 및 약국 정보 영역 */}
        <div className="hidden print:flex flex-col items-center mt-12 pt-8 border-t border-slate-200">
            <PersonalizedLogo className="scale-75 mb-4" />
            <p className="text-xl font-black text-slate-900 tracking-widest">{config.pharmacyName}</p>
            <p className="text-sm text-slate-600 mt-1">{config.businessAddress}</p>
            <p className="text-sm text-slate-500 mt-3 font-bold tracking-tight">맞춤형 건강기능식품 소분 관리사: {config.managerName} (인)</p>
        </div>
      </div>

      <style>{`
        @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            /* 화면의 나머지 요소들을 display: none으로 제거하여 겹침 원천 방지 */
            body > *:not(#root) { display: none !important; }
            #root > div > *:not(main) { display: none !important; }
            main > *:not(.print-content) { display: none !important; }
            
            /* 모달 컨테이너를 인쇄 영역 전체로 확장 */
            .fixed { position: static !important; background: white !important; padding: 0 !important; }
            .print-content { 
              display: block !important; 
              width: 100% !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              box-shadow: none !important; 
              overflow: visible !important;
            }
            
            /* 배경색 출력을 강제 (브라우저 설정에 따라 다름) */
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            
            /* 인쇄 시 텍스트 겹침의 주원인인 필터 및 특수 효과 제거 */
            .backdrop-blur-md { backdrop-filter: none !important; }
            .shadow-2xl, .shadow-xl, .shadow-md { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default RecordDetailModal;
