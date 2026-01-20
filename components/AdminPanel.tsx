
import React, { useState, useMemo, useRef } from 'react';
import { Product, ConsultationRecord, Pharmacist, PharmacyConfig, IngredientInfo, PillType } from '../types';
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
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
    products, records, pharmacists, config, 
    onUpdateProducts, onUpdateRecords, onUpdatePharmacists, onUpdateConfig 
}) => {
  const [tab, setTab] = useState<'products' | 'records' | 'customers' | 'settings'>('products');
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

  const uniqueCustomers = useMemo(() => {
    const customerMap = new Map<string, ConsultationRecord>();
    records.forEach(r => {
      const key = `${r.customerName}-${r.surveyData.phone}`;
      if (!customerMap.has(key)) customerMap.set(key, r);
    });
    return Array.from(customerMap.values()).filter(c => 
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.surveyData.phone.includes(searchQuery)
    );
  }, [records, searchQuery]);

  const handleDeleteRecord = (id: string) => {
    if (confirm('해당 상담 기록을 영구 삭제하시겠습니까?\n(3년 보관 원칙에 따라 신중히 결정해 주세요.)')) {
      const newRecords = records.filter(r => r.id !== id);
      onUpdateRecords(newRecords);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let updatedProducts;
    const existingIndex = products.findIndex(p => p.id === editingProduct.id);
    if (existingIndex !== -1) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    } else {
      const newId = editingProduct.id || `P-${Date.now()}`;
      updatedProducts = [...products, { ...editingProduct, id: newId }];
    }
    onUpdateProducts(updatedProducts);
    setEditingProduct(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({
          ...editingProduct,
          images: [reader.result as string]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIngredientChange = (idx: number, field: keyof IngredientInfo, value: string | number) => {
    if (!editingProduct) return;
    const newIngredients = [...editingProduct.ingredients];
    newIngredients[idx] = { ...newIngredients[idx], [field]: value };
    setEditingProduct({ ...editingProduct, ingredients: newIngredients });
  };

  const addIngredient = () => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      ingredients: [...editingProduct.ingredients, { name: '', amount: 0, unit: '' }]
    });
  };

  const removeIngredient = (idx: number) => {
    if (!editingProduct) return;
    const newIngredients = editingProduct.ingredients.filter((_, i) => i !== idx);
    setEditingProduct({ ...editingProduct, ingredients: newIngredients });
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {[
          { id: 'products', label: '제품 관리' },
          { id: 'records', label: '상담 로그' },
          { id: 'customers', label: '고객 관리' },
          { id: 'settings', label: '설정' }
        ].map((t) => (
          <button 
            key={t.id}
            onClick={() => { setTab(t.id as any); setSearchQuery(''); }}
            className={`px-6 py-4 font-black text-xs uppercase transition-all whitespace-nowrap ${tab === t.id ? 'text-teal-600 border-b-4 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'records' || tab === 'customers') && (
        <div className="mb-4">
           <input 
            type="text" 
            placeholder="성함 또는 연락처 검색" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-teal-500 shadow-inner font-bold"
           />
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">영양제 데이터베이스</h3>
            <button 
              onClick={() => setEditingProduct({ id: '', name: '', images: [''], price: 0, storage: '상온', usage: '', ingredients: [], isActive: true, expirationDate: '', pillType: 'round-white' })} 
              className="px-6 py-3 bg-teal-600 text-white font-black rounded-2xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm"
            >
              + 새 제품 등록
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {products.map(p => (
               <div key={p.id} className="p-5 bg-white border-2 border-slate-50 rounded-[2rem] shadow-sm flex flex-col gap-4 group hover:border-teal-200 transition-all">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                        {p.images[0] ? (
                          <img src={p.images[0]} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-300">No Image</span>
                        )}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <h4 className="font-black text-slate-800 truncate text-sm">{p.name}</h4>
                        <p className="text-xs font-bold text-teal-600">{p.price.toLocaleString()}원</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">{p.usage}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50">
                    <button onClick={() => setEditingProduct(p)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-black text-[11px] rounded-xl hover:bg-teal-50 hover:text-teal-600 transition-colors">정보 수정</button>
                    <button onClick={() => { if(confirm('삭제하시겠습니까?')) onUpdateProducts(products.filter(item => item.id !== p.id)) }} className="px-4 py-2 bg-red-50 text-red-500 font-black text-[11px] rounded-xl hover:bg-red-500 hover:text-white transition-colors">삭제</button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
              <tr>
                <th className="p-4">일시</th>
                <th className="p-4">고객명</th>
                <th className="p-4">상담 단계</th>
                <th className="p-4 text-right">최종 금액</th>
                <th className="p-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm font-bold text-slate-600">
              {filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-4 font-black text-slate-800">{r.customerName}</td>
                  <td className="p-4"><span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black whitespace-nowrap">{r.surveyData.stage}</span></td>
                  <td className="p-4 text-right whitespace-nowrap">{r.totalPrice.toLocaleString()}원</td>
                  <td className="p-4 flex gap-2 justify-center">
                    <button onClick={() => setViewingRecord(r)} className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-black">보기</button>
                    <button onClick={() => handleDeleteRecord(r.id)} className="px-3 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-black hover:bg-red-500 hover:text-white transition-colors">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRecords.length === 0 && <div className="p-20 text-center text-slate-300 font-black italic">상담 기록이 없습니다.</div>}
        </div>
      )}

      {tab === 'customers' && (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
           <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                <tr>
                  <th className="p-4">고객 성함</th>
                  <th className="p-4">연락처</th>
                  <th className="p-4">임신 단계</th>
                  <th className="p-4">상태</th>
                  <th className="p-4 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm font-bold text-slate-600">
                {uniqueCustomers.map(c => (
                  <tr key={`${c.customerName}-${c.surveyData.phone}`}>
                    <td className="p-4 font-black text-slate-800">{c.customerName}</td>
                    <td className="p-4 font-mono">{c.surveyData.phone}</td>
                    <td className="p-4 text-xs">{c.surveyData.stage}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black">기존 고객</span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => { setSearchQuery(c.customerName); setTab('records'); }} className="text-teal-600 font-black text-xs hover:underline">기록 보기</button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
           {uniqueCustomers.length === 0 && <div className="p-20 text-center text-slate-300 font-black italic">고객 정보가 없습니다.</div>}
        </div>
      )}

      {tab === 'settings' && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center gap-3 border-b border-slate-50 pb-6 mb-2">
              <span className="text-3xl">⚙️</span>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">약국 운영 환경 설정</h4>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">약국 명칭</label>
                <input 
                  value={config.pharmacyName} 
                  onChange={e => onUpdateConfig({...config, pharmacyName: e.target.value})} 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">관리사 성함</label>
                <input 
                  value={config.managerName} 
                  onChange={e => onUpdateConfig({...config, managerName: e.target.value})} 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 font-bold" 
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">약국 주소</label>
                <input 
                  value={config.businessAddress} 
                  onChange={e => onUpdateConfig({...config, businessAddress: e.target.value})} 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 font-bold" 
                />
              </div>
           </div>
        </div>
      )}

      {/* 제품 수정/추가 모달 */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <form onSubmit={handleSaveProduct} className="flex flex-col h-full">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">영양제 등록/수정</h3>
                <button type="button" onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-900 font-bold">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">제품명</label>
                    <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">가격 (원)</label>
                    <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} className="p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">제형</label>
                    <select value={editingProduct.pillType} onChange={e => setEditingProduct({...editingProduct, pillType: e.target.value as PillType})} className="p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-teal-500 outline-none">
                      <option value="round-white">하얀색 원형</option>
                      <option value="oval-yellow">노란색 타원형</option>
                      <option value="capsule-brown">갈색 캡슐</option>
                      <option value="small-round">작은 원형</option>
                      <option value="powder-pack">분말 포</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">복용법</label>
                    <input value={editingProduct.usage} onChange={e => setEditingProduct({...editingProduct, usage: e.target.value})} className="p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">이미지 URL</label>
                    <input value={editingProduct.images[0]} onChange={e => setEditingProduct({...editingProduct, images: [e.target.value]})} className="p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest">함유 성분</label>
                     <button type="button" onClick={addIngredient} className="text-[11px] font-black text-teal-600 bg-teal-50 px-4 py-1.5 rounded-xl">+ 추가</button>
                   </div>
                   <div className="space-y-2">
                      {editingProduct.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl">
                          <input placeholder="성분명" value={ing.name} onChange={e => handleIngredientChange(idx, 'name', e.target.value)} className="flex-[2] p-3 bg-white border border-slate-50 rounded-xl text-xs font-bold" />
                          <input type="number" placeholder="함량" value={ing.amount} onChange={e => handleIngredientChange(idx, 'amount', parseInt(e.target.value) || 0)} className="flex-1 p-3 bg-white border border-slate-50 rounded-xl text-xs font-bold" />
                          <input placeholder="단위" value={ing.unit} onChange={e => handleIngredientChange(idx, 'unit', e.target.value)} className="flex-1 p-3 bg-white border border-slate-50 rounded-xl text-xs font-bold" />
                          <button type="button" onClick={() => removeIngredient(idx)} className="p-2 text-red-400 font-bold">✕</button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-white text-slate-400 font-black rounded-2xl border-2 border-slate-200">취소</button>
                <button type="submit" className="flex-[2] py-4 bg-teal-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">설정 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingRecord && <RecordDetailModal record={viewingRecord} config={config} onClose={() => setViewingRecord(null)} />}
    </div>
  );
};

export default AdminPanel;
