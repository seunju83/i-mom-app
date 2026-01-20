
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PregnancyStage, AgeGroup, BloodTestResult, HbLevel, Symptom, SurveyData, Product, ConsultationRecord, Pharmacist, PharmacyConfig } from './types';
import { INITIAL_PRODUCTS, DISCLAIMER } from './constants';
import HomeView from './components/HomeView';
import SurveyView from './components/SurveyView';
import RecommendationView from './components/RecommendationView';
import AdminPanel from './components/AdminPanel';

// 더 안정적인 엔드포인트 구조 사용
const SYNC_API_BASE = 'https://api.keyvalue.xyz';

const compressImageExtreme = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400; 
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.5));
    };
    img.onerror = () => resolve(base64Str);
  });
};

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
  const [syncErrorMsg, setSyncErrorMsg] = useState<string>('');
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // [Pull] 클라우드 데이터 가져오기 (에러 핸들링 대폭 강화)
  const pullFromCloud = useCallback(async (code: string) => {
    if (!code || code.trim().length < 2) return;
    const targetCode = code.trim();
    
    try {
      setSyncStatus('syncing');
      const response = await fetch(`${SYNC_API_BASE}/${targetCode}`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json, text/plain, */*' },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().startsWith('{')) {
          try {
            const data = JSON.parse(text);
            
            // 데이터 병합 로직
            if (data.records) {
              const localRecords = JSON.parse(localStorage.getItem('i-mom-records') || '[]');
              const recordMap = new Map();
              localRecords.forEach((r: any) => recordMap.set(r.id, r));
              data.records.forEach((r: any) => recordMap.set(r.id, r));
              const merged = Array.from(recordMap.values()).sort((a: any, b: any) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
              setRecords(merged);
              localStorage.setItem('i-mom-records', JSON.stringify(merged));
            }

            if (data.products) {
              setProducts(data.products);
              localStorage.setItem('i-mom-products', JSON.stringify(data.products));
            }
          } catch (parseError) {
            console.error('JSON Parse Error', parseError);
          }
        }
        setSyncStatus('connected');
        setSyncErrorMsg('');
      } else if (response.status === 404) {
        // 404는 서버에 아직 해당 코드가 없다는 뜻이므로 '연결 성공(신규)'으로 간주
        console.log('New Sync Channel Identified');
        setSyncStatus('connected');
        setSyncErrorMsg('새로운 연동 채널이 생성되었습니다.');
      } else {
        setSyncStatus('error');
        setSyncErrorMsg(`서버 응답 오류 (${response.status})`);
      }
    } catch (e) {
      console.error('Pull Failure:', e);
      setSyncStatus('error');
      setSyncErrorMsg('네트워크 연결이 원활하지 않습니다.');
    }
  }, []);

  // [Push] 클라우드로 데이터 전송
  const pushToCloud = useCallback(async (code: string, currentRecords: ConsultationRecord[], currentProducts: Product[]) => {
    if (!code || code.trim().length < 2) return;
    const targetCode = code.trim();

    try {
      setSyncStatus('syncing');
      const payload = JSON.stringify({
        records: currentRecords.slice(0, 30), // 전송 안정성을 위해 최근 30개만
        products: currentProducts,
        lastUpdated: new Date().toISOString()
      });

      // 서버 전송 (POST 사용)
      const response = await fetch(`${SYNC_API_BASE}/${targetCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // keyvalue.xyz는 plain text를 선호함
        body: payload
      });
      
      if (response.ok) {
        setSyncStatus('connected');
        setSyncErrorMsg('');
      } else {
        setSyncStatus('error');
        setSyncErrorMsg('데이터 업로드 실패');
      }
    } catch (e) {
      console.error('Push Failure:', e);
      setSyncStatus('error');
      setSyncErrorMsg('서버와 통신할 수 없습니다.');
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

    if (syncCode) {
      pullFromCloud(syncCode);
      const interval = setInterval(() => pullFromCloud(syncCode), 20000); // 주기 20초로 조정
      return () => clearInterval(interval);
    }
  }, [syncCode, pullFromCloud]);

  const autoPush = useCallback((newRecords: ConsultationRecord[], newProducts: Product[]) => {
    if (!syncCode) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushToCloud(syncCode, newRecords, newProducts);
    }, 2000);
  }, [syncCode, pushToCloud]);

  const handleUpdateRecords = (newRecords: ConsultationRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('i-mom-records', JSON.stringify(newRecords));
    autoPush(newRecords, products);
  };

  const handleUpdateProducts = async (newProducts: Product[]) => {
    const optimizedProducts = await Promise.all(newProducts.map(async p => {
      const optimizedImages = await Promise.all(p.images.map(async img => {
        return img.length > 50000 ? await compressImageExtreme(img) : img;
      }));
      return { ...p, images: optimizedImages };
    }));
    setProducts(optimizedProducts);
    localStorage.setItem('i-mom-products', JSON.stringify(optimizedProducts));
    autoPush(records, optimizedProducts);
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
                    syncStatus === 'error' ? 'bg-red-500' : 'bg-slate-300'
                 }`}></div>
                 <span className={`text-[9px] font-black uppercase tracking-widest ${syncStatus === 'error' ? 'text-red-500' : 'text-slate-400'}`}>
                   {syncStatus === 'syncing' ? '데이터 확인 중...' : 
                    syncStatus === 'connected' ? '기기간 연동 활성화' : 
                    syncStatus === 'error' ? (syncErrorMsg || '연결 대기') : '오프라인'}
                 </span>
               </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => { if(syncCode) pullFromCloud(syncCode); }} className={`w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-white transition-colors ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}>🔄</button>
           <button onClick={() => isAdminAuthenticated ? setCurrentView('admin') : setShowAdminLogin(true)} className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center hover:bg-white transition-colors">⚙️</button>
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
