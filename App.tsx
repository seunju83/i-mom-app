
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, ConsultationRecord, Pharmacist, PharmacyConfig, SurveyData } from './types';
import { INITIAL_PRODUCTS, DISCLAIMER } from './constants';
import HomeView from './components/HomeView';
import SurveyView from './components/SurveyView';
import RecommendationView from './components/RecommendationView';
import AdminPanel from './components/AdminPanel';
import { createClient } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'survey' | 'recommendation' | 'admin'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  
  const [pharmacyConfig, setPharmacyConfig] = useState<PharmacyConfig>(() => {
    const saved = localStorage.getItem('i-mom-v5-config');
    return saved ? JSON.parse(saved) : {
      pharmacyName: '아이맘약국',
      currentPharmacistId: '1',
      businessAddress: '세종시 보듬3로 150 아름행복타워 101호 아이맘약국',
      managerName: '송은주'
    };
  });
  
  // v5 전용 키 (캐시 무력화)
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('v5_url') || '');
  const [sbKey, setSbKey] = useState(localStorage.getItem('v5_key') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'error' | 'syncing'>('offline');

  const supabase = useMemo(() => {
    if (sbUrl && sbKey) {
      try { return createClient(sbUrl, sbKey); } 
      catch (e) { return null; }
    }
    return null;
  }, [sbUrl, sbKey]);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const handleSync = useCallback(async () => {
    if (!supabase) {
      setSyncStatus('offline');
      const localP = localStorage.getItem('i-mom-v5-products');
      const localR = localStorage.getItem('i-mom-v5-records');
      setProducts(localP ? JSON.parse(localP) : INITIAL_PRODUCTS);
      setRecords(localR ? JSON.parse(localR) : []);
      return;
    }

    try {
      setSyncStatus('syncing');
      const { data: dbP } = await supabase.from('products').select('*');
      if (dbP && dbP.length > 0) {
        setProducts(dbP);
        localStorage.setItem('i-mom-v5-products', JSON.stringify(dbP));
      } else if (products.length > 0) {
        await supabase.from('products').upsert(products);
      } else {
        setProducts(INITIAL_PRODUCTS);
      }

      const { data: dbR } = await supabase.from('consultations').select('*').order('date', { ascending: false });
      if (dbR) {
        setRecords(dbR);
        localStorage.setItem('i-mom-v5-records', JSON.stringify(dbR));
      }
      setSyncStatus('connected');
    } catch (e) {
      setSyncStatus('error');
    }
  }, [supabase, products.length]);

  useEffect(() => {
    handleSync();
  }, [supabase, handleSync]);

  const onSaveSbConfig = (url: string, key: string) => {
    localStorage.setItem('v5_url', url);
    localStorage.setItem('v5_key', key);
    setSbUrl(url);
    setSbKey(key);
    alert('v5.0 서버 설정이 저장되었습니다. 앱을 재시작합니다.');
    window.location.reload(); 
  };

  return (
    <div className={`min-h-screen flex flex-col max-w-[1024px] mx-auto shadow-2xl relative ${currentView === 'home' ? 'bg-teal-900' : 'bg-white'}`}>
      {/* v5.0 버전 확인용 긴급 배너 */}
      <div className="bg-yellow-400 text-black text-[10px] font-black text-center py-2 tracking-tighter uppercase">
        ⚠️ EMERGENCY UPDATE v5.0 - CLOUD SYNC INTERFACE ENABLED ⚠️
      </div>

      <header className="bg-white p-6 sticky top-0 z-50 flex justify-between items-center border-b shadow-sm">
        <div className="cursor-pointer flex items-center gap-3" onClick={() => setCurrentView('home')}>
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-[10px]">아이맘</div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{pharmacyConfig.pharmacyName}</h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {syncStatus === 'connected' ? 'CLOUD CONNECTED' : 'OFFLINE MODE'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => isAdminAuthenticated ? setCurrentView('admin') : setShowAdminLogin(true)} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl">⚙️</button>
      </header>

      <main className="flex-1">
        {currentView === 'home' && <HomeView onStart={() => setCurrentView('survey')} />}
        {currentView === 'survey' && <SurveyView onComplete={(data) => { setSurveyData(data); setCurrentView('recommendation'); }} products={products} />}
        {currentView === 'recommendation' && surveyData && (
          <RecommendationView surveyData={surveyData} products={products} config={pharmacyConfig} onSave={(ids, names, total) => {
             const selectedFull = products.filter(p => ids.includes(p.id));
             const newRecord: ConsultationRecord = {
                id: `RE-${Date.now()}`, date: new Date().toISOString(), pharmacistName: pharmacyConfig.managerName, customerName: surveyData?.customerName || '고객', surveyData: surveyData!, recommendedProductNames: names, selectedProducts: selectedFull, totalPrice: total, purchaseStatus: '구매 완료', counselingMethod: '태블릿 대면 상담', dispensingDays: 30
             };
             const updated = [newRecord, ...records];
             setRecords(updated);
             localStorage.setItem('i-mom-v5-records', JSON.stringify(updated));
             if (supabase) supabase.from('consultations').upsert(newRecord);
             return newRecord;
          }} onBack={() => setCurrentView('survey')} onReturnHome={() => setCurrentView('home')} />
        )}
        {currentView === 'admin' && (
          <AdminPanel 
            products={products} records={records} pharmacists={[]} config={pharmacyConfig}
            onUpdateProducts={(p) => { setProducts(p); localStorage.setItem('i-mom-v5-products', JSON.stringify(p)); if(supabase) supabase.from('products').upsert(p); }}
            onUpdateRecords={(r) => { setRecords(r); localStorage.setItem('i-mom-v5-records', JSON.stringify(r)); if(supabase) supabase.from('consultations').upsert(r); }}
            onUpdatePharmacists={()=>{}} onUpdateConfig={(c) => { setPharmacyConfig(c); localStorage.setItem('i-mom-v5-config', JSON.stringify(c)); }}
            onForcePush={handleSync}
            sbConfig={{ url: sbUrl, key: sbKey }}
            onSetSbConfig={onSaveSbConfig}
          />
        )}
      </main>

      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-12 shadow-2xl">
            <h3 className="text-xl font-black text-center mb-8">관리자 비밀번호</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (passwordInput === '1234') { setIsAdminAuthenticated(true); setShowAdminLogin(false); setCurrentView('admin'); setPasswordInput(''); }
              else alert('비밀번호가 틀렸습니다.');
            }} className="space-y-6">
              <input type="password" autoFocus className="w-full p-5 bg-slate-100 border-none rounded-2xl text-center text-3xl tracking-[0.5em]" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="••••" />
              <button type="submit" className="w-full py-5 bg-teal-600 text-white font-black rounded-2xl text-lg">확인</button>
              <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full text-slate-400 font-bold text-sm mt-4">닫기</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
