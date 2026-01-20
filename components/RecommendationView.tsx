
import React, { useState, useEffect, useMemo } from 'react';
import { SurveyData, Product, PregnancyStage, BloodTestResult, HbLevel, Symptom, PillType, ConsultationRecord, PharmacyConfig } from '../types';
import { COMMON_NOTICE } from '../constants';
import RecordDetailModal from './RecordDetailModal';
import { GoogleGenAI } from '@google/genai';

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
  const [aiNote, setAiNote] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 핵심 추천 로직 엔진
  const logicResult = useMemo(() => {
    const { stage, vitaminDLevel, hbLevel, symptoms, isOver35, currentSupplements } = surveyData;
    const items: string[] = [];
    const warnings: string[] = [];
    const autoIds: string[] = [];
    let autoOmegaId: string = '';

    // A. 비타민D 목표 설정
    const targetVitD = (vitaminDLevel === BloodTestResult.NORMAL) ? 1000 : 2000;

    // B. 단계별 영양 설계
    if (stage === PregnancyStage.PREP) {
      if (!currentSupplements.folicAcid) autoIds.push('2');
      items.push('활성형 엽산 620㎍');

      if (!currentSupplements.vitaminD) {
        autoIds.push(targetVitD === 1000 ? '5-1' : '5');
      }
      items.push(`비타민D ${targetVitD}IU`);

      if (isOver35) {
        autoIds.push('8', '9');
        autoOmegaId = '4';
        items.push('코큐텐', '비타민C', '오메가3 1000mg');
        warnings.push('💡 임신 준비(만 35세 이상/난임)를 위해 이노시톨(별도 구매) 병행이 도움됩니다.');
      }
    } 
    else if (stage === PregnancyStage.EARLY) {
      if (!currentSupplements.folicAcid) {
        autoIds.push('1');
        if (targetVitD === 2000) autoIds.push('5-1');
      } else if (!currentSupplements.vitaminD) {
        autoIds.push(targetVitD === 1000 ? '5-1' : '5');
      }
      items.push('활성형 엽산 800㎍', `비타민D ${targetVitD}IU`);
      if (!currentSupplements.omega3) autoOmegaId = '3';
    }
    else {
      // 중기/후기/수유기 (엽산 제품은 추천에서 완전 제외)
      const isAnemiaOrTwins = symptoms.includes(Symptom.TWINS) || hbLevel === HbLevel.LEVEL_1 || hbLevel === HbLevel.LEVEL_2;
      
      if (isAnemiaOrTwins) {
        warnings.push('⚠️ 빈혈 수치가 낮으므로 고함량 철분제 별도 상담을 권장합니다.');
      } else if (!currentSupplements.iron) {
        autoIds.push('6-1');
        items.push('철분 24mg');
      }

      if (!currentSupplements.vitaminD) {
        autoIds.push(targetVitD === 1000 ? '5-1' : '5');
      }
      items.push(`비타민D ${targetVitD}IU`);

      if (!currentSupplements.omega3) autoOmegaId = '3';

      if ((stage === PregnancyStage.LATE || stage === PregnancyStage.LACT) && !currentSupplements.calMag) {
        autoIds.push('7');
        items.push('칼마디 복합제');
      }
    }

    if (symptoms.includes(Symptom.CONSTIPATION)) {
      autoIds.push('10');
      items.push('차전자피(변비)');
    }
    if (symptoms.includes(Symptom.CRAMPS)) {
      autoIds.push('11');
      items.push('마그네슘(쥐 예방)');
    }

    return { items, warnings, autoIds, autoOmegaId };
  }, [surveyData, products]);

  useEffect(() => {
    setSelectedIds(logicResult.autoIds);
    setSelectedOmegaId(logicResult.autoOmegaId);
    
    const fetchAiNote = async () => {
      setIsAiLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `약사로서 ${surveyData.customerName}님께 드리는 인사. 단계:${surveyData.stage}, 증상:${surveyData.symptoms.join(',')}. 다정한 한국어 2문장.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setAiNote(response.text || '');
      } catch (e) {
        setAiNote(`${surveyData.customerName}님의 건강하고 행복한 임신 기간을 아이맘약국이 응원합니다!`);
      } finally { setIsAiLoading(false); }
    };
    fetchAiNote();
  }, [logicResult, surveyData.customerName]);

  const selectedProducts = products.filter(p => selectedIds.includes(p.id) || p.id === selectedOmegaId);
  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  const handleSave = () => {
    if (selectedProducts.length === 0) return alert('제품을 선택해 주세요.');
    const record = onSave(selectedProducts.map(p => p.id), logicResult.items, totalPrice);
    setSavedRecord(record);
  };

  if (savedRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-5xl mb-8 animate-bounce">✓</div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">상담 결과 저장 완료</h2>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={() => setShowPrintModal(true)} className="w-full py-6 bg-teal-600 text-white font-black rounded-3xl shadow-xl">결과지 출력</button>
          <button onClick={onReturnHome} className="w-full py-5 bg-slate-100 text-slate-500 font-black rounded-3xl">홈으로</button>
        </div>
        {showPrintModal && <RecordDetailModal record={savedRecord} config={config} onClose={() => setShowPrintModal(false)} />}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-32 animate-in fade-in duration-700">
      <div className="lg:col-span-7 space-y-8">
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-10 rounded-[3rem] text-white shadow-2xl relative">
            <div className="relative z-10">
                <p className="text-2xl font-black leading-tight italic min-h-[3.5rem]">
                   "{isAiLoading ? '분석 중...' : aiNote}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">👩‍⚕️</div>
                    <span className="text-sm font-bold opacity-80">아이맘약국 전문 가이드</span>
                </div>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">📊 {surveyData.stage} 추천 지표</h3>
           <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: '엽산', key: 'folicAcid' }, { label: '비타민D', key: 'vitaminD' },
                { label: '철분', key: 'iron' }, { label: '오메가3', key: 'omega3' },
                { label: '칼/마/디', key: 'calMag' }, { label: '기타', key: 'others' }
              ].map(m => {
                const isTaken = m.key !== 'others' && (surveyData.currentSupplements as any)[m.key];
                const isRecommended = logicResult.items.some(item => item.includes(m.label));
                return (
                  <div key={m.key} className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${isTaken ? 'bg-slate-50 opacity-40' : isRecommended ? 'bg-teal-50 border-teal-200' : 'bg-white'}`}>
                    <span className="text-[10px] font-black text-slate-500">{m.label}</span>
                    <span className={`text-[10px] font-black py-1 px-2 rounded-lg mt-1 ${isTaken ? 'bg-slate-200' : isRecommended ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                        {isTaken ? '복용중' : isRecommended ? '추천' : '-'}
                    </span>
                  </div>
                );
              })}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-black text-slate-800 mb-6">추천 제품 목록</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.filter(p => p.isActive).map(product => {
                // [중기 이후 엽산 필터링]
                const isMidOrLater = [PregnancyStage.MID, PregnancyStage.LATE, PregnancyStage.LACT].includes(surveyData.stage);
                const hasFolic = product.ingredients.some(ing => ing.name === '엽산');
                if (isMidOrLater && hasFolic) return null;

                const isSelected = selectedIds.includes(product.id) || selectedOmegaId === product.id;
                const isOmega = product.ingredients.some(i => i.name === '오메가3');
                
                return (
                  <div key={product.id} onClick={() => {
                        if (isOmega) setSelectedOmegaId(selectedOmegaId === product.id ? '' : product.id);
                        else isSelected ? setSelectedIds(selectedIds.filter(id => id !== product.id)) : setSelectedIds([...selectedIds, product.id]);
                    }} className={`p-4 border-2 rounded-[2rem] cursor-pointer flex gap-4 transition-all ${isSelected ? 'border-teal-500 bg-teal-50/30' : 'border-slate-50'}`}>
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-50"><img src={product.images[0]} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 overflow-hidden flex flex-col justify-center">
                      <h4 className="font-black text-[12px] truncate">{product.name}</h4>
                      <p className="text-[10px] font-bold text-teal-600">{product.price.toLocaleString()}원</p>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="sticky top-24 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl">
            <h3 className="text-2xl font-black text-center mb-8">{surveyData.customerName}님 설계 요약</h3>
            <div className="bg-slate-50/80 p-6 rounded-[2.5rem] border-2 border-dashed min-h-[300px] mb-8">
                {selectedProducts.length === 0 ? <p className="text-center py-20 text-slate-300 italic">선택된 제품이 없습니다.</p> : (
                  <div className="space-y-3">
                    {selectedProducts.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm">
                          <div className="flex items-center gap-3"><PillIcon type={p.pillType} /><p className="font-black text-[11px] truncate w-32">{p.name}</p></div>
                          <span className="text-[10px] font-bold text-slate-400">{p.price.toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <p className="text-3xl font-black text-teal-600 text-right mb-8 px-4">{totalPrice.toLocaleString()}원</p>
            <button onClick={handleSave} className="w-full py-7 bg-slate-900 text-white font-black rounded-[2.5rem] text-xl active:scale-95 shadow-xl transition-all">기록 저장</button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationView;
