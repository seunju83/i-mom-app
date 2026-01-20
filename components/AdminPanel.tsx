
import React, { useState, useMemo, useRef } from 'react';
import { Product, ConsultationRecord, Pharmacist, PharmacyConfig, IngredientInfo, PillType } from '../types';
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

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('기록을 삭제하시겠습니까? 연동된 모든 기기에서 삭제됩니다.')) {
      onUpdateRecords(records.filter(r => r.id !== id));
    }
  };

  const PILL_TYPES: {value: PillType, label: string}[] = [
    { value: 'round-white', label: '흰색 원형' },
    { value: 'oval-yellow', label: '노란 타원형' },
    { value: 'capsule-brown', label: '갈색 캡슐' },
    { value: 'small-round', label: '작은 원형' },
    { value: 'powder-pack', label: '가루/포' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b bg-white sticky top-0 z-10">
        {[
          { id: 'products', label: '제품 관리' },
          { id: 'records', label: '상담 로그' },
          { id: 'settings', label: '연동 및 설정' }
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
               <h4 className="text-xl font-black">🔗 기기간 실시간 연동 설정</h4>
               <span className={`px-3 py-1 rounded-full text-[9px] font-black ${syncCode ? 'bg-teal-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                 {syncCode ? '연동 활성화' : '연동 대기'}
               </span>
             </div>
             <div className="bg-teal-900/30 p-5 rounded-2xl border border-teal-500/30 text-[11px] text-teal-200 leading-relaxed font-medium">
               💡 <b>사용법:</b> 두 대의 기기에 같은 코드를 입력하세요.<br/>
               제품 정보가 사라졌다면 헤더의 <b>[클라우드 강제 저장]</b> 버튼을 눌러 데이터를 다시 동기화할 수 있습니다.
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">우리 약국 전용 코드</label>
                <input 
                  type="text" 
                  value={syncCode} 
                  onChange={e => onSetSyncCode(e.target.value)}
                  placeholder="예: imom-pharm-01"
                  className="w-full p-5 bg-white/10 border-2 border-white/10 rounded-2xl outline-none focus:border-teal-500 font-black text-white text-lg"
                />
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border space-y-6 shadow-sm">
             <h4 className="text-xl font-black text-slate-800">🏥 약국 기본 정보</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400">약국 이름</label>
                  <input value={config.pharmacyName} onChange={e => onUpdateConfig({...config, pharmacyName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400">약사 이름</label>
                  <input value={config.managerName} onChange={e => onUpdateConfig({...config, managerName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400">약국 주소</label>
                  <input value={config.businessAddress} onChange={e => onUpdateConfig({...config, businessAddress: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
             </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
             <h3 className="font-black text-slate-800">보유 제품 목록 ({products.length})</h3>
             <button onClick={() => setEditingProduct({ id: '', name: '', images: [], price: 0, storage: '상온', usage: '', ingredients: [], isActive: true, expirationDate: new Date().toISOString().split('T')[0], pillType: 'round-white' })} className="px-5 py-2.5 bg-teal-600 text-white rounded-2xl text-xs font-black shadow-lg">새 제품 추가</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {products.map(p => (
               <div key={p.id} className="p-4 bg-white border rounded-[2rem] flex flex-col gap-3 hover:shadow-md transition-all">
                  <div className="flex gap-4">
                    <img src={p.images[0] || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-2xl object-cover bg-slate-50 border shadow-sm" />
                    <div className="flex-1 truncate">
                        <h4 className="font-black text-slate-800 text-sm truncate">{p.name}</h4>
                        <p className="text-xs font-bold text-teal-600">{p.price.toLocaleString()}원</p>
                        <p className="text-[9px] text-slate-400 font-bold">유효기간: {p.expirationDate}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingProduct(p)} className="w-full py-2 bg-slate-50 text-slate-600 font-black text-[10px] rounded-xl hover:bg-slate-900 hover:text-white transition-all">정보 수정</button>
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
                  <th className="p-4 pl-6">상담일</th>
                  <th className="p-4">성함</th>
                  <th className="p-4 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold text-slate-600">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={3} className="p-20 text-center text-slate-300 italic">내역이 없습니다.</td></tr>
                ) : filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-900 font-black">{r.customerName}</td>
                    <td className="p-4 flex items-center justify-center gap-2">
                      <button onClick={() => setViewingRecord(r)} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-black shadow-md">상세보기</button>
                      <button onClick={() => handleDeleteRecord(r.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">🗑️</button>
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
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">제품 상세 관리</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-300 hover:text-slate-900 text-xl font-bold">✕</button>
            </div>
            
            <form onSubmit={(e) => {
               e.preventDefault();
               const updated = editingProduct.id 
                 ? products.map(p => p.id === editingProduct.id ? editingProduct : p)
                 : [...products, { ...editingProduct, id: `P-${Date.now()}` }];
               onUpdateProducts(updated);
               setEditingProduct(null);
            }} className="flex-1 overflow-y-auto p-8 space-y-8">
              
              <div className="space-y-3">
                <label className="text-xs font-black text-teal-600 border-l-4 border-teal-500 pl-2">상품 사진</label>
                <div className="grid grid-cols-4 gap-3">
                  {editingProduct.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img src={img} className="w-full h-full rounded-2xl object-cover border" />
                      <button type="button" onClick={() => setEditingProduct({...editingProduct, images: editingProduct.images.filter((_, i) => i !== idx)})} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-slate-300">
                    <span className="text-2xl">+</span>
                  </button>
                  <input type="file" ref={fileInputRef} multiple accept="image/*" className="hidden" onChange={(e) => {
                    if (!e.target.files) return;
                    Array.from(e.target.files).forEach(file => {
                      const reader = new FileReader();
                      reader.onloadend = () => setEditingProduct(prev => prev ? { ...prev, images: [...prev.images, reader.result as string] } : null);
                      reader.readAsDataURL(file);
                    });
                  }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">제품명</label>
                  <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">판매가(원)</label>
                  <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">제형</label>
                  <select value={editingProduct.pillType} onChange={e => setEditingProduct({...editingProduct, pillType: e.target.value as PillType})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500">
                    {PILL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">유효기간</label>
                  <input type="date" value={editingProduct.expirationDate} onChange={e => setEditingProduct({...editingProduct, expirationDate: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400">권장 용법</label>
                <input value={editingProduct.usage} onChange={e => setEditingProduct({...editingProduct, usage: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" placeholder="예: 1일 1회 식후 복용" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-teal-600 border-l-4 border-teal-500 pl-2">성분 및 함량</label>
                  <button type="button" onClick={() => setEditingProduct({...editingProduct, ingredients: [...editingProduct.ingredients, { name: '', amount: 0, unit: 'mg' }]})} className="px-3 py-1 bg-slate-800 text-white rounded-lg text-[10px]">+ 추가</button>
                </div>
                {editingProduct.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input placeholder="성분명" value={ing.name} onChange={e => {
                      const newIngs = [...editingProduct.ingredients];
                      newIngs[idx].name = e.target.value;
                      setEditingProduct({...editingProduct, ingredients: newIngs});
                    }} className="flex-1 p-3 bg-slate-50 rounded-xl text-xs font-bold" />
                    <input type="number" placeholder="함량" value={ing.amount} onChange={e => {
                      const newIngs = [...editingProduct.ingredients];
                      newIngs[idx].amount = parseFloat(e.target.value) || 0;
                      setEditingProduct({...editingProduct, ingredients: newIngs});
                    }} className="w-16 p-3 bg-slate-50 rounded-xl text-xs font-bold" />
                    <input placeholder="단위" value={ing.unit} onChange={e => {
                      const newIngs = [...editingProduct.ingredients];
                      newIngs[idx].unit = e.target.value;
                      setEditingProduct({...editingProduct, ingredients: newIngs});
                    }} className="w-16 p-3 bg-slate-50 rounded-xl text-xs font-bold" />
                    <button type="button" onClick={() => setEditingProduct({...editingProduct, ingredients: editingProduct.ingredients.filter((_, i) => i !== idx)})} className="text-red-400 font-bold px-2">✕</button>
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full py-5 bg-teal-600 text-white font-black rounded-3xl shadow-xl">저장 및 동기화</button>
            </form>
          </div>
        </div>
      )}

      {viewingRecord && <RecordDetailModal record={viewingRecord} config={config} onClose={() => setViewingRecord(null)} />}
    </div>
  );
};

export default AdminPanel;
