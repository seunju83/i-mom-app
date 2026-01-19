
import React, { useState, useRef } from 'react';
import { Product, ConsultationRecord, Pharmacist, PharmacyConfig, IngredientInfo } from '../types';
import RecordDetailModal from './RecordDetailModal';

interface AdminPanelProps {
  products: Product[];
  records: ConsultationRecord[];
  pharmacists: Pharmacist[];
  config: PharmacyConfig;
  onUpdateProducts: (products: Product[]) => void;
  onUpdatePharmacists: (pharmacists: Pharmacist[]) => void;
  onUpdateConfig: (config: PharmacyConfig) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
    products, records, pharmacists, config, 
    onUpdateProducts, onUpdatePharmacists, onUpdateConfig 
}) => {
  const [tab, setTab] = useState<'products' | 'records' | 'settings'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ConsultationRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    const existingIndex = products.findIndex(p => p.id === editingProduct.id);
    if (existingIndex > -1) {
      const newProducts = [...products];
      newProducts[existingIndex] = editingProduct;
      onUpdateProducts(newProducts);
    } else {
      onUpdateProducts([...products, editingProduct]);
    }
    setEditingProduct(null);
  };

  const addNewProduct = () => {
    setEditingProduct({
      id: `PR-${Date.now()}`,
      name: '',
      images: ['https://picsum.photos/300/300'],
      price: 0,
      storage: '상온',
      usage: '',
      ingredients: [{ name: '', amount: 0, unit: 'mg' }],
      isActive: true,
      expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
      descriptionUrl: ''
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && editingProduct) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setEditingProduct(prev => prev ? { 
            ...prev, 
            images: [...prev.images, result] 
          } : null);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    if (!editingProduct) return;
    const newImages = editingProduct.images.filter((_, i) => i !== index);
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const handleAddIngredient = () => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      ingredients: [...editingProduct.ingredients, { name: '', amount: 0, unit: 'mg' }]
    });
  };

  const handleUpdateIngredient = (index: number, field: keyof IngredientInfo, value: string | number) => {
    if (!editingProduct) return;
    const newIngredients = [...editingProduct.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setEditingProduct({ ...editingProduct, ingredients: newIngredients });
  };

  const handleRemoveIngredient = (index: number) => {
    if (!editingProduct) return;
    const newIngredients = editingProduct.ingredients.filter((_, i) => i !== index);
    setEditingProduct({ ...editingProduct, ingredients: newIngredients });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b border-slate-100 print:hidden">
        {['products', 'records', 'settings'].map((t) => (
          <button 
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-8 py-5 font-black text-xs uppercase tracking-widest transition-all ${tab === t ? 'text-teal-600 border-b-4 border-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t === 'products' ? '제품 관리' : t === 'records' ? '상담/소분 기록' : '약국 설정'}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <div className="space-y-6 print:hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800">등록 제품 ({products.length})</h3>
            <button onClick={addNewProduct} className="px-6 py-3 bg-teal-600 text-white font-black rounded-2xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition">+ 새 제품 등록</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className={`p-5 border-2 rounded-2xl flex gap-5 transition-all hover:shadow-md ${p.isActive ? 'bg-white border-slate-50' : 'bg-slate-50 border-transparent opacity-60 grayscale'}`}>
                <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex-shrink-0">
                  <img src={p.images?.[0] || 'https://picsum.photos/300/300'} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 flex flex-col">
                  <h4 className="font-black text-slate-800 text-lg leading-tight mb-1">{p.name}</h4>
                  <p className="text-[10px] font-black text-teal-600 mb-2 uppercase tracking-tighter">유효기간: {p.expirationDate}</p>
                  <div className="mt-auto flex gap-4">
                    <button onClick={() => setEditingProduct(p)} className="text-xs font-black text-blue-600 hover:underline">수정</button>
                    <button onClick={() => onUpdateProducts(products.map(item => item.id === p.id ? {...item, isActive: !item.isActive} : item))} className="text-xs font-black text-amber-600 hover:underline">
                        {p.isActive ? '비활성' : '활성'}
                    </button>
                    <button onClick={() => confirm('정말 삭제하시겠습니까?') && onUpdateProducts(products.filter(item => item.id !== p.id))} className="text-xs font-black text-red-500 hover:underline">삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-800 mb-8">제품 정보 수정</h3>
            <form onSubmit={saveProduct} className="space-y-6">
              
              <div className="flex flex-col gap-4 mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">제품 이미지 (여러 장 등록 가능)</label>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {editingProduct.images.map((img, idx) => (
                    <div key={idx} className="w-32 h-32 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden relative group flex-shrink-0">
                      <img src={img} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    </div>
                  ))}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors flex-shrink-0"
                  >
                    <span className="text-2xl">➕</span>
                    <span className="text-[10px] font-black text-slate-400 mt-1 uppercase">사진 추가</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple
                  onChange={handleImageUpload} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">제품명</label>
                  <input 
                    required
                    className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">가격 (원)</label>
                  <input 
                    type="number"
                    required
                    className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">제품 상세 페이지 URL</label>
                <input 
                  className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  value={editingProduct.descriptionUrl || ''}
                  onChange={e => setEditingProduct({...editingProduct, descriptionUrl: e.target.value})}
                  placeholder="공식 상세 정보 링크 (예: https://...)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">보관 및 유효기간</label>
                  <div className="flex gap-2">
                    <select 
                        className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                        value={editingProduct.storage}
                        onChange={e => setEditingProduct({...editingProduct, storage: e.target.value as any})}
                    >
                        <option value="상온">상온</option>
                        <option value="냉장">냉장</option>
                    </select>
                    <input 
                        type="date"
                        className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                        value={editingProduct.expirationDate}
                        onChange={e => setEditingProduct({...editingProduct, expirationDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">제형 타입</label>
                   <select 
                        className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                        value={editingProduct.pillType || 'round-white'}
                        onChange={e => setEditingProduct({...editingProduct, pillType: e.target.value as any})}
                    >
                        <option value="round-white">흰색 원형 정제</option>
                        <option value="oval-yellow">노란색 타원형 연질</option>
                        <option value="capsule-brown">갈색 캡슐</option>
                        <option value="small-round">작은 원형</option>
                        <option value="powder-pack">분말 포</option>
                    </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">함유 성분</label>
                  <button type="button" onClick={handleAddIngredient} className="text-[10px] font-black text-teal-600">+ 성분 추가</button>
                </div>
                <div className="space-y-2">
                  {editingProduct.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input 
                        placeholder="성분명"
                        className="flex-1 p-2 border rounded-lg text-sm"
                        value={ing.name}
                        onChange={e => handleUpdateIngredient(idx, 'name', e.target.value)}
                      />
                      <input 
                        type="number"
                        placeholder="함량"
                        className="w-20 p-2 border rounded-lg text-sm text-center"
                        value={ing.amount}
                        onChange={e => handleUpdateIngredient(idx, 'amount', parseFloat(e.target.value))}
                      />
                      <input 
                        placeholder="단위"
                        className="w-16 p-2 border rounded-lg text-sm text-center"
                        value={ing.unit}
                        onChange={e => handleUpdateIngredient(idx, 'unit', e.target.value)}
                      />
                      <button type="button" onClick={() => handleRemoveIngredient(idx)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">복용법 안내 문구</label>
                <input 
                  className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                  value={editingProduct.usage}
                  onChange={e => setEditingProduct({...editingProduct, usage: e.target.value})}
                  placeholder="예: 1일 1회 식사 직후 복용"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl">취소</button>
                <button type="submit" className="flex-1 py-4 bg-teal-600 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20">저장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-6 print:hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800">상담 및 소분 판매 로그</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">법정 3년 보관 의무 준수 (이후 자동 삭제)</span>
          </div>
          <div className="bg-white border-2 border-slate-50 rounded-[2rem] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">일시</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">고객명</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">담당 약사</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">금액</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold">저장된 상담 기록이 없습니다.</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="hover:bg-teal-50/20 transition group">
                    <td className="p-5 text-sm text-slate-500 font-bold whitespace-nowrap">{new Date(r.date).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="p-5 text-sm text-slate-800 font-black">{r.customerName}</td>
                    <td className="p-5 text-sm text-slate-500 font-medium">{r.pharmacistName}</td>
                    <td className="p-5 text-sm text-teal-600 font-black text-right">{r.totalPrice.toLocaleString()}원</td>
                    <td className="p-5 text-center">
                        <button onClick={() => setViewingRecord(r)} className="px-4 py-2 bg-slate-100 text-slate-600 font-black rounded-xl text-[10px] hover:bg-teal-600 hover:text-white transition-all shadow-sm">상세보기</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
          <section className="bg-white p-8 rounded-[2rem] border-2 border-slate-50 shadow-sm flex flex-col h-fit">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">🏪</span> 약국 및 사업자 정보
            </h3>
            <div className="space-y-5">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">약국 정식 명칭</label>
                    <input 
                        className="p-4 border-2 border-slate-100 rounded-2xl font-black text-xl focus:border-teal-500 outline-none transition-all shadow-inner"
                        value={config.pharmacyName}
                        onChange={e => onUpdateConfig({...config, pharmacyName: e.target.value})}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">판매 장소 (주소)</label>
                    <input 
                        className="p-4 border-2 border-slate-100 rounded-2xl font-bold text-sm focus:border-teal-500 outline-none transition-all shadow-inner"
                        value={config.businessAddress}
                        onChange={e => onUpdateConfig({...config, businessAddress: e.target.value})}
                        placeholder="세종시 보듬3로 150..."
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">소분 관리사 성함</label>
                    <input 
                        className="p-4 border-2 border-slate-100 rounded-2xl font-black text-lg focus:border-teal-500 outline-none transition-all shadow-inner"
                        value={config.managerName}
                        onChange={e => onUpdateConfig({...config, managerName: e.target.value})}
                        placeholder="성함 입력"
                    />
                </div>
            </div>
          </section>
        </div>
      )}

      {/* Record Detail Modal */}
      {viewingRecord && (
        <RecordDetailModal 
          record={viewingRecord} 
          config={config} 
          onClose={() => setViewingRecord(null)} 
        />
      )}
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
