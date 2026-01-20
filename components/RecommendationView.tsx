
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

  // 1. 핵심 추천 로직 엔진 (약사님의 가이드라인 반영)
  const logicResult = useMemo(() => {
    const { stage, vitaminDLevel, hbLevel, symptoms, isOver35, currentSupplements } = surveyData;
    const items: string[] = [];
    const warnings: string[] = [];
    const autoIds: string[] = [];
    let autoOmegaId: string = '';

    // A. 비타민D 목표 설정 (정상일 때 1000IU, 그 외 2000IU 우선 제안)
    const targetVitD = (vitaminDLevel === BloodTestResult.NORMAL) ? 1000 : 2000;

    // B. 임신 단계별 핵심 영양 설계
    if (stage === PregnancyStage.PREP) {
      // [임신 준비기]
      if (!currentSupplements.folicAcid) autoIds.push('2'); // 활성형 620
      items.push('활성형 엽산 620㎍');

      if (!currentSupplements.vitaminD) {
        autoIds.push(targetVitD === 1000 ? '5-1' : '5');
      }
      items.push(`비타민D ${targetVitD}IU`);

      // 35세 이상 또는 난임 우려
      if (isOver35) {
        autoIds.push('8', '9'); // 코큐텐, 비타민C
        autoOmegaId = '4'; // rTG 오메가3 1000mg
        items.push('코엔자임Q10', '비타민C', '오메가3 1000mg');
        warnings.push('💡 만 35세 이상 준비기에는 이노시톨(별도 구매) 병행을 권장합니다.');
      }
    } 
    else if (stage === PregnancyStage.EARLY) {
      // [임신 초기]
      if (!currentSupplements.folicAcid) {
        autoIds.push('1'); // 엽산800 + D1000 복합제
        if (targetVitD === 2000) autoIds.push('5-1'); // 부족할 경우 D1000 추가
      } else if (!currentSupplements.vitaminD) {
        autoIds.push(targetVitD === 1000 ? '5-1' : '5');
      }
      items.push('활성형 엽산 800㎍', `비타민D ${targetVitD}IU`);

      if (!currentSupplements.omega3) autoOmegaId = '3'; // 식물성 600
    }
    else {
      // [임신 중기 / 후기 / 수유기] -> 엽산은 여기서부터 완전 제외
      const isAnemiaOrTwins = symptoms.includes(Symptom.TWINS) || hbLevel === HbLevel.LEVEL_1 || hbLevel === HbLevel.LEVEL_2;
      
      // 철분 설계
      if (isAnemiaOrTwins) {
        warnings.push('⚠️ 빈혈 수치가 낮거나 쌍둥이 임신의 경우, 고함량 철분제(액상 등) 별도 구매가 필요할 수 있습니다.');
      } else if (!currentSupplements.iron) {
        autoIds.push('6-1'); // 철분 24mg
        items.push('철분 24mg');
      }

      // 비타민D 설계 (엽산 없는 단일제로)
      if (!currentSupplements.vitaminD) {
        autoIds.push(targetVitD === 1000 ? '5-1' : '5');
      }
      items.push(`비타민D ${targetVitD}IU`);

      // 오메가3
      if (!currentSupplements.omega3) autoOmegaId = '3';

      // 후기/수유기 칼슘 추가
      if ((stage === PregnancyStage.LATE || stage === PregnancyStage.LACT) && !currentSupplements.calMag) {
        autoIds.push('7');
        items.push('칼슘·마그네슘·D 복합제');
      }

      if (stage === PregnancyStage.LACT) {
        warnings.push('✅ 출산 후에도 임신 후기 영양 조합을 최소 1~2개월 유지하시는 것이 회복에 좋습니다.');
      }
    }

    // C. 공통 증상별 케어
    if (symptoms.includes(Symptom.CONSTIPATION)) {
      autoIds.push('10');
      items.push('차전자피(변비 개선)');
    }
    if (symptoms.includes(Symptom.CRAMPS)) {
      autoIds.push('11');
      items.push('고순도 마그네슘(다리 쥐 예방)');
    }
    if (symptoms.includes(Symptom.BLEEDING)) {
      warnings.push('‼️ 현재 출혈 증상이 있으므로 오메가3 섭취 여부는 약사님과 반드시 상의하세요.');
    }

    return { items, warnings, autoIds, autoOmegaId };
  }, [surveyData, products]);

  // AI 코멘트 생성 (Gemini 3 모델 사용)
  useEffect(() => {
    setSelectedIds(logicResult.autoIds);
    setSelectedOmegaId(logicResult.autoOmegaId);
    
    const fetchAiNote = async () => {
      setIsAiLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `약사로서 ${surveyData.customerName}님께 드리는 짧은 응원. 단계:${surveyData.stage}, 주요증상:${surveyData.symptoms.join(',')}. 한국어로 다정하게 2문장 내외.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setAiNote(response.text || '');
      } catch (e) {
        setAiNote(`${surveyData.customerName}님, 아이맘약국이 엄마와 아기의 건강한 내일을 진심으로 응원합니다!`);
      } finally { setIsAiLoading(false); }
    };
    fetchAiNote();
  }, [logicResult, surveyData.customerName]);

  const selectedProducts = products.filter(p => selectedIds.includes(p.id) || p.id === selectedOmegaId);
  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  const handleSave = () => {
    if (selectedProducts.length === 0) {
      alert('최소 하나 이상의 제품이 선택되어야 합니다.');
      return;
    }
    const record = onSave(selectedProducts.map(p => p.id), logicResult.items, totalPrice);
    setSavedRecord(record);
  };

  if (savedRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-5xl mb-8 shadow-inner animate-bounce">✓</div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">상담 설계 완료</h2>
        <p className="text-slate-500 mb-12 text-center leading-relaxed">
          {savedRecord.customerName}님의 맞춤 영양 설계가 저장되었습니다.<br/>
          결과지를 출력하여 고객님께 전달해 주세요.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={() => setShowPrintModal(true)} className="w-full py-6 bg-teal-600 text-white font-black rounded-[2rem] shadow-xl text-lg flex items-center justify-center gap-3 transition-all active:scale-95">
             🖨️ 결과지 인쇄하기
          </button>
          <button onClick={onReturnHome} className="w-full py-5 bg-slate-100 text-slate-500 font-black rounded-2xl">처음으로</button>
        </div>
        {showPrintModal && <RecordDetailModal record={savedRecord} config={config} onClose={() => setShowPrintModal(false)} />}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-32 animate-in fade-in duration-700">
      <div className="lg:col-span-7 space-y-8">
        {/* AI 약사 한마디 */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <PersonalizedLogo className="scale-150" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Personalized Note</span>
                </div>
                <p className="text-2xl font-black leading-tight italic min-h-[3.5rem]">
                   "{isAiLoading ? '영양 설계를 분석하고 있습니다...' : aiNote}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">👩‍⚕️</div>
                    <span className="text-sm font-bold opacity-80">아이맘약국 송은주 약사</span>
                </div>
            </div>
        </div>

        {/* 핵심 설계 지표 */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">📊</span> {surveyData.stage} 집중 케어
           </h3>
           <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: '엽산', key: 'folicAcid' }, { label: '비타민D', key: 'vitaminD' },
                { label: '철분', key: 'iron' }, { label: '오메가3', key: 'omega3' },
                { label: '칼/마/디', key: 'calMag' }, { label: '기타증상', key: 'others' }
              ].map(m => {
                const isTaken = m.key !== 'others' && (surveyData.currentSupplements as any)[m.key];
                const isRecommended = logicResult.items.some(item => item.includes(m.label));
                return (
                  <div key={m.key} className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${isTaken ? 'bg-slate-50 border-slate-100 opacity-40' : isRecommended ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-50'}`}>
                    <span className="text-[10px] font-black text-slate-500 mb-1">{m.label}</span>
                    <span className={`text-[10px] font-black py-1 px-2 rounded-lg ${isTaken ? 'bg-slate-200 text-slate-400' : isRecommended ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                        {isTaken ? '복용중' : isRecommended ? '추천' : '-'}
                    </span>
                  </div>
                );
              })}
           </div>
        </div>

        {/* 제품 리스트 (중기 이후 엽산 필터링 적용) */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-xl font-black text-slate-800">추천 영양제 조합</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Expert Curated</span>
           </div>
           
           {logicResult.warnings.length > 0 && (
             <div className="mb-6 space-y-2">
                {logicResult.warnings.map((w, i) => (
                  <div key={i} className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl text-xs font-bold text-amber-800 animate-in slide-in-from-left duration-300">
                    {w}
                  </div>
                ))}
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.filter(p => p.isActive).map(product => {
                // [필터 로직] 중기 이후에는 엽산 제품(ID 1, 2)을 목록에서 완전히 숨김
                const isMidOrLater = [PregnancyStage.MID, PregnancyStage.LATE, PregnancyStage.LACT].includes(surveyData.stage);
                const isFolicProduct = product.ingredients.some(ing => ing.name === '엽산');
                if (isMidOrLater && isFolicProduct) return null;

                const isSelected = selectedIds.includes(product.id) || selectedOmegaId === product.id;
                const isOmega = product.ingredients.some(i => i.name === '오메가3');
                
                return (
                  <div 
                    key={product.id}
                    onClick={() => {
                        if (isOmega) {
                          setSelectedOmegaId(selectedOmegaId === product.id ? '' : product.id);
                        } else {
                          isSelected ? setSelectedIds(selectedIds.filter(id => id !== product.id)) : setSelectedIds([...selectedIds, product.id]);
                        }
                    }}
                    className={`p-4 border-2 rounded-[2rem] cursor-pointer flex gap-4 transition-all ${isSelected ? 'border-teal-500 bg-teal-50/30 shadow-lg' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                  >
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-50">
                        <img src={product.images[0]} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col justify-center">
                      <h4 className="font-black text-[12px] text-slate-800 truncate">{product.name}</h4>
                      <p className="text-[10px] font-bold text-teal-600">{product.price.toLocaleString()}원</p>
                    </div>
                    <div className="flex items-center pr-2">
                       <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200'}`}>
                          <span className="text-sm font-black">{isSelected ? '✓' : '+'}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      {/* 우측 설계 요약 패널 */}
      <div className="lg:col-span-5">
        <div className="sticky top-24 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl">
            <div className="w-full text-center border-b-2 border-slate-50 pb-6 mb-8">
               <h3 className="text-2xl font-black text-slate-800">{surveyData.customerName}님 영양 설계</h3>
            </div>
            <div className="space-y-6">
                <div className="bg-slate-50/80 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 min-h-[300px]">
                    {selectedProducts.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-slate-300">
                           <p className="font-black italic text-sm">추천 제품을 선택해 주세요.</p>
                        </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedProducts.map(p => (
                          <div key={p.id} className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                              <div className="flex items-center gap-3">
                                  <PillIcon type={p.pillType} />
                                  <p className="font-black text-[11px] text-slate-800 truncate w-32">{p.name}</p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 shrink-0">{p.price.toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                <div className="flex justify-between items-end px-4 pt-4">
                    <span className="text-slate-400 font-black text-sm uppercase tracking-widest">Total Price</span>
                    <p className="text-3xl font-black text-teal-600">{totalPrice.toLocaleString()}<span className="text-lg ml-1">원</span></p>
                </div>
                <button onClick={handleSave} className="w-full py-7 bg-slate-900 text-white font-black rounded-[2.5rem] text-xl transition-all hover:bg-slate-800 active:scale-95 shadow-xl">상담 완료 및 기록 저장</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationView;
