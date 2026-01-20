
import React, { useState, useMemo, useRef } from 'react';
import { Product, ConsultationRecord, Pharmacist, PharmacyConfig, IngredientInfo } from '../types';
import RecordDetailModal from './RecordDetailModal';

interface AdminPanelProps {
  products: Product[];
  records: ConsultationRecord[];
  pharmacists: Pharmacist[];
  config: PharmacyConfig;
  syncCode: string;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateRecords: (records: ConsultationRecord[]) => void;
  onUpdatePharmacists: (pharmacists: Pharmacist[]) => void;
  onUpdateConfig: (config: PharmacyConfig) => void;
  onSetSyncCode: (code: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
    products, records, pharmacists, config, syncCode,
    onUpdateProducts, onUpdateRecords, onUpdatePharmacists, onUpdateConfig,
    onSetSyncCode
}) => {
  const [tab, setTab] = useState<'products' | 'records' | 'settings'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ConsultationRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.surveyData.phone.includes(searchQuery)
    );
  }, [records, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b bg-white sticky top-0 z-10">
        {[
          { id: 'products', label: '제품 관리' },
          { id: 'records', label: '상담 로그' },
          { id: 'settings', label: '연동 및 약국 설정' }
        ].map((t) => (
          <button 
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-6 py-4 font-black text-xs whitespace-nowrap transition-all ${tab === t.id ? 'text-teal-600 border-b-4 border-teal-600 bg-teal-50/30' : 'text-slate-400'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-6 shadow-xl">
             <div className="flex justify-between items-center">
               <h4 className="text-xl font-black">🔗 기기간 실시간 자동 연동</h4>
               <span className={`px-3 py-1 rounded-full text-[9px] font-black ${syncCode ? 'bg-teal-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                 {syncCode ? '연동 대기 중' : '미설정'}
               </span>
             </div>
             <div className="bg-teal-900/30 p-5 rounded-2xl border border-teal-500/30 text-[11px] text-teal-200 leading-relaxed font-medium">
               💡 <b>기존 기기의 데이터를 새 기기로 옮기려면:</b><br/>
               1. 기존 기기에서 사용하던 <b>연동 코드</b>를 기억하세요.<br/>
               2. 새 기기(핸드폰/태블릿)에 <b>똑같은 코드</b>를 입력하세요.<br/>
               3. 약 2~3초 후 '연결됨' 표시와 함께 모든 기록이 나타납니다.
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">우리 약국 전용 연동 코드</label>
                <input 
                  type="text" 
                  value={syncCode} 
                  onChange={e => onSetSyncCode(e.target.value)}
                  placeholder="예: imom-777 (나만 아는 코드 입력)"
                  className="w-full p-5 bg-white/10 border-2 border-white/10 rounded-2xl outline-none focus:border-teal-500 font-black text-white text-lg"
                />
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border space-y-6 shadow-sm">
             <h4 className="text-xl font-black text-slate-800">🏥 약국 정보 관리</h4>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400">약국 명칭</label>
                  <input value={config.pharmacyName} onChange={e => onUpdateConfig({...config, pharmacyName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400">관리 약사명</label>
                  <input value={config.managerName} onChange={e => onUpdateConfig({...config, managerName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
             </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
             <h3 className="font-black text-slate-800">보유 제품 목록</h3>
             <button onClick={() => setEditingProduct({ id: '', name: '', images: [], price: 0, storage: '상온', usage: '', ingredients: [], isActive: true, expirationDate: new Date().toISOString().split('T')[0], pillType: 'round-white' })} className="px-5 py-2.5 bg-teal-600 text-white rounded-2xl text-xs font-black shadow-lg">제품 등록</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {products.map(p => (
               <div key={p.id} className="p-4 bg-white border rounded-[2rem] flex flex-col gap-3 hover:shadow-md transition-all group">
                  <div className="flex gap-4">
                    <img src={p.images[0] || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-2xl object-cover bg-slate-50 border shadow-sm" />
                    <div className="flex-1 truncate">
                        <h4 className="font-black text-slate-800 text-sm truncate">{p.name}</h4>
                        <p className="text-xs font-bold text-teal-600">{p.price.toLocaleString()}원</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingProduct(p)} className="w-full py-2 bg-slate-50 text-slate-600 font-black text-[10px] rounded-xl hover:bg-slate-100 transition-colors">제품 정보 수정</button>
               </div>
             ))}
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          <input 
            type="text" placeholder="고객 성함 또는 연락처로 검색..." 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-5 border-2 rounded-[2rem] outline-none focus:border-teal-500 font-bold shadow-sm"
          />
          <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 font-black text-[10px] text-slate-400 uppercase">
                <tr>
                  <th className="p-4 pl-6">상담일자</th>
                  <th className="p-4">고객명</th>
                  <th className="p-4 text-center">조회</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold text-slate-600">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={3} className="p-20 text-center text-slate-300 italic">상담 내역이 없습니다.</td></tr>
                ) : filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-900">{r.customerName}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => setViewingRecord(r)} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-black shadow-md">기록지 보기</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">제품 상세 정보</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-300 hover:text-slate-900 text-xl font-bold transition-colors">✕</button>
            </div>
            <form onSubmit={async (e) => {
               e.preventDefault();
               const updated = editingProduct.id 
                 ? products.map(p => p.id === editingProduct.id ? editingProduct : p)
                 : [...products, { ...editingProduct, id: `P-${Date.now()}` }];
               onUpdateProducts(updated);
               setEditingProduct(null);
            }} className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest border-l-4 border-teal-500 pl-2">제품 사진</h4>
                <div className="grid grid-cols-4 gap-3">
                  {editingProduct.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img src={img} className="w-full h-full rounded-2xl object-cover border shadow-sm" />
                      <button type="button" onClick={() => setEditingProduct({...editingProduct, images: editingProduct.images.filter((_, i) => i !== idx)})} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                    <span className="text-2xl">+</span>
                    <span className="text-[8px] font-black">사진 추가</span>
                  </button>
                  <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={(e) => {
                    if (!e.target.files) return;
                    Array.from(e.target.files).forEach(file => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditingProduct(prev => prev ? { ...prev, images: [...prev.images, reader.result as string] } : null);
                      };
                      reader.readAsDataURL(file);
                    });
                  }} className="hidden" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="제품명" className="p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" />
                <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} placeholder="가격" className="p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <button type="submit" className="w-full py-5 bg-teal-600 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all">저장 및 기기 연동</button>
            </form>
          </div>
        </div>
      )}

      {viewingRecord && <RecordDetailModal record={viewingRecord} config={config} onClose={() => setViewingRecord(null)} />}
    </div>
  );
};

export default AdminPanel;
