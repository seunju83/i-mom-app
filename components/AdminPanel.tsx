
import React, { useState, useMemo } from 'react';
import { Product, ConsultationRecord, Pharmacist, PharmacyConfig, PillType } from '../types';
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
  const [searchQuery, setSearchQuery] = useState('');
  
  // 입력창을 위한 임시 상태
  const [tempSbUrl, setTempSbUrl] = useState(sbConfig.url);
  const [tempSbKey, setTempSbKey] = useState(sbConfig.key);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.surveyData && r.surveyData.phone.includes(searchQuery))
    );
  }, [records, searchQuery]);

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('기록을 삭제하시겠습니까?')) {
      onUpdateRecords(records.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 탭 메뉴 */}
      <div className="flex border-b bg-white sticky top-0 z-10">
        <button onClick={() => setTab('products')} className={`px-6 py-4 font-black text-xs ${tab === 'products' ? 'text-teal-600 border-b-4 border-teal-600' : 'text-slate-400'}`}>📦 제품 관리</button>
        <button onClick={() => setTab('records')} className={`px-6 py-4 font-black text-xs ${tab === 'records' ? 'text-teal-600 border-b-4 border-teal-600' : 'text-slate-400'}`}>📋 상담 로그</button>
        <button onClick={() => setTab('settings')} className={`px-6 py-4 font-black text-xs ${tab === 'settings' ? 'text-teal-600 border-b-4 border-teal-600' : 'text-slate-400'}`}>⚙️ 연동 설정</button>
      </div>

      {tab === 'settings' && (
        <div className="space-y-6 animate-in slide-in-from-bottom">
          {/* Supabase 설정 (가장 중요) */}
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-6 shadow-xl">
             <div className="flex justify-between items-center">
               <h4 className="text-xl font-black">🔗 Supabase 클라우드 연동</h4>
               <button onClick={onForcePush} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-[10px] font-black">동기화 실행</button>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">1. Supabase 프로젝트 주소 (URL)</label>
                  <input 
                    type="text" 
                    value={tempSbUrl} 
                    onChange={e => setTempSbUrl(e.target.value)} 
                    placeholder="https://xxxx.supabase.co" 
                    className="w-full p-5 bg-white/10 border-2 border-white/5 rounded-2xl outline-none focus:border-teal-500 font-bold text-white text-sm" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">2. API 공개 키 (Anon Key)</label>
                  <input 
                    type="password" 
                    value={tempSbKey} 
                    onChange={e => setTempSbKey(e.target.value)} 
                    placeholder="eyJ...로 시작하는 긴 문자열" 
                    className="w-full p-5 bg-white/10 border-2 border-white/5 rounded-2xl outline-none focus:border-teal-500 font-bold text-white text-sm" 
                  />
                </div>

                <button 
                  onClick={() => onSetSbConfig(tempSbUrl, tempSbKey)} 
                  className="w-full py-5 bg-teal-600 text-white font-black rounded-2xl shadow-lg hover:bg-teal-500 transition-all"
                >
                  설정 저장 및 연동 시작
                </button>
             </div>
             
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-[10px] text-slate-400 leading-relaxed">
                * Supabase 대시보드 -> Settings -> API 메뉴에서 위 정보를 복사해 넣으세요.<br />
                * 이 정보가 입력되어야 모든 기기에서 상담 기록이 실시간으로 공유됩니다.
             </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
             <h3 className="font-black text-slate-800">제품 관리</h3>
             <button onClick={() => setEditingProduct({ id: '', name: '', images: [], price: 0, storage: '상온', usage: '', ingredients: [], isActive: true, expirationDate: new Date().toISOString().split('T')[0], pillType: 'round-white' })} className="px-5 py-3 bg-teal-600 text-white rounded-2xl text-[11px] font-black">+ 새 제품</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {products.map(p => (
               <div key={p.id} className="p-5 bg-white border rounded-[2.5rem] flex flex-col gap-4">
                  <div className="flex gap-4">
                    <img src={p.images[0] || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-2xl object-cover border shrink-0" />
                    <div className="flex-1 truncate">
                        <h4 className="font-black text-slate-800 text-sm truncate">{p.name}</h4>
                        <p className="text-xs font-bold text-teal-600">{p.price.toLocaleString()}원</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingProduct(p)} className="w-full py-2 bg-slate-50 text-slate-600 font-black text-[10px] rounded-xl">수정</button>
               </div>
             ))}
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          <input type="text" placeholder="고객명 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-5 border-2 rounded-[2.5rem] outline-none focus:border-teal-500 font-bold" />
          <div className="bg-white border rounded-[2.5rem] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 font-black text-[10px] text-slate-400">
                <tr><th className="p-5">날짜</th><th className="p-5">고객명</th><th className="p-5 text-center">동작</th></tr>
              </thead>
              <tbody className="divide-y font-bold">
                {filteredRecords.map(r => (
                  <tr key={r.id}>
                    <td className="p-5 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-5">{r.customerName}</td>
                    <td className="p-5 flex justify-center gap-2">
                      <button onClick={() => setViewingRecord(r)} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px]">보기</button>
                      <button onClick={() => handleDeleteRecord(r.id)} className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px]">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/70 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10">
            <h3 className="text-xl font-black mb-6">제품 상세 수정</h3>
            <form onSubmit={(e) => {
               e.preventDefault();
               const updated = editingProduct.id ? products.map(p => p.id === editingProduct.id ? editingProduct : p) : [...products, { ...editingProduct, id: `P-${Date.now()}` }];
               onUpdateProducts(updated);
               setEditingProduct(null);
            }} className="space-y-4">
              <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="제품명" className="w-full p-4 bg-slate-50 rounded-2xl" />
              <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} placeholder="가격" className="w-full p-4 bg-slate-50 rounded-2xl" />
              <button type="submit" className="w-full py-5 bg-teal-600 text-white font-black rounded-3xl">저장</button>
              <button type="button" onClick={() => setEditingProduct(null)} className="w-full py-2 text-slate-400">취소</button>
            </form>
          </div>
        </div>
      )}

      {viewingRecord && <RecordDetailModal record={viewingRecord} config={config} onClose={() => setViewingRecord(null)} />}
    </div>
  );
};

export default AdminPanel;
