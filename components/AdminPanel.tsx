
import React, { useState, useMemo } from 'react';
import { Product, ConsultationRecord, Pharmacist, PharmacyConfig } from '../types';
import RecordDetailModal from './RecordDetailModal';

interface AdminPanelProps {
  products: Product[];
  records: ConsultationRecord[];
  pharmacists: Pharmacist[];
  config: PharmacyConfig;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateRecords: (records: ConsultationRecord[]) => void;
  onUpdatePharmacists: (pharmacists: Pharmacist[]) => void;
  onUpdateConfig: (config: PharmacyConfig) => void;
  onForcePush: () => void;
  sbConfig: { url: string, key: string };
  onSetSbConfig: (url: string, key: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
    products, records, config,
    onUpdateProducts, onUpdateRecords, onUpdateConfig,
    onForcePush, sbConfig, onSetSbConfig
}) => {
  const [tab, setTab] = useState<'products' | 'records' | 'settings'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ConsultationRecord | null>(null);
  
  // v5.0 전용 입력값 (반드시 2개)
  const [inputUrl, setInputUrl] = useState(sbConfig.url);
  const [inputKey, setInputKey] = useState(sbConfig.key);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex bg-slate-900 text-white">
        <button onClick={() => setTab('products')} className={`flex-1 py-6 font-black text-xs ${tab === 'products' ? 'bg-teal-600' : ''}`}>상품관리</button>
        <button onClick={() => setTab('records')} className={`flex-1 py-6 font-black text-xs ${tab === 'records' ? 'bg-teal-600' : ''}`}>상담기록</button>
        <button onClick={() => setTab('settings')} className={`flex-1 py-6 font-black text-xs ${tab === 'settings' ? 'bg-red-600 animate-pulse' : ''}`}>🚨 서버 연동 (v5.0)</button>
      </div>

      <div className="p-8">
        {tab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-10">
            <div className="bg-slate-800 p-12 rounded-[4rem] text-white shadow-2xl space-y-10">
               <div className="text-center">
                  <h2 className="text-3xl font-black text-yellow-400">Cloud Database Setup</h2>
                  <p className="text-slate-400 text-sm mt-2">Supabase 클라우드 서버와 기기를 연결합니다.</p>
               </div>

               <div className="space-y-8">
                  {/* 입력창 1: URL */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-yellow-500 uppercase ml-2">1. Supabase Project URL</label>
                    <input 
                      type="text" 
                      value={inputUrl} 
                      onChange={e => setInputUrl(e.target.value)} 
                      placeholder="https://abc...supabase.co" 
                      className="w-full p-6 bg-slate-700 border-4 border-yellow-500/30 rounded-3xl outline-none focus:border-yellow-500 text-white font-bold" 
                    />
                  </div>

                  {/* 입력창 2: API KEY */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-teal-400 uppercase ml-2">2. Supabase API Key (Anon Key)</label>
                    <input 
                      type="password" 
                      value={inputKey} 
                      onChange={e => setInputKey(e.target.value)} 
                      placeholder="eyJ...로 시작하는 아주 긴 문자열" 
                      className="w-full p-6 bg-slate-700 border-4 border-teal-500/30 rounded-3xl outline-none focus:border-teal-400 text-white font-bold" 
                    />
                  </div>

                  <button 
                    onClick={() => onSetSbConfig(inputUrl, inputKey)} 
                    className="w-full py-8 bg-yellow-500 text-black font-black text-2xl rounded-[3rem] shadow-xl hover:bg-yellow-400 transition-all"
                  >
                    설정 저장 및 데이터 연동 시작
                  </button>
               </div>
            </div>
            
            <button onClick={onForcePush} className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl">서버 데이터 강제 동기화</button>
          </div>
        )}

        {tab === 'products' && (
          <div className="grid grid-cols-2 gap-6">
            {products.map(p => (
              <div key={p.id} className="p-6 border-2 rounded-[3rem] flex items-center gap-5">
                <img src={p.images[0]} className="w-16 h-16 rounded-2xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-black text-slate-800">{p.name}</h4>
                  <p className="text-teal-600 font-bold">{p.price.toLocaleString()}원</p>
                </div>
                <button onClick={() => setEditingProduct(p)} className="p-3 bg-slate-100 rounded-xl">✏️</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'records' && (
          <div className="space-y-4">
            {records.map(r => (
              <div key={r.id} className="p-6 bg-slate-50 rounded-[2.5rem] flex justify-between items-center border">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">{new Date(r.date).toLocaleString()}</p>
                  <h4 className="font-black text-lg text-slate-800">{r.customerName} 고객님</h4>
                </div>
                <button onClick={() => setViewingRecord(r)} className="px-6 py-3 bg-teal-600 text-white font-black rounded-2xl text-xs">상담지 보기</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingRecord && <RecordDetailModal record={viewingRecord} config={config} onClose={() => setViewingRecord(null)} />}
    </div>
  );
};

export default AdminPanel;
