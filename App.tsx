import React, { useState, useCallback, useRef } from 'react';
import { AppTab, ClothingItem, ProcessState, Category, AnalysisResult, ShopRecommendation, ShopItem } from './types';
import { analyzeClothingImage, generateTryOn, recommendShopOutfit, generateShopTryOn } from './services/geminiService';
import UploadZone from './components/UploadZone';
import CameraModal from './components/CameraModal';
import ProcessingView from './components/ProcessingView';
import ResultView from './components/ResultView';
import { HomeIcon, WardrobeIcon, UserIcon, HangerIcon, PlusIcon, SparklesIcon, XIcon, CheckIcon, ShoppingBagIcon, TagIcon } from './components/Icons';

// --- Components ---

// Bottom Navigation Component
const BottomNav = ({ activeTab, onTabChange }: { activeTab: AppTab, onTabChange: (t: AppTab) => void }) => {
  const navItems = [
    { id: AppTab.UPLOAD, icon: PlusIcon, label: '上傳' },
    { id: AppTab.WARDROBE, icon: WardrobeIcon, label: '衣櫥' },
    { id: AppTab.FITTING_ROOM, icon: HangerIcon, label: '試穿間' },
    { id: AppTab.SHOPPING, icon: ShoppingBagIcon, label: '網購試穿' }, // Changed Profile to Shopping
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-400'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10 scale-110' : ''}`}>
                 <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
};

// Wardrobe Component
const WardrobeView = ({ items }: { items: ClothingItem[] }) => {
  const [filter, setFilter] = useState<Category | '全部'>('全部');
  const categories: (Category | '全部')[] = ['全部', '上衣', '下著', '內搭', '外套', '鞋子', '配飾'];

  const filteredItems = filter === '全部' ? items : items.filter(i => i.category === filter);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-24 animate-fade-in">
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === cat 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
           <HangerIcon className="w-16 h-16 mb-4 opacity-20" />
           <p>這裡還沒有衣物，快去上傳吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow aspect-[3/4]">
              <img src={item.image} alt={item.category} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-white text-xs font-medium truncate">{item.description}</p>
              </div>
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">
                {item.category}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Fitting Room Component
const FittingRoomView = ({ 
  wardrobe, 
  userPhoto, 
  onUploadUserPhoto,
  onGenerate
}: { 
  wardrobe: ClothingItem[], 
  userPhoto: string | null, 
  onUploadUserPhoto: (f: File) => void,
  onGenerate: (selectedIds: string[]) => void
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItems(newSet);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-24 animate-slide-up">
      <div className="bg-gradient-to-br from-primary to-accent-purple rounded-3xl p-6 text-white mb-6 shadow-lg shadow-blue-500/20">
         <h2 className="text-2xl font-display font-bold mb-2">智能試穿鏡</h2>
         <p className="text-white/80 text-sm">上傳全身照，選擇衣物，AI 幫你一鍵換裝。</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* User Photo Section */}
        <div className="w-full md:w-1/3">
           <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> 我的身形
              </h3>
              {userPhoto ? (
                <div className="relative rounded-xl overflow-hidden aspect-[3/4] group">
                   <img src={userPhoto} className="w-full h-full object-cover" alt="User" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-bold">
                        更換照片
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onUploadUserPhoto(e.target.files[0])} />
                      </label>
                   </div>
                </div>
              ) : (
                <UploadZone 
                  compact 
                  title="上傳全身照" 
                  subtitle="正面清晰全身照效果最佳"
                  onFileSelect={onUploadUserPhoto}
                  onCameraRequest={() => document.getElementById('camera-trigger')?.click()}
                />
              )}
           </div>
        </div>

        {/* Selection Section */}
        <div className="w-full md:w-2/3">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-800">選擇搭配單品 ({selectedItems.size})</h3>
             {userPhoto && selectedItems.size > 0 && (
               <button 
                 onClick={() => onGenerate(Array.from(selectedItems))}
                 className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
               >
                 <SparklesIcon className="w-4 h-4 text-accent" />
                 開始試穿
               </button>
             )}
          </div>
          
          {wardrobe.length === 0 ? (
             <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
               <p>衣櫥空空的，先去上傳衣服吧！</p>
             </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto no-scrollbar pb-10">
              {wardrobe.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggleItem(item.id)}
                  className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer border-2 transition-all ${
                    selectedItems.has(item.id) ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={item.image} className="w-full h-full object-cover" alt="item" />
                  {selectedItems.has(item.id) && (
                    <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-1">
                      <CheckIcon className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Shopping View Component (New Feature)
const ShoppingView = ({ 
  userPhoto, 
  onUploadUserPhoto 
}: { 
  userPhoto: string | null, 
  onUploadUserPhoto: (f: File) => void 
}) => {
  const [brands, setBrands] = useState<string[]>(['Uniqlo']);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<ShopRecommendation | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const availableBrands = ['Uniqlo', 'GU', 'Lativ'];

  const toggleBrand = (b: string) => {
    setBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const handleAnalysis = async () => {
    if (!userPhoto || brands.length === 0) return;
    setLoading(true);
    setRecommendation(null);
    setGeneratedImage(null);
    
    try {
      // 1. Get Recommendations (JSON)
      const rec = await recommendShopOutfit(userPhoto.split(',')[1], brands);
      setRecommendation(rec);

      // 2. Generate Image based on description
      const desc = rec.items.map(i => `${i.brand} 的 ${i.name} (${i.category})`).join(', ');
      const img = await generateShopTryOn(userPhoto.split(',')[1], desc);
      setGeneratedImage(img);

    } catch (e) {
      console.error(e);
      alert("AI 忙碌中，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-24 animate-slide-up">
      <div className="bg-slate-900 rounded-3xl p-6 text-white mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <h2 className="text-2xl font-display font-bold mb-2 flex items-center gap-2">
           <ShoppingBagIcon className="text-primary" /> 網購試穿間
         </h2>
         <p className="text-slate-400 text-sm">選擇品牌，AI 分析風格，自動為您穿上新品。</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Controls */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
             
             {/* Brand Selector */}
             <div className="flex gap-2">
               {availableBrands.map(brand => (
                 <button
                   key={brand}
                   onClick={() => toggleBrand(brand)}
                   className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                     brands.includes(brand) 
                       ? 'border-slate-800 bg-slate-800 text-white' 
                       : 'border-slate-200 text-slate-400 hover:border-slate-300'
                   }`}
                 >
                   {brand}
                 </button>
               ))}
             </div>

             {/* Action Button */}
             <button
               onClick={handleAnalysis}
               disabled={!userPhoto || brands.length === 0 || loading}
               className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all ${
                 !userPhoto || brands.length === 0
                   ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                   : 'bg-primary text-white hover:bg-blue-600 hover:shadow-blue-500/30 active:scale-95'
               }`}
             >
               {loading ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   分析中...
                 </>
               ) : (
                 <>
                   <SparklesIcon className="w-5 h-5" />
                   AI 推薦穿搭
                 </>
               )}
             </button>
           </div>

           {!userPhoto && (
             <div className="mt-4 p-4 bg-orange-50 text-orange-600 rounded-xl text-sm flex items-center gap-2">
               <UserIcon className="w-4 h-4" /> 請先上傳個人照片以進行分析
             </div>
           )}
        </div>

        {/* Content Area */}
        <div className="flex flex-col md:flex-row gap-6">
           
           {/* Left: User Photo / Result Image */}
           <div className="w-full md:w-5/12">
             <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 relative">
                {generatedImage ? (
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden group">
                    <img src={generatedImage} className="w-full h-full object-cover" alt="Result" />
                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">AI Generated Look</p>
                      <p className="text-sm font-bold text-slate-800">風格模擬完成</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-50">
                     {userPhoto ? (
                       <img src={userPhoto} className="w-full h-full object-cover opacity-80" alt="User" />
                     ) : (
                       <div className="flex items-center justify-center h-full">
                         <UploadZone compact onFileSelect={onUploadUserPhoto} onCameraRequest={() => document.getElementById('shop-camera')?.click()} title="上傳照片" subtitle="" />
                       </div>
                     )}
                     {loading && (
                       <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                          <p className="text-slate-600 font-medium animate-pulse">正在挑選單品...</p>
                       </div>
                     )}
                  </div>
                )}
             </div>
             
             {/* Retake/Change Photo */}
             {userPhoto && !loading && (
               <button 
                onClick={() => document.getElementById('shop-camera')?.click()}
                className="mt-2 w-full py-2 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
               >
                 更換照片
               </button>
             )}
           </div>

           {/* Right: Recommendations List */}
           <div className="w-full md:w-7/12">
             {recommendation ? (
               <div className="space-y-4 animate-slide-up">
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-slate-700 text-sm leading-relaxed">
                   <span className="font-bold text-primary block mb-1">風格分析</span>
                   {recommendation.styleAnalysis}
                 </div>

                 <h3 className="font-bold text-slate-800 flex items-center gap-2 mt-2">
                   <TagIcon className="w-4 h-4" /> 推薦單品清單
                 </h3>
                 
                 <div className="space-y-3">
                   {recommendation.items.map((item, idx) => (
                     <div 
                       key={idx} 
                       className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow group"
                     >
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-bold">{item.brand}</span>
                           <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{item.category}</span>
                         </div>
                         <h4 className="font-bold text-slate-800 mb-1">{item.name}</h4>
                         <p className="text-xs text-slate-500">{item.reason}</p>
                       </div>
                       <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-between sm:justify-start">
                         <span className="block font-bold text-slate-900">NT$ {item.price}</span>
                         <a 
                           href={item.purchaseUrl}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="bg-primary text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center gap-1"
                         >
                           <ShoppingBagIcon className="w-3 h-3" />
                           前往購買
                         </a>
                       </div>
                     </div>
                   ))}
                 </div>
                 
                 <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl mt-4">
                   <span className="text-slate-500 font-medium text-sm">預估總金額</span>
                   <span className="text-xl font-bold text-slate-900">
                     NT$ {recommendation.items.reduce((acc, i) => acc + i.price, 0)}
                   </span>
                 </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <ShoppingBagIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p>選擇品牌並開始分析</p>
                  <p className="text-xs mt-1 opacity-60">支援 Uniqlo, GU, Lativ</p>
               </div>
             )}
           </div>

        </div>
      </div>
      
      {/* Hidden input for shop camera */}
      <input 
        id="shop-camera"
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => e.target.files?.[0] && onUploadUserPhoto(e.target.files[0])}
      />
    </div>
  );
};

// --- Main App ---

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.UPLOAD);
  const [processState, setProcessState] = useState<ProcessState>(ProcessState.IDLE);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  
  // Temporary state for processing
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [tryOnResult, setTryOnResult] = useState<{imageUrl: string | null, advice: string} | null>(null);

  // --- Handlers ---

  const handleFileUpload = useCallback(async (file: File, isUserPhoto: boolean = false) => {
    // Basic file reading
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      const base64Full = reader.result as string;
      const base64Data = base64Full.split(',')[1];
      
      if (isUserPhoto) {
        setUserPhoto(base64Full);
        return;
      }

      // Processing Clothing Item
      setTempImage(base64Full);
      setProcessState(ProcessState.ANALYZING);
      
      try {
        const result = await analyzeClothingImage(base64Data, file.type);
        setAnalysisResult({
          category: result.category as Category,
          description: result.description,
          stylingTips: result.stylingTips,
          raw: JSON.stringify(result)
        });
        setProcessState(ProcessState.SUCCESS);
      } catch (e) {
        console.error(e);
        alert("分析失敗，請重試");
        setProcessState(ProcessState.IDLE);
      }
    };
  }, []);

  const addToWardrobe = () => {
    if (tempImage && analysisResult) {
      const newItem: ClothingItem = {
        id: Date.now().toString(),
        image: tempImage,
        category: analysisResult.category,
        description: analysisResult.description,
        dateAdded: Date.now()
      };
      setWardrobe(prev => [newItem, ...prev]);
      setTempImage(null);
      setAnalysisResult(null);
      setProcessState(ProcessState.IDLE);
      setActiveTab(AppTab.WARDROBE); // Auto switch to wardrobe
    }
  };

  const handleGenerateTryOn = async (selectedIds: string[]) => {
    if (!userPhoto) return;
    
    setProcessState(ProcessState.GENERATING_TRYON);
    
    try {
      const selectedImages = wardrobe
        .filter(item => selectedIds.includes(item.id))
        .map(item => item.image.split(',')[1]); // get base64 data only

      const userPhotoData = userPhoto.split(',')[1];

      const result = await generateTryOn(userPhotoData, selectedImages);
      setTryOnResult(result);
    } catch (e) {
      console.error(e);
      alert("生成失敗，請稍後再試");
    } finally {
      setProcessState(ProcessState.IDLE);
    }
  };

  // --- Render ---

  return (
    // Main Container: Full Height, Flex Column, No Scroll on itself
    // Changed h-full to h-[100dvh] for mobile browser address bar handling
    // Added select-none to feel like an app
    <div className="h-[100dvh] w-full flex flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-primary/20 overflow-hidden select-none supports-[height:100dvh]:h-[100dvh]">
      
      {/* Top Bar - Flex Item, Fixed Height */}
      <nav className="flex-none bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent-purple flex items-center justify-center text-white">
             <SparklesIcon className="w-5 h-5" />
           </div>
           <span className="font-display font-bold text-xl tracking-tight text-slate-800">
             Smart<span className="text-primary">Look</span>
           </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
           {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-slate-400" />}
        </div>
      </nav>

      {/* Main Content Area - Grow, Scrollable */}
      <main className="flex-1 w-full max-w-5xl mx-auto overflow-y-auto overflow-x-hidden relative overscroll-contain">
        
        {/* Spacer wrapper for bottom padding */}
        <div className="pb-24">
          {/* Upload Tab Logic */}
          {activeTab === AppTab.UPLOAD && (
            <div className="pt-8 px-4">
               {processState === ProcessState.IDLE && (
                 <div className="animate-fade-in space-y-8">
                   <div className="text-center space-y-2 mb-10">
                     <h1 className="text-4xl font-display font-bold text-slate-900">
                       打造你的 <span className="gemini-text">AI 智能衣櫥</span>
                     </h1>
                     <p className="text-slate-500">拍照、分析、歸類。讓每一件衣服都發揮價值。</p>
                   </div>
                   <UploadZone 
                     onFileSelect={(f) => handleFileUpload(f)} 
                     onCameraRequest={() => setProcessState(ProcessState.CAMERA)} 
                   />
                 </div>
               )}

               {processState === ProcessState.ANALYZING && <ProcessingView />}
               
               {processState === ProcessState.SUCCESS && tempImage && analysisResult && (
                 <ResultView 
                   imageSrc={tempImage} 
                   result={analysisResult} 
                   onConfirm={addToWardrobe} 
                   onRetake={() => {
                     setProcessState(ProcessState.IDLE);
                     setTempImage(null);
                     setAnalysisResult(null);
                   }} 
                 />
               )}
            </div>
          )}

          {/* Wardrobe Tab */}
          {activeTab === AppTab.WARDROBE && <WardrobeView items={wardrobe} />}

          {/* Fitting Room Tab */}
          {activeTab === AppTab.FITTING_ROOM && !tryOnResult && ! (processState === ProcessState.GENERATING_TRYON) && (
            <FittingRoomView 
               wardrobe={wardrobe}
               userPhoto={userPhoto}
               onUploadUserPhoto={(f) => handleFileUpload(f, true)}
               onGenerate={handleGenerateTryOn}
            />
          )}

          {/* Fitting Room - Generating State */}
          {processState === ProcessState.GENERATING_TRYON && (
            <ProcessingView text="AI 正在為您換裝與設計造型..." />
          )}

          {/* Fitting Room - Result State */}
          {tryOnResult && (
            <div className="px-4 py-8 animate-fade-in">
               <div className="max-w-2xl mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100">
                  <div className="relative aspect-[3/4] bg-slate-50">
                    {tryOnResult.imageUrl ? (
                      <img src={tryOnResult.imageUrl} className="w-full h-full object-cover" alt="Generated Try On" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">無法生成圖片，請參考文字建議</div>
                    )}
                    <button 
                      onClick={() => setTryOnResult(null)}
                      className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur"
                    >
                      <XIcon />
                    </button>
                  </div>
                  <div className="p-6">
                     <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                       <SparklesIcon className="text-accent-purple" /> 造型師建議
                     </h3>
                     <div className="prose prose-sm text-slate-600">
                       {tryOnResult.advice}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Shopping Tab */}
          {activeTab === AppTab.SHOPPING && (
            <ShoppingView 
               userPhoto={userPhoto}
               onUploadUserPhoto={(f) => handleFileUpload(f, true)}
            />
          )}
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Camera Modal */}
      {processState === ProcessState.CAMERA && (
        <CameraModal 
          onCapture={(f) => {
            setProcessState(ProcessState.IDLE);
            handleFileUpload(f);
          }} 
          onClose={() => setProcessState(ProcessState.IDLE)} 
        />
      )}

      {/* Hidden Camera Trigger for Fitting Room */}
      <input 
        id="camera-trigger"
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
      />

    </div>
  );
}

export default App;