
import React, { useState, useEffect, useMemo } from 'react';
import { SurveyData, Product, PregnancyStage, BloodTestResult, HbLevel, Symptom, PillType, ConsultationRecord, PharmacyConfig } from '../types';
import RecordDetailModal from './RecordDetailModal';
import { GoogleGenAI } from '@google/genai';

interface RecommendationViewProps {
  surveyData: SurveyData;
  products: Product[];
  config: PharmacyConfig;
  onSave: (selectedIds: string[], recommendedNames: string[], totalPrice: number) => ConsultationRecord;
  onBack: () => void;
  onReturnHome: () => void;
}

const RecommendationView: React.FC<RecommendationViewProps> = ({ surveyData, products, config, onSave, onBack, onReturnHome }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOmegaId, setSelectedOmegaId] = useState<string>('');
  const [savedRecord, setSavedRecord] = useState<ConsultationRecord | null>(null);
  const [aiNote, setAiNote] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 단계별 자동 추천 및 필터링 로직 고도화
  const logicResult = useMemo(() => {
    const { stage, vitaminDLevel, symptoms, isOver35, currentSupplements } = surveyData;
    const autoIds: string[] = [];
    let autoOmegaId: string = '';

    const targetVitDId = (vitaminDLevel === BloodTestResult.NORMAL) ? '5-1' : '5';
    const hasBleeding = symptoms.includes(Symptom.BLEEDING);

    // [로직 추가] 출혈이 없는 경우 오메가3와 유산균 권장
    if (!hasBleeding) {
      if (!currentSupplements.omega3) {
        // 임신 준비기+35세 이상은 일반 오메가3(4) 추천, 나머지는 식물성(3) 추천
        autoOmegaId = (stage === PregnancyStage.PREP && isOver35) ? '4' : '3';
      }
      if (!currentSupplements.probiotics) {
        autoIds.push('12'); // 유산균 자동 추가
      }
    }

    // 단계별 기본 추천
    if (stage === PregnancyStage.PREP) {
      if (!currentSupplements.folicAcid) autoIds.push('2');
      if (!currentSupplements.vitaminD) autoIds.push(targetVitDId);
      if (isOver35) autoIds.push('8', '9'); // 코큐텐, 비타민C
    } 
    else if (stage === PregnancyStage.EARLY) {
      if (!currentSupplements.folicAcid) autoIds.push('1');
      if (!currentSupplements.vitaminD) autoIds.push(targetVitDId);
    }
    else if (stage === PregnancyStage.MID) {
      if (!currentSupplements.iron) autoIds.push('6-1');
      if (!currentSupplements.vitaminD) autoIds.push(targetVitDId);
    }
    else if (stage === PregnancyStage.LATE || stage === PregnancyStage.LACT) {
      if (stage === PregnancyStage.LATE && !currentSupplements.iron) autoIds.push('6-1');
      if (!currentSupplements.vitaminD) autoIds.push(targetVitDId);
      // [로직 추가] 임신 후기 및 수유기 칼마디 권장
      if (!currentSupplements.calMag) autoIds.push('7');
    }

    // 증상 기반 추가
    if (symptoms.includes(Symptom.CONSTIPATION)) autoIds.push('10');
    if (symptoms.includes(Symptom.CRAMPS)) autoIds.push('11');

    return { autoIds, autoOmegaId };
  }, [surveyData]);

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
        setAiNote(`${surveyData.customerName}님의 건강하고 행복한 나날을 아이맘약국이 응원합니다!`);
      } finally { setIsAiLoading(false); }
    };
    fetchAiNote();
  }, [logicResult, surveyData.customerName]);

  const selectedProducts = products.filter(p => selectedIds.includes(p.id) || p.id === selectedOmegaId);
  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  const handleSave = () => {
    if (selectedProducts.length === 0) return alert('제품을 선택해 주세요.');
    const record = onSave(selectedProducts.map(p => p.id), [], totalPrice);
    setSavedRecord(record);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-700 pb-20">
      <div className="lg:col-span-7 space-y-8">
        <div className="bg-teal-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <p className="text-xl font-black leading-tight italic min-h-[3rem] relative z-10">"{isAiLoading ? '전문 약사의 영양 설계를 분석하고 있습니다...' : aiNote}"</p>
            <p className="mt-4 text-[10px] font-bold opacity-70 uppercase tracking-widest relative z-10">Pharmacist's Message</p>
        </div>

        {/* [복구 및 강화] 상담 내역 전체 요약 섹션 */}
        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-inner space-y-6">
           <div className="flex justify-between items-center border-b border-slate-200 pb-4">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-teal-500 pl-3">상담 내역 전체 요약</h4>
             <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded-md">ID: {Date.now().toString().slice(-6)}</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold">고객 기본 정보</p>
                  <p className="font-black text-slate-800 text-lg">{surveyData.customerName} <span className="text-xs font-normal text-slate-400">({surveyData.ageGroup}{surveyData.isOver35 ? ', 만35세↑' : ''})</span></p>
                  <p className="text-xs font-bold text-slate-500">{surveyData.phone}</p>
                  {surveyData.address && <p className="text-[10px] text-slate-400 bg-white p-2 rounded-lg mt-1 border">{surveyData.address}</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold">현재 단계</p>
                  <p className="font-black text-teal-600">{surveyData.stage}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold">비타민D 수치</p>
                    <p className="font-black text-amber-600">{surveyData.vitaminDLevel}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold">Hb(빈혈) 수치</p>
                    <p className="font-black text-red-500">{surveyData.hbLevel}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold">불편 증상</p>
                  <p className="font-black text-slate-700">{surveyData.symptoms.length > 0 ? surveyData.symptoms.join(', ') : '해당 없음'}</p>
                </div>
              </div>

              <div className="col-span-full space-y-1">
                <p className="text-[10px] text-slate-400 font-bold">현재 복용 중인 영양제 (한 달 이상 남은 것)</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(surveyData.currentSupplements)
                    .filter(([key, val]) => val === true && key !== 'prescriptionDrug' && key !== 'others')
                    .map(([key]) => (
                      <span key={key} className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 shadow-sm">
                        {key === 'folicAcid' ? '엽산' : key === 'iron' ? '철분' : key === 'vitaminD' ? '비타민D' : key === 'omega3' ? '오메가3' : key === 'calMag' ? '칼마디' : '유산균'}
                      </span>
                    ))}
                  {!Object.entries(surveyData.currentSupplements).some(([k,v]) => v === true && k !== 'prescriptionDrug' && k !== 'others') && <span className="text-[10px] text-slate-300 italic">복용 중인 영양제 없음</span>}
                </div>
              </div>

              {(surveyData.currentSupplements.prescriptionDrug || surveyData.notes) && (
                <div className="col-span-full bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                  {surveyData.currentSupplements.prescriptionDrug && (
                    <p className="text-[11px] leading-relaxed"><span className="font-black text-amber-700">복용 약:</span> {surveyData.currentSupplements.prescriptionDrug}</p>
                  )}
                  {surveyData.notes && (
                    <p className="text-[11px] leading-relaxed mt-1"><span className="font-black text-amber-700">비고:</span> {surveyData.notes}</p>
                  )}
                </div>
              )}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="text-lg font-black text-slate-800 mb-6">맞춤 영양제 조합 설계</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.filter(p => p.isActive).map(product => {
                // 특정 단계에서 제외해야 할 로직 (예: 후기엔 엽산 불필요 등은 약사님이 관리 가능하므로 기본 필터만 적용)
                const isSelected = selectedIds.includes(product.id) || selectedOmegaId === product.id;
                const isOmega = product.ingredients.some(i => i.name.includes('오메가3'));

                return (
                  <div key={product.id} onClick={() => {
                        if (isOmega) setSelectedOmegaId(selectedOmegaId === product.id ? '' : product.id);
                        else isSelected ? setSelectedIds(selectedIds.filter(id => id !== product.id)) : setSelectedIds([...selectedIds, product.id]);
                    }} className={`p-4 border-2 rounded-[2rem] cursor-pointer flex gap-4 transition-all ${isSelected ? 'border-teal-500 bg-teal-50/30 shadow-md scale-[1.02]' : 'border-slate-50 hover:border-slate-200'}`}>
                    <img src={product.images[0]} className="w-12 h-12 rounded-xl object-cover bg-slate-50 border" />
                    <div className="flex-1 overflow-hidden flex flex-col justify-center">
                      <h4 className="font-black text-xs truncate text-slate-800">{product.name}</h4>
                      <p className="text-[10px] font-bold text-teal-600">{product.price.toLocaleString()}원</p>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="sticky top-24 space-y-4">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
              <h3 className="text-xl font-black text-center mb-6">{surveyData.customerName}님 최종 설계</h3>
              <div className="bg-slate-50 p-6 rounded-3xl min-h-[200px] mb-6 space-y-3 border-2 border-dashed border-slate-200">
                  {selectedProducts.length === 0 ? <p className="text-center py-20 text-slate-300 font-bold italic">추천 제품을 선택하세요.</p> : (
                    selectedProducts.map(p => (
                      <div key={p.id} className="flex justify-between items-center text-xs font-bold bg-white p-3 rounded-2xl shadow-sm animate-in slide-in-from-right duration-300">
                        <span className="truncate w-32">{p.name}</span>
                        <span className="text-slate-400">{p.price.toLocaleString()}원</span>
                      </div>
                    ))
                  )}
              </div>
              <div className="flex justify-between items-end mb-8 px-2">
                  <span className="text-xs font-black text-slate-400">TOTAL PRICE</span>
                  <p className="text-2xl font-black text-teal-600">{totalPrice.toLocaleString()}원</p>
              </div>
              <button onClick={handleSave} className="w-full py-5 bg-teal-600 text-white font-black rounded-2xl active:scale-95 transition-all shadow-xl shadow-teal-600/20">설계 완료 및 기록 저장</button>
          </div>
          
          {/* [복구] 이전으로 돌아가는 버튼 */}
          <button onClick={onBack} className="w-full py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
             <span>←</span> 정보 수정 (설문 단계로 돌아가기)
          </button>
        </div>
      </div>

      {savedRecord && <RecordDetailModal record={savedRecord} config={config} onClose={onReturnHome} />}
    </div>
  );
};

export default RecommendationView;
