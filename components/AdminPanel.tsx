
import React, { useState, useMemo, useRef } from 'react';
import { Product, ConsultationRecord, Pharmacist, PharmacyConfig, PillType } from '../types';
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
  onForcePush: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
    products, records, pharmacists, config, syncCode,
    onUpdateProducts, onUpdateRecords, onUpdatePharmacists, onUpdateConfig,
    onSetSyncCode, onForcePush
}) => {
  const [tab, setTab] = useState<'products' | 'records' | 'settings'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ConsultationRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.surveyData && r.surveyData.phone.includes(searchQuery))
    );
  }, [records, searchQuery]);

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('이 상담 기록을 영구 삭제하시겠습니까? 연동된 모든 기기에서 사라집니다.')) {
      onUpdateRecords(records.filter(r => r.id !== id));
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ products, records, config, syncCode });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `아이맘약국_백업_${new Date().toLocaleDateString()}.json`);
    linkElement.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.products) onUpdateProducts(data.products);
        if (data.records) onUpdateRecords(data.records);
        if (data.config) onUpdateConfig(data.config);
        alert('데이터 복구가 완료되었습니다.');
      } catch (err) { alert('유효하지 않은 파일입니다.'); }
    };
    reader.readAsText(file);
  };

  const PILL_TYPES: {value: PillType, label: string}[] = [
    { value: 'round-white', label: '흰색 원형' },
    { value: 'oval-yellow', label: '노란 타원형' },
    { value: 'capsule-brown', label: '갈색 캡슐' },
    { value: 'small-round', label: '작은 원형' },
    { value: 'powder-pack', label: '가루/포' }
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex border-b bg-white sticky top-0 z-10 overflow-x-auto no-scrollbar">
        {['products', 'records', 'settings'].map((t) => (
          <button key={t} onClick={() => setTab(t as any)} className={`px-6 py-4 font-black text-xs transition-all ${tab === t ? 'text-teal-600 border-b-4 border-teal-600 bg-teal-50/30' : 'text-slate-400'}`}>
            {t === 'products' ? '📦 제품 관리' : t === 'records' ? '📋 상담 로그' : '⚙️ 연동 및 백업'}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <div className="space-y-6 animate-in slide-in-from-bottom">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-6 shadow-xl">
             <div className="flex justify-between items-center">
               <h4 className="text-xl font-black">🔗 기기간 연동 (Cloud Sync)</h4>
               <button onClick={onForcePush} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-[10px] font-black animate-pulse">지금 서버에 동기화</button>
             </div>
             <input type="text" value={syncCode} onChange={e => onSetSyncCode(e.target.value)} placeholder="약국 고유 코드 입력 (예: imom01)" className="w-full p-5 bg-white/10 border-2 border-white/10 rounded-2xl outline-none focus:border-teal-500 font-black text-white text-lg" />
          </div>

          <div className="bg-white p-8 rounded-[3rem] border space-y-6 shadow-sm">
             <h4 className="text-xl font-black text-slate-800">💾 데이터 수동 백업</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={exportData} className="p-5 bg-slate-800 text-white rounded-2xl font-black text-sm">내보내기 (JSON 파일로 저장)</button>
                <label className="p-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm text-center cursor-pointer">
                   가져오기 (파일로 복구)
                   <input type="file" className="hidden" accept=".json" onChange={importData} />
                </label>
             </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
             <h3 className="font-black text-slate-800">보유 제품 ({products.length})</h3>
             <button onClick={() => setEditingProduct({ id: '', name: '', images: [], price: 0, storage: '상온', usage: '', ingredients: [], isActive: true, expirationDate: new Date().toISOString().split('T')[0], pillType: 'round-white' })} className="px-5 py-3 bg-teal-600 text-white rounded-2xl text-[11px] font-black shadow-lg hover:bg-teal-700 transition-all">+ 새 제품 추가</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {products.map(p => (
               <div key={p.id} className="p-5 bg-white border rounded-[2.5rem] flex flex-col gap-4 hover:shadow-md transition-all">
                  <div className="flex gap-4">
                    <img src={p.images[0] || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-2xl object-cover bg-slate-50 border shrink-0" />
                    <div className="flex-1 truncate">
                        <h4 className="font-black text-slate-800 text-sm truncate">{p.name}</h4>
                        <p className="text-xs font-bold text-teal-600">{p.price.toLocaleString()}원</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingProduct(p)} className="w-full py-2 bg-slate-50 text-slate-600 font-black text-[10px] rounded-xl hover:bg-slate-900 hover:text-white transition-all">수정하기</button>
               </div>
             ))}
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          <input type="text" placeholder="고객명 또는 연락처로 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-5 border-2 rounded-[2.5rem] outline-none focus:border-teal-500 font-bold shadow-sm" />
          <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 font-black text-[10px] text-slate-400 uppercase">
                <tr>
                  <th className="p-5 pl-8">날짜</th>
                  <th className="p-5">고객명</th>
                  <th className="p-5 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold text-slate-600">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={3} className="p-24 text-center text-slate-300 italic">내역이 없습니다.</td></tr>
                ) : filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 pl-8 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-5 text-slate-900 font-black">{r.customerName}</td>
                    <td className="p-5 flex items-center justify-center gap-3">
                      <button onClick={() => setViewingRecord(r)} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-[10px] font-black shadow-md">기록지</button>
                      <button onClick={() => handleDeleteRecord(r.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xl">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/70 z-[300] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">제품 상세 관리</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-300 hover:text-slate-900 text-2xl font-bold">✕</button>
            </div>
            <form onSubmit={(e) => {
               e.preventDefault();
               const updated = editingProduct.id ? products.map(p => p.id === editingProduct.id ? editingProduct : p) : [...products, { ...editingProduct, id: `P-${Date.now()}` }];
               onUpdateProducts(updated);
               setEditingProduct(null);
            }} className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">제품명</label>
                  <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">판매가(원)</label>
                  <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">제형</label>
                  <select value={editingProduct.pillType} onChange={e => setEditingProduct({...editingProduct, pillType: e.target.value as any})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-teal-500">
                    {PILL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">유효기간</label>
                  <input type="date" value={editingProduct.expirationDate} onChange={e => setEditingProduct({...editingProduct, expirationDate: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-teal-600">영양 성분</label>
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
                    }} className="w-20 p-3 bg-slate-50 rounded-xl text-xs font-bold" />
                    <input placeholder="단위" value={ing.unit} onChange={e => {
                      const newIngs = [...editingProduct.ingredients];
                      newIngs[idx].unit = e.target.value;
                      setEditingProduct({...editingProduct, ingredients: newIngs});
                    }} className="w-16 p-3 bg-slate-50 rounded-xl text-xs font-bold" />
                    <button type="button" onClick={() => setEditingProduct({...editingProduct, ingredients: editingProduct.ingredients.filter((_, i) => i !== idx)})} className="text-red-400 font-bold px-2">✕</button>
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full py-5 bg-teal-600 text-white font-black rounded-3xl shadow-xl hover:bg-teal-700 transition-all">저장 및 동기화</button>
            </form>
          </div>
        </div>
      )}

      {viewingRecord && <RecordDetailModal record={viewingRecord} config={config} onClose={() => setViewingRecord(null)} />}
    </div>
  );
};

export default AdminPanel;
