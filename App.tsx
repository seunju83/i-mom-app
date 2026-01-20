
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
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([{ id: '1', name: '아이맘 약사', isActive: true }]);
  const [pharmacyConfig, setPharmacyConfig] = useState<PharmacyConfig>(() => {
    const saved = localStorage.getItem('i-mom-config-v3');
    return saved ? JSON.parse(saved) : {
      pharmacyName: '아이맘약국',
      currentPharmacistId: '1',
      businessAddress: '세종시 보듬3로 150 아름행복타워 101호 아이맘약국',
      managerName: '송은주'
    };
  });
  
  // 캐시 충돌 방지를 위해 v3 전용 키 사용
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('sb_url_v3') || '');
  const [sbKey, setSbKey] = useState(localStorage.getItem('sb_key_v3') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'error' | 'syncing'>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const supabaseClient = useMemo(() => {
    if (sbUrl && sbKey) {
      try { return createClient(sbUrl, sbKey); } 
      catch (e) { return null; }
    }
    return null;
  }, [sbUrl, sbKey]);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const fetchSync = useCallback(async () => {
    if (!supabaseClient) {
      setSyncStatus('offline');
      const localProducts = localStorage.getItem('i-mom-products-v3');
      const localRecords = localStorage.getItem('i-mom-records-v3');
      setProducts(localProducts ? JSON.parse(localProducts) : INITIAL_PRODUCTS);
      setRecords(localRecords ? JSON.parse(localRecords) : []);
      return;
    }

    try {
      setSyncStatus('syncing');
      // 제품 데이터 가져오기
      const { data: dbP } = await supabaseClient.from('products').select('*');
      if (dbP && dbP.length > 0) {
        setProducts(dbP);
        localStorage.setItem('i-mom-products-v3', JSON.stringify(dbP));
      } else if (products.length > 0) {
        await supabaseClient.from('products').upsert(products);
      } else {
        setProducts(INITIAL_PRODUCTS);
      }

      // 상담 기록 가져오기
      const { data: dbR } = await supabaseClient.from('consultations').select('*').order('date', { ascending: false });
      if (dbR) {
        setRecords(dbR);
        localStorage.setItem('i-mom-records-v3', JSON.stringify(dbR));
      }

      setSyncStatus('connected');
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      setSyncStatus('error');
    }
  }, [supabaseClient, products.length]);

  useEffect(() => {
    fetchSync();
  }, [supabaseClient, fetchSync]);

  const handleUpdateRecords = async (newRecords: ConsultationRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('i-mom-records-v3', JSON.stringify(newRecords));
    if (supabaseClient) await supabaseClient.from('consultations').upsert(newRecords);
  };

  const handleUpdateProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('i-mom-products-v3', JSON.stringify(newProducts));
    if (supabaseClient) await supabaseClient.from('products').upsert(newProducts);
  };

  const handleSetSbConfig = (url: string, key: string) => {
    setSbUrl(url);
    setSbKey(key);
    localStorage.setItem('sb_url_v3', url);
    localStorage.setItem('sb_key_v3', key);
    alert('설정이 저장되었습니다. 페이지가 새로고침됩니다.');
    window.location.reload(); // 강제 새로고침으로 캐시 무력화
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1024px] mx-auto bg-white shadow-2xl relative">
      <header className="bg-white/95 backdrop-blur-md p-6 sticky top-0 z-50 flex justify-between items-center border-b border-slate-100">
        <div className="cursor-pointer flex items-center gap-3" onClick={() => setCurrentView('home')}>
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-[10px] shadow-lg">아이맘</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 tracking-tighter">{pharmacyConfig.pharmacyName}</h1>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[8px] font-black rounded-md uppercase">Final v3.0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'connected' ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {syncStatus === 'connected' ? `클라우드 연결됨 (${lastSyncTime})` : '오프라인 (설정필요)'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={fetchSync} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-white text-sm">🔄</button>
           <button onClick={() => isAdminAuthenticated ? setCurrentView('admin') : setShowAdminLogin(true)} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-white shadow-sm">⚙️</button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {currentView === 'home' && <HomeView onStart={() => setCurrentView('survey')} />}
        {currentView === 'survey' && <SurveyView onComplete={(data) => { setSurveyData(data); setCurrentView('recommendation'); }} products={products} />}
        {currentView === 'recommendation' && surveyData && (
          <RecommendationView surveyData={surveyData} products={products} config={pharmacyConfig} onSave={(ids, names, total) => {
             const selectedFull = products.filter(p => ids.includes(p.id));
             const newRecord: ConsultationRecord = {
                id: `RE-${Date.now()}`, date: new Date().toISOString(), pharmacistName: pharmacyConfig.managerName, customerName: surveyData?.customerName || '고객', surveyData: surveyData!, recommendedProductNames: names, selectedProducts: selectedFull, totalPrice: total, purchaseStatus: '구매 완료', counselingMethod: '태블릿 대면 상담', dispensingDays: 30
             };
             handleUpdateRecords([newRecord, ...records]);
             return newRecord;
          }} onBack={() => setCurrentView('survey')} onReturnHome={() => setCurrentView('home')} />
        )}
        {currentView === 'admin' && (
          <AdminPanel 
            products={products} records={records} pharmacists={pharmacists} config={pharmacyConfig}
            onUpdateProducts={handleUpdateProducts} onUpdateRecords={handleUpdateRecords} onUpdatePharmacists={setPharmacists} onUpdateConfig={(c) => { setPharmacyConfig(c); localStorage.setItem('i-mom-config-v3', JSON.stringify(c)); }}
            onForcePush={fetchSync}
            sbConfig={{ url: sbUrl, key: sbKey }}
            onSetSbConfig={handleSetSbConfig}
          />
        )}
      </main>

      {showAdminLogin && (
        <div className="fixed inset-0 bg-slate-900/40 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl">
            <h3 className="text-xl font-black text-center mb-6">관리자 로그인</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (passwordInput === '1234') { setIsAdminAuthenticated(true); setShowAdminLogin(false); setCurrentView('admin'); setPasswordInput(''); }
              else alert('비밀번호가 틀렸습니다.');
            }} className="space-y-4">
              <input type="password" autoFocus className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-center text-2xl tracking-[0.5em] outline-none" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="••••" />
              <button type="submit" className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl">확인</button>
              <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full py-2 text-slate-400 text-sm font-bold">취소</button>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-white border-t p-8 text-center">
        <p className="text-[10px] text-slate-400 font-black mb-2">{DISCLAIMER}</p>
        <p className="text-xs text-slate-600 font-bold">{pharmacyConfig.pharmacyName}</p>
      </footer>
    </div>
  );
};

export default App;
