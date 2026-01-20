
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const data = encoder.encode(password.trim());
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
  const [syncStatus, setSyncStatus] = useState<'connected' | 'error' | 'syncing' | 'idle'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('i-mom-last-sync'));
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // [Pull] 서버 데이터를 가져와서 로컬과 스마트하게 합침
  const pullFromCloud = useCallback(async (code: string) => {
    if (!code || code.trim().length < 4) return;
    setSyncStatus('syncing');
    try {
      const response = await fetch(`${SYNC_API_BASE}/${code.trim()}`);
      if (!response.ok) {
        if (response.status === 404) {
          // 키가 아직 서버에 없음 - 새로 생성될 예정이므로 정상 처리
          setSyncStatus('connected');
          return;
        }
        throw new Error("Server Response Error");
      }

      const encryptedResult = await response.text();
      if (encryptedResult && encryptedResult.length > 20) {
        const decryptedJson = await decryptData(encryptedResult, code);
        if (decryptedJson) {
          const cloudData = JSON.parse(decryptedJson);
          
          // 1. 제품 정보 병합 (이미지 포함)
          if (cloudData.products) {
            setProducts(cloudData.products);
            localStorage.setItem('i-mom-products', JSON.stringify(cloudData.products));
          }

          // 2. 상담 기록 병합 (ID 기준 중복 제거 핵심 로직)
          if (cloudData.records) {
            const localRecords = JSON.parse(localStorage.getItem('i-mom-records') || '[]');
            const recordMap = new Map();
            
            // 로컬 우선 담기
            localRecords.forEach((r: any) => { if(r.id) recordMap.set(r.id, r); });
            // 클라우드 데이터로 덮어쓰거나 추가 (합집합)
            cloudData.records.forEach((r: any) => { if(r.id) recordMap.set(r.id, r); });
            
            const mergedRecords = Array.from(recordMap.values()).sort((a: any, b: any) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            setRecords(mergedRecords);
            localStorage.setItem('i-mom-records', JSON.stringify(mergedRecords));
          }
          
          const nowStr = new Date().toLocaleTimeString();
          setLastSyncTime(nowStr);
          localStorage.setItem('i-mom-last-sync', nowStr);
          setSyncStatus('connected');
        } else {
          setSyncStatus('error');
        }
      } else {
        setSyncStatus('connected');
      }
    } catch (err) {
      console.error('Pull Error:', err);
      setSyncStatus('error');
    }
  }, []);

  // [Push] 내 데이터를 서버로 안전하게 전송
  const pushToCloud = useCallback(async (code: string, currentRecords: ConsultationRecord[], currentProducts: Product[]) => {
    if (!code || code.trim().length < 4) return;
    setSyncStatus('syncing');
    try {
      const payload = JSON.stringify({
        records: currentRecords,
        products: currentProducts,
        updatedAt: new Date().toISOString()
      });
      
      const encryptedPayload = await encryptData(payload, code);
      if (!encryptedPayload) throw new Error("Encryption failed");

      // 데이터 용량 체크 (약 5MB 제한 권장)
      if (encryptedPayload.length > 5 * 1024 * 1024) {
        alert("데이터 용량이 너무 큽니다. 제품 이미지를 줄이거나 고화질 사진을 삭제해주세요.");
        setSyncStatus('error');
        return;
      }

      const response = await fetch(`${SYNC_API_BASE}/${code.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: encryptedPayload
      });
      
      if (response.ok) {
        const nowStr = new Date().toLocaleTimeString();
        setLastSyncTime(nowStr);
        localStorage.setItem('i-mom-last-sync', nowStr);
        setSyncStatus('connected');
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Push Error:', err);
      setSyncStatus('error');
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    const savedProducts = localStorage.getItem('i-mom-products');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    else setProducts(INITIAL_PRODUCTS);

    const savedRecordsStr = localStorage.getItem('i-mom-records');
    if (savedRecordsStr) setRecords(JSON.parse(savedRecordsStr));

    const savedConfig = localStorage.getItem('i-mom-config');
    if (savedConfig) setPharmacyConfig(JSON.parse(savedConfig));

    if (syncCode) pullFromCloud(syncCode);
  }, []);

  const handleUpdateRecords = useCallback((newRecords: ConsultationRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('i-mom-records', JSON.stringify(newRecords));
    if (syncCode) pushToCloud(syncCode, newRecords, products);
  }, [syncCode, products, pushToCloud]);

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
      id: `RE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, // 기기간 ID 충돌 방지용 랜덤 키 추가
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

  const openAdmin = () => {
    if (isAdminAuthenticated) {
      if (syncCode) pullFromCloud(syncCode);
      setCurrentView('admin');
    } else {
      setShowAdminLogin(true);
    }
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
                 <div className={`w-1.5 h-1.5 rounded-full ${
                    syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 
                    syncStatus === 'connected' ? 'bg-teal-500' : 
                    syncStatus === 'error' ? 'bg-red-500' : 'bg-slate-300'
                 }`}></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                   {syncStatus === 'syncing' ? 'Syncing...' : 
                    syncStatus === 'connected' ? 'Cloud Connected' : 
                    syncStatus === 'error' ? 'Connection Error' : 'Offline'}
                   {lastSyncTime && <span className="opacity-50">({lastSyncTime})</span>}
                 </span>
               </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
           {syncCode && (
             <button 
              onClick={() => pullFromCloud(syncCode)} 
              className={`w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
             >
               🔄
             </button>
           )}
           <button onClick={openAdmin} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all">⚙️</button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {currentView === 'home' && <HomeView onStart={() => {
           if(syncCode) pullFromCloud(syncCode);
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
              const cleaned = code.trim();
              setSyncCode(cleaned);
              localStorage.setItem('i-mom-sync-code', cleaned);
              pullFromCloud(cleaned);
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
                if (syncCode) pullFromCloud(syncCode);
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
