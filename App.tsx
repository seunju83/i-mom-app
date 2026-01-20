
import React, { useState, useEffect, useCallback } from 'react';
import { Product, ConsultationRecord, Pharmacist, PharmacyConfig, SurveyData } from './types';
import { INITIAL_PRODUCTS, DISCLAIMER } from './constants';
import HomeView from './components/HomeView';
import SurveyView from './components/SurveyView';
import RecommendationView from './components/RecommendationView';
import AdminPanel from './components/AdminPanel';

const SYNC_API_BASE = 'https://api.keyvalue.xyz';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'survey' | 'recommendation' | 'admin'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([{ id: '1', name: '아이맘 약사', isActive: true }]);
  const [pharmacyConfig, setPharmacyConfig] = useState<PharmacyConfig>({
    pharmacyName: '아이맘약국',
    currentPharmacistId: '1',
    businessAddress: '세종시 보듬3로 150 아름행복타워 101호 아이맘약국',
    managerName: '송은주'
  });
  
  const [syncCode, setSyncCode] = useState<string>(localStorage.getItem('i-mom-sync-code') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'error' | 'syncing' | 'idle'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // [데이터 보호 로직] 로컬 스토리지에 제품 정보가 없으면 기본값 강제 주입
  const loadLocalData = useCallback(() => {
    const savedProducts = localStorage.getItem('i-mom-products');
    const parsedProducts = savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS;
    setProducts(parsedProducts.length > 0 ? parsedProducts : INITIAL_PRODUCTS);

    const savedRecords = localStorage.getItem('i-mom-records');
    if (savedRecords) setRecords(JSON.parse(savedRecords));

    const savedConfig = localStorage.getItem('i-mom-config');
    if (savedConfig) setPharmacyConfig(JSON.parse(savedConfig));
  }, []);

  const pushToCloud = useCallback(async (code: string, currentRecords: ConsultationRecord[], currentProducts: Product[]) => {
    if (!code || code.trim().length < 3 || !navigator.onLine) return;
    try {
      setSyncStatus('syncing');
      const payload = {
        records: currentRecords,
        products: currentProducts,
        updatedAt: Date.now()
      };
      const response = await fetch(`${SYNC_API_BASE}/${code.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (e) { setSyncStatus('error'); }
  }, []);

  const pullFromCloud = useCallback(async (code: string) => {
    if (!code || code.trim().length < 3 || !navigator.onLine) return;
    try {
      setSyncStatus('syncing');
      const response = await fetch(`${SYNC_API_BASE}/${code.trim()}?t=${Date.now()}`, { mode: 'cors' });
      
      // 1. 서버에 데이터가 없으면(404) 내 현재 데이터를 서버로 즉시 전송 (Seeding)
      if (response.status === 404) {
        await pushToCloud(code, records, products);
        return;
      }

      if (response.ok) {
        const remoteData = await response.json();
        if (!remoteData || !remoteData.products) return;

        // 2. 지능형 병합 (ID가 없는 데이터들만 추가)
        setProducts(prev => {
          const merged = [...remoteData.products];
          prev.forEach(p => {
            if (!merged.find(rp => rp.id === p.id)) merged.push(p);
          });
          localStorage.setItem('i-mom-products', JSON.stringify(merged));
          return merged;
        });

        setRecords(prev => {
          const merged = [...remoteData.records];
          prev.forEach(r => {
            if (!merged.find(rr => rr.id === r.id)) merged.push(r);
          });
          const sorted = merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          localStorage.setItem('i-mom-records', JSON.stringify(sorted));
          return sorted;
        });

        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (e) { setSyncStatus('error'); }
  }, [records, products, pushToCloud]);

  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

  useEffect(() => {
    if (syncCode) {
      pullFromCloud(syncCode);
      const interval = setInterval(() => pullFromCloud(syncCode), 60000);
      return () => clearInterval(interval);
    }
  }, [syncCode, pullFromCloud]);

  const handleUpdateRecords = (newRecords: ConsultationRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('i-mom-records', JSON.stringify(newRecords));
    if (syncCode) pushToCloud(syncCode, newRecords, products);
  };

  const handleUpdateProducts = (newProducts: Product[]) => {
    const validProducts = newProducts.length > 0 ? newProducts : INITIAL_PRODUCTS;
    setProducts(validProducts);
    localStorage.setItem('i-mom-products', JSON.stringify(validProducts));
    // Fix: Swap validProducts and records to match pushToCloud(code, currentRecords, currentProducts) signature
    if (syncCode) pushToCloud(syncCode, records, validProducts);
  };

  const handleSaveConsultation = (selectedProductIds: string[], recommendedNames: string[], totalPrice: number): ConsultationRecord => {
    const selectedFull = products.filter(p => selectedProductIds.includes(p.id));
    const newRecord: ConsultationRecord = {
      id: `RE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString(),
      pharmacistName: pharmacyConfig.managerName,
      customerName: surveyData?.customerName || '고객',
      surveyData: surveyData!,
      recommendedProductNames: recommendedNames,
      selectedProducts: selectedFull,
      totalPrice: totalPrice,
      purchaseStatus: '구매 완료',
      counselingMethod: '태블릿 대면 상담',
      dispensingDays: 30
    };
    const updated = [newRecord, ...records];
    handleUpdateRecords(updated);
    return newRecord;
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1024px] mx-auto bg-white shadow-2xl relative">
      <header className="bg-white/95 backdrop-blur-md p-6 sticky top-0 z-50 flex justify-between items-center border-b border-slate-100">
        <div className="cursor-pointer flex items-center gap-3" onClick={() => setCurrentView('home')}>
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-[10px] shadow-lg">아이맘</div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter">{pharmacyConfig.pharmacyName}</h1>
            {syncCode && (
               <div className="flex items-center gap-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'connected' ? 'bg-teal-500' : 'bg-red-500 animate-pulse'}`}></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                   {syncStatus === 'connected' ? `연동 활성화 (${lastSyncTime})` : '서버 연결 확인 중...'}
                 </span>
               </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => syncCode && pullFromCloud(syncCode)} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-white active:scale-90 shadow-sm transition-all">🔄</button>
           <button onClick={() => isAdminAuthenticated ? setCurrentView('admin') : setShowAdminLogin(true)} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-white shadow-sm">⚙️</button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {currentView === 'home' && <HomeView onStart={() => setCurrentView('survey')} />}
        {currentView === 'survey' && <SurveyView onComplete={(data) => { setSurveyData(data); setCurrentView('recommendation'); }} products={products} />}
        {currentView === 'recommendation' && surveyData && (
          <RecommendationView surveyData={surveyData} products={products} config={pharmacyConfig} onSave={handleSaveConsultation} onBack={() => setCurrentView('survey')} onReturnHome={() => setCurrentView('home')} />
        )}
        {currentView === 'admin' && (
          <AdminPanel 
            products={products} records={records} pharmacists={pharmacists} config={pharmacyConfig} syncCode={syncCode}
            onUpdateProducts={handleUpdateProducts} onUpdateRecords={handleUpdateRecords} onUpdatePharmacists={setPharmacists} onUpdateConfig={(c) => { setPharmacyConfig(c); localStorage.setItem('i-mom-config', JSON.stringify(c)); }}
            onSetSyncCode={(c) => { setSyncCode(c); localStorage.setItem('i-mom-sync-code', c); pullFromCloud(c); }}
            onForcePush={() => pushToCloud(syncCode, records, products)}
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
