import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { Product, ProductPlan, LicenseKey } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Coins, 
  KeyRound, 
  ShoppingCart, 
  Copy, 
  CheckCircle, 
  X, 
  Package, 
  Flame, 
  ArrowLeft, 
  Check, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCsrfToken, initSecurityHardening } from '../utils/security';
import { AnnouncementPopupModal } from '../components/ui/AnnouncementPopupModal';

// ─── Key Result Modal ─────────────────────────────────────────────────────────
function KeyResultModal({ keyData, productName, planLabel, onClose }: { keyData: LicenseKey; productName: string; planLabel: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(keyData.keyString);
    setCopied(true);
    toast.success('คัดลอกคีย์เรียบร้อยแล้ว!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#12141F] border border-red-500/40 w-full max-w-lg p-6 rounded-2xl shadow-[0_0_60px_rgba(230,0,0,0.25)] relative"
        >
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg bg-gray-800/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0 shadow-[0_0_20px_rgba(230,0,0,0.3)]">
              <CheckCircle size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">สั่งซื้อสินค้าสำเร็จ!</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                คุณได้รับคีย์สินค้า <span className="text-red-400 font-bold">{productName}</span> ({planLabel})
              </p>
            </div>
          </div>

          <div className="bg-[#0B0E14] border border-gray-800 rounded-xl p-4 mb-6 space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">รหัสคีย์ (License Key):</span>
            <div className="flex items-center justify-between gap-3 bg-[#161925] border border-red-500/30 rounded-lg p-3 font-mono text-sm text-red-300 font-bold tracking-wider">
              <span className="select-all break-all">{keyData.keyString}</span>
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(230,0,0,0.4)]'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกคีย์'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(230,0,0,0.4)] transition-all cursor-pointer"
          >
            ตกลง / ปิดหน้าต่าง
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Reseller Dashboard Page ─────────────────────────────────────────────
export function ResellerDashboard() {
  const { categories, products, keys, currentReseller, purchaseProductKey } = useStore();
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [purchasing, setPurchasing] = useState(false);
  const [boughtKey, setBoughtKey] = useState<LicenseKey | null>(null);

  useEffect(() => {
    const cleanup = initSecurityHardening();
    return cleanup;
  }, []);

  // Filter products by selected category
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.categoryId === selectedCategory);

  // Helper: calculate total stock count across all plans for a product
  const getProductTotalStock = (productId: string) => {
    return keys.filter(k => k.productId === productId && k.status === 'unused').length;
  };

  // Helper: calculate stock count for a specific plan
  const getPlanStock = (productId: string, planId: string) => {
    return keys.filter(k => k.productId === productId && k.planId === planId && k.status === 'unused').length;
  };

  // Get price display (e.g. ฿200 or ฿25 - ฿150)
  const getProductPriceLabel = (product: Product) => {
    if (!product.plans || product.plans.length === 0) return '฿0';
    const costs = product.plans.map(p => p.cost);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    if (minCost === maxCost) return `฿${minCost}`;
    return `฿${minCost} - ฿${maxCost}`;
  };

  const handleOpenProductDetail = (product: Product) => {
    setSelectedProduct(product);
    if (product.plans && product.plans.length > 0) {
      setSelectedPlanId(product.plans[0].id);
    } else {
      setSelectedPlanId('');
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedProduct || !selectedPlanId) {
      toast.error('กรุณาเลือกแพ็กเกจสินค้าที่ต้องการสั่งซื้อ');
      return;
    }

    const selectedPlan = selectedProduct.plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) return;

    const planStock = getPlanStock(selectedProduct.id, selectedPlan.id);
    if (planStock <= 0) {
      toast.error('สินค้าแพ็กเกจนี้หมดสต็อกแล้ว');
      return;
    }

    if ((currentReseller?.balance || 0) < selectedPlan.cost) {
      toast.error(`เครดิตไม่เพียงพอ (ต้องการ ${selectedPlan.cost} เครดิต)`);
      return;
    }

    setPurchasing(true);
    try {
      const csrfToken = getCsrfToken();
      const res = await purchaseProductKey(selectedProduct.id, selectedPlan.id, csrfToken);

      if (res.success && res.key) {
        setBoughtKey(res.key);
        toast.success(`สั่งซื้อ ${selectedProduct.title} (${selectedPlan.label}) สำเร็จ!`);
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการดึงคีย์');
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (err?.message || ''));
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16 text-white select-none">
      <AnnouncementPopupModal />

      {/* Credit Status Card Header */}
      <div className="bg-[#12141F]/90 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(230,0,0,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 p-0.5 shadow-[0_0_25px_rgba(230,0,0,0.5)]">
            <div className="w-full h-full bg-[#0B0E14] rounded-[14px] flex items-center justify-center text-red-500">
              <Coins size={28} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              ยินดีต้อนรับ, <span className="text-red-400">{currentReseller?.username || 'Reseller'}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              ร้านค้าจำหน่ายคีย์สินค้าดิจิทัลและโปรแกรมอัตโนมัติ 24 ชั่วโมง
            </p>
          </div>
        </div>

        <div className="bg-[#0B0E14] border border-gray-800 rounded-xl px-5 py-3 flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xs text-gray-400 font-medium">เครดิตคงเหลือ:</span>
          <span className="text-lg font-bold text-emerald-400 font-mono tracking-wider">
            ฿{(currentReseller?.balance || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
            <Layers size={16} className="text-red-500" />
            <span>หมวดหมู่ : <strong className="text-red-400 uppercase">{categories.find(c => c.id === selectedCategory)?.name || 'ทั้งหมด'}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(230,0,0,0.5)] scale-105'
                : 'bg-[#12141F] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            ทั้งหมด ({products.length})
          </button>

          {categories.map((cat) => {
            const catCount = products.filter(p => p.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(230,0,0,0.5)] scale-105'
                    : 'bg-[#12141F] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                {cat.name} ({catCount})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid Catalog (Matching Screenshot 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredProducts.map((prod) => {
          const totalStock = getProductTotalStock(prod.id);
          const priceLabel = getProductPriceLabel(prod);
          const isOutStock = totalStock <= 0;

          return (
            <motion.div
              key={prod.id}
              whileHover={{ y: -4 }}
              className="bg-[#12141F] border border-gray-800/80 hover:border-red-500/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-lg group cursor-pointer"
              onClick={() => handleOpenProductDetail(prod)}
            >
              <div>
                {/* Product Cover Image Container */}
                <div className="relative w-full aspect-square bg-[#0B0E14] overflow-hidden">
                  {prod.imageUrl ? (
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                      ไม่มีรูปภาพ
                    </div>
                  )}

                  {/* Top Badges */}
                  {prod.isPopular && (
                    <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(230,0,0,0.6)]">
                      <Flame size={12} />
                      ยอดฮิต
                    </span>
                  )}
                </div>

                {/* Info Content */}
                <div className="p-3.5">
                  <h3 className="text-xs font-bold text-white tracking-wide truncate mb-2">{prod.title}</h3>
                  
                  <div className="flex items-center justify-between text-[11px] mb-3">
                    <span className="text-red-500 font-bold text-sm">{priceLabel}</span>
                    <span className={isOutStock ? 'text-red-400 font-medium' : 'text-gray-400 font-medium'}>
                      {isOutStock ? 'สินค้าหมด' : `เหลือ ${totalStock} ชิ้น`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button & Sold Count */}
              <div className="p-3.5 pt-0 space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenProductDetail(prod);
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    isOutStock
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(230,0,0,0.4)] active:scale-95'
                  }`}
                >
                  <ShoppingCart size={13} />
                  <span>ซื้อเลย</span>
                </button>

                <div className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
                  <Flame size={11} className="text-amber-500" />
                  <span>ขายไปแล้ว {(prod.soldCount || 0).toLocaleString()} ชิ้น</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-[#12141F] border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
          <Package size={40} className="mx-auto mb-3 opacity-30 text-red-500" />
          <p className="text-sm">ไม่มีสินค้าในหมวดหมู่นี้</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT DETAIL & SELECTION MODAL (Matching Screenshot 2 100%)              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B0E14] border border-gray-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8"
            >
              {/* Top Navigation & Breadcrumbs */}
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <span>หน้าแรก</span>
                  <ChevronRight size={13} />
                  <span>ร้านค้า</span>
                  <ChevronRight size={13} />
                  <span>{categories.find(c => c.id === selectedProduct.categoryId)?.name || 'หมวดหมู่'}</span>
                  <ChevronRight size={13} />
                  <span className="text-white font-bold">{selectedProduct.title}</span>
                </div>

                <button
                  onClick={() => setSelectedProduct(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12141F] border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>ย้อนกลับ</span>
                </button>
              </div>

              {/* Product Header Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 font-bold">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">{selectedProduct.title}</h2>
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    {categories.find(c => c.id === selectedProduct.categoryId)?.name || 'GENERAL'}
                  </span>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: Large Cover Image */}
                <div className="md:col-span-5">
                  <div className="w-full aspect-square bg-[#12141F] border border-gray-800 rounded-2xl overflow-hidden relative shadow-xl">
                    {selectedProduct.imageUrl ? (
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                        ไม่มีรูปภาพ
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Plans Selector & Details */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-6">
                  <div>
                    {/* Header Title & Price starting tag */}
                    <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
                      <h3 className="text-lg font-bold text-white">{selectedProduct.title}</h3>
                      <div className="text-right">
                        <span className="text-[11px] text-gray-400 block">ราคาต่อชิ้น</span>
                        <span className="text-red-500 font-bold text-base">
                          {selectedPlanId 
                            ? `฿${selectedProduct.plans.find(p => p.id === selectedPlanId)?.cost || 0} บาท`
                            : getProductPriceLabel(selectedProduct)}
                        </span>
                      </div>
                    </div>

                    {/* Plan Options Selector Grid (Matching Screenshot 2) */}
                    <div className="space-y-2 mb-6">
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                        เลือกแผนราคา
                      </label>

                      <div className="grid grid-cols-2 gap-2.5">
                        {selectedProduct.plans.map((plan) => {
                          const planStock = getPlanStock(selectedProduct.id, plan.id);
                          const isSelected = selectedPlanId === plan.id;
                          const isOutOfStock = planStock <= 0;

                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => !isOutOfStock && setSelectedPlanId(plan.id)}
                              disabled={isOutOfStock}
                              className={`p-3.5 rounded-xl border text-left relative transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(230,0,0,0.3)]'
                                  : isOutOfStock
                                  ? 'bg-[#12141F]/40 border-gray-800/40 opacity-50 cursor-not-allowed'
                                  : 'bg-[#12141F] border-gray-800 hover:border-gray-700'
                              }`}
                            >
                              {/* Selected Checkmark Badge */}
                              {isSelected && (
                                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                                  <Check size={11} />
                                </span>
                              )}

                              <div className="text-xs font-bold text-white mb-1">{plan.label}</div>
                              <div className="text-sm font-bold text-red-400">฿{plan.cost}</div>
                              <div className={`text-[10px] mt-1.5 font-medium ${isOutOfStock ? 'text-red-400' : 'text-gray-400'}`}>
                                {isOutOfStock ? 'สินค้าหมด' : `เหลือ ${planStock} ชิ้น`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Product Description */}
                    <div className="bg-[#12141F] border border-gray-800/80 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">รายละเอียด</span>
                      <p className="text-xs text-gray-300 leading-relaxed font-light whitespace-pre-line">
                        {selectedProduct.description || '• บริการระบบอัตโนมัติ 24 ชั่วโมง\n• ปลอดภัย ใช้งานง่าย ได้รับของทันที'}
                      </p>
                    </div>
                  </div>

                  {/* Purchase Action Button */}
                  <div className="pt-4 border-t border-gray-800">
                    <button
                      onClick={handleConfirmPurchase}
                      disabled={purchasing || !selectedPlanId || getPlanStock(selectedProduct.id, selectedPlanId) <= 0}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs transition-all shadow-[0_0_25px_rgba(230,0,0,0.5)] hover:shadow-[0_0_35px_rgba(230,0,0,0.8)] active:scale-95 disabled:opacity-50 cursor-pointer tracking-wider flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={15} />
                      <span>{purchasing ? 'กำลังดึงคีย์...' : 'สั่งซื้อสินค้า / ดึงคีย์ ➔'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Extracted Key Modal */}
      {boughtKey && selectedProduct && (
        <KeyResultModal
          keyData={boughtKey}
          productName={selectedProduct.title}
          planLabel={selectedProduct.plans.find(p => p.id === boughtKey.planId)?.label || 'แพ็กเกจ'}
          onClose={() => setBoughtKey(null)}
        />
      )}
    </div>
  );
}
