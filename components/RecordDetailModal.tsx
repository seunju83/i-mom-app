
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-[200] backdrop-blur-md print:bg-white print:p-0 print:block">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[95vh] overflow-y-auto p-12 shadow-2xl relative print:max-h-none print:shadow-none print:p-8 print:rounded-none">
        <button onClick={onClose} className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors text-3xl font-bold print:hidden">✕</button>
        
        <div className="mb-10 text-center space-y-2 flex flex-col items-center">
            <PersonalizedLogo className="mb-4" />
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">맞춤형 건강기능식품 상담 및 소분·조합 기록지</h3>
            <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Record ID: {record.id}</p>
        </div>

        {/* 법정 필수 정보: 영업소 정보 추가 */}
        <div className="mb-6 p-4 bg-teal-50/30 border border-teal-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:bg-white print:border-slate-200">
            <div>
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">판매 영업소 정보</p>
                <p className="text-sm font-black text-slate-800">{config.pharmacyName} <span className="text-slate-400 font-medium ml-2">| {config.businessAddress}</span></p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">소분 관리사</p>
                <p className="text-sm font-black text-slate-800">{config.managerName}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-10 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 print:bg-white print:border-slate-200">
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">소비자 및 상담 기본 정보</h4>
                <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-slate-400">소비자명:</span> <span className="font-black">{record.customerName}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">연락처:</span> <span className="font-bold">{record.surveyData.phone}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">이메일:</span> <span className="font-bold text-teal-600">{record.surveyData.email}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">상담 일자:</span> <span className="font-bold">{new Date(record.date).toLocaleString()}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">상담 방법:</span> <span className="font-bold">{record.counselingMethod}</span></p>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">운영 및 상태 정보</h4>
                <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-slate-400">상담 약사:</span> <span className="font-black">{record.pharmacistName}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">구매 여부:</span> <span className="font-black text-teal-600">{record.purchaseStatus}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">조제 일수:</span> <span className="font-bold">{record.dispensingDays}일분 (1개월)</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">임신 단계:</span> <span className="font-bold">{record.surveyData.stage}</span></p>
                </div>
            </div>
        </div>

        <div className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-4">상담 내용 및 결과 (상담 결과 / 소분 상세)</h4>
            <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-[10px] font-black text-slate-400 uppercase">
                            <th className="p-4">제품명</th>
                            <th className="p-4">유효기간</th>
                            <th className="p-4 text-center">복용 방법 안내</th>
                            <th className="p-4 text-right">단가</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {record.selectedProducts.map((p, idx) => (
                            <tr key={idx} className="text-sm">
                                <td className="p-4">
                                    <div className="font-black text-slate-800">{p.name}</div>
                                    <div className="text-[9px] text-slate-400">{p.ingredients.map(i => `${i.name}${i.amount}${i.unit}`).join(', ')}</div>
                                </td>
                                <td className="p-4 font-bold text-amber-600">{p.expirationDate}</td>
                                <td className="p-4 text-center font-black">
                                  {p.usage || (p.name.includes('차전자피') ? '1회 1포' : '1회 1정')}
                                </td>
                                <td className="p-4 text-right font-black">{p.price.toLocaleString()}원</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-teal-50/50 font-black">
                        <tr>
                            <td colSpan={3} className="p-4 text-right text-slate-500">총 구매 합계:</td>
                            <td className="p-4 text-right text-teal-600 text-xl">{record.totalPrice.toLocaleString()}원</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-[1.5rem] mb-10 text-xs text-slate-600 space-y-4 border border-slate-100 print:bg-white print:border-slate-200">
            <h5 className="font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">상담 상세 기록 / 복약 지도</h5>
            <p className="leading-relaxed">
                <span className="font-black text-slate-400">[상담 결과 요약]</span><br />
                대상자는 {record.surveyData.stage} 상태로, {record.recommendedProductNames.join(', ')}를 기반으로 한 개인 맞춤 영양 설계를 진행함. 
                {record.surveyData.symptoms.length > 0 ? `불편 증상(${record.surveyData.symptoms.join(', ')}) 완화를 위한 추가 함량 조정이 반영됨.` : '특별한 불편 증상 없는 건강 유지 목적의 조합임.'}
            </p>
            <p className="leading-relaxed font-bold">
                <span className="text-teal-600">섭취 권장 기간:</span> 소분일({new Date(record.date).toLocaleDateString()})로부터 <span className="underline">2개월 이내</span> 섭취를 강력히 권장합니다. 
                개봉 및 소분 이후에는 습도 및 온도 변화에 취약하므로 서늘한 곳에 보관하시기 바랍니다.
            </p>
            {record.surveyData.notes && (
               <p className="italic text-slate-400">비고: "{record.surveyData.notes}"</p>
            )}
            <p className="text-[10px] text-slate-400 mt-4 italic">본 기록은 관련 법령 및 운영 방침에 따라 상담일로부터 3년간 보관 후 자동 파기됩니다.</p>
        </div>

        <div className="flex gap-4 print:hidden">
          <button onClick={handlePrint} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-3">
             <span>🖨️</span> 인쇄 및 PDF 저장
          </button>
          <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-3xl">닫기</button>
        </div>

        <div className="hidden print:block text-center mt-20 border-t pt-10 flex flex-col items-center">
            <PersonalizedLogo className="scale-75 mb-4" />
            <p className="text-xl font-black text-slate-800 tracking-widest">{config.pharmacyName}</p>
            <p className="text-sm text-slate-600 mt-1">{config.businessAddress}</p>
            <p className="text-sm text-slate-400 mt-2">맞춤형 건강기능식품 소분 관리사: {config.managerName} (인)</p>
        </div>
      </div>
      <style>{`
        @media print {
            body * { visibility: hidden; }
            .print\\:block, .print\\:block * { visibility: visible; }
            .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
            .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default RecordDetailModal;
