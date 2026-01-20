
import React, { useState } from 'react';
import { LEGAL_CONSENT_TEXT } from '../constants';

interface HomeViewProps {
  onStart: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onStart }) => {
  const [showConsent, setShowConsent] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-6 animate-in fade-in duration-1000">
      <div className="w-64 h-64 rounded-full bg-white/10 flex flex-col items-center justify-center border-8 border-yellow-400 shadow-2xl mb-12">
        <h2 className="text-4xl font-black text-white tracking-tighter">아이맘</h2>
        <p className="text-yellow-400 font-bold text-sm tracking-widest uppercase mt-1">Pharmacy</p>
      </div>

      <h1 className="text-5xl font-black text-white mb-6 tracking-tighter leading-tight">
        임산부 맞춤형 영양제<br />
        <span className="text-yellow-400 underline decoration-8 underline-offset-8">실시간 클라우드 상담</span>
      </h1>
      
      <p className="text-teal-200 text-lg mb-12 font-bold max-w-sm leading-relaxed">
        v5.0 업데이트가 완료되었습니다.<br />
        이제 모든 태블릿에서 상담 기록을<br />
        실시간으로 공유할 수 있습니다.
      </p>

      <button onClick={() => setShowConsent(true)} className="px-20 py-6 bg-yellow-400 text-black text-2xl font-black rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all mb-12">
        상담 시작하기
      </button>

      {showConsent && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl p-12 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-6">서비스 이용 동의</h3>
            <div className="bg-slate-50 p-6 rounded-3xl text-left text-xs text-slate-500 h-64 overflow-y-auto mb-8 border leading-relaxed font-medium">
              {LEGAL_CONSENT_TEXT}
            </div>
            <label className="flex items-center gap-4 mb-8 cursor-pointer p-5 bg-slate-50 rounded-2xl">
              <input type="checkbox" className="w-8 h-8 accent-teal-600" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span className="text-lg font-black text-slate-800">모든 내용에 동의합니다.</span>
            </label>
            <div className="flex gap-4">
              <button onClick={() => setShowConsent(false)} className="flex-1 py-5 bg-slate-100 font-bold rounded-2xl text-slate-400">취소</button>
              <button disabled={!agreed} onClick={() => { setShowConsent(false); onStart(); }} className={`flex-1 py-5 font-black rounded-2xl text-white text-lg ${agreed ? 'bg-teal-600 shadow-lg' : 'bg-slate-300'}`}>상담 시작</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;
