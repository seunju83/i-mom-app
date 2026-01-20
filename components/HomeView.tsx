
import React, { useState } from 'react';
import { LEGAL_CONSENT_TEXT } from '../constants';

interface HomeViewProps {
  onStart: () => void;
}

const PersonalizedLogoLarge = () => (
  <div className="w-56 h-56 rounded-full border-[10px] border-teal-500 flex flex-col items-center justify-center bg-white shadow-2xl relative animate-in zoom-in duration-700">
    <div className="text-3xl font-black text-orange-500 tracking-tighter mb-1">맞춤형</div>
    <div className="text-xl font-black text-teal-600 tracking-tight mb-2">건강기능식품</div>
    <div className="w-40 h-1.5 bg-orange-400 rounded-full mb-4 opacity-80"></div>
    <div className="absolute bottom-0 w-full bg-teal-500 text-white text-[10px] font-black py-2.5 text-center tracking-widest uppercase">식품의약품안전처</div>
  </div>
);

const HomeView: React.FC<HomeViewProps> = ({ onStart }) => {
  const [showConsent, setShowConsent] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-8 text-center bg-[#FDF8F1] rounded-[4rem] shadow-inner border border-[#F0E5D8] animate-in fade-in duration-1000">
      <div className="relative mb-12">
         <PersonalizedLogoLarge />
         <div className="absolute -bottom-4 -right-6 bg-slate-800 text-white px-8 py-3 rounded-2xl shadow-2xl transform rotate-2">
            <span className="text-xl font-black">아이맘약국</span>
         </div>
      </div>

      <h1 className="text-4xl font-black text-slate-800 mb-6 tracking-tighter leading-tight">
        임산부 및 수유기를 위한<br />
        <span className="text-teal-600">개인 맞춤 영양 설계 서비스</span>
      </h1>
      
      <p className="text-base text-slate-500 mb-10 max-w-sm leading-relaxed font-medium">
        전문 약사의 1:1 상담을 통해<br />
        임신 단계별 최적의 영양을 소분해 드립니다.<br />
        <span className="text-teal-600 font-bold">(법정 기록 보관 3년 원칙 준수)</span>
      </p>

      <button onClick={() => setShowConsent(true)} className="px-16 py-5 bg-teal-600 hover:bg-teal-700 text-white text-xl font-black rounded-[2rem] shadow-xl transform active:scale-95 transition-all mb-12">상담 시작하기</button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl px-6">
        {[
          { icon: '🧑‍⚕️', title: '전문 약사 설계', desc: '1:1 정밀 영양 가이드' },
          { icon: '📋', title: '3년 기록 보관', desc: '법정 상담 기록 관리' },
          { icon: '💊', title: '안전 소분 판매', desc: '식약처 가이드 준수' }
        ].map((item, i) => (
          <div key={i} className="p-5 bg-white/60 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-1 shadow-sm">
            <span className="text-2xl mb-1">{item.icon}</span>
            <p className="font-black text-slate-700 text-xs">{item.title}</p>
            <p className="text-[10px] text-slate-400 font-bold">{item.desc}</p>
          </div>
        ))}
      </div>

      {showConsent && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-6">개인정보 수집 및 상담 동의</h3>
            <div className="bg-slate-50 p-6 rounded-2xl text-left text-xs text-slate-500 whitespace-pre-wrap leading-relaxed h-64 overflow-y-auto mb-6 border font-medium">{LEGAL_CONSENT_TEXT}</div>
            <div className="flex flex-col gap-6">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl">
                <input type="checkbox" className="w-6 h-6 accent-teal-600" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                <span className="text-sm font-black text-slate-700">위 내용을 확인했으며 상담에 동의합니다.</span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => setShowConsent(false)} className="flex-1 py-4 bg-slate-100 font-black rounded-2xl text-slate-400">취소</button>
                <button disabled={!agreed} onClick={() => { setShowConsent(false); onStart(); }} className={`flex-1 py-4 font-black rounded-2xl text-white ${agreed ? 'bg-teal-600 shadow-lg' : 'bg-slate-300'}`}>상담 시작</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;
