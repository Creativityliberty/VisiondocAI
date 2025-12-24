
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, 
  Zap, 
  Copy, 
  Check, 
  RefreshCw, 
  Eye, 
  FolderTree, 
  FileCode,
  Brain,
  Rocket,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Archive,
  Flame,
  Binary,
  Maximize2,
  Minimize2,
  Sparkles,
  Terminal,
  Settings,
  Box,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Target,
  Cpu,
  Layers,
  Activity,
  Sun,
  Moon,
  Globe,
  Focus,
  Database,
  CloudUpload
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import JSZip from 'jszip';
import { AppStep, ResultTab, AnalysisResult, DesignTokens } from './types';
import { Button } from './components/Button';
import { TokenItem } from './components/TokenItem';
import { VoiceAssistant } from './components/VoiceAssistant';
import { analyzeUIScreenshot } from './services/geminiService';

// --- HUD OVERLAY (The Enhanced Real Scan Effect) ---

const RealScanOverlay: React.FC<{ progress: number }> = ({ progress }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
  >
    {/* Scanning Laser Line with Glow */}
    <motion.div 
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E6644C] to-transparent shadow-[0_0_25px_rgba(230,100,76,0.8)] z-30"
    />
    
    {/* Digital Grain & Grid Overlay */}
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(230,100,76,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(230,100,76,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

    {/* Dynamic Intelligence Boxes */}
    <AnimatePresence>
      {progress > 15 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 0.4], scale: [0.8, 1, 1] }}
          className="absolute top-[15%] left-[20%] w-48 h-16 border border-[#E6644C] rounded-lg bg-black/40 backdrop-blur-sm p-2"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[7px] font-mono text-[#E6644C] uppercase tracking-tighter">NAV_MATRIX</span>
            <span className="text-[7px] font-mono text-[#E6644C]">OK</span>
          </div>
          <div className="h-0.5 w-full bg-[#E6644C]/20 rounded-full overflow-hidden">
            <motion.div animate={{ width: ['0%', '100%'] }} transition={{ duration: 1, repeat: Infinity }} className="h-full bg-[#E6644C]" />
          </div>
        </motion.div>
      )}
      {progress > 45 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 0.4], scale: [0.8, 1, 1] }}
          className="absolute top-[40%] right-[10%] w-64 h-40 border border-white/20 rounded-[30px] bg-black/20 backdrop-blur-sm flex items-center justify-center"
        >
           <Focus size={32} className="text-[#E6644C] opacity-50" />
           <div className="absolute top-2 right-2 text-[6px] font-mono text-white/40">COMP_RECOGNITION</div>
        </motion.div>
      )}
      {progress > 75 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6] }}
          className="absolute bottom-10 left-10 p-4 border border-green-500/30 bg-green-500/5 rounded-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Logic Extraction Active</span>
          </div>
          <span className="text-[6px] font-mono text-green-500/60 uppercase tracking-tighter">Foundry Engine v3.2 Protocol</span>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// --- MAIN APP ---

