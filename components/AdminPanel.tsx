
import React, { useState, useMemo, useRef } from 'react';
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

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.surveyData.phone.includes(searchQuery)
    );
  }, [records, searchQuery]);

  const uniqueCustomers = useMemo(() => {
    const customerMap = new Map<string, ConsultationRecord[]>();
    records.forEach(r => {
      const key = `${r.customerName}-${r.surveyData.phone}`;
      if (!customerMap.has(key)) customerMap.set(key, []);
      customerMap.get(key)!.push(r);
    });
    return Array.from(customerMap.entries()).map(([key, customerRecords]) => ({
      name: customerRecords[0].customerName,
      phone: customerRecords[0].surveyData.phone,
      lastStage: customerRecords[0].surveyData.stage,
      count: customerRecords.length,
      lastDate: customerRecords[0].date
    })).filter(c => c.name.includes(searchQuery) || c.phone.includes(searchQuery));
  }, [records, searchQuery]);

  // 이미지 파일 선택 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct || !e.target.files) return;
    
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditingProduct(prev => {
          if (!prev) return null;
          // 중복 방지 및 이미지 추가
          if (prev.images.includes(base64String)) return prev;
          return { ...prev, images: [...prev.images, base64String] };
        });
      };
      reader.readAsDataURL(file);
    });
    // 인풋 초기화 (같은 파일 다시 선택 가능하게)
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
                  <h4 className="text-xl font-black flex items-center gap-2">🛡️ 암호화 클라우드 동기화</h4>
                  <p className="text-xs opacity-60 mt-1 font-bold">동기화 코드는 우리 약국만의 '데이터 암호화 열쇠'가 됩니다.</p>
               </div>
               <button onClick={onRefresh} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">🔄</button>
             </div>
             
             <div className="bg-teal-900/30 p-4 rounded-2xl border border-teal-500/30 text-[11px] text-teal-200 leading-relaxed font-medium">
               💡 <b>보안 안내:</b> 입력하신 코드로 모든 상담 데이터 및 제품 정보가 256비트 암호화 처리됩니다. 
               코드를 모르면 외부인은 데이터를 절대 읽을 수 없습니다. 모든 기기에 동일한 코드를 입력해 주세요.
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
                    alert('강력한 보안 연동이 설정되었습니다.');
                  }}
                  className="px-8 py-4 bg-teal-500 text-white font-black rounded-2xl hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/30"
                >
                  보안 연동
                </button>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 space-y-6">
             <h4 className="font-black text-slate-800">기본 정보 설정</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">약국 명칭</label>
                  <input value={config.pharmacyName} onChange={e => onUpdateConfig({...config, pharmacyName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">대표 관리사 성함</label>
                  <input value={config.managerName} onChange={e => onUpdateConfig({...config, managerName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 font-bold" />
                </div>
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
                        <p className="text-[9px] text-slate-400 mt-0.5">이미지 {p.images.length}장 등록됨</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingProduct(p)} className="flex-1 py-2.5 bg-slate-50 text-slate-600 font-black text-[10px] rounded-xl hover:bg-slate-100 transition-colors">수정</button>
                    <button onClick={() => { if(confirm(`'${p.name}' 제품을 삭제하시겠습니까?`)) onUpdateProducts(products.filter(item => item.id !== p.id)) }} className="px-3 py-2 text-red-400 font-black text-[10px] hover:text-red-600 transition-colors">삭제</button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
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
                {filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-900">{r.customerName}</td>
                    <td className="p-4 flex gap-2 justify-center">
                      <button onClick={() => setViewingRecord(r)} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-black">상세보기</button>
                      <button onClick={() => { if(confirm('이 기록을 삭제하시겠습니까?')) onUpdateRecords(records.filter(item => item.id !== r.id)) }} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-black hover:bg-red-500 hover:text-white transition-all">삭제</button>
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
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-xl font-black">{editingProduct.id ? '제품 정보 수정' : '새 제품 등록'}</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 font-bold text-xl hover:text-slate-900">✕</button>
            </div>
            
            <form onSubmit={(e) => {
               e.preventDefault();
               if (editingProduct.images.length === 0) {
                 alert('최소 1장 이상의 제품 이미지를 등록해주세요.');
                 return;
               }
               const updated = editingProduct.id 
                 ? products.map(p => p.id === editingProduct.id ? editingProduct : p)
                 : [...products, { ...editingProduct, id: `P-${Date.now()}` }];
               onUpdateProducts(updated);
               setEditingProduct(null);
            }} className="flex-1 overflow-y-auto p-8 space-y-8">
              
              <div className="space-y-4">
                <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest border-l-4 border-teal-500 pl-2">제품 이미지 관리 (2장 이상 권장)</h4>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />

                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {editingProduct.images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img src={img} className="w-full h-full rounded-2xl object-cover border-2 border-slate-100 shadow-sm" />
                      <button 
                        type="button" 
                        onClick={() => removeImage(idx)} 
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                      {idx === 0 && <span className="absolute bottom-2 left-2 bg-teal-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black">대표 이미지</span>}
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-teal-500 hover:text-teal-500 hover:bg-teal-50 transition-all"
                  >
                    <span className="text-2xl">+</span>
                    <span className="text-[10px] font-black uppercase">사진 추가</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest border-l-4 border-teal-500 pl-2">기본 정보</h4>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">보관 방법</label>
                    <select value={editingProduct.storage} onChange={e => setEditingProduct({...editingProduct, storage: e.target.value as any})} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none">
                      <option value="상온">상온 보관</option>
                      <option value="냉장">냉장 보관</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">유효기간 *</label>
                    <input type="date" required value={editingProduct.expirationDate} onChange={e => setEditingProduct({...editingProduct, expirationDate: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-teal-500 outline-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">복용 방법 안내</label>
                    <input value={editingProduct.usage} onChange={e => setEditingProduct({...editingProduct, usage: e.target.value})} placeholder="예: 1일 1회 식후 복용" className="p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-teal-500 outline-none" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-l-4 border-teal-500 pl-2">
                   <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest">주요 성분 및 함량</h4>
                   <button type="button" onClick={addIngredient} className="text-[10px] font-black bg-teal-50 text-teal-600 px-3 py-1 rounded-full">+ 성분 추가</button>
                </div>
                <div className="space-y-2">
                  {editingProduct.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input placeholder="성분명" value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)} className="flex-1 p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" />
                      <input type="number" placeholder="함량" value={ing.amount} onChange={e => updateIngredient(idx, 'amount', parseFloat(e.target.value) || 0)} className="w-20 p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none text-center" />
                      <input placeholder="단위" value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)} className="w-16 p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none text-center" />
                      <button type="button" onClick={() => removeIngredient(idx)} className="text-red-300 hover:text-red-500 p-2">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-6 pb-2">
                <button type="submit" className="w-full py-5 bg-teal-600 text-white font-black rounded-3xl shadow-xl hover:bg-teal-700 transition-all transform active:scale-[0.98]">
                  제품 정보 저장 및 동기화
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
