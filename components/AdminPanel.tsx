
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, ConsultationRecord, Pharmacist, PharmacyConfig, PillType, IngredientInfo } from '../types';
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
  onRefresh: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
    products, records, pharmacists, config, syncCode,
    onUpdateProducts, onUpdateRecords, onUpdatePharmacists, onUpdateConfig,
    onSetSyncCode, onRefresh
}) => {
  const [tab, setTab] = useState<'products' | 'records' | 'customers' | 'settings'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ConsultationRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSyncCode, setNewSyncCode] = useState(syncCode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 탭 변경 시 상담 로그 탭이면 새로고침 트리거
  useEffect(() => {
    if (tab === 'records' && syncCode) {
      onRefresh();
    }
  }, [tab, syncCode, onRefresh]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.surveyData.phone.includes(searchQuery)
    );
  }, [records, searchQuery]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct || !e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    files.forEach(file => {
      if (file.size > 1024 * 1024) {
        alert(`${file.name}의 용량이 너무 큽니다. 1MB 이하의 이미지를 사용해주세요.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditingProduct(prev => {
          if (!prev) return null;
          if (prev.images.includes(base64String)) return prev;
          return { ...prev, images: [...prev.images, base64String] };
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    if (!editingProduct) return;
    const newImages = editingProduct.images.filter((_, i) => i !== index);
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const addIngredient = () => {
    if (!editingProduct) return;
    const newIngredients = [...editingProduct.ingredients, { name: '', amount: 0, unit: 'mg' }];
    setEditingProduct({ ...editingProduct, ingredients: newIngredients });
  };

  const removeIngredient = (index: number) => {
    if (!editingProduct) return;
    const newIngredients = editingProduct.ingredients.filter((_, i) => i !== index);
    setEditingProduct({ ...editingProduct, ingredients: newIngredients });
  };

  const updateIngredient = (index: number, field: keyof IngredientInfo, value: any) => {
    if (!editingProduct) return;
    const newIngredients = [...editingProduct.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setEditingProduct({ ...editingProduct, ingredients: newIngredients });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b overflow-x-auto bg-white sticky top-0 z-10">
        {[
          { id: 'products', label: '제품 관리' },
          { id: 'records', label: '상담 로그' },
          { id: 'customers', label: '고객 관리' },
          { id: 'settings', label: '보안 연동 및 설정' }
        ].map((t) => (
          <button 
            key={t.id}
            onClick={() => { setTab(t.id as any); setSearchQuery(''); }}
            className={`px-6 py-4 font-black text-xs whitespace-nowrap transition-all ${tab === t.id ? 'text-teal-600 border-b-4 border-teal-600 bg-teal-50/30' : 'text-slate-400'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-4 shadow-xl">
             <div className="flex justify-between items-start">
               <div>
                  <h4 className="text-xl font-black flex items-center gap-2">🛡️ 강력한 기기간 동기화</h4>
                  <p className="text-xs opacity-60 mt-1 font-bold">동일한 보안 코드를 입력한 모든 기기의 데이터가 합쳐집니다.</p>
               </div>
               <button onClick={onRefresh} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">🔄</button>
             </div>
             
             <div className="bg-teal-900/30 p-4 rounded-2xl border border-teal-500/30 text-[11px] text-teal-200 leading-relaxed font-medium">
               💡 <b>데이터 유실 방지 시스템:</b> 본 앱은 '병합(Merge)' 로직을 사용하여 기기간 데이터가 덮어씌워지는 것을 방지합니다. 
               PC와 스마트폰에서 동시에 작업해도 각자의 기록이 서버에 안전하게 합산되어 저장됩니다.
             </div>

             <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSyncCode} 
                  onChange={e => setNewSyncCode(e.target.value)}
                  placeholder="약국 고유 보안 코드 (최소 6자)"
                  className="flex-1 p-4 bg-white/10 border-2 border-white/10 rounded-2xl outline-none focus:border-teal-500 font-black text-white placeholder:text-white/20"
                />
                <button 
                  onClick={() => {
                    if (newSyncCode.length < 6) return alert('보안을 위해 코드를 6자 이상 입력해주세요.');
                    onSetSyncCode(newSyncCode);
                    alert('보안 연동이 활성화되었습니다. 이제 다른 기기에서도 동일한 코드를 입력하세요.');
                  }}
                  className="px-8 py-4 bg-teal-500 text-white font-black rounded-2xl hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/30"
                >
                  보안 연동
                </button>
             </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
             <h3 className="font-black text-slate-800">제품 관리 ({products.length})</h3>
             <button onClick={() => setEditingProduct({ id: '', name: '', images: [], price: 0, storage: '상온', usage: '', ingredients: [], isActive: true, expirationDate: new Date().toISOString().split('T')[0], pillType: 'round-white' })} className="px-5 py-2.5 bg-teal-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-teal-600/20 active:scale-95 transition-all">+ 새 제품 등록</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {products.map(p => (
               <div key={p.id} className="p-4 bg-white border rounded-[2rem] flex flex-col gap-3 hover:shadow-md transition-all">
                  <div className="flex gap-4">
                    <img src={p.images[0] || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-2xl object-cover bg-slate-50 border shadow-sm" />
                    <div className="flex-1 truncate">
                        <h4 className="font-black text-slate-800 text-sm truncate">{p.name}</h4>
                        <p className="text-xs font-bold text-teal-600">{p.price.toLocaleString()}원</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingProduct(p)} className="flex-1 py-2.5 bg-slate-50 text-slate-600 font-black text-[10px] rounded-xl hover:bg-slate-100 transition-colors">수정</button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-black text-slate-800 tracking-tight">상담 로그 (기기간 병합 완료)</h3>
            <button onClick={onRefresh} className="text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full">최신 내역 가져오기</button>
          </div>
          <input 
            type="text" placeholder="고객 성함 또는 연락처 검색" 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-4 border-2 rounded-2xl outline-none focus:border-teal-500 font-bold"
          />
          <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 font-black text-[10px] text-slate-400 uppercase">
                <tr>
                  <th className="p-4">날짜</th>
                  <th className="p-4">고객명</th>
                  <th className="p-4 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold text-slate-600">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={3} className="p-20 text-center text-slate-300 italic font-medium">검색 결과가 없거나 기록이 비어있습니다.</td></tr>
                ) : filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-900">{r.customerName}</td>
                    <td className="p-4 flex gap-2 justify-center">
                      <button onClick={() => setViewingRecord(r)} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-black">상세보기</button>
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
              <h3 className="text-xl font-black">제품 정보 수정</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 font-bold text-xl">✕</button>
            </div>
            
            <form onSubmit={(e) => {
               e.preventDefault();
               const updated = editingProduct.id 
                 ? products.map(p => p.id === editingProduct.id ? editingProduct : p)
                 : [...products, { ...editingProduct, id: `P-${Date.now()}` }];
               onUpdateProducts(updated);
               setEditingProduct(null);
            }} className="flex-1 overflow-y-auto p-8 space-y-8">
              
              <div className="space-y-4">
                <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest border-l-4 border-teal-500 pl-2">제품 이미지 (용량 주의)</h4>
                <div className="grid grid-cols-4 gap-3">
                  {editingProduct.images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img src={img} className="w-full h-full rounded-2xl object-cover border-2 border-slate-100 shadow-sm" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-teal-500 transition-all">
                    <span className="text-2xl">+</span>
                  </button>
                  <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">제품명 *</label>
                    <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-teal-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">판매 가격(원) *</label>
                    <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} className="p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-teal-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-6 pb-2">
                <button type="submit" className="w-full py-5 bg-teal-600 text-white font-black rounded-3xl shadow-xl hover:bg-teal-700 transition-all">
                  제품 정보 저장 및 서버 동기화
                </button>
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
