
import React, { useState } from 'react';
import { LEGAL_CONSENT_TEXT } from '../constants';

interface HomeViewProps {
  onStart: () => void;
}

const PersonalizedLogoLarge = () => (
  <div className="w-64 h-64 rounded-full border-[12px] border-teal-500 flex flex-col items-center justify-center bg-white shadow-2xl overflow-hidden relative transform hover:scale-105 transition-transform duration-500">
    <div className="text-4xl font-black text-orange-500 tracking-tighter mb-1">맞춤형</div>
    <div className="text-2xl font-black text-teal-600 tracking-tight mb-2">건강기능식품</div>
    <div className="w-48 h-2 bg-orange-400 rounded-full mb-6 opacity-80"></div>
    <div className="absolute bottom-0 w-full bg-teal-500 text-white text-xs font-black py-3 text-center tracking-widest uppercase">
      식품의약품안전처
    </div>
  </div>
);

const HomeView: React.FC<HomeViewProps> = ({ onStart }) => {
  const [showConsent, setShowConsent] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 text-center bg-[#FDF8F1] rounded-[3rem] shadow-inner border border-[#F0E5D8]">
      <div className="relative mb-16">
         <PersonalizedLogoLarge />
         <div className="absolute -bottom-6 -right-8 bg-[#5D5347] text-white px-8 py-4 rounded-3xl shadow-2xl transform rotate-3 flex flex-col items-center">
            <span className="text-xs font-bold text-teal-400 mb-1 uppercase tracking-widest">Premium Pharmacy</span>
            <span className="text-2xl font-black">아이맘약국</span>
         </div>
      </div>

      <h1 className="text-5xl font-black text-[#5D5347] mb-6 tracking-tighter leading-tight">
        임산부를 위한<br />
        <span className="text-teal-600">맞춤형 건강기능식품</span>
      </h1>
      
      <p className="text-lg text-[#8D7F70] mb-12 max-w-lg leading-relaxed font-medium">
        맞춤형 건강기능식품 소분 서비스.<br />
        약사 상담을 통해 임신 단계별로 꼭 필요한<br />
        최적의 영양 조합을 설계해 드립니다.
      </p>

      <button 
        onClick={() => setShowConsent(true)}
        className="px-20 py-6 bg-teal-600 hover:bg-teal-700 text-white text-2xl font-black rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(13,148,136,0.4)] transform active:scale-95 transition-all mb-12"
      >
        상담 및 설문 시작하기
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl px-8">
        {[
          { icon: '🧑‍⚕️', title: '전문 약사 상담', desc: '1:1 전담 약사 상담' },
          { icon: '📋', title: '법정 기록 관리', desc: '상담 기록 3년 안전 보관' },
          { icon: '✅', title: '식약처 가이드라인', desc: '안전한 소분 판매 준수' }
        ].map((item, i) => (
          <div key={i} className="p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-[#F0E5D8] flex flex-col items-center gap-2">
            <span className="text-4xl mb-2">{item.icon}</span>
            <p className="font-black text-[#5D5347]">{item.title}</p>
            <p className="text-xs text-[#8D7F70] font-bold">{item.desc}</p>
          </div>
        ))}
      </div>

      {showConsent && (
        <div className="fixed inset-0 bg-[#5D5347]/40 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="text-center mb-8">
               <span className="text-4xl mb-4 block">📄</span>
               <h3 className="text-2xl font-black text-[#5D5347]">이용 약관 및 개인정보 동의</h3>
            </div>
            
            <div className="bg-[#FDF8F1] p-6 rounded-3xl text-left text-sm text-[#8D7F70] whitespace-pre-wrap leading-relaxed border border-[#F0E5D8] mb-8 h-64 overflow-y-auto font-medium custom-scrollbar">
              {LEGAL_CONSENT_TEXT}
            </div>
            
            <div className="flex flex-col gap-6">
              <label className="flex items-center gap-4 cursor-pointer group p-4 bg-[#FDF8F1] rounded-2xl border-2 border-transparent hover:border-teal-500/20 transition-all">
                <input 
                  type="checkbox" 
                  className="w-7 h-7 accent-teal-600"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                />
                <span className="text-lg font-black text-[#5D5347]">모든 내용을 확인하였으며 동의합니다.</span>
              </label>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowConsent(false)}
                  className="flex-1 py-5 bg-[#F0E5D8] font-black rounded-2xl text-[#8D7F70] transition-colors hover:bg-[#EBDBC9]"
                >취소</button>
                <button 
                  disabled={!agreed}
                  onClick={() => {
                    setShowConsent(false);
                    onStart();
                  }}
                  className={`flex-1 py-5 font-black rounded-2xl text-white shadow-xl transition-all ${agreed ? 'bg-teal-600 shadow-teal-600/20 active:scale-95' : 'bg-slate-300'}`}
                >상담 시작</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;
