
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

  // 고도화된 추천 로직 (약사님 요청 반영)
  const logicResult = useMemo(() => {
    const { stage, vitaminDLevel, symptoms, isOver35, currentSupplements } = surveyData;
    const autoIds: string[] = [];
    let autoOmegaId: string = '';

    const targetVitDId = (vitaminDLevel === BloodTestResult.NORMAL) ? '5-1' : '5';
    const hasBleeding = symptoms.includes(Symptom.BLEEDING);

    // [로직] 출혈이 없는 경우 오메가3와 유산균 권장
    if (!hasBleeding) {
      if (!currentSupplements.omega3) {
        // 임신 준비기+35세 이상은 일반 오메가3(4), 나머지는 식물성(3)
        autoOmegaId = (stage === PregnancyStage.PREP && isOver35) ? '4' : '3';
      }
      if (!currentSupplements.probiotics) {
        autoIds.push('12'); // 유산균
      }
    }

    // 단계별 기본 영양소 추천
    if (stage === PregnancyStage.PREP) {
      if (!currentSupplements.folicAcid) autoIds.push('2');
      if (!currentSupplements.vitaminD) autoIds.push(targetVitDId);
      if (isOver35) autoIds.push('8', '9');
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
      if (!currentSupplements.iron) autoIds.push('6-1');
      if (!currentSupplements.vitaminD) autoIds.push(targetVitDId);
      // [로직] 임신 후기 및 수유기 칼마디 권장
      if (!currentSupplements.calMag) autoIds.push('7');
    }

    // 증상 기반 추가 추천
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700 pb-20">
      <div className="lg:col-span-7 space-y-8">
        <div className="bg-teal-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <p className="text-xl font-black leading-tight italic min-h-[3rem] relative z-10">"{isAiLoading ? '전문 약사의 영양 설계를 분석 중입니다...' : aiNote}"</p>
            <p className="mt-4 text-[10px] font-bold opacity-70 uppercase tracking-widest relative z-10">Pharmacist's Message</p>
        </div>

        {/* [전체 상담 내역 요약 섹션] - 모든 내역 및 35세 체크 여부 포함 */}
        <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6">
           <div className="flex justify-between items-center border-b-2 border-slate-200/50 pb-4">
             <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
               <span className="w-2 h-5 bg-teal-500 rounded-full"></span>
               상담 내역 전체 요약
             </h4>
             <button onClick={onBack} className="text-xs font-black text-teal-600 hover:underline">← 정보 수정하기</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 text-sm">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">소비자 정보</p>
                  <p className="font-black text-slate-800 text-lg flex items-center gap-2">
                    {surveyData.customerName} 
                    <span className="text-xs font-bold text-slate-400">({surveyData.ageGroup})</span>
                    {surveyData.isOver35 && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] rounded-md font-black">만 35세 이상</span>}
                  </p>
                  <p className="text-xs font-bold text-slate-500">{surveyData.phone}</p>
                  {surveyData.address && <p className="text-[10px] text-slate-400 bg-white p-2 rounded-lg mt-2 border border-slate-100">{surveyData.address}</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">임신/수유 단계</p>
                  <p className="font-black text-teal-600 text-base">{surveyData.stage}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">비타민D 수치</p>
                    <p className="font-black text-amber-600">{surveyData.vitaminDLevel}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hb(빈혈) 수치</p>
                    <p className="font-black text-red-500">{surveyData.hbLevel}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">불편 증상 ({surveyData.symptoms.length})</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {surveyData.symptoms.length > 0 ? surveyData.symptoms.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-black rounded-md">{s}</span>
                    )) : <span className="text-slate-300 font-bold italic">특이사항 없음</span>}
                  </div>
                </div>
              </div>

              <div className="col-span-full space-y-2 pt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">기존 복용 중인 항목 (한 달분 이상 잔여 시)</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(surveyData.currentSupplements)
                    .filter(([key, val]) => val === true && key !== 'prescriptionDrug' && key !== 'others')
                    .map(([key]) => (
                      <span key={key} className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-600 shadow-sm">
                        {key === 'folicAcid' ? '엽산' : key === 'iron' ? '철분' : key === 'vitaminD' ? '비타민D' : key === 'omega3' ? '오메가3' : key === 'calMag' ? '칼마디' : '유산균'}
                      </span>
                    ))}
                  {!Object.entries(surveyData.currentSupplements).some(([k,v]) => v === true && k !== 'prescriptionDrug' && k !== 'others') && <span className="text-[10px] text-slate-300 italic">현재 복용 중인 영양제 없음</span>}
                </div>
                {(surveyData.currentSupplements.prescriptionDrug || surveyData.notes) && (
                  <div className="mt-3 bg-white p-4 rounded-2xl border border-slate-100 space-y-2 shadow-sm">
                    {surveyData.currentSupplements.prescriptionDrug && (
                      <p className="text-[11px] font-bold text-slate-600">💊 처방약: <span className="text-slate-800 font-black">{surveyData.currentSupplements.prescriptionDrug}</span></p>
                    )}
                    {surveyData.notes && (
                      <p className="text-[11px] font-bold text-slate-600">📝 비고: <span className="text-slate-800 font-black italic">"{surveyData.notes}"</span></p>
                    )}
                  </div>
                )}
              </div>
           </div>
        </div>

        {/* 제품 선택 영역 */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center justify-between">
              맞춤 영양제 설계 리스트
              <span className="text-[10px] font-black text-slate-300">클릭하여 개별 조정 가능</span>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.filter(p => p.isActive).map(product => {
                const isSelected = selectedIds.includes(product.id) || selectedOmegaId === product.id;
                const isOmega = product.ingredients.some(i => i.name.includes('오메가3'));

                return (
                  <div key={product.id} onClick={() => {
                        if (isOmega) setSelectedOmegaId(selectedOmegaId === product.id ? '' : product.id);
                        else isSelected ? setSelectedIds(selectedIds.filter(id => id !== product.id)) : setSelectedIds([...selectedIds, product.id]);
                    }} className={`p-4 border-2 rounded-[2rem] cursor-pointer flex gap-4 transition-all ${isSelected ? 'border-teal-500 bg-teal-50/30 shadow-md scale-[1.02]' : 'border-slate-50 bg-white hover:border-slate-200'}`}>
                    <img src={product.images[0]} className="w-12 h-12 rounded-xl object-cover bg-slate-50 border shadow-inner" />
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
          <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl">
              <div className="mb-6 text-center">
                <span className="text-[10px] font-black text-teal-500 border-2 border-teal-500 px-3 py-1 rounded-full uppercase tracking-widest">Final Selection</span>
                <h3 className="text-2xl font-black text-slate-800 mt-4">{surveyData.customerName}님 최종 설계</h3>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-[2.5rem] min-h-[250px] mb-8 space-y-3 border-2 border-dashed border-slate-200">
                  {selectedProducts.length === 0 ? <p className="text-center py-24 text-slate-300 font-bold italic">추천 제품을 선택해 주세요.</p> : (
                    selectedProducts.map(p => (
                      <div key={p.id} className="flex justify-between items-center text-xs font-bold bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-right duration-300">
                        <span className="truncate w-40 text-slate-700">{p.name}</span>
                        <span className="text-teal-600 font-black">{p.price.toLocaleString()}원</span>
                      </div>
                    ))
                  )}
              </div>
              
              <div className="flex justify-between items-end mb-10 px-4">
                  <span className="text-xs font-black text-slate-400">총 구매 합계</span>
                  <p className="text-3xl font-black text-teal-600 leading-none">{totalPrice.toLocaleString()}원</p>
              </div>
              
              <button onClick={handleSave} className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl active:scale-95 transition-all shadow-2xl hover:bg-black">설계 완료 및 기록 저장</button>
          </div>
          
          <button onClick={onBack} className="w-full py-5 bg-white text-slate-400 border-2 border-slate-100 font-black rounded-3xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
             <span>←</span> 이전으로 (설문 내용 수정)
          </button>
        </div>
      </div>

      {savedRecord && <RecordDetailModal record={savedRecord} config={config} onClose={onReturnHome} />}
    </div>
  );
};

export default RecommendationView;
