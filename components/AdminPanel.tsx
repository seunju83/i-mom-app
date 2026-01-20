
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
  
  // 입력창 상태 관리
  const [tempUrl, setTempUrl] = useState(sbConfig.url);
  const [tempKey, setTempKey] = useState(sbConfig.key);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.surveyData && r.surveyData.phone.includes(searchQuery))
    );
  }, [records, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* 고정된 탭 메뉴 */}
      <div className="flex border-b bg-white sticky top-0 z-10 overflow-x-auto no-scrollbar">
        <button onClick={() => setTab('products')} className={`px-8 py-5 font-black text-xs transition-all ${tab === 'products' ? 'text-teal-600 border-b-4 border-teal-600 bg-teal-50/20' : 'text-slate-400'}`}>📦 제품 관리</button>
        <button onClick={() => setTab('records')} className={`px-8 py-5 font-black text-xs transition-all ${tab === 'records' ? 'text-teal-600 border-b-4 border-teal-600 bg-teal-50/20' : 'text-slate-400'}`}>📋 상담 로그</button>
        <button onClick={() => setTab('settings')} className={`px-8 py-5 font-black text-xs transition-all ${tab === 'settings' ? 'text-teal-600 border-b-4 border-teal-600 bg-teal-50/20' : 'text-slate-400'}`}>⚙️ [중요] 서버 연동</button>
      </div>

      {tab === 'settings' && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
          {/* Supabase 설정 카드 (네이비 다크 모드) */}
          <div className="bg-[#0f172a] p-10 rounded-[4rem] text-white space-y-8 shadow-2xl border-4 border-teal-500/20">
             <div className="flex justify-between items-center">
               <div>
                 <h4 className="text-2xl font-black tracking-tighter">🔗 실시간 서버 연동 (Supabase)</h4>
                 <p className="text-slate-400 text-xs mt-1 font-bold">기기 간 데이터를 실시간으로 동기화합니다.</p>
               </div>
               <button onClick={onForcePush} className="px-5 py-2.5 bg-teal-500 text-white rounded-2xl text-[11px] font-black hover:scale-105 active:scale-95 transition-all">지금 바로 동기화</button>
             </div>

             <div className="space-y-6">
                {/* 1. URL 입력란 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">필수 1. 프로젝트 주소 (Project URL)</label>
                    <span className="text-[9px] text-slate-500">https://... 로 시작</span>
                  </div>
                  <input 
                    type="text" 
                    value={tempUrl} 
                    onChange={e => setTempUrl(e.target.value)} 
                    placeholder="예: https://abcdefghijkl.supabase.co" 
                    className="w-full p-6 bg-white/5 border-2 border-white/10 rounded-[2rem] outline-none focus:border-teal-500 font-bold text-white text-base transition-all placeholder:text-slate-700 shadow-inner" 
                  />
                </div>

                {/* 2. Key 입력란 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">필수 2. 서비스 API 키 (Anon Public Key)</label>
                    <span className="text-[9px] text-slate-500">eyJ... 로 시작하는 긴 문자열</span>
                  </div>
                  <input 
                    type="password" 
                    value={tempKey} 
                    onChange={e => setTempKey(e.target.value)} 
                    placeholder="복사한 API 키를 여기에 붙여넣으세요" 
                    className="w-full p-6 bg-white/5 border-2 border-white/10 rounded-[2rem] outline-none focus:border-amber-500 font-bold text-white text-base transition-all placeholder:text-slate-700 shadow-inner" 
                  />
                </div>

                <button 
                  onClick={() => onSetSbConfig(tempUrl, tempKey)} 
                  className="w-full py-6 bg-teal-600 text-white font-black text-lg rounded-[2.5rem] shadow-[0_10px_30px_rgba(20,184,166,0.3)] hover:bg-teal-500 active:scale-[0.98] transition-all"
                >
                  위 설정값 저장 및 클라우드 연결
                </button>
             </div>

             <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10">
                <p className="text-xs text-teal-400 font-black mb-2 flex items-center gap-2">💡 확인사항</p>
                <ul className="text-[11px] text-slate-400 space-y-1.5 font-medium">
                  <li>• Supabase 사이트 접속 -> Project Settings -> API 메뉴의 값을 복사하세요.</li>
                  <li>• 모든 상담용 태블릿에 **동일한 URL과 Key**를 입력해야 데이터가 공유됩니다.</li>
                  <li>• 설정 완료 후 상단에 <span className="text-teal-400 font-black">"v2.1 Cloud"</span> 표시가 나타납니다.</li>
                </ul>
             </div>
          </div>
          
          <div className="p-8 text-center opacity-30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Personalized Counseling System v2.1 (NEW VERSION)</p>
          </div>
        </div>
      )}

      {/* 제품 관리 탭 */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
             <h3 className="font-black text-slate-800 text-lg">보유 제품 목록 ({products.length})</h3>
             <button onClick={() => setEditingProduct({ id: '', name: '', images: [], price: 0, storage: '상온', usage: '', ingredients: [], isActive: true, expirationDate: new Date().toISOString().split('T')[0], pillType: 'round-white' })} className="px-6 py-4 bg-teal-600 text-white rounded-2xl text-xs font-black shadow-lg hover:scale-105 transition-all">+ 새 제품 추가</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-2">
             {products.map(p => (
               <div key={p.id} className="p-6 bg-white border-2 border-slate-50 rounded-[3rem] flex flex-col gap-5 hover:shadow-xl hover:border-teal-100 transition-all group">
                  <div className="flex gap-5">
                    <img src={p.images[0] || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-[1.5rem] object-cover bg-slate-50 border-2 border-slate-50 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 truncate py-1">
                        <h4 className="font-black text-slate-800 text-base truncate">{p.name}</h4>
                        <p className="text-sm font-bold text-teal-600 mt-1">{p.price.toLocaleString()}원</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-[9px] font-black ${p.storage === '냉장' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>{p.storage}보관</span>
                    </div>
                  </div>
                  <button onClick={() => setEditingProduct(p)} className="w-full py-3 bg-slate-50 text-slate-500 font-black text-[11px] rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all">정보 수정하기</button>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* 상담 로그 탭 */}
      {tab === 'records' && (
        <div className="space-y-6">
          <div className="px-2">
            <input type="text" placeholder="검색: 고객 성함 또는 전화번호 뒷자리" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-6 border-4 border-slate-50 rounded-[2.5rem] outline-none focus:border-teal-500 font-bold shadow-inner bg-slate-50/50" />
          </div>
          <div className="bg-white border-2 border-slate-50 rounded-[3rem] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b-2 border-slate-50">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-6 pl-10">상담 일시</th>
                  <th className="p-6">고객 정보</th>
                  <th className="p-6 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50 font-bold text-slate-600">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={3} className="p-32 text-center text-slate-300 italic font-medium">검색 결과가 없습니다.</td></tr>
                ) : filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="p-6 pl-10">
                      <p className="text-xs text-slate-800">{new Date(r.date).toLocaleDateString()}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{new Date(r.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-slate-900 font-black text-sm">{r.customerName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{r.surveyData.phone}</p>
                    </td>
                    <td className="p-6 flex items-center justify-center gap-4">
                      <button onClick={() => setViewingRecord(r)} className="px-6 py-3 bg-teal-600 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-teal-600/20 active:scale-95 transition-all">기록지 보기</button>
                      <button onClick={() => { if(window.confirm('삭제하시겠습니까?')) onUpdateRecords(records.filter(rec => rec.id !== r.id)) }} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/80 z-[300] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter">📦 제품 상세 정보 수정</h3>
              <button onClick={() => setEditingProduct(null)} className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md text-slate-300 hover:text-slate-900 transition-colors">✕</button>
            </div>
            <form onSubmit={(e) => {
               e.preventDefault();
               const updated = editingProduct.id ? products.map(p => p.id === editingProduct.id ? editingProduct : p) : [...products, { ...editingProduct, id: `P-${Date.now()}` }];
               onUpdateProducts(updated);
               setEditingProduct(null);
            }} className="flex-1 overflow-y-auto p-12 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-1">제품 명칭</label>
                  <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] font-bold outline-none focus:border-teal-500 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-1">판매 단가 (원)</label>
                  <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] font-bold outline-none focus:border-teal-500 focus:bg-white transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full py-6 bg-teal-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl hover:bg-teal-700 active:scale-95 transition-all">수정 내용 서버에 저장</button>
            </form>
          </div>
        </div>
      )}

      {viewingRecord && <RecordDetailModal record={viewingRecord} config={config} onClose={() => setViewingRecord(null)} />}
    </div>
  );
};

export default AdminPanel;
