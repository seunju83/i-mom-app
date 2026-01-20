
import React, { useState, useEffect, useCallback } from 'react';
import { PregnancyStage, AgeGroup, BloodTestResult, HbLevel, Symptom, SurveyData, Product, ConsultationRecord, Pharmacist, PharmacyConfig } from './types';
import { INITIAL_PRODUCTS, DISCLAIMER } from './constants';
import HomeView from './components/HomeView';
import SurveyView from './components/SurveyView';
import RecommendationView from './components/RecommendationView';
import AdminPanel from './components/AdminPanel';

const SYNC_API_BASE = 'https://api.keyvalue.xyz';

// --- 강력한 보안 엔진 (Web Crypto API 기반 AES-GCM) ---
async function deriveKey(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptData(text: string, password: string) {
  try {
    const key = await deriveKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(text);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch (e) { return null; }
}

async function decryptData(encryptedBase64: string, password: string) {
  try {
    const key = await deriveKey(password);
    const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch (e) { return null; }
}

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // [Push] 모든 데이터를 하나로 묶어 전송 (제품 정보 + 이미지 + 상담 기록)
  const pushToCloud = useCallback(async (code: string, currentRecords: ConsultationRecord[], currentProducts: Product[]) => {
    if (!code) return;
    setIsSyncing(true);
    try {
      const payload = JSON.stringify({
        records: currentRecords,
        products: currentProducts,
        updatedAt: new Date().toISOString()
      });
      const encryptedPayload = await encryptData(payload, code);
      if (!encryptedPayload) throw new Error("Encryption failed");

      await fetch(`${SYNC_API_BASE}/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: encryptedPayload
      });
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Cloud Sync Failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // [Pull] 서버에서 최신 데이터 가져와서 로컬과 병합
  const pullFromCloud = useCallback(async (code: string) => {
    if (!code) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`${SYNC_API_BASE}/${code}`);
      if (response.ok) {
        const encryptedResult = await response.text();
        if (encryptedResult && encryptedResult.length > 20) {
          const decryptedJson = await decryptData(encryptedResult, code);
          if (decryptedJson) {
            const cloudData = JSON.parse(decryptedJson);
            
            // 1. 제품 정보 동기화 (기기 불러오기 이미지가 포함된 최신 정보)
            if (cloudData.products) {
              setProducts(cloudData.products);
              localStorage.setItem('i-mom-products', JSON.stringify(cloudData.products));
            }

            // 2. 상담 기록 동기화 (기존 로컬 기록과 병합하여 유실 방지)
            if (cloudData.records) {
              const localRecords = JSON.parse(localStorage.getItem('i-mom-records') || '[]');
              const recordMap = new Map();
              [...localRecords, ...cloudData.records].forEach(r => recordMap.set(r.id, r));
              const mergedRecords = Array.from(recordMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              setRecords(mergedRecords);
              localStorage.setItem('i-mom-records', JSON.stringify(mergedRecords));
            }
            
            setLastSyncTime(new Date().toLocaleTimeString());
          }
        }
      }
    } catch (err) {
      console.error('Cloud Pull Failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 초기 로드 시 실행
  useEffect(() => {
    const savedProducts = localStorage.getItem('i-mom-products');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    else setProducts(INITIAL_PRODUCTS);

    const savedRecordsStr = localStorage.getItem('i-mom-records');
    if (savedRecordsStr) setRecords(JSON.parse(savedRecordsStr));

    const savedConfig = localStorage.getItem('i-mom-config');
    if (savedConfig) setPharmacyConfig(JSON.parse(savedConfig));

    if (syncCode) pullFromCloud(syncCode);
  }, [syncCode, pullFromCloud]);

  // 기록 업데이트 및 서버 전송
  const handleUpdateRecords = useCallback((newRecords: ConsultationRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('i-mom-records', JSON.stringify(newRecords));
    if (syncCode) pushToCloud(syncCode, newRecords, products);
  }, [syncCode, products, pushToCloud]);

  // 제품 업데이트 및 서버 전송 (이미지 포함)
  const handleUpdateProducts = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('i-mom-products', JSON.stringify(newProducts));
    if (syncCode) pushToCloud(syncCode, records, newProducts);
  }, [syncCode, records, pushToCloud]);

  const handleUpdateConfig = useCallback((newConfig: PharmacyConfig) => {
    setPharmacyConfig(newConfig);
    localStorage.setItem('i-mom-config', JSON.stringify(newConfig));
  }, []);

  const handleSaveConsultation = (selectedProductIds: string[], recommendedNames: string[], totalPrice: number): ConsultationRecord => {
    const selectedFull = products.filter(p => selectedProductIds.includes(p.id));
    const newRecord: ConsultationRecord = {
      id: `RE-${Date.now()}`,
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
      <header className="bg-white/90 backdrop-blur-md p-6 sticky top-0 z-50 flex justify-between items-center border-b border-slate-100">
        <div className="cursor-pointer flex items-center gap-3" onClick={() => setCurrentView('home')}>
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-[10px]">아이맘</div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter">{pharmacyConfig.pharmacyName}</h1>
            {syncCode && (
               <div className="flex items-center gap-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-teal-500'}`}></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                   {isSyncing ? 'Syncing...' : 'Secure Cloud Active'}
                   {lastSyncTime && <span className="opacity-50">({lastSyncTime})</span>}
                 </span>
               </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
           {syncCode && <button onClick={() => pullFromCloud(syncCode)} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all" title="새로고침">🔄</button>}
           <button onClick={() => isAdminAuthenticated ? setCurrentView('admin') : setShowAdminLogin(true)} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all">⚙️</button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {currentView === 'home' && <HomeView onStart={() => {
           if(syncCode) pullFromCloud(syncCode); // 상담 시작 전 최신 데이터 확인
           setCurrentView('survey');
        }} />}
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
              setSyncCode(code);
              localStorage.setItem('i-mom-sync-code', code);
              if (code) pullFromCloud(code);
            }}
            onRefresh={() => pullFromCloud(syncCode)}
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
              <button type="submit" className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl">로그인</button>
              <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full py-2 text-slate-400 text-sm font-bold">취소</button>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-white border-t p-8 text-center">
        <p className="text-[10px] text-slate-400 font-black mb-2">{DISCLAIMER}</p>
        <p className="text-xs text-slate-600 font-bold">{pharmacyConfig.pharmacyName} | {pharmacyConfig.businessAddress}</p>
      </footer>
    </div>
  );
};

export default App;
