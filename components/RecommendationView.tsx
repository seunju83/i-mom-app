
import React, { useState, useEffect, useMemo } from 'react';
import { SurveyData, Product, PregnancyStage, BloodTestResult, HbLevel, Symptom, PillType, ConsultationRecord, PharmacyConfig } from '../types';
import { COMMON_NOTICE } from '../constants';
import RecordDetailModal from './RecordDetailModal';

interface RecommendationViewProps {
  surveyData: SurveyData;
  products: Product[];
  config: PharmacyConfig;
  onSave: (selectedIds: string[], recommendedNames: string[], totalPrice: number) => ConsultationRecord;
  onReturnHome: () => void;
}

const PersonalizedLogo = ({ className = "" }: { className?: string }) => (
  <div className={`w-20 h-20 rounded-full border-4 border-teal-500 flex flex-col items-center justify-center bg-white shadow-md overflow-hidden relative ${className}`}>
    <div className="text-[10px] font-black text-orange-500 leading-none">맞춤형</div>
    <div className="text-[8px] font-bold text-teal-600 leading-none mt-1">건강기능식품</div>
    <div className="absolute bottom-0 w-full bg-teal-500 text-white text-[6px] font-bold py-1 text-center leading-none">식품의약품안전처</div>
  </div>
);

const PillIcon = ({ type }: { type?: PillType }) => {
  switch (type) {
    case 'round-white':
      return <div className="w-8 h-8 bg-white border-2 border-slate-200 rounded-full shadow-sm"></div>;
    case 'oval-yellow':
      return <div className="w-10 h-6 bg-yellow-300 border-2 border-yellow-400 rounded-full shadow-sm"></div>;
    case 'capsule-brown':
      return <div className="w-10 h-6 bg-[#8B4513] border-2 border-[#5D2E0D] rounded-full shadow-sm flex overflow-hidden"><div className="w-1/2 h-full bg-[#5D2E0D]/30"></div></div>;
    case 'small-round':
      return <div className="w-5 h-5 bg-white border-2 border-slate-100 rounded-full shadow-sm"></div>;
    case 'powder-pack':
      return <div className="w-8 h-10 bg-white border-2 border-slate-200 rounded shadow-sm relative"><div className="absolute inset-2 border-t border-slate-100"></div></div>;
    default:
      return <div className="w-6 h-6 bg-slate-200 rounded-full"></div>;
  }
};

