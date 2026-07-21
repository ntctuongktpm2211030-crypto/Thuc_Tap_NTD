import { useState } from 'react';
import { 
  useMotion, MotionButton, MotionCard, MotionInput, 
  MotionTooltip, MotionStagger, MotionModal, useCounter 
} from '../../animations';
import { 
  RefreshCw, Sliders, Play, Pause,
  Users, FileText, CheckCircle
} from 'lucide-react';

const MotionPlayground = () => {
  const { 
    reducedMotion, setReducedMotion, 
    speedMultiplier, setSpeedMultiplier, 
    enabled, setEnabled, 
    debug, setDebug 
  } = useMotion();

  // Sandbox states
  const [inputVal, setInputVal] = useState('');
  const [hasInputError, setHasInputError] = useState(false);
  const [staggerKey, setStaggerKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Counter demo (counts up from 0 to 4500)
  const [targetCount, setTargetCount] = useState(1200);
  const countVal = useCounter(targetCount, 1000);

  const handleTestError = () => {
    setHasInputError(true);
    setTimeout(() => setHasInputError(false), 1000);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 p-8 font-sans antialiased space-y-8 pb-20">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] block mb-1">
          Terraholic Motion Library
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Motion Design System Playground
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Developer QA Sandbox to test animation variants, speed multipliers, and WCAG accessibility preferences.
        </p>
      </div>

      {/* Grid: Settings Panel + Demos */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Settings Controller Dashboard (Col Span 4) */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 h-fit">
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Sliders size={14} className="text-[#0F766E]" /> Global Motion Controller
          </h3>

          {/* Toggle Animation Enabled */}
          <div className="flex justify-between items-center text-xs font-semibold">
            <div>
              <span className="block text-slate-800">Trạng thái animation</span>
              <span className="text-[9px] text-slate-400 font-medium">Bật/tắt tất cả chuyển động</span>
            </div>
            <button 
              onClick={() => setEnabled(!enabled)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                enabled 
                  ? 'bg-teal-50 border-teal-200 text-[#0F766E]' 
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}
            >
              {enabled ? <Play size={10} /> : <Pause size={10} />}
              {enabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Easing Speed Multiplier */}
          <div className="space-y-2 text-xs font-semibold">
            <div className="flex justify-between">
              <span>Hệ số tốc độ (Speed Multiplier)</span>
              <span className="text-[#0F766E] font-black">{speedMultiplier}x</span>
            </div>
            <input 
              type="range" 
              min="0.2" 
              max="2.5" 
              step="0.1" 
              value={speedMultiplier} 
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
              className="w-full accent-[#0F766E]"
            />
            <div className="flex justify-between text-[8px] text-slate-400 font-black uppercase">
              <span>Nhanh (0.2x)</span>
              <span>Mặc định (1x)</span>
              <span>Chậm (2.5x)</span>
            </div>
          </div>

          {/* Simulate Reduced Motion */}
          <div className="flex justify-between items-center text-xs font-semibold">
            <div>
              <span className="block text-slate-800">Reduced Motion (WCAG)</span>
              <span className="text-[9px] text-slate-400 font-medium">Mô phỏng hạn chế chuyển động</span>
            </div>
            <button 
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                reducedMotion 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 font-black' 
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {reducedMotion ? 'ACTIVE (FADES ONLY)' : 'INACTIVE'}
            </button>
          </div>

          {/* Debug Mode Toggle */}
          <div className="flex justify-between items-center text-xs font-semibold">
            <div>
              <span className="block text-slate-800">Console Logs (Debug)</span>
              <span className="text-[9px] text-slate-400 font-medium">In nhật ký hoạt động ra console</span>
            </div>
            <button 
              onClick={() => setDebug(!debug)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                debug 
                  ? 'bg-slate-900 border-slate-900 text-white font-black' 
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {debug ? 'DEBUG LOGGING' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Demos Panel (Col Span 8) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* Sandbox 1: Buttons & Hovers */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-800">1. Button & Micro-Interactions Demos</h4>
            <div className="flex flex-wrap gap-4">
              <MotionButton 
                motion="hover"
                className="px-4 py-2 bg-[#0F766E] hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Hover scale: 1.015
              </MotionButton>

              <MotionButton 
                motion="press"
                className="px-4 py-2 bg-[#0891B2] hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Press scale: 0.97
              </MotionButton>

              <MotionButton 
                motion="both"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Dual Hover + Press
              </MotionButton>
            </div>
          </div>

          {/* Sandbox 2: Forms validation & Input */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-800">2. Form Validation & Focus Highlights</h4>
            <div className="max-w-md space-y-3">
              <MotionInput 
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Click focus to animate borders | test error below..."
                hasError={hasInputError}
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleTestError}
                  className="px-3 py-1.5 border border-rose-200 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Trigger validation error (shake)
                </button>
              </div>
            </div>
          </div>

          {/* Sandbox 3: Cards & Stagger Grids */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-slate-800">3. Stagger Grid Loaders</h4>
              <button 
                onClick={() => setStaggerKey(prev => prev + 1)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                title="Re-run stagger animations"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            <MotionStagger 
              key={staggerKey}
              selector=".stagger-card" 
              delay={60} 
              className="grid grid-cols-3 gap-4"
            >
              {[
                { title: 'Tài nguyên Lâm Đồng', body: '54 điểm checkin', icon: CheckCircle },
                { title: 'Báo cáo Khánh Hòa', body: '120 lượt checkin', icon: FileText },
                { title: 'Thống kê Hà Giang', body: '12 bài viết', icon: Users }
              ].map((item, idx) => (
                <MotionCard 
                  key={idx}
                  motion="both"
                  className="stagger-card bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 opacity-0 hover:bg-white transition-colors"
                >
                  <item.icon size={16} className="text-[#0f766e]" />
                  <h5 className="text-xs font-bold text-slate-800">{item.title}</h5>
                  <p className="text-[10px] text-slate-400">{item.body}</p>
                </MotionCard>
              ))}
            </MotionStagger>
          </div>

          {/* Sandbox 4: Counters & Modals */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-800">4. Numeric Count-Ups & Tooltips</h4>
            <div className="grid grid-cols-2 gap-4">
              
              {/* Counter section */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase">Live Count value</span>
                <p className="text-2xl font-black text-[#0f766e]">{countVal.toLocaleString()}</p>
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => setTargetCount(4500)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold cursor-pointer"
                  >
                    Count to 4,500
                  </button>
                  <button 
                    onClick={() => setTargetCount(100)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold cursor-pointer"
                  >
                    Reset count
                  </button>
                </div>
              </div>

              {/* Tooltip & Modal Section */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-center items-center gap-3">
                <MotionTooltip text="This tooltip scales in using ease-out (Durations.micro) on hover.">
                  <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold cursor-help">
                    Hover for tooltip
                  </span>
                </MotionTooltip>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 bg-[#0F766E] text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-teal-800"
                >
                  Trigger Modal
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Reusable Modal dialog box */}
      <MotionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Spring Modal Demo"
        footer={
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-black"
            >
              Close Dialog
            </button>
          </div>
        }
      >
        <p className="text-xs text-slate-500 leading-relaxed">
          This modal was opened with a spring elastic zoom transition using Anime.js v4. When you press the ESC key or click the close triggers, it closes instantly without memory leaks.
        </p>
      </MotionModal>
    </div>
  );
};

export default MotionPlayground;
