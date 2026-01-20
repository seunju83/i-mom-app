
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
    const saved = localStorage.getItem('i-mom-config');
    return saved ? JSON.parse(saved) : {
      pharmacyName: '아이맘약국',
      currentPharmacistId: '1',
      businessAddress: '세종시 보듬3로 150 아름행복타워 101호 아이맘약국',
      managerName: '송은주'
    };
  });
  
  // Supabase 설정 (로컬 스토리지에서 직접 관리)
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('i-mom-sb-url-v2') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('i-mom-sb-key-v2') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'error' | 'syncing'>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const supabase = useMemo(() => {
    if (supabaseUrl && supabaseKey) {
      try { return createClient(supabaseUrl, supabaseKey); } 
      catch (e) { return null; }
    }
    return null;
  }, [supabaseUrl, supabaseKey]);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const syncData = useCallback(async () => {
    if (!supabase) {
      setSyncStatus('offline');
      const localProducts = localStorage.getItem('i-mom-products');
      const localRecords = localStorage.getItem('i-mom-records');
      setProducts(localProducts ? JSON.parse(localProducts) : INITIAL_PRODUCTS);
      setRecords(localRecords ? JSON.parse(localRecords) : []);
      return;
    }

    try {
      setSyncStatus('syncing');
      // 제품 데이터 동기화
      const { data: dbProducts, error: pError } = await supabase.from('products').select('*');
      if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts);
        localStorage.setItem('i-mom-products', JSON.stringify(dbProducts));
      } else if (!pError && products.length > 0) {
        await supabase.from('products').upsert(products);
      } else if (!dbProducts || dbProducts.length === 0) {
        setProducts(INITIAL_PRODUCTS);
      }

      // 상담 기록 동기화
      const { data: dbRecords } = await supabase.from('consultations').select('*').order('date', { ascending: false });
      if (dbRecords) {
        setRecords(dbRecords);
        localStorage.setItem('i-mom-records', JSON.stringify(dbRecords));
      }

      setSyncStatus('connected');
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      setSyncStatus('error');
    }
  }, [supabase, products.length]);

  useEffect(() => {
    syncData();
  }, [supabase, syncData]);

  const handleUpdateRecords = async (newRecords: ConsultationRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('i-mom-records', JSON.stringify(newRecords));
    if (supabase) {
      await supabase.from('consultations').upsert(newRecords);
      setSyncStatus('connected');
    }
  };

  const handleUpdateProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('i-mom-products', JSON.stringify(newProducts));
    if (supabase) {
      await supabase.from('products').upsert(newProducts);
      setSyncStatus('connected');
    }
  };

  const handleSetSupabaseConfig = (url: string, key: string) => {
    setSupabaseUrl(url);
    setSupabaseKey(key);
    localStorage.setItem('i-mom-sb-url-v2', url);
    localStorage.setItem('i-mom-sb-key-v2', key);
    alert('새로운 연동 설정이 적용되었습니다.');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1024px] mx-auto bg-white shadow-2xl relative">
      <header className="bg-white/95 backdrop-blur-md p-6 sticky top-0 z-50 flex justify-between items-center border-b border-slate-100">
        <div className="cursor-pointer flex items-center gap-3" onClick={() => setCurrentView('home')}>
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-[10px] shadow-lg">아이맘</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 tracking-tighter">{pharmacyConfig.pharmacyName}</h1>
              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-[8px] font-black rounded-md uppercase">v2.1 Cloud</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'connected' ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {syncStatus === 'connected' ? `동기화 완료 (${lastSyncTime})` : '설정 필요 (오프라인)'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={syncData} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-white text-sm">🔄</button>
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
            onUpdateProducts={handleUpdateProducts} onUpdateRecords={handleUpdateRecords} onUpdatePharmacists={setPharmacists} onUpdateConfig={(c) => { setPharmacyConfig(c); localStorage.setItem('i-mom-config', JSON.stringify(c)); }}
            onForcePush={syncData}
            sbConfig={{ url: supabaseUrl, key: supabaseKey }}
            onSetSbConfig={handleSetSupabaseConfig}
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