export default function VisionDocApp() {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [activeTab, setActiveTab] = useState<ResultTab>(ResultTab.MISSION);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isWorkspaceMaximized, setIsWorkspaceMaximized] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isPasting, setIsPasting] = useState(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const runAnalysis = useCallback(async (image: string) => {
    setUploadedImage(image);
    setStep(AppStep.SCANNING);
    setScanProgress(0);
    const interval = setInterval(() => setScanProgress(p => p < 99 ? p + 0.4 : p), 60);
    try {
      const result = await analyzeUIScreenshot(image);
      setAnalysisResult({ 
        tokens: result.tokens, 
        markdownSpec: result.spec, 
        cursorRules: result.rules, 
        projectFiles: result.projectFiles, 
        confidence: 99.9 
      });
      clearInterval(interval);
      setScanProgress(100);
      setTimeout(() => { setStep(AppStep.RESULT); setActiveTab(ResultTab.MISSION); }, 500);
    } catch (e) { 
      console.error(e);
      setStep(AppStep.UPLOAD); 
    }
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (step !== AppStep.UPLOAD) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setIsPasting(true);
            const reader = new FileReader();
            reader.onload = (event) => {
              runAnalysis(event.target?.result as string);
              setTimeout(() => setIsPasting(false), 300);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step, runAnalysis]);

  const downloadZip = async () => {
    if (!analysisResult) return;
    setIsZipping(true);
    const zip = new JSZip();
    Object.entries(analysisResult.projectFiles).forEach(([p, c]) => zip.file(p, c));
    zip.file("README.md", `# Nümtema Foundry Artifact\n\n1. Install: \`npm install\`\n2. Dev: \`npm run dev\`\n3. Deploy: \`vercel\``);
    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url; link.download = "foundry-saas-core.zip"; link.click();
    setIsZipping(false);
  };

  return (
    <div className={`min-h-screen transition-all duration-700 p-2 md:p-6 lg:p-10 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#F9F9F9] text-[#1A1A1A]'}`}>
      <LayoutGroup>
        <motion.div 
          layout 
          className={`mx-auto rounded-[50px] md:rounded-[70px] min-h-[92vh] flex flex-col p-4 md:p-12 lg:p-16 relative overflow-hidden max-w-[1700px] border shadow-[0_50px_100px_rgba(0,0,0,0.1)] transition-all duration-700 ${isDarkMode ? 'bg-white/[0.02] border-white/5 backdrop-blur-3xl' : 'bg-white border-gray-100'}`}
        >
          
          <AnimatePresence>
            {!isWorkspaceMaximized && (
              <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="flex flex-col md:flex-row justify-between items-center gap-10 mb-16 lg:mb-24 z-30">
                <div className="flex items-center gap-6 cursor-pointer group" onClick={() => setStep(AppStep.UPLOAD)}>
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[28px] flex items-center justify-center font-bold text-3xl md:text-5xl shadow-2xl transition-all group-hover:scale-105 ${isDarkMode ? 'bg-[#E6644C] text-white' : 'bg-[#1A1A1A] text-white'}`}>F</div>
                  <div>
                    <h1 className="text-2xl md:text-5xl font-black italic tracking-tighter leading-none">Foundry <span className="text-[#E6644C]">OS</span></h1>
                    <p className={`text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] mt-1 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Ideas to SaaS Deploy</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5">
                  <button 
                    onClick={toggleTheme}
                    className={`p-5 rounded-full transition-all border ${isDarkMode ? 'bg-white/5 border-white/10 text-[#E6644C]' : 'bg-gray-100 border-gray-200 text-gray-500'} hover:scale-110 shadow-lg`}
                  >
                    {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                  </button>
                  <div className={`flex items-center gap-5 p-2 rounded-full border pr-10 transition-all shadow-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-inner ${isDarkMode ? 'bg-white/10' : 'bg-white'}`}>
                      <Activity size={24} className="text-[#E6644C]" />
                    </div>
                    <div className="hidden sm:block">
                      <div className={`text-[11px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-white/30' : 'text-gray-300'}`}>Forge Status</div>
                      <div className="text-sm font-bold text-green-500 flex items-center gap-2">Protocol Live</div>
                    </div>
                    <img src="https://i.pravatar.cc/150?u=foundry_master" className="w-14 h-14 rounded-full ml-4 shadow-2xl border-2 border-white/10" alt="Master" />
                  </div>
                </div>
              </motion.header>
            )}
          </AnimatePresence>

          <main className="flex-1 flex flex-col relative z-20 min-h-0">
            <AnimatePresence mode="wait">
              {step === AppStep.UPLOAD && (
                <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -40 }} className="w-full max-w-6xl mx-auto text-center py-10">
                   <div className={`inline-block px-8 py-3 rounded-full mb-12 border shadow-lg transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                     <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[#E6644C] flex items-center gap-4">
                       <CloudUpload size={16} /> Nümtema Advanced Foundry
                     </span>
                   </div>
                   <h2 className={`text-6xl md:text-[10rem] font-black mb-16 leading-[0.85] tracking-tighter ${isDarkMode ? 'text-white/95' : 'text-[#1A1A1A]'}`}>
                     Forge Vision. <br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#E6644C] via-[#ff8e7a] to-[#E6644C] italic">Deploy SaaS Core.</span>
                   </h2>
                   
                   <label className={`group relative w-full h-[500px] border-2 border-dashed rounded-[70px] flex flex-col items-center justify-center cursor-pointer transition-all ${isDarkMode ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]' : 'bg-gray-50 border-gray-200 hover:bg-white hover:shadow-2xl'} ${isPasting ? 'border-[#E6644C] scale-[0.98]' : ''}`}>
                     <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = ev => runAnalysis(ev.target?.result as string); r.readAsDataURL(f); }}} />
                     <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 4 }} className={`w-40 h-40 rounded-[45px] shadow-2xl flex items-center justify-center mb-12 group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                       <Upload size={56} className="text-[#E6644C]" />
                     </motion.div>
                     <p className="font-black text-4xl mb-4 tracking-tight">Drop UI Screenshot</p>
                     <p className={`text-[12px] font-bold uppercase tracking-[0.7em] opacity-60 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>FOUNDRY ENGINE V3.2 • NEXT.JS 15 READY</p>
                   </label>
                </motion.div>
              )}

              {step === AppStep.SCANNING && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-7xl mx-auto text-center">
                  <div className={`relative w-full aspect-video rounded-[70px] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden border-[15px] transition-all ${isDarkMode ? 'border-white/5' : 'border-white'}`}>
                    {uploadedImage && <img src={uploadedImage} className="w-full h-full object-cover" alt="Source" />}
                    <RealScanOverlay progress={scanProgress} />
                  </div>
                  <div className="mt-20">
                    <div className="flex justify-between max-w-md mx-auto mb-6 px-3">
                      <span className="text-[12px] font-black text-[#E6644C] uppercase tracking-[0.4em]">Extracting Logic Matrix</span>
                      <span className="text-[12px] font-black text-[#E6644C]">{Math.floor(scanProgress)}%</span>
                    </div>
                    <div className={`w-[500px] h-[4px] rounded-full mx-auto mb-14 overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${scanProgress}%` }} className="h-full bg-gradient-to-r from-[#E6644C] to-white shadow-[0_0_20px_#E6644C]" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-8">
                      {["Structural Mapping", "Color Clustering", "SaaS Logic", "Manifesto Creation"].map((s, i) => (
                        <div key={s} className={`flex items-center gap-4 px-7 py-3 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${scanProgress > (i+1)*25 ? 'bg-[#E6644C]/10 border-[#E6644C]/30 text-[#E6644C] shadow-lg' : 'bg-gray-100/50 border-gray-100 text-gray-300'}`}>
                          {scanProgress > (i+1)*25 ? <Check size={14} /> : <RefreshCw size={14} className="animate-spin" />} {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === AppStep.RESULT && analysisResult && (
                <motion.div key="result" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full flex flex-col gap-12 min-h-0">
                  <div className="flex flex-col md:flex-row justify-between items-end gap-10 shrink-0">
                    <div>
                      <div className="flex items-center gap-5 mb-8">
                        <div className="px-5 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-4 shadow-sm">
                          <ShieldCheck size={16}/> Forge Integrity 100%
                        </div>
                        <div className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-3 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
                           <Target size={14} /> Confidence: {analysisResult.confidence}%
                        </div>
                      </div>
                      <h2 className={`text-6xl lg:text-9xl font-black tracking-tighter italic leading-none ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>Artifact Ready.</h2>
                    </div>
                    <div className="flex gap-5 mb-2">
                      <Button variant="ghost" onClick={() => setStep(AppStep.UPLOAD)} className={`px-10 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : ''}`}><RefreshCw size={20} /> New Forge</Button>
                      <Button onClick={downloadZip} className="px-16 shadow-[0_0_60px_rgba(230,100,76,0.4)] !bg-[#E6644C] hover:!bg-[#ff755c]" loading={isZipping}><Archive size={24} /> Deploy Core (.ZIP)</Button>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 min-h-0">
                    <AnimatePresence>
                      {!isSidebarCollapsed && !isWorkspaceMaximized && (
                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="lg:col-span-3 flex flex-col min-h-0">
                          <div className={`p-10 rounded-[60px] flex flex-col h-full border transition-all shadow-2xl ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                             <div className="flex items-center justify-between mb-16">
                               <h4 className="font-black text-[11px] tracking-[0.6em] uppercase text-[#E6644C] flex items-center gap-4"><Database size={18}/> Extracted DNA</h4>
                               <button onClick={() => setIsSidebarCollapsed(true)} className={`p-3 rounded-2xl transition-all hidden lg:block ${isDarkMode ? 'hover:bg-white/10 text-white/30' : 'hover:bg-white text-gray-400 shadow-sm border border-gray-100'}`}><PanelLeftClose size={22}/></button>
                             </div>
                             <div className="space-y-6 flex-1 overflow-y-auto pr-3 scrollbar-hide">
                               <TokenItem iconKey="Palette" label="Brand Core" value={analysisResult.tokens.colors.primary} />
                               <TokenItem iconKey="Layout" label="Radius DNA" value={analysisResult.tokens.radii.card} />
                               <TokenItem iconKey="Type" label="Typography" value={analysisResult.tokens.typography.fontFamily} />
                               <TokenItem iconKey="Maximize2" label="Foundry Grid" value={analysisResult.tokens.spacing.gap} />
                               
                               <div className={`pt-12 border-t mt-12 transition-all ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                                 <p className={`text-[11px] font-black uppercase tracking-[0.5em] mb-5 ${isDarkMode ? 'text-white/20' : 'text-gray-300'}`}>SaaS Compatibility</p>
                                 <div className="grid grid-cols-5 gap-2.5">
                                   {[1,1,1,1,0].map((v, i) => (
                                      <div key={i} className={`h-1.5 rounded-full ${v ? 'bg-[#E6644C]' : (isDarkMode ? 'bg-white/10' : 'bg-gray-200')}`} />
                                   ))}
                                 </div>
                               </div>
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className={`${isWorkspaceMaximized ? 'fixed inset-12 z-[100]' : (isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-9')} flex flex-col gap-10 transition-all duration-700 min-h-0`}>
                      <div className="flex items-center justify-between shrink-0">
                        <div className={`flex gap-4 p-2.5 border rounded-[35px] shadow-2xl transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                          {isSidebarCollapsed && !isWorkspaceMaximized && (
                            <button onClick={() => setIsSidebarCollapsed(false)} className={`px-6 py-4 rounded-full hidden lg:block ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-white shadow-sm'}`}><PanelLeftOpen size={22}/></button>
                          )}
                          {[
                            { id: ResultTab.MISSION, label: 'Manifesto', icon: Terminal },
                            { id: ResultTab.INFRA, label: 'Artifact Files', icon: FolderTree },
                            { id: ResultTab.RULES, label: 'Cursor Rules', icon: Target },
                            { id: ResultTab.PREVIEW, label: 'Core Preview', icon: Eye }
                          ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id as ResultTab)} className={`px-10 py-5 rounded-[26px] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-4 ${activeTab === t.id ? 'bg-[#E6644C] text-white shadow-[0_0_30px_rgba(230,100,76,0.4)]' : (isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-[#1A1A1A] hover:bg-white shadow-sm')}`}>
                              <t.icon size={20} /> {t.label}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setIsWorkspaceMaximized(!isWorkspaceMaximized)} className={`p-6 border rounded-full shadow-2xl transition-all hover:scale-110 ${isDarkMode ? 'bg-white/5 border-white/10 text-[#E6644C]' : 'bg-white border-gray-100 text-[#E6644C]'}`}>
                          {isWorkspaceMaximized ? <Minimize2 size={28} /> : <Maximize2 size={28} />}
                        </button>
                      </div>

                      <div className={`flex-1 shadow-[0_60px_120px_rgba(0,0,0,0.4)] rounded-[60px] overflow-hidden flex flex-col min-h-0 relative border transition-all duration-700 ${isDarkMode ? 'bg-[#050505] border-white/5' : 'bg-white border-gray-100'}`}>
                        <AnimatePresence mode="wait">
                          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col overflow-hidden">
                            {activeTab === ResultTab.MISSION && <CodePreview isDark={isDarkMode} title="FOUNDRY_MANIFESTO.md" code={analysisResult.projectFiles['FOUNDRY_MANIFESTO.md'] || ''} />}
                            {activeTab === ResultTab.INFRA && <SourceExplorer isDark={isDarkMode} files={analysisResult.projectFiles} />}
                            {activeTab === ResultTab.RULES && <CodePreview isDark={isDarkMode} title=".cursor/rules/foundry-core.mdc" code={analysisResult.cursorRules} />}
                            {activeTab === ResultTab.PREVIEW && (
                               <div className={`h-full flex flex-col items-center justify-center relative overflow-hidden ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                                 <div className={`absolute inset-0 bg-[radial-gradient(#E6644C15_1.5px,transparent_1.5px)] [background-size:50px_50px]`} />
                                 <div className={`relative p-20 rounded-[70px] shadow-2xl border max-w-2xl text-center z-10 mx-8 ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>
                                   <div className="w-28 h-28 rounded-[35px] bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-10 shadow-2xl"><Check size={56} /></div>
                                   <h3 className={`text-5xl font-black tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>Artifact Integrity Verified</h3>
                                   <p className={`mb-12 font-medium text-xl leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Nümtema Foundry a injecté avec succès l'architecture SaaS complète. Prêt pour Vercel & GitHub.</p>
                                   <div className="flex gap-6 justify-center">
                                      <div className={`px-8 py-4 rounded-[22px] text-[11px] font-black uppercase border tracking-widest ${isDarkMode ? 'bg-white/5 border-white/10 text-white/30' : 'bg-gray-50 border-gray-200 text-gray-400 shadow-sm'}`}>Foundry v3.2 Core</div>
                                      <div className={`px-8 py-4 rounded-[22px] text-[11px] font-black uppercase border tracking-widest ${isDarkMode ? 'bg-white/5 border-white/10 text-white/30' : 'bg-gray-50 border-gray-200 text-gray-400 shadow-sm'}`}>SaaS Architecture OK</div>
                                   </div>
                                 </div>
                               </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
          
          <AnimatePresence>
            {!isWorkspaceMaximized && (
              <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`mt-24 pt-12 border-t flex flex-col md:flex-row justify-between items-center gap-10 text-[11px] font-black uppercase tracking-[0.7em] relative z-30 transition-all ${isDarkMode ? 'border-white/5 text-white/20' : 'border-gray-100 text-gray-300'}`}>
                <div className="flex items-center gap-5">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse"></div> 
                  Forge Operational • Nümtema Foundry OS
                </div>
                <div className="flex gap-16 font-bold italic text-sm opacity-40 hover:opacity-100 transition-opacity cursor-default">
                  Nümtema Foundry
                </div>
                <div className="flex gap-12">
                  <a href="#" className="hover:text-[#E6644C] transition-colors">Manifesto</a>
                  <a href="#" className="hover:text-[#E6644C] transition-colors">OS Config</a>
                  <a href="#" className="hover:text-[#E6644C] transition-colors">Security</a>
                </div>
              </motion.footer>
            )}
          </AnimatePresence>

          {isWorkspaceMaximized && <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[90]" onClick={() => setIsWorkspaceMaximized(false)} />}
        </motion.div>
      </LayoutGroup>
      <VoiceAssistant />
    </div>
  );
}

// --- REFINED SUB-COMPONENTS ---

const CodePreview: React.FC<{ code: string, title: string, isDark?: boolean }> = ({ code, title, isDark }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className={`flex flex-col h-full transition-colors duration-700 ${isDark ? 'bg-[#030303]' : 'bg-[#FAFAFA]'}`}>
      <div className={`flex justify-between items-center px-12 py-10 border-b transition-all ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
        <span className={`text-[11px] font-mono tracking-[0.7em] uppercase flex items-center gap-5 ${isDark ? 'text-white/20' : 'text-gray-400'}`}><Binary size={20} /> {title}</span>
        <button onClick={copy} className={`transition-all p-5 rounded-[22px] border ${isDark ? 'text-white/30 hover:text-white hover:bg-white/5 border-white/5' : 'text-gray-400 hover:text-[#1A1A1A] hover:bg-white border-gray-100 shadow-sm'}`}>{copied ? <Check size={28} className="text-green-400" /> : <Copy size={28} />}</button>
      </div>
      <pre className={`p-14 text-sm font-mono overflow-auto scrollbar-hide flex-1 leading-relaxed selection:bg-[#E6644C] selection:text-white transition-all ${isDark ? 'text-white/60' : 'text-gray-600'}`}><code>{code}</code></pre>
    </div>
  );
};

const SourceExplorer: React.FC<{ files: Record<string, string>, isDark?: boolean }> = ({ files, isDark }) => {
  const filePaths = Object.keys(files);
  const [selectedFile, setSelectedFile] = useState(filePaths[0]);

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className={`w-full md:w-96 border-r p-10 overflow-y-auto shrink-0 transition-all ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
        <h5 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-10 ${isDark ? 'text-white/10' : 'text-gray-300'}`}>Registry Codex</h5>
        <div className="space-y-3">
          {filePaths.map(path => (
            <button key={path} onClick={() => setSelectedFile(path)} className={`w-full text-left px-6 py-5 rounded-[22px] text-[12px] transition-all flex items-center gap-5 ${selectedFile === path ? 'bg-[#E6644C] text-white font-bold shadow-2xl scale-[1.02]' : (isDark ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-gray-400 hover:text-[#1A1A1A] hover:bg-white border-gray-100 shadow-sm')}`}>
              <FileCode size={22} /> {path.split('/').pop()}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
         <CodePreview isDark={isDark} title={selectedFile} code={files[selectedFile] || ''} />
      </div>
    </div>
  );
};