const RecommendationView: React.FC<RecommendationViewProps> = ({ surveyData, products, config, onSave, onReturnHome }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOmegaId, setSelectedOmegaId] = useState<string>('');
  const [savedRecord, setSavedRecord] = useState<ConsultationRecord | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const targets = useMemo(() => {
    const { stage, vitaminDLevel, hbLevel, symptoms } = surveyData;
    let folic = (stage === PregnancyStage.PREP) ? 620 : 800;
    let vitD = (vitaminDLevel === BloodTestResult.NORMAL) ? 1000 : 2000;
    let iron = 0;
    const isIronStage = [PregnancyStage.MID, PregnancyStage.LATE, PregnancyStage.LACT].includes(stage);
    if (isIronStage) {
      const isHighRisk = symptoms.includes(Symptom.TWINS) || hbLevel === HbLevel.LEVEL_1 || hbLevel === HbLevel.LEVEL_2;
      iron = isHighRisk ? 100 : 24; 
    }
    return { folic, vitD, iron };
  }, [surveyData]);

  const { items, warnings, comments } = useMemo(() => {
    const { stage, isOver35, symptoms } = surveyData;
    const itemsList: string[] = [];
    const warningsList: string[] = [];
    const commentsList: string[] = [];

    itemsList.push(`엽산 ${targets.folic}㎍`);
    itemsList.push(`비타민D ${targets.vitD}IU`);

    if (stage === PregnancyStage.PREP) {
      commentsList.push('이노시톨: 임신 준비에 도움이 될 수 있습니다. (별도 구매 권장)');
      if (isOver35) {
        itemsList.push('코큐텐 100mg');
        itemsList.push('비타민C 1000mg');
        itemsList.push('오메가3 1000mg');
      }
    } else {
      itemsList.push('오메가3 (식물성 rTG 또는 일반 rTG 선택)');
      commentsList.push('유산균: 냉장보관 및 공복 복용이 권장되므로 별도 구매를 추천드립니다.');
    }

    if (targets.iron > 0) {
      if (targets.iron >= 80) {
        warningsList.push('고함량 철분제(80-120mg) 권장: 빈혈 임산부용 고함량 철분제는 일반의약품이므로 약사와의 별도 상담을 통한 상담 및 구매가 필요합니다.');
      } else {
        itemsList.push(`철분 ${targets.iron}mg`);
      }
    }

    if (stage === PregnancyStage.LATE || stage === PregnancyStage.LACT) {
      itemsList.push('칼슘·마그네슘·비타민D 복합제품');
    }

    if (symptoms.includes(Symptom.CONSTIPATION)) itemsList.push('차전자피 (변비 완화)');
    if (symptoms.includes(Symptom.CRAMPS)) itemsList.push('마그네슘 (다리 쥐 예방)');
    
    if (symptoms.includes(Symptom.BLEEDING)) {
      warningsList.push('⚠️ 출혈이 있는 경우 오메가3 복용은 권장되지 않습니다.');
    }

    return { items: itemsList, warnings: warningsList, comments: commentsList };
  }, [surveyData, targets]);

  useEffect(() => {
    const activeProducts = products.filter(p => p.isActive);
    let autoSelected: string[] = [];
    
    const folicProduct = activeProducts.find(p => p.ingredients.some(i => i.name === '엽산' && i.amount === targets.folic));
    if (folicProduct) autoSelected.push(folicProduct.id);

    if (targets.iron > 0 && targets.iron < 80) {
      const ironProduct = activeProducts.find(p => p.ingredients.some(i => i.name === '철분' && i.amount === targets.iron));
      if (ironProduct) autoSelected.push(ironProduct.id);
    }

    if (surveyData.stage === PregnancyStage.PREP && surveyData.isOver35) {
      const coq10 = activeProducts.find(p => p.ingredients.some(i => i.name === '코큐텐'));
      const vitc = activeProducts.find(p => p.ingredients.some(i => i.name === '비타민C'));
      if (coq10) autoSelected.push(coq10.id);
      if (vitc) autoSelected.push(vitc.id);
    }

    const currentVitD = activeProducts.filter(p => autoSelected.includes(p.id)).reduce((sum, p) => sum + (p.ingredients.find(i => i.name === '비타민D')?.amount || 0), 0);
    const gap = targets.vitD - currentVitD;
    if (gap > 0) {
      const vitDProduct = activeProducts.find(p => p.ingredients.some(i => i.name === '비타민D' && i.amount === gap));
      if (vitDProduct) autoSelected.push(vitDProduct.id);
    }

    if (surveyData.stage !== PregnancyStage.PREP && !surveyData.symptoms.includes(Symptom.BLEEDING)) {
      const defaultOmega = activeProducts.find(p => p.ingredients.some(i => i.name === '오메가3') && p.name.includes('600'));
      if (defaultOmega) setSelectedOmegaId(defaultOmega.id);
    } else if (surveyData.stage === PregnancyStage.PREP && surveyData.isOver35) {
      const defaultOmega = activeProducts.find(p => p.ingredients.some(i => i.name === '오메가3') && p.ingredients.some(i => i.amount === 1000));
      if (defaultOmega) autoSelected.push(defaultOmega.id);
    }

    if (surveyData.symptoms.includes(Symptom.CONSTIPATION)) {
      const fiber = activeProducts.find(p => p.ingredients.some(i => i.name === '차전자피'));
      if (fiber) autoSelected.push(fiber.id);
    }
    if (surveyData.symptoms.includes(Symptom.CRAMPS)) {
      const mag = activeProducts.find(p => p.ingredients.some(i => i.name === '마그네슘') && p.ingredients.length === 1);
      if (mag) autoSelected.push(mag.id);
    }
    
    if (surveyData.stage === PregnancyStage.LATE || surveyData.stage === PregnancyStage.LACT) {
      const complex = activeProducts.find(p => p.name.includes('칼마디'));
      if (complex) autoSelected.push(complex.id);
    }

    setSelectedIds(autoSelected);
  }, [targets, products, surveyData]);

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const selectedProducts = products.filter(p => selectedIds.includes(p.id) || p.id === selectedOmegaId);
  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  const handleSave = () => {
    const record = onSave(selectedProducts.map(p => p.id), items, totalPrice);
    setSavedRecord(record);
  };

  if (savedRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-5xl mb-8 shadow-inner">✓</div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">상담 및 조제 기록 완료</h2>
        <p className="text-slate-500 mb-10 max-w-md">
          {savedRecord.customerName}님의 맞춤 영양 설계가 안전하게 저장되었습니다.<br/>
          법정 기록은 3년간 보관됩니다.
        </p>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={() => setShowPrintModal(true)}
            className="w-full py-5 bg-teal-600 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span>🖨️</span> 내역 출력 및 PDF 발행
          </button>
          <button 
            onClick={onReturnHome}
            className="w-full py-5 bg-slate-100 text-slate-600 font-black rounded-2xl active:scale-95 transition-all"
          >
            메인 화면으로
          </button>
        </div>

        {showPrintModal && (
          <RecordDetailModal 
            record={savedRecord} 
            config={config} 
            onClose={() => setShowPrintModal(false)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-32">
      <div className="lg:col-span-7 space-y-8">
        <div className="bg-white/80 p-6 rounded-[2rem] border border-[#F0E5D8] shadow-sm">
          <h4 className="text-[10px] font-black text-teal-700 uppercase mb-4 tracking-widest">Counseling Summary (Email: {surveyData.email})</h4>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-[#FDF8F1] rounded-2xl border border-[#F0E5D8]">
                <p className="text-[10px] text-slate-400 font-bold mb-1">임신 단계</p>
                <p className="font-black text-slate-800">{surveyData.stage}</p>
             </div>
             <div className="p-4 bg-[#FDF8F1] rounded-2xl border border-[#F0E5D8]">
                <p className="text-[10px] text-slate-400 font-bold mb-1">상담 결과 요약</p>
                <p className="font-black text-slate-800 text-xs">{surveyData.symptoms.length > 0 ? surveyData.symptoms.join(', ') : '특이 증상 없음'}</p>
             </div>
          </div>
        </div>

        {(warnings.length > 0 || comments.length > 0) && (
          <div className="space-y-4">
            {warnings.map((w, idx) => (
              <div key={idx} className="p-5 bg-red-50 border-2 border-red-100 rounded-3xl text-red-700 font-black text-sm flex gap-4 items-center animate-pulse">
                <span className="text-3xl">🚫</span>
                <p className="leading-relaxed">{w}</p>
              </div>
            ))}
            {comments.map((c, idx) => (
              <div key={idx} className="p-5 bg-blue-50 border border-blue-100 rounded-3xl text-blue-700 font-bold text-sm flex gap-4 items-center">
                <span className="text-2xl">☝️</span>
                <p className="leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
        )}

        {surveyData.stage !== PregnancyStage.PREP && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#F0E5D8] shadow-sm">
             <h3 className="text-xl font-black text-[#5D5347] mb-6 flex items-center gap-2">
                <span className="text-2xl">🐟</span> 오메가3 옵션 선택
             </h3>
             <div className="space-y-3">
                {products.filter(p => p.isActive && p.ingredients.some(i => i.name === '오메가3')).map(omega => (
                  <div 
                    key={omega.id}
                    onClick={() => setSelectedOmegaId(omega.id)}
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${selectedOmegaId === omega.id ? 'border-teal-500 bg-teal-50/20' : 'border-slate-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <PillIcon type={omega.pillType} />
                      <span className="font-black text-slate-800 text-sm">{omega.name}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${selectedOmegaId === omega.id ? 'bg-teal-600 border-teal-600' : 'border-slate-200'}`}></div>
                  </div>
                ))}
             </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-[2.5rem] border border-[#F0E5D8] shadow-sm">
          <h3 className="text-xl font-black text-[#5D5347] mb-6">추천 영양제 리스트</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.filter(p => p.isActive && !p.ingredients.some(i => i.name === '오메가3')).map(product => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <div 
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`p-4 border-2 rounded-3xl cursor-pointer transition-all flex gap-4 ${isSelected ? 'border-teal-500 bg-teal-50/10 shadow-sm' : 'border-slate-50'}`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={product.images?.[0] || 'https://picsum.photos/300/300'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-black text-xs text-[#5D5347] truncate">{product.name}</h4>
                    <p className="text-[10px] font-bold text-teal-600">{product.price.toLocaleString()}원</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200'}`}>
                    {isSelected && <span className="text-[8px] font-bold">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 relative">
        <div className="sticky top-24 bg-[#FDF8F1] p-8 rounded-[3rem] border border-[#F0E5D8] shadow-2xl min-h-[600px] flex flex-col items-center">
            <div className="w-full text-center border-b-2 border-[#EBDBC9] pb-6 mb-8">
               <span className="text-[#5D5347] font-black text-[8px] uppercase tracking-[0.3em] mb-2 block">Personalized Recommendation</span>
               <h3 className="text-3xl font-black text-[#5D5347] tracking-tighter">맞춤형 영양제 추천</h3>
            </div>

            <div className="w-full space-y-6 flex-1">
                <div className="flex justify-between items-end px-4">
                    <div className="space-y-1">
                        <p className="text-2xl font-black text-[#5D5347]">{surveyData.customerName} 님</p>
                        <p className="text-xs font-bold text-teal-600">[약사 상담 맞춤 추천]</p>
                    </div>
                    <PersonalizedLogo className="opacity-80" />
                </div>

                <div className="bg-white/60 p-6 rounded-3xl border border-dashed border-[#EBDBC9] space-y-4">
                    {selectedProducts.length === 0 ? (
                        <p className="text-center text-slate-300 py-10 font-bold italic">영양제를 선택해 주세요.</p>
                    ) : selectedProducts.map(p => (
                        <div key={p.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <PillIcon type={p.pillType} />
                                <span className="font-black text-xs text-[#5D5347]">{p.name}</span>
                            </div>
                            <span className="font-black text-[10px] text-[#8D7F70]">
                              {p.usage || (p.name.includes('차전자피') ? '1회 1포' : '1회 1정')}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="border-t-2 border-[#EBDBC9] pt-6 flex flex-col items-center gap-2">
                    <p className="text-sm font-black text-[#5D5347]">아이맘약국 송은주 약사 상담 설계</p>
                    <div className="flex flex-col items-center mt-4">
                        <p className="text-lg font-black text-teal-600">{config.pharmacyName}</p>
                        <p className="text-[10px] font-bold text-[#8D7F70]">{new Date().toLocaleDateString()} 추천</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[1024px] mx-auto bg-white/90 backdrop-blur-md border-t border-[#F0E5D8] p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl z-50 rounded-t-[3rem]">
        <div className="hidden md:block">
            <p className="text-[#8D7F70] text-[10px] font-black uppercase tracking-widest mb-1">Total Monthly Cost</p>
            <p className="text-4xl font-black text-teal-600 tracking-tighter">{totalPrice.toLocaleString()}원</p>
        </div>
        <button 
          onClick={handleSave}
          className="w-full md:w-auto px-16 py-6 bg-teal-600 hover:bg-teal-700 text-white text-xl font-black rounded-3xl shadow-xl transition-all"
        >
          상담 기록 저장 및 구매 확정
        </button>
      </div>
    </div>
  );
};

export default RecommendationView;
