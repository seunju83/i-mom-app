
import React, { useState } from 'react';
import { PregnancyStage, AgeGroup, BloodTestResult, HbLevel, Symptom, SurveyData, Product } from '../types';

interface SurveyViewProps {
  onComplete: (data: SurveyData) => void;
  products: Product[];
}

const SurveyView: React.FC<SurveyViewProps> = ({ onComplete, products }) => {
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<Partial<SurveyData>>({
    customerName: '',
    phone: '',
    email: '',
    emailConsent: true,
    ageGroup: AgeGroup.THIRTIES,
    isOver35: false,
    zipCode: '',
    address: '',
    detailAddress: '',
    stage: PregnancyStage.PREP,
    currentSupplements: {
      folicAcid: false, iron: false, vitaminD: false, omega3: false, 
      calMag: false, probiotics: false, prescriptionDrug: '', others: ''
    },
    vitaminDLevel: BloodTestResult.UNKNOWN,
    hbLevel: HbLevel.UNKNOWN,
    symptoms: [],
    notes: ''
  });

  const nextStep = () => {
    if (step === 1) {
      if (!formData.customerName || !formData.phone) {
        alert('성함과 전화번호는 필수 입력 사항입니다.');
        return;
      }
    }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const toggleSymptom = (s: Symptom) => {
    const current = formData.symptoms || [];
    if (current.includes(s)) {
      setFormData({ ...formData, symptoms: current.filter(item => item !== s) });
    } else {
      setFormData({ ...formData, symptoms: [...current, s] });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Step Progress Bar */}
      <div className="mb-12 flex items-center justify-between px-2 relative">
        <div className="absolute left-0 right-0 h-1 bg-slate-100 top-5 mx-10 -z-10"></div>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2 z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step >= s ? 'bg-teal-600 text-white shadow-lg scale-110' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
              {s}
            </div>
            <span className={`text-[10px] font-bold ${step >= s ? 'text-teal-600' : 'text-slate-400'}`}>
              {s === 1 ? '기본정보' : s === 2 ? '임신단계' : s === 3 ? '건강상태' : '복용약'}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">고객 기본 정보</h3>
            <p className="text-slate-400 font-medium">상담 기록 관리를 위해 정보를 입력해주세요.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">성함 *</label>
              <input 
                type="text" 
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                className="p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold"
                placeholder="홍길동"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">전화번호 *</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold"
                placeholder="010-0000-0000"
              />
            </div>
            
            <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">주소지 (자유 입력)</label>
              <textarea 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold min-h-[100px]"
                placeholder="배송 또는 기록을 위한 주소를 자유롭게 입력해주세요."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">연령대</label>
              <select 
                value={formData.ageGroup}
                onChange={e => setFormData({ ...formData, ageGroup: e.target.value as AgeGroup })}
                className="p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold"
              >
                {Object.values(AgeGroup).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4 p-4 bg-teal-50/50 rounded-2xl h-[72px] mt-auto">
              <input 
                type="checkbox" 
                id="isOver35"
                checked={formData.isOver35}
                onChange={e => setFormData({ ...formData, isOver35: e.target.checked })}
                className="w-6 h-6 accent-teal-600 cursor-pointer"
              />
              <label htmlFor="isOver35" className="font-black text-teal-800 cursor-pointer text-sm">만 35세 이상 여부</label>
            </div>
          </div>
          
          <button onClick={nextStep} className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl text-xl transition-all active:scale-95">다음 단계로</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">임신 단계 선택</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {Object.values(PregnancyStage).map(v => (
              <button
                key={v}
                onClick={() => setFormData({ ...formData, stage: v })}
                className={`p-6 text-left border-4 rounded-3xl transition-all flex items-center justify-between group ${formData.stage === v ? 'border-teal-500 bg-teal-50/30' : 'border-slate-50 bg-white hover:border-slate-200'}`}
              >
                <span className={`text-xl font-black ${formData.stage === v ? 'text-teal-700' : 'text-slate-600'}`}>{v}</span>
                <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${formData.stage === v ? 'bg-teal-600 border-teal-600 shadow-lg scale-110' : 'border-slate-100'}`}>
                    {formData.stage === v && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </button>
            ))}
          </div>
          <div className="pt-6 flex items-center gap-4">
            <button onClick={prevStep} className="px-5 py-3 bg-slate-100 text-slate-400 font-black rounded-xl text-xs transition-all hover:bg-slate-200">이전</button>
            <button onClick={nextStep} className="flex-1 py-6 bg-slate-900 text-white font-black rounded-[2rem] text-xl shadow-xl">다음 단계로</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">혈액검사 및 증상 확인</h3>
            <p className="text-slate-400 font-medium">비타민D와 빈혈(Hb) 수치를 체크하여 정밀 설계를 진행합니다.</p>
          </div>
          
          <div className="space-y-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-md">
            {/* 비타민D 파트 강조 */}
            <div className="p-6 bg-amber-50/30 border-2 border-amber-100 rounded-[2.5rem] space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/20">D</div>
                <label className="text-2xl font-black text-slate-800 tracking-tight">비타민D 혈액검사 결과</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(BloodTestResult).map(v => (
                  <button
                    key={v}
                    onClick={() => setFormData({ ...formData, vitaminDLevel: v })}
                    className={`p-5 border-2 rounded-[1.5rem] text-lg font-black text-left transition-all ${formData.vitaminDLevel === v ? 'bg-amber-500 border-amber-500 text-white shadow-lg scale-[1.03]' : 'bg-white border-slate-100 text-slate-500 hover:bg-amber-50 hover:border-amber-200'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* 빈혈(Hb) 파트 강조 */}
            <div className="p-6 bg-red-50/30 border-2 border-red-100 rounded-[2.5rem] space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-red-500/20">Fe</div>
                <label className="text-2xl font-black text-slate-800 tracking-tight">헤모글로빈(Hb) 빈혈 검사</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(HbLevel).map(v => (
                  <button
                    key={v}
                    onClick={() => setFormData({ ...formData, hbLevel: v })}
                    className={`p-5 border-2 rounded-[1.5rem] text-lg font-black transition-all ${formData.hbLevel === v ? 'bg-red-500 border-red-500 text-white shadow-lg scale-[1.03]' : 'bg-white border-slate-100 text-slate-500 hover:bg-red-50 hover:border-red-200'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* 증상 파트 */}
            <div className="space-y-4 pt-4">
              <label className="text-lg font-black text-slate-500 uppercase tracking-widest block ml-2">불편한 증상 및 특이사항</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(Symptom).map(v => (
                  <button
                    key={v}
                    onClick={() => toggleSymptom(v)}
                    className={`p-4 border-2 rounded-2xl text-sm font-black text-left transition-all ${formData.symptoms?.includes(v) ? 'bg-teal-600 border-teal-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-500'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 flex items-center gap-4">
            <button onClick={prevStep} className="px-5 py-3 bg-slate-100 text-slate-400 font-black rounded-xl text-xs transition-all hover:bg-slate-200">이전</button>
            <button onClick={nextStep} className="flex-1 py-6 bg-slate-900 text-white font-black rounded-[2rem] text-xl shadow-xl">다음 단계로</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">현재 복용 영양제 및 약</h3>
            <p className="text-amber-600 font-bold bg-amber-50 py-2 px-4 rounded-full inline-block mt-2 tracking-tight">☝️ 한 달 이상 남은 영양제만 체크해 주세요.</p>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="grid grid-cols-2 gap-4">
               {[
                 { id: 'folicAcid', label: '엽산제' },
                 { id: 'iron', label: '철분제' },
                 { id: 'vitaminD', label: '비타민D' },
                 { id: 'omega3', label: '오메가3' },
                 { id: 'calMag', label: '칼/마 복합제' },
                 { id: 'probiotics', label: '유산균' }
               ].map(item => (
                  <label key={item.id} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${ (formData.currentSupplements as any)[item.id] ? 'border-teal-500 bg-teal-50/50' : 'border-slate-50 bg-slate-50'}`}>
                      <input 
                          type="checkbox"
                          checked={(formData.currentSupplements as any)[item.id]}
                          onChange={e => setFormData({
                              ...formData,
                              currentSupplements: {
                                  ...formData.currentSupplements!,
                                  [item.id]: e.target.checked
                              }
                          })}
                          className="w-6 h-6 accent-teal-600"
                      />
                      <span className="font-black text-slate-700">{item.label}</span>
                  </label>
               ))}
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">처방약 (예: 갑상선 호르몬제 등)</label>
                    <input 
                        type="text"
                        value={formData.currentSupplements?.prescriptionDrug}
                        onChange={e => setFormData({ ...formData, currentSupplements: { ...formData.currentSupplements!, prescriptionDrug: e.target.value } })}
                        className="p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold"
                        placeholder="복용 중인 처방약이 있다면 직접 입력해주세요."
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">기타 영양제 직접 입력</label>
                    <textarea 
                        value={formData.currentSupplements?.others}
                        onChange={e => setFormData({ ...formData, currentSupplements: { ...formData.currentSupplements!, others: e.target.value } })}
                        className="p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold min-h-[100px]"
                        placeholder="위 목록에 없는 영양제나 특이사항을 적어주세요."
                    />
                </div>
            </div>
          </div>

          <div className="pt-6 flex items-center gap-4">
            <button onClick={prevStep} className="px-5 py-3 bg-slate-100 text-slate-400 font-black rounded-xl text-xs transition-all hover:bg-slate-200">이전</button>
            <button onClick={() => onComplete(formData as SurveyData)} className="flex-1 py-6 bg-teal-600 text-white font-black rounded-[2rem] text-xl shadow-xl shadow-teal-600/20 active:scale-95 transition-all">설문 완료 및 추천 보기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyView;
