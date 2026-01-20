
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PregnancyStage, AgeGroup, BloodTestResult, HbLevel, Symptom, SurveyData, Product, ConsultationRecord, Pharmacist, PharmacyConfig } from './types';
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
  const [syncStatus, setSyncStatus] = useState<'connected' | 'error' | 'syncing' | 'idle' | 'initializing'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // [Push] 데이터를 서버에 저장 (CORS 및 에러 핸들링 강화)
  const pushToCloud = useCallback(async (code: string, currentRecords: ConsultationRecord[], currentProducts: Product[]) => {
    if (!code || code.trim().length < 3 || !navigator.onLine) return;
    const targetCode = code.trim();

    try {
      setSyncStatus('syncing');
      const payload = JSON.stringify({
        records: currentRecords,
        products: currentProducts,
        updatedAt: Date.now()
      });

      const response = await fetch(`${SYNC_API_BASE}/${targetCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // CORS preflight 회피
        mode: 'cors',
        body: payload
      });

      if (response.ok) {
        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      setSyncStatus('error');
    }
  }, []);

  // [Pull] 서버 데이터를 가져오고 지능적으로 병합 (유실 방지 핵심)
  const pullFromCloud = useCallback(async (code: string) => {
    if (!code || code.trim().length < 3 || !navigator.onLine) return;
    const targetCode = code.trim();
    
    try {
      setSyncStatus('syncing');
      const response = await fetch(`${SYNC_API_BASE}/${targetCode}?nocache=${Date.now()}`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        cache: 'no-store'
      });
      
      // 서버에 데이터가 아예 없는 경우 (404) -> 내 로컬 데이터를 서버로 복제하여 연동 시작
      if (response.status === 404) {
        setSyncStatus('initializing');
        const localRecs = JSON.parse(localStorage.getItem('i-mom-records') || '[]');
        const localProds = JSON.parse(localStorage.getItem('i-mom-products') || JSON.stringify(INITIAL_PRODUCTS));
        await pushToCloud(targetCode, localRecs, localProds);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        // 데이터 무결성 체크: 서버 데이터가 너무 부실하면 무시 (유실 방지)
        if (!data || (!data.records && !data.products)) {
          setSyncStatus('error');
          return;
        }

        // 1. 상담 기록 지능형 병합 (ID 기준)
        const localRecords: ConsultationRecord[] = JSON.parse(localStorage.getItem('i-mom-records') || '[]');
        const recordMap = new Map();
        localRecords.forEach(r => recordMap.set(r.id, r));
        
        if (data.records && Array.isArray(data.records)) {
          data.records.forEach((r: ConsultationRecord) => {
            if (!recordMap.has(r.id)) recordMap.set(r.id, r);
          });
        }
        
        const mergedRecords = Array.from(recordMap.values()).sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setRecords(mergedRecords);
        localStorage.setItem('i-mom-records', JSON.stringify(mergedRecords));

        // 2. 제품 정보 업데이트 (서버에 유효한 제품이 있을 때만)
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          localStorage.setItem('i-mom-products', JSON.stringify(data.products));
        }
        
        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      setSyncStatus('error');
    }
  }, [pushToCloud]);

  // 초기 상태 로딩 및 자동 동기화 시작
  useEffect(() => {
    // 1. 로컬 데이터 우선 로드
    const savedProducts = localStorage.getItem('i-mom-products');
    setProducts(savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS);

    const savedRecordsStr = localStorage.getItem('i-mom-records');
    if (savedRecordsStr) setRecords(JSON.parse(savedRecordsStr));

    const savedConfig = localStorage.getItem('i-mom-config');
    if (savedConfig) setPharmacyConfig(JSON.parse(savedConfig));

    // 2. 연동 코드 있으면 즉시 Pull
    if (syncCode) {
      pullFromCloud(syncCode);
      const interval = setInterval(() => pullFromCloud(syncCode), 60000); // 1분마다 자동 확인
      return () => clearInterval(interval);
    }
  }, [syncCode, pullFromCloud]);

  const handleUpdateRecords = (newRecords: ConsultationRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('i-mom-records', JSON.stringify(newRecords));
    if (syncCode) pushToCloud(syncCode, newRecords, products);
  };

  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('i-mom-products', JSON.stringify(newProducts));
    if (syncCode) pushToCloud(syncCode, records, newProducts);
  };

  const handleUpdateConfig = (newConfig: PharmacyConfig) => {
    setPharmacyConfig(newConfig);
    localStorage.setItem('i-mom-config', JSON.stringify(newConfig));
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
    
    const updatedRecords = [newRecord, ...records];
    handleUpdateRecords(updatedRecords);
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
                 <div className={`w-1.5 h-1.5 rounded-full ${
                    syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 
                    syncStatus === 'connected' ? 'bg-teal-500' : 
                    syncStatus === 'initializing' ? 'bg-blue-400' : 'bg-red-500'
                 }`}></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                   {syncStatus === 'syncing' ? '데이터 동기화 중...' : 
                    syncStatus === 'connected' ? `연동 활성화 (${lastSyncTime})` : 
                    syncStatus === 'initializing' ? '초기 연동 설정 중...' : '연동 확인 필요'}
                 </span>
               </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
           {syncCode && (
             <button 
               onClick={() => pushToCloud(syncCode, records, products)}
               className="px-4 py-2 bg-teal-600 text-white text-[10px] font-black rounded-xl shadow-lg hover:bg-teal-700 active:scale-95 transition-all"
             >
               클라우드 강제 저장
             </button>
           )}
           <button onClick={() => { if(syncCode) pullFromCloud(syncCode); }} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm">🔄</button>
           <button onClick={() => isAdminAuthenticated ? setCurrentView('admin') : setShowAdminLogin(true)} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-white transition-all shadow-sm">⚙️</button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {currentView === 'home' && <HomeView onStart={() => setCurrentView('survey')} />}
        {currentView === 'survey' && <SurveyView onComplete={(data) => {
          setSurveyData({ ...data, pharmacistName: pharmacyConfig.managerName });
          setCurrentView('recommendation');
        }} products={products} />}
        {currentView === 'recommendation' && surveyData && (
          <RecommendationView 
            surveyData={surveyData} 
            products={products} 
            config={pharmacyConfig}
            onSave={handleSaveConsultation} 
            onBack={() => setCurrentView('survey')}
            onReturnHome={() => setCurrentView('home')}
          />
        )}
        {currentView === 'admin' && (
          <AdminPanel 
            products={products} 
            records={records} 
            pharmacists={pharmacists}
            config={pharmacyConfig}
            syncCode={syncCode}
            onUpdateProducts={handleUpdateProducts}
            onUpdateRecords={handleUpdateRecords}
            onUpdatePharmacists={setPharmacists}
            onUpdateConfig={handleUpdateConfig}
            onSetSyncCode={(code) => {
              const cleaned = code.trim();
              setSyncCode(cleaned);
              localStorage.setItem('i-mom-sync-code', cleaned);
              pullFromCloud(cleaned);
            }}
          />
        )}
      </main>

      {showAdminLogin && (
        <div className="fixed inset-0 bg-slate-900/40 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl">
            <h3 className="text-xl font-black text-center mb-6">관리자 로그인</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (passwordInput === '1234') {
                setIsAdminAuthenticated(true);
                setShowAdminLogin(false);
                setCurrentView('admin');
                setPasswordInput('');
              } else alert('비밀번호가 틀렸습니다.');
            }} className="space-y-4">
              <input type="password" autoFocus className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-center text-2xl tracking-[0.5em] outline-none focus:border-teal-500" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="••••" />
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
