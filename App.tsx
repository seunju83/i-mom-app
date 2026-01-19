
import React, { useState, useEffect } from 'react';
import { PregnancyStage, AgeGroup, BloodTestResult, HbLevel, Symptom, SurveyData, Product, ConsultationRecord, Pharmacist, PharmacyConfig } from './types';
import { INITIAL_PRODUCTS, DISCLAIMER } from './constants';
import HomeView from './components/HomeView';
import SurveyView from './components/SurveyView';
import RecommendationView from './components/RecommendationView';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'survey' | 'recommendation' | 'admin'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([
    { id: '1', name: '송은주 약사', isActive: true }
  ]);
  const [pharmacyConfig, setPharmacyConfig] = useState<PharmacyConfig>({
    pharmacyName: '아이맘약국',
    currentPharmacistId: '1',
    businessAddress: '세종시 보듬3로 150 아름행복타워 101호 아이맘약국',
    managerName: '송은주'
  });
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    // Load Products
    const savedProducts = localStorage.getItem('i-mom-products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('i-mom-products', JSON.stringify(INITIAL_PRODUCTS));
    }

    // Load Records and Cleanup (3 years policy)
    const savedRecordsStr = localStorage.getItem('i-mom-records');
    if (savedRecordsStr) {
      const allRecords: ConsultationRecord[] = JSON.parse(savedRecordsStr);
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      
      const filteredRecords = allRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate > threeYearsAgo;
      });

      if (filteredRecords.length !== allRecords.length) {
        localStorage.setItem('i-mom-records', JSON.stringify(filteredRecords));
      }
      setRecords(filteredRecords);
    }

    const savedPharmacists = localStorage.getItem('i-mom-pharmacists');
    if (savedPharmacists) setPharmacists(JSON.parse(savedPharmacists));

    const savedConfig = localStorage.getItem('i-mom-config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setPharmacyConfig(prev => ({
        ...prev,
        ...parsed
      }));
    }
  }, []);

  const handleStartSurvey = () => setCurrentView('survey');

  const handleSurveyComplete = (data: SurveyData) => {
    const activePharmacist = pharmacists.find(p => p.id === pharmacyConfig.currentPharmacistId);
    setSurveyData({
        ...data,
        pharmacistName: activePharmacist?.name || '약사 미지정'
    });
    setCurrentView('recommendation');
  };

  const handleSaveConsultation = (selectedProductIds: string[], recommendedNames: string[], totalPrice: number): ConsultationRecord => {
    const selectedProductsFull = products.filter(p => selectedProductIds.includes(p.id));
    const activePharmacist = pharmacists.find(p => p.id === pharmacyConfig.currentPharmacistId);
    
    const newRecord: ConsultationRecord = {
      id: `RE-${Date.now()}`,
      date: new Date().toISOString(),
      pharmacistName: activePharmacist?.name || '약사 미지정',
      customerName: surveyData?.customerName || '고객',
      surveyData: surveyData!,
      recommendedProductNames: recommendedNames,
      selectedProducts: selectedProductsFull,
      totalPrice: totalPrice,
      purchaseStatus: '구매 완료',
      counselingMethod: '태블릿 기반 대면 상담',
      dispensingDays: 30
    };
    
    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    localStorage.setItem('i-mom-records', JSON.stringify(updatedRecords));
    return newRecord;
  };

  const handleAdminClick = () => {
    if (isAdminAuthenticated) setCurrentView('admin');
    else setShowAdminLogin(true);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '1234') {
      setIsAdminAuthenticated(true);
      setShowAdminLogin(false);
      setCurrentView('admin');
      setPasswordInput('');
    } else alert('비밀번호가 일치하지 않습니다.');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1024px] mx-auto bg-white shadow-2xl relative overflow-x-hidden">
      <header className="bg-white/80 backdrop-blur-md p-8 sticky top-0 z-50 flex justify-between items-center border-b border-[#F0E5D8]">
        <div className="cursor-pointer group flex items-center gap-3" onClick={() => setCurrentView('home')}>
          <div className="w-12 h-12 rounded-full border-4 border-teal-500 flex flex-col items-center justify-center bg-white shadow-sm overflow-hidden relative">
            <div className="text-[6px] font-black text-orange-500 leading-none">맞춤형</div>
            <div className="text-[5px] font-bold text-teal-600 leading-none mt-0.5">건강기능식품</div>
            <div className="absolute bottom-0 w-full bg-teal-500 text-white text-[4px] font-bold py-0.5 text-center leading-none scale-90">식품의약품안전처</div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#5D5347] tracking-tighter">{pharmacyConfig.pharmacyName}</h1>
          </div>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={handleAdminClick} 
            className="w-12 h-12 bg-[#FDF8F1] border border-[#F0E5D8] rounded-2xl flex items-center justify-center text-xl shadow-sm hover:bg-white transition-all"
           >
            ⚙️
           </button>
        </div>
      </header>

      <main className="flex-1 p-8 bg-[#FDF8F1]/20">
        {currentView === 'home' && <HomeView onStart={handleStartSurvey} />}
        {currentView === 'survey' && <SurveyView onComplete={handleSurveyComplete} products={products} />}
        {currentView === 'recommendation' && surveyData && (
          <RecommendationView 
            surveyData={surveyData} 
            products={products} 
            config={pharmacyConfig}
            onSave={handleSaveConsultation} 
            onReturnHome={() => setCurrentView('home')}
          />
        )}
        {currentView === 'admin' && (
          <AdminPanel 
            products={products} 
            records={records} 
            pharmacists={pharmacists}
            config={pharmacyConfig}
            onUpdateProducts={(p) => { setProducts(p); localStorage.setItem('i-mom-products', JSON.stringify(p)); }}
            onUpdatePharmacists={(p) => { setPharmacists(p); localStorage.setItem('i-mom-pharmacists', JSON.stringify(p)); }}
            onUpdateConfig={(c) => { setPharmacyConfig(c); localStorage.setItem('i-mom-config', JSON.stringify(c)); }}
          />
        )}
      </main>

      {showAdminLogin && (
        <div className="fixed inset-0 bg-[#5D5347]/40 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center mb-8">
               <span className="text-4xl mb-4 block">🔐</span>
               <h3 className="text-xl font-black text-[#5D5347]">관리자 전용 로그인</h3>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <input 
                type="password"
                autoFocus
                className="w-full p-5 bg-[#FDF8F1] border-2 border-[#F0E5D8] rounded-2xl font-black text-center text-3xl focus:border-teal-500 outline-none transition-all tracking-[0.5em]"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="••••"
              />
              <button type="submit" className="w-full py-5 bg-teal-600 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 active:scale-95 transition-all">접속하기</button>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-[#F0E5D8] p-8 text-center">
        <p className="text-[10px] text-[#8D7F70] font-black uppercase tracking-[0.2em] mb-3">{DISCLAIMER}</p>
        <p className="text-xs text-[#5D5347] font-bold">
          {pharmacyConfig.pharmacyName} | {pharmacyConfig.businessAddress} | 관리사: {pharmacyConfig.managerName}
        </p>
      </footer>
    </div>
  );
};

export default App;
