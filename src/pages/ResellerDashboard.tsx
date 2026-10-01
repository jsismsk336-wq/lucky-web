import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { Product, ProductPlan, LicenseKey } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Search, 
  Zap, 
  Copy, 
  CheckCircle, 
  X, 
  Package, 
  Check, 
  Minus, 
  Plus, 
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCsrfToken, initSecurityHardening } from '../utils/security';
import { AnnouncementPopupModal } from '../components/ui/AnnouncementPopupModal';
import { TopupModal } from '../components/ui/TopupModal';

// ─── Key Result Modal (Supports single or multiple pulled keys) ──────────────────
function KeyResultModal({ keysData, productName, planLabel, onClose }: { keysData: LicenseKey[]; productName: string; planLabel: string; onClose: () => void }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyOne = (keyStr: string, idx: number) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedIndex(idx);
    toast.success(`คัดลอกคีย์ #${idx + 1} เรียบร้อยแล้ว!`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allKeysText = keysData.map(k => k.keyString).join('\n');
    navigator.clipboard.writeText(allKeysText);
    setCopiedAll(true);
    toast.success(`คัดลอกคีย์ทั้งหมด ${keysData.length} คีย์ เรียบร้อยแล้ว!`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-[95%] sm:w-full max-w-xl max-h-[90vh] bg-[#101012] border border-white/12 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 text-white overflow-y-auto custom-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0091ff]/10 border border-[#0091ff]/30 flex items-center justify-center text-[#0091ff]">
                <CheckCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">เบิกคีย์สินค้าสำเร็จ!</h3>
                <p className="text-xs text-gray-400">
                  {productName} — <span className="text-[#0091ff] font-semibold">{planLabel}</span> (รวม {keysData.length} คีย์)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Key List container */}
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {keysData.map((k, idx) => (
              <div
                key={k.id || idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#16181b] border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-gray-500 shrink-0">#{idx + 1}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 truncate select-all tracking-wider">
                    {k.keyString}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyOne(k.keyString, idx)}
                  className="px-3 py-1.5 rounded-lg bg-[#212326] hover:bg-[#2e3033] text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  {copiedIndex === idx ? (
                    <span className="text-emerald-400">คัดลอกแล้ว!</span>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>คัดลอก</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center gap-3">
            {keysData.length > 1 && (
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex-1 py-3 rounded-xl bg-[#0091ff] hover:bg-[#43a1ff] text-white font-bold text-xs transition-all shadow-lg shadow-[#0091ff]/20 flex items-center justify-center gap-2"
              >
                <Copy size={15} />
                <span>{copiedAll ? 'คัดลอกครบทั้งหมดแล้ว!' : `คัดลอกคีย์ทั้งหมด (${keysData.length} คีย์)`}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#212326] hover:bg-[#2e3033] text-gray-300 font-bold text-xs transition-all"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Reseller Dashboard Page (Matching luckystore.rzxhub.com Theme 100%) ───────
export function ResellerDashboard() {
  const { categories, products, keys, currentReseller, purchaseProductKey } = useStore();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [purchasing, setPurchasing] = useState(false);
  const [boughtKeys, setBoughtKeys] = useState<LicenseKey[]>([]);

  useEffect(() => {
    const cleanup = initSecurityHardening();
    return cleanup;
  }, []);

  // Set default product selection on initial load if products exist
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      handleSelectProduct(products[0]);
    }
  }, [products]);

  // Filter products by search query and category (and exclude disabled products)
  const filteredProducts = products.filter(p => {
    if (p.isDisabled) return false;
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper: calculate total stock count across all plans for a product
  const getProductTotalStock = (product: Product) => {
    if (product.isAutoStock || Boolean(product.customPullUrl)) return 999;
    if (!product.plans || product.plans.length === 0) return 0;
    return keys.filter(k => {
      if (k.status !== 'unused') return false;
      if (k.productId === product.id) return true;
      if (!k.productId) {
        return product.plans.some(plan => Number(plan.days) === Number(k.durationDays));
      }
      return false;
    }).length;
  };

  // Helper: calculate stock for a specific plan
  const getPlanStock = (productId: string, planId: string, durationDays: number, plan?: ProductPlan) => {
    const product = products.find(p => p.id === productId);
    if (product?.isAutoStock || Boolean(product?.customPullUrl) || plan?.isAutoStock) {
      return 999;
    }
    return keys.filter(k => {
      if (k.status !== 'unused') return false;
      if (k.productId && k.planId) {
        return k.productId === productId && k.planId === planId;
      }
      if (k.productId && !k.planId) {
        return k.productId === productId && Number(k.durationDays) === Number(durationDays);
      }
      return Number(k.durationDays) === Number(durationDays);
    }).length;
  };

  // Helper: get minimum starting price for a product
  const getProductMinPrice = (product: Product) => {
    if (!product.plans || product.plans.length === 0) return 0;
    return Math.min(...product.plans.map(p => p.cost));
  };

  // Handle choosing a product
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    if (product.plans && product.plans.length > 0) {
      setSelectedPlanId(product.plans[0].id);
    } else {
      setSelectedPlanId('');
    }
  };

  // Handle choosing a plan
  const handleSelectPlan = (plan: ProductPlan) => {
    setSelectedPlanId(plan.id);
    setQuantity(1);
  };

  // Handle instant key purchase
  const handleConfirmPurchase = async () => {
    if (!selectedProduct || !selectedPlanId) {
      toast.error('กรุณาเลือกสินค้าและแพ็กเกจที่ต้องการเบิก');
      return;
    }

    const selectedPlan = selectedProduct.plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) {
      toast.error('ไม่พบข้อมูลแพ็กเกจ');
      return;
    }

    const availableStock = getPlanStock(selectedProduct.id, selectedPlan.id, selectedPlan.days);
    const pullQty = Math.max(1, Math.min(50, quantity));

    if (availableStock < pullQty) {
      toast.error(`สินค้าหมดหรือไม่พอในระบบ (ต้องการ ${pullQty} คีย์ แต่มีเพียง ${availableStock} คีย์)`);
      return;
    }

    const totalCost = selectedPlan.cost * pullQty;
    if ((currentReseller?.balance || 0) < totalCost) {
      toast.error(`พอยท์ไม่เพียงพอ (ต้องการ ${totalCost} พอยท์ แต่คุณมี ${currentReseller?.balance || 0} พอยท์)`);
      return;
    }

    setPurchasing(true);
    try {
      const csrfToken = getCsrfToken();
      const res = await purchaseProductKey(selectedProduct.id, selectedPlan.id, csrfToken, pullQty);

      if (res.success && (res.keys || res.key)) {
        const receivedKeys = res.keys || [res.key!];
        setBoughtKeys(receivedKeys);
        toast.success(`เบิกคีย์ ${selectedProduct.title} (${selectedPlan.label}) จำนวน ${receivedKeys.length} คีย์ สำเร็จ!`);
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการดึงคีย์');
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (err?.message || ''));
    } finally {
      setPurchasing(false);
    }
  };

  const [isTopupOpen, setIsTopupOpen] = useState(false);

  const selectedPlan = selectedProduct?.plans.find(p => p.id === selectedPlanId);
  const currentPlanStock = selectedProduct && selectedPlan 
    ? getPlanStock(selectedProduct.id, selectedPlan.id, selectedPlan.days) 
    : 0;

  return (
    <div className="space-y-6 font-sans pb-16 text-white select-none bg-transparent min-h-screen">
      <AnnouncementPopupModal />
      {isTopupOpen && (
        <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
      )}

      {/* Subtitle Announcement Banner */}
      <div className="bg-[#101012] border border-white/12 rounded-2xl p-4 text-xs sm:text-sm text-gray-300 font-medium shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-[#0091ff] shrink-0" />
          <span>เลือกระบบเกม ซอฟต์แวร์ หรือแพ็กเกจที่ต้องการ เพื่อเบิกคีย์แท้เข้าคลังทันทีใน 1 วินาที</span>
        </div>
        <button
          onClick={() => setIsTopupOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all shrink-0 active:scale-[0.98]"
        >
          <Wallet size={15} />
          <span>เติมเงินซองทรูมันนี่</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#101012] border border-white/12 rounded-2xl p-3.5">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า คีย์ หรือหมวดหมู่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#16181b] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#0091ff] transition-colors font-medium"
          />
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#0091ff] text-white shadow-[0_0_15px_rgba(0,145,255,0.3)]'
                : 'bg-[#16181b] text-gray-400 border border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            ทั้งหมด ({products.length})
          </button>

          {categories.map((cat) => {
            const count = products.filter(p => p.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#0091ff] text-white shadow-[0_0_15px_rgba(0,145,255,0.3)]'
                    : 'bg-[#16181b] text-gray-400 border border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Reseller Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ========================================================================= */}
        {/* LEFT COLUMN: 1. เลือกสินค้าที่คุณต้องการเบิก                                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-[#101012] border border-white/12 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Package size={16} className="text-[#0091ff]" />
              <span>1. เลือกสินค้าที่คุณต้องการเบิก ({filteredProducts.length} รายการ)</span>
            </h2>
          </div>

          {/* Scrollable Products List Container */}
          <div className="max-h-[580px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((prod) => {
                const isSelected = selectedProduct?.id === prod.id;
                const minPrice = getProductMinPrice(prod);
                const categoryName = categories.find(c => c.id === prod.categoryId)?.name || 'ทั่วไป';

                return (
                  <motion.div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    whileHover={{ scale: 1.01 }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#1a1c1f] border-2 border-[#0091ff] shadow-[0_0_15px_rgba(0,145,255,0.25)]'
                        : 'bg-[#16181b] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#0091ff] text-white text-[10px] font-bold shadow-md flex items-center gap-1 z-10">
                        <Check size={11} />
                        <span>เลือกอยู่</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-[#212326] border border-white/10 overflow-hidden shrink-0 relative">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px]">
                            ไม่มีรูป
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="min-w-0 flex-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#18273a] border border-[#1d4570] text-[#319bff] text-[9px] font-bold uppercase tracking-wider mb-1">
                          {categoryName}
                        </span>
                        <h3 className="text-xs font-bold text-white tracking-wide truncate">{prod.title}</h3>
                      </div>
                    </div>

                    {/* Bottom Price Line */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10 text-[11px]">
                      <span className="text-gray-400">เริ่มต้น</span>
                      <span className="text-[#319bff] font-bold">{minPrice} พอยท์</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="p-12 text-center text-gray-500 bg-[#16181b] border border-white/10 rounded-xl">
                <Package size={36} className="mx-auto mb-2 opacity-30 text-[#0091ff]" />
                <p className="text-xs">ไม่พบคีย์หรือสินค้าที่ค้นหา</p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 2. เลือกระยะเวลา & 3. ดึงคีย์ CHECKOUT PANEL                   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-[#101012] border border-white/12 rounded-2xl p-5 space-y-6 sticky top-4">
          
          {selectedProduct ? (
            <>
              {/* Selected Product Header Title */}
              <div className="bg-[#16181b] border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#212326] border border-white/10 overflow-hidden shrink-0">
                  {selectedProduct.imageUrl ? (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">N/A</div>
                  )}
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#0091ff] tracking-wider">
                    [{categories.find(c => c.id === selectedProduct.categoryId)?.name || 'ทั่วไป'}]
                  </span>
                  <h3 className="text-sm font-bold text-white">{selectedProduct.title}</h3>
                </div>
              </div>

              {/* 2. เลือกระยะเวลา / แพ็กเกจ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className="text-[#0091ff]" />
                    <span>2. เลือกระยะเวลา / แพ็กเกจ</span>
                  </span>
                  <span className="text-gray-400 font-medium">({selectedProduct.plans.length} ตัวเลือก)</span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {selectedProduct.plans.map((plan) => {
                    const isAuto = selectedProduct.isAutoStock || Boolean(selectedProduct.customPullUrl) || plan.isAutoStock;
                    const planStock = getPlanStock(selectedProduct.id, plan.id, plan.days, plan);
                    const isSelected = selectedPlanId === plan.id;
                    const isOutOfStock = !isAuto && planStock <= 0;

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => !isOutOfStock && handleSelectPlan(plan)}
                        disabled={isOutOfStock}
                        className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#18273a] border-2 border-[#0091ff] text-white shadow-[0_0_15px_rgba(0,145,255,0.2)]'
                            : isOutOfStock
                            ? 'bg-[#16181b]/40 border-white/5 opacity-40 cursor-not-allowed'
                            : 'bg-[#16181b] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white mb-0.5">{plan.label}</div>
                          <div className={`text-[10px] font-medium ${isOutOfStock ? 'text-red-400' : isAuto ? 'text-emerald-400 font-bold' : 'text-emerald-400'}`}>
                            {isOutOfStock ? 'สินค้าหมด' : isAuto ? '🟢 สต็อกอัตโนมัติ (พร้อมเบิก)' : `สต็อกคงเหลือ ${planStock} คีย์`}
                          </div>
                        </div>

                        <div className="text-sm font-bold text-[#0091ff]">
                          {plan.cost} พอยท์
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. จำนวนคีย์ที่ต้องการ (Stepper & Presets 1, 5, 10, 25, 50) */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  3. จำนวนคีย์ที่ต้องการ
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Stepper `-` input `+` */}
                  <div className="flex items-center bg-[#16181b] border border-white/10 rounded-xl overflow-hidden p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={quantity <= 1 || currentPlanStock <= 0}
                      className="w-8 h-8 flex items-center justify-center bg-[#212326] hover:bg-[#0091ff] disabled:opacity-30 text-white font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={Math.min(50, currentPlanStock)}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const maxAllowed = Math.min(50, currentPlanStock > 0 ? currentPlanStock : 1);
                        setQuantity(Math.min(maxAllowed, Math.max(1, val)));
                      }}
                      disabled={currentPlanStock <= 0}
                      className="w-12 text-center bg-transparent text-white font-bold text-xs focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.min(50, Math.min(currentPlanStock, prev + 1)))}
                      disabled={quantity >= Math.min(50, currentPlanStock) || currentPlanStock <= 0}
                      className="w-8 h-8 flex items-center justify-center bg-[#212326] hover:bg-[#0091ff] disabled:opacity-30 text-white font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Preset Buttons 1, 5, 10, 25, 50 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 5, 10, 25, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQuantity(Math.min(preset, Math.min(50, currentPlanStock)))}
                        disabled={currentPlanStock < preset}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          quantity === preset
                            ? 'bg-[#0091ff] border-[#0091ff] text-white shadow-[0_0_10px_rgba(0,145,255,0.4)]'
                            : 'bg-[#16181b] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                        } disabled:opacity-30 cursor-pointer`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Calculation Summary Box */}
              <div className="bg-[#16181b] border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>ราคาต่อหน่วย</span>
                  <span className="text-white font-bold">{selectedPlan ? selectedPlan.cost : 0} พอยท์</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>จำนวนที่เลือก</span>
                  <span className="text-white font-bold">{quantity} ชิ้น</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <div>
                    <span className="font-bold text-white text-sm block">ยอดรวมพอยท์ที่ต้องใช้:</span>
                    <span className="text-[10px] text-gray-400">(พอยท์ของคุณ: {currentReseller?.balance?.toLocaleString() || 0} PTS)</span>
                  </div>
                  <span className="text-lg font-black text-[#0091ff]">
                    {selectedPlan ? (selectedPlan.cost * quantity).toLocaleString() : 0} PTS
                  </span>
                </div>
              </div>

              {/* Instant Pull Main Action Button */}
              <button
                onClick={handleConfirmPurchase}
                disabled={purchasing || !selectedPlanId || currentPlanStock <= 0}
                className="w-full py-3.5 rounded-xl bg-[#0091ff] hover:bg-[#43a1ff] text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-[#0091ff]/20 active:scale-95 disabled:opacity-50 cursor-pointer tracking-wider flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                <span>
                  {purchasing 
                    ? 'กำลังเบิกคีย์...' 
                    : selectedPlan 
                      ? `เบิกคีย์ทันที (${(selectedPlan.cost * quantity).toLocaleString()} พอยท์)` 
                      : 'เบิกคีย์ทันที'}
                </span>
              </button>
            </>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Package size={40} className="mx-auto mb-3 opacity-30 text-[#0091ff]" />
              <p className="text-xs">กรุณาเลือกสินค้าจากฝั่งซ้าย</p>
            </div>
          )}

        </div>

      </div>

      {/* Extracted Key Result Modal */}
      {boughtKeys.length > 0 && selectedProduct && (
        <KeyResultModal
          keysData={boughtKeys}
          productName={selectedProduct.title}
          planLabel={selectedProduct.plans.find(p => p.id === boughtKeys[0]?.planId)?.label || 'แพ็กเกจ'}
          onClose={() => setBoughtKeys([])}
        />
      )}
    </div>
  );
}
