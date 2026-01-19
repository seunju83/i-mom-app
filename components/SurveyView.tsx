
import React, { useState, useRef } from 'react';
import { PregnancyStage, AgeGroup, BloodTestResult, HbLevel, Symptom, SurveyData, Product } from '../types';
import { GoogleGenAI } from '@google/genai';

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
    ageGroup: AgeGroup.THIRTIES,
    isOver35: false,
    address: '',
    stage: PregnancyStage.PREP,
    currentSupplements: [],
    vitaminDLevel: BloodTestResult.UNKNOWN,
    hbLevel: HbLevel.UNKNOWN,
    symptoms: [],
    notes: ''
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('카메라를 시작할 수 없습니다.');
      setIsCapturing(false);
    }
  };

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsAnalyzing(true);
    
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    
    const base64Image = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
    
    const stream = videoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
    setIsCapturing(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            { text: 'Extract ONLY the product names of the nutritional supplements or medicines shown in this image. Return them as a comma separated list. If no product is found, return "None".' }
          ]
        }
      });
      
      const recognized = response.text || '';
      if (recognized.toLowerCase() !== 'none') {
        const newProducts = recognized.split(',').map(s => s.trim());
        setFormData(prev => ({
          ...prev,
          currentSupplements: [...(prev.currentSupplements || []), ...newProducts]
        }));
      }
    } catch (err) {
      console.error(err);
      alert('제품 인식 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.customerName || !formData.phone || !formData.email) {
        alert('성함, 전화번호, 이메일은 필수 입력 사항입니다.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('유효한 이메일 형식이 아닙니다.');
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

  const handleComplete = () => {
    onComplete(formData as SurveyData);
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-8 bg-slate-100 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-teal-500 h-full transition-all duration-300" 
          style={{ width: `${(step / 4) * 100}%` }}
        ></div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <h3 className="text-2xl font-bold text-slate-800">1. 고객 기본 정보 (Email 필수)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">성함 *</label>
              <input 
                type="text" 
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="예: 홍길동"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">전화번호 *</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="010-0000-0000"
              />
            </div>
            <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">이메일 주소 (상세 정보 발송용) *</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="example@email.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">연령대</label>
              <select 
                value={formData.ageGroup}
                onChange={e => setFormData({ ...formData, ageGroup: e.target.value as AgeGroup })}
                className="p-3 border rounded-lg outline-none"
              >
                {Object.values(AgeGroup).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4 p-3 bg-teal-50 border border-teal-100 rounded-lg h-[68px] mt-auto">
              <input 
                type="checkbox" 
                id="isOver35"
                checked={formData.isOver35}
                onChange={e => setFormData({ ...formData, isOver35: e.target.checked })}
                className="w-5 h-5 accent-teal-600"
              />
              <label htmlFor="isOver35" className="font-semibold text-teal-800 cursor-pointer">만 35세 이상 여부</label>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">주소 (선택)</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="배송 등이 필요한 경우 입력"
            />
          </div>
          <div className="pt-4">
            <button 
              onClick={nextStep}
              className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl shadow-md active:bg-teal-700 transition"
            >
              다음으로
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800">2. 임신 단계 선택</h3>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2">
              {Object.values(PregnancyStage).map(v => (
                <button
                  key={v}
                  onClick={() => setFormData({ ...formData, stage: v })}
                  className={`p-4 text-left border rounded-xl transition ${formData.stage === v ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'bg-white hover:bg-slate-50'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 flex gap-4">
            <button onClick={prevStep} className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-xl">이전</button>
            <button onClick={nextStep} className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-xl shadow-md">다음으로</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800">3. 혈액검사 및 증상 확인</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">비타민D 혈액검사 결과</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.values(BloodTestResult).map(v => (
                  <button
                    key={v}
                    onClick={() => setFormData({ ...formData, vitaminDLevel: v })}
                    className={`p-3 border rounded-lg text-sm ${formData.vitaminDLevel === v ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">헤모글로빈(Hb) 수치</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.values(HbLevel).map(v => (
                  <button
                    key={v}
                    onClick={() => setFormData({ ...formData, hbLevel: v })}
                    className={`p-3 border rounded-lg text-sm ${formData.hbLevel === v ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">불편한 증상 (다중 선택)</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(Symptom).map(v => (
                  <button
                    key={v}
                    onClick={() => toggleSymptom(v)}
                    className={`p-3 border rounded-lg text-sm text-left ${formData.symptoms?.includes(v) ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button onClick={prevStep} className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-xl">이전</button>
            <button onClick={nextStep} className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-xl shadow-md">다음으로</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-bold text-slate-800">4. 최종 상담 반영 사항</h3>
            <button 
                onClick={startCamera}
                className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-200 transition"
            >
                📸 기존 약 촬영
            </button>
          </div>

          {isCapturing && (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-4 flex gap-4">
                    <button onClick={captureAndRecognize} className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 shadow-xl" />
                    <button onClick={() => setIsCapturing(false)} className="px-6 py-2 bg-red-600 text-white font-bold rounded-full">닫기</button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {isAnalyzing && (
            <div className="p-8 text-center bg-teal-50 rounded-2xl border border-teal-200 animate-pulse">
                <p className="font-bold text-teal-800">AI 분석 중...</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">현재 복용 영양제 (AI 인식 또는 직접 입력)</label>
            <textarea 
              value={formData.currentSupplements?.join('\n')}
              onChange={e => setFormData({ ...formData, currentSupplements: e.target.value.split('\n').filter(s => s) })}
              className="p-4 border rounded-xl min-h-[120px] focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="직접 입력 시 줄바꿈으로 구분"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">기타 메모 / 약사 전달 내용</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="p-4 border rounded-xl min-h-[80px] focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="특별한 요구사항이나 알러지 정보 등을 기재해주세요."
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button onClick={prevStep} className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-xl">이전</button>
            <button 
              onClick={handleComplete}
              className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-xl shadow-md"
            >
              추천 결과 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyView;
