
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
  
  // 입력 상태 (v3로 이름 변경하여 캐시 방지)
  const [v3Url, setV3Url] = useState(sbConfig.url);
  const [v3Key, setV3Key] = useState(sbConfig.key);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.surveyData && r.surveyData.phone.includes(searchQuery))
    );
  }, [records, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* 탭 디자인 변경 */}
      <div className="flex border-b bg-white sticky top-0 z-10">
        <button onClick={() => setTab('products')} className={`px-8 py-5 font-black text-xs ${tab === 'products' ? 'text-teal-600 border-b-4 border-teal-600 bg-teal-50/20' : 'text-slate-400'}`}>📦 제품관리</button>
        <button onClick={() => setTab('records')} className={`px-8 py-5 font-black text-xs ${tab === 'records' ? 'text-teal-600 border-b-4 border-teal-600 bg-teal-50/20' : 'text-slate-400'}`}>📋 상담기록</button>
        <button onClick={() => setTab('settings')} className={`px-8 py-5 font-black text-xs ${tab === 'settings' ? 'text-orange-600 border-b-4 border-orange-600 bg-orange-50/20' : 'text-slate-400'}`}>⚙️ [연동] 프로젝트 설정</button>
      </div>

      {tab === 'settings' && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
          {/* 아예 다른 색상 배경을 사용하여 업데이트 여부를 확인 (인디고 블루) */}
          <div className="bg-[#1e1b4b] p-12 rounded-[4rem] text-white space-y-10 shadow-2xl border-4 border-orange-500/20">
             <div className="flex justify-between items-center border-b border-white/10 pb-6">
               <div>
                 <h4 className="text-2xl font-black text-orange-400">Cloud Database Setup (v3.0)</h4>
                 <p className="text-slate-400 text-xs mt-1">이 설정은 모든 태블릿에 동일하게 입력해야 합니다.</p>
               </div>
               <button onClick={onForcePush} className="px-6 py-3 bg-white/10 text-white rounded-2xl text-[10px] font-black hover:bg-white/20">데이터 강제 동기화</button>
             </div>

             <div className="space-y-8">
                {/* 1. URL 입력란 - 명칭을 아주 길게 변경 */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-orange-300 uppercase tracking-[0.2em] ml-2">설정항목 1. Supabase Project URL</label>
                  <input 
                    type="text" 
                    value={v3Url} 
                    onChange={e => setV3Url(e.target.value)} 
                    placeholder="https://...supabase.co" 
                    className="w-full p-6 bg-white/5 border-2 border-white/10 rounded-[2rem] outline-none focus:border-orange-500 font-bold text-white text-base" 
                  />
                </div>

                {/* 2. Key 입력란 - 명칭을 아주 길게 변경 */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-teal-300 uppercase tracking-[0.2em] ml-2">설정항목 2. Supabase API Key (Anon Public)</label>
                  <input 
                    type="password" 
                    value={v3Key} 
                    onChange={e => setV3Key(e.target.value)} 
                    placeholder="eyJ...로 시작하는 아주 긴 문자열을 넣으세요" 
                    className="w-full p-6 bg-white/5 border-2 border-white/10 rounded-[2rem] outline-none focus:border-teal-500 font-bold text-white text-base" 
                  />
                </div>

                <button 
                  onClick={() => onSetSbConfig(v3Url, v3Key)} 
                  className="w-full py-7 bg-orange-600 text-white font-black text-xl rounded-[2.5rem] shadow-xl hover:bg-orange-500 active:scale-[0.98] transition-all"
                >
                  위 설정값 저장 후 시스템 재시작
                </button>
             </div>

             <div className="p-6 bg-black/20 rounded-[2.5rem] border border-white/5">
                <p className="text-xs text-orange-400 font-black mb-2">📌 연동 가이드</p>
                <ul className="text-[11px] text-slate-400 space-y-2">
                  <li>1. Supabase 대시보드 -> Project Settings -> API 메뉴로 이동합니다.</li>
                  <li>2. **Project URL** 값을 복사해서 1번에 넣습니다.</li>
                  <li>3. **Project API keys**의 `anon / public` 키를 복사해서 2번에 넣습니다.</li>
                </ul>
             </div>
          </div>
        </div>
      )}

      {/* 제품 관리 탭 */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
             <h3 className="font-black text-slate-800 text-lg">보유 제품 ({products.length})</h3>
             <button onClick={() => setEditingProduct({ id: '', name: '', images: [], price: 0, storage: '상온', usage: '', ingredients: [], isActive: true, expirationDate: new Date().toISOString().split('T')[0], pillType: 'round-white' })} className="px-6 py-4 bg-teal-600 text-white rounded-2xl text-xs font-black">+ 새 제품 추가</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
             {products.map(p => (
               <div key={p.id} className="p-6 bg-white border rounded-[3rem] flex flex-col gap-5">
                  <div className="flex gap-5">
                    <img src={p.images[0] || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-[1.5rem] object-cover border shrink-0" />
                    <div className="flex-1 truncate">
                        <h4 className="font-black text-slate-800 text-sm truncate">{p.name}</h4>
                        <p className="text-xs font-bold text-teal-600">{p.price.toLocaleString()}원</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingProduct(p)} className="w-full py-3 bg-slate-50 text-slate-500 font-black text-[10px] rounded-2xl">정보 수정</button>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* 상담 로그 탭 */}
      {tab === 'records' && (
        <div className="space-y-6">
          <input type="text" placeholder="고객 성함 검색" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-6 bg-slate-50 border-none rounded-[2.5rem] outline-none focus:ring-2 focus:ring-teal-500 font-bold" />
          <div className="bg-white border rounded-[2.5rem] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr className="text-[10px] font-black text-slate-400">
                  <th className="p-6 pl-10">상담 일시</th>
                  <th className="p-6">고객</th>
                  <th className="p-6 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold text-slate-600">
                {filteredRecords.map(r => (
                  <tr key={r.id}>
                    <td className="p-6 pl-10 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-6 text-sm">{r.customerName}</td>
                    <td className="p-6 flex justify-center gap-2">
                      <button onClick={() => setViewingRecord(r)} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-[10px]">기록지</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/80 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10">
            <h3 className="text-2xl font-black mb-8">제품 정보 수정</h3>
            <form onSubmit={(e) => {
               e.preventDefault();
               const updated = editingProduct.id ? products.map(p => p.id === editingProduct.id ? editingProduct : p) : [...products, { ...editingProduct, id: `P-${Date.now()}` }];
               onUpdateProducts(updated);
               setEditingProduct(null);
            }} className="space-y-6">
              <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="제품명" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" />
              <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} placeholder="가격" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" />
              <button type="submit" className="w-full py-6 bg-teal-600 text-white font-black text-lg rounded-[2.5rem]">저장하기</button>
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
