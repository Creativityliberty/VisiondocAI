
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
  CloudUpload,
  Github,
  Server
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
    <motion.div 
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E6644C] to-transparent shadow-[0_0_25px_rgba(230,100,76,0.8)] z-30"
    />
    
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(230,100,76,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(230,100,76,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

    <AnimatePresence>
      {progress > 15 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-[15%] left-[10%] p-4 bg-black/60 backdrop-blur-xl border border-[#E6644C]/30 rounded-2xl flex flex-col gap-2"
        >
          <div className="flex items-center gap-3">
            <Cpu size={14} className="text-[#E6644C]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Vercel Configurator</span>
          </div>
          <div className="text-[7px] font-mono text-[#E6644C]">DEPLOYMENT_READY: TRUE</div>
        </motion.div>
      )}
      {progress > 45 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-[40%] right-[10%] w-56 h-32 border border-white/20 rounded-[30px] bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4"
        >
           <Github size={24} className="text-white mb-2" />
           <span className="text-[8px] font-black uppercase tracking-widest text-white/40">GitHub Actions CI/CD</span>
           <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
             <motion.div animate={{ width: ['0%', '100%'] }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-green-500" />
           </div>
        </motion.div>
      )}
      {progress > 75 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-10 left-10 p-6 border border-green-500/30 bg-black/60 rounded-3xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Nümtema Foundry Active</span>
          </div>
          <span className="text-[7px] font-mono text-white/40 uppercase tracking-tighter">Next.js 15 App Router Architecture Forged</span>
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
            const reader = new FileReader();
            reader.onload = (event) => runAnalysis(event.target?.result as string);
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
    zip.file("DEPLOYMENT_GUIDE.md", `# Nümtema Foundry SaaS Artifact\n\n## Stack\n- Next.js 15 (App Router)\n- Tailwind CSS 4\n- Lucide React\n- Framer Motion\n\n## Vercel Deploy\n\`npm install -g vercel\`\n\`vercel\`\n\n## GitHub Setup\n- Create repo\n- Link project\n- Done.`);
    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url; link.download = "foundry-complete-saas.zip"; link.click();
    setIsZipping(false);
  };

  return (
    <div className={`min-h-screen transition-all duration-700 p-4 md:p-8 lg:p-12 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#F9F9F9] text-[#1A1A1A]'}`}>
      <LayoutGroup>
        <motion.div 
          layout 
          className={`mx-auto rounded-[60px] md:rounded-[80px] min-h-[92vh] flex flex-col p-6 md:p-12 lg:p-20 relative overflow-hidden max-w-[1700px] border shadow-[0_50px_150px_rgba(0,0,0,0.2)] transition-all duration-700 ${isDarkMode ? 'bg-white/[0.02] border-white/5 backdrop-blur-3xl' : 'bg-white border-gray-100'}`}
        >
          
          <AnimatePresence>
            {!isWorkspaceMaximized && (
              <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16 lg:mb-28 z-30">
                <div className="flex items-center gap-8 cursor-pointer group" onClick={() => setStep(AppStep.UPLOAD)}>
                  <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[32px] flex items-center justify-center font-black text-4xl md:text-6xl shadow-2xl transition-all group-hover:scale-105 ${isDarkMode ? 'bg-[#E6644C] text-white' : 'bg-[#1A1A1A] text-white'}`}>F</div>
                  <div>
                    <h1 className="text-3xl md:text-6xl font-black italic tracking-tighter leading-none mb-2">Foundry <span className="text-[#E6644C]">OS</span></h1>
                    <p className={`text-[11px] md:text-[14px] font-black uppercase tracking-[0.6em] ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Ideas to SaaS Deploy</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <button 
                    onClick={toggleTheme}
                    className={`p-6 rounded-full transition-all border shadow-xl ${isDarkMode ? 'bg-white/5 border-white/10 text-[#E6644C]' : 'bg-gray-100 border-gray-200 text-gray-500'} hover:scale-110`}
                  >
                    {isDarkMode ? <Sun size={28} /> : <Moon size={28} />}
                  </button>
                  <div className={`flex items-center gap-6 p-2 rounded-full border pr-12 transition-all shadow-2xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner ${isDarkMode ? 'bg-white/10' : 'bg-white'}`}>
                      <Server size={28} className="text-[#E6644C]" />
                    </div>
                    <div className="hidden sm:block">
                      <div className={`text-[12px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/30' : 'text-gray-300'}`}>System Forge</div>
                      <div className="text-sm font-bold text-green-500 flex items-center gap-3">Protocol Optimized</div>
                    </div>
                    <img src="https://i.pravatar.cc/150?u=numtema_master" className="w-16 h-16 rounded-full ml-4 shadow-2xl border-2 border-white/10" alt="Master" />
                  </div>
                </div>
              </motion.header>
            )}
          </AnimatePresence>

          <main className="flex-1 flex flex-col relative z-20 min-h-0">
            <AnimatePresence mode="wait">
              {step === AppStep.UPLOAD && (
                <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -40 }} className="w-full max-w-7xl mx-auto text-center py-10">
                   <div className={`inline-block px-10 py-4 rounded-full mb-16 border shadow-2xl transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                     <span className="text-[14px] font-black uppercase tracking-[0.5em] text-[#E6644C] flex items-center gap-5">
                       <Rocket size={18} /> Nümtema Foundry Mastery
                     </span>
                   </div>
                   <h2 className={`text-7xl md:text-[11rem] font-black mb-20 leading-[0.85] tracking-tighter ${isDarkMode ? 'text-white/95' : 'text-[#1A1A1A]'}`}>
                     Forge Vision. <br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#E6644C] via-[#ff947f] to-[#E6644C] italic">Deploy Core SaaS.</span>
                   </h2>
                   
                   <label className={`group relative w-full h-[550px] border-2 border-dashed rounded-[80px] flex flex-col items-center justify-center cursor-pointer transition-all ${isDarkMode ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07]' : 'bg-gray-50 border-gray-200 hover:bg-white hover:shadow-2xl'}`}>
                     <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = ev => runAnalysis(ev.target?.result as string); r.readAsDataURL(f); }}} />
                     <motion.div animate={{ y: [0, -25, 0] }} transition={{ repeat: Infinity, duration: 4 }} className={`w-44 h-44 rounded-[50px] shadow-2xl flex items-center justify-center mb-16 group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                       <Upload size={64} className="text-[#E6644C]" />
                     </motion.div>
                     <p className="font-black text-5xl mb-6 tracking-tight">Drop Screenshot ou Colle</p>
                     <p className={`text-[14px] font-bold uppercase tracking-[0.8em] opacity-60 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>VERCEL • GITHUB • NEXT.JS 15 ENGINE</p>
                   </label>
                </motion.div>
              )}

              {step === AppStep.SCANNING && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-[1500px] mx-auto text-center">
                  <div className={`relative w-full aspect-video rounded-[80px] shadow-[0_0_120px_rgba(0,0,0,0.6)] overflow-hidden border-[20px] transition-all ${isDarkMode ? 'border-white/5' : 'border-white'}`}>
                    {uploadedImage && <img src={uploadedImage} className="w-full h-full object-cover" alt="SaaS Source" />}
                    <RealScanOverlay progress={scanProgress} />
                  </div>
                  <div className="mt-24">
                    <div className="flex justify-between max-w-lg mx-auto mb-8 px-4">
                      <span className="text-[14px] font-black text-[#E6644C] uppercase tracking-[0.5em]">Forging SaaS Infrastructure</span>
                      <span className="text-[14px] font-black text-[#E6644C]">{Math.floor(scanProgress)}%</span>
                    </div>
                    <div className={`w-[600px] h-[5px] rounded-full mx-auto mb-20 overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${scanProgress}%` }} className="h-full bg-gradient-to-r from-[#E6644C] to-white shadow-[0_0_30px_#E6644C]" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-10">
                      {["UI Architecture", "Next.js 15 Logic", "Vercel Deploy Path", "GitHub Workflow"].map((s, i) => (
                        <div key={s} className={`flex items-center gap-5 px-10 py-4 rounded-full text-[12px] font-black uppercase tracking-widest border transition-all ${scanProgress > (i+1)*25 ? 'bg-[#E6644C]/10 border-[#E6644C]/30 text-[#E6644C] shadow-2xl' : 'bg-gray-100/50 border-gray-100 text-gray-300'}`}>
                          {scanProgress > (i+1)*25 ? <Check size={16} /> : <RefreshCw size={16} className="animate-spin" />} {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === AppStep.RESULT && analysisResult && (
                <motion.div key="result" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full flex flex-col gap-14 min-h-0">
                  <div className="flex flex-col md:flex-row justify-between items-end gap-12 shrink-0">
                    <div>
                      <div className="flex items-center gap-6 mb-10">
                        <div className="px-6 py-2.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[13px] font-black uppercase tracking-widest flex items-center gap-5 shadow-2xl">
                          <ShieldCheck size={20}/> SaaS Infrastructure Validated
                        </div>
                        <div className={`text-[13px] font-black uppercase tracking-widest flex items-center gap-4 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
                           <Globe size={18} /> Forge Confidence: {analysisResult.confidence}%
                        </div>
                      </div>
                      <h2 className={`text-7xl lg:text-[10rem] font-black tracking-tighter italic leading-none ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>Artifact Ready.</h2>
                    </div>
                    <div className="flex gap-6 mb-4">
                      <Button variant="ghost" onClick={() => setStep(AppStep.UPLOAD)} className={`px-12 py-6 text-lg ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : ''}`}><RefreshCw size={24} /> New Forge</Button>
                      <Button onClick={downloadZip} className="px-20 py-6 text-lg shadow-[0_0_80px_rgba(230,100,76,0.5)] !bg-[#E6644C] hover:!bg-[#ff7b63]" loading={isZipping}><Rocket size={28} /> Deploy SaaS (.ZIP)</Button>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-14 min-h-0">
                    <AnimatePresence>
                      {!isSidebarCollapsed && !isWorkspaceMaximized && (
                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="lg:col-span-3 flex flex-col min-h-0">
                          <div className={`p-12 rounded-[70px] flex flex-col h-full border transition-all shadow-2xl ${isDarkMode ? 'bg-white/[0.04] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                             <div className="flex items-center justify-between mb-20">
                               <h4 className="font-black text-[13px] tracking-[0.7em] uppercase text-[#E6644C] flex items-center gap-5"><Terminal size={22}/> SaaS Core DNA</h4>
                               <button onClick={() => setIsSidebarCollapsed(true)} className={`p-4 rounded-2xl transition-all hidden lg:block ${isDarkMode ? 'hover:bg-white/10 text-white/30' : 'hover:bg-white text-gray-400 shadow-xl border border-gray-100'}`}><PanelLeftClose size={28}/></button>
                             </div>
                             <div className="space-y-8 flex-1 overflow-y-auto pr-4 scrollbar-hide">
                               <TokenItem iconKey="Palette" label="Brand Identity" value={analysisResult.tokens.colors.primary} />
                               <TokenItem iconKey="Layout" label="Radius Scaling" value={analysisResult.tokens.radii.card} />
                               <TokenItem iconKey="Type" label="Font Protocol" value={analysisResult.tokens.typography.fontFamily} />
                               <TokenItem iconKey="Maximize2" label="Foundry Grid" value={analysisResult.tokens.spacing.gap} />
                               
                               <div className={`pt-16 border-t mt-16 transition-all ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                                 <p className={`text-[13px] font-black uppercase tracking-[0.6em] mb-8 ${isDarkMode ? 'text-white/20' : 'text-gray-300'}`}>Deployment Synergy</p>
                                 <div className="flex items-center gap-6">
                                   <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}><Box className="text-[#E6644C]" size={20} /></div>
                                   <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}><Github className="text-white" size={20} /></div>
                                   <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}><Layers className="text-blue-400" size={20} /></div>
                                 </div>
                               </div>
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className={`${isWorkspaceMaximized ? 'fixed inset-16 z-[100]' : (isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-9')} flex flex-col gap-12 transition-all duration-700 min-h-0`}>
                      <div className="flex items-center justify-between shrink-0">
                        <div className={`flex gap-6 p-3.5 border rounded-[45px] shadow-2xl transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                          {isSidebarCollapsed && !isWorkspaceMaximized && (
                            <button onClick={() => setIsSidebarCollapsed(false)} className={`px-8 py-5 rounded-full hidden lg:block ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-white shadow-xl'}`}><PanelLeftOpen size={28}/></button>
                          )}
                          {[
                            { id: ResultTab.MISSION, label: 'SaaS Manifesto', icon: Terminal },
                            { id: ResultTab.INFRA, label: 'Next.js 15 Files', icon: FolderTree },
                            { id: ResultTab.RULES, label: 'Forge Rules (.MDC)', icon: Target },
                            { id: ResultTab.PREVIEW, label: 'Success View', icon: Eye }
                          ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id as ResultTab)} className={`px-12 py-6 rounded-[32px] text-[13px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-5 ${activeTab === t.id ? 'bg-[#E6644C] text-white shadow-[0_0_40px_rgba(230,100,76,0.5)]' : (isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-[#1A1A1A] hover:bg-white shadow-xl')}`}>
                              <t.icon size={24} /> {t.label}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setIsWorkspaceMaximized(!isWorkspaceMaximized)} className={`p-8 border rounded-full shadow-2xl transition-all hover:scale-110 ${isDarkMode ? 'bg-white/5 border-white/10 text-[#E6644C]' : 'bg-white border-gray-100 text-[#E6644C]'}`}>
                          {isWorkspaceMaximized ? <Minimize2 size={36} /> : <Maximize2 size={36} />}
                        </button>
                      </div>

                      <div className={`flex-1 shadow-[0_80px_160px_rgba(0,0,0,0.5)] rounded-[80px] overflow-hidden flex flex-col min-h-0 relative border transition-all duration-700 ${isDarkMode ? 'bg-[#030303] border-white/5' : 'bg-white border-gray-100'}`}>
                        <AnimatePresence mode="wait">
                          <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="h-full flex flex-col overflow-hidden">
                            {activeTab === ResultTab.MISSION && <CodePreview isDark={isDarkMode} title="FOUNDRY_MANIFESTO.md" code={analysisResult.projectFiles['FOUNDRY_MANIFESTO.md'] || ''} />}
                            {activeTab === ResultTab.INFRA && <SourceExplorer isDark={isDarkMode} files={analysisResult.projectFiles} />}
                            {activeTab === ResultTab.RULES && <CodePreview isDark={isDarkMode} title=".cursor/rules/foundry-core.mdc" code={analysisResult.cursorRules} />}
                            {activeTab === ResultTab.PREVIEW && (
                               <div className={`h-full flex flex-col items-center justify-center relative overflow-hidden ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                                 <div className={`absolute inset-0 bg-[radial-gradient(#E6644C20_1.5px,transparent_1.5px)] [background-size:60px_60px]`} />
                                 <div className={`relative p-24 rounded-[80px] shadow-2xl border max-w-3xl text-center z-10 mx-10 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-gray-200 shadow-2xl'}`}>
                                   <div className="w-32 h-32 rounded-[40px] bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-12 shadow-3xl"><Check size={64} /></div>
                                   <h3 className={`text-6xl font-black tracking-tighter mb-10 ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>Protocol Deployment Ready</h3>
                                   <p className={`mb-16 font-medium text-2xl leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Nümtema Foundry a injecté l'architecture SaaS complète avec intégration Vercel & GitHub. Téléchargez votre artifact et lancez le déploiement.</p>
                                   <div className="flex gap-8 justify-center">
                                      <div className={`px-10 py-5 rounded-[28px] text-[13px] font-black uppercase border tracking-widest ${isDarkMode ? 'bg-white/5 border-white/10 text-white/30' : 'bg-gray-50 border-gray-200 text-gray-400 shadow-2xl'}`}>Foundry v3.2 SaaS Core</div>
                                      <div className={`px-10 py-5 rounded-[28px] text-[13px] font-black uppercase border tracking-widest ${isDarkMode ? 'bg-white/5 border-white/10 text-white/30' : 'bg-gray-50 border-gray-200 text-gray-400 shadow-2xl'}`}>Next.js 15 Ready</div>
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
              <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`mt-32 pt-16 border-t flex flex-col md:flex-row justify-between items-center gap-14 text-[13px] font-black uppercase tracking-[0.8em] relative z-30 transition-all ${isDarkMode ? 'border-white/5 text-white/20' : 'border-gray-100 text-gray-300'}`}>
                <div className="flex items-center gap-6">
                  <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-pulse"></div> 
                  Forge Operational • Vercel Verified • Nümtema Foundry OS
                </div>
                <div className="flex gap-20 font-bold italic text-lg opacity-40 hover:opacity-100 transition-opacity cursor-default tracking-tighter">
                  Nümtema Foundry
                </div>
                <div className="flex gap-16">
                  <a href="#" className="hover:text-[#E6644C] transition-colors">Manifesto</a>
                  <a href="#" className="hover:text-[#E6644C] transition-colors">Infrastructure</a>
                  <a href="#" className="hover:text-[#E6644C] transition-colors">Security</a>
                </div>
              </motion.footer>
            )}
          </AnimatePresence>

          {isWorkspaceMaximized && <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[90]" onClick={() => setIsWorkspaceMaximized(false)} />}
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
    <div className={`flex flex-col h-full transition-colors duration-700 ${isDark ? 'bg-[#020202]' : 'bg-[#FAFAFA]'}`}>
      <div className={`flex justify-between items-center px-16 py-12 border-b transition-all ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-100 shadow-xl'}`}>
        <span className={`text-[13px] font-mono tracking-[0.8em] uppercase flex items-center gap-6 ${isDark ? 'text-white/20' : 'text-gray-400'}`}><Binary size={24} /> {title}</span>
        <button onClick={copy} className={`transition-all p-6 rounded-[28px] border ${isDark ? 'text-white/30 hover:text-white hover:bg-white/5 border-white/5' : 'text-gray-400 hover:text-[#1A1A1A] hover:bg-white border-gray-100 shadow-xl'}`}>{copied ? <Check size={32} className="text-green-400" /> : <Copy size={32} />}</button>
      </div>
      <pre className={`p-16 text-md font-mono overflow-auto scrollbar-hide flex-1 leading-relaxed selection:bg-[#E6644C] selection:text-white transition-all ${isDark ? 'text-white/60' : 'text-gray-600'}`}><code>{code}</code></pre>
    </div>
  );
};

const SourceExplorer: React.FC<{ files: Record<string, string>, isDark?: boolean }> = ({ files, isDark }) => {
  const filePaths = Object.keys(files);
  const [selectedFile, setSelectedFile] = useState(filePaths[0]);

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className={`w-full md:w-[450px] border-r p-12 overflow-y-auto shrink-0 transition-all ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
        <h5 className={`text-[13px] font-black uppercase tracking-[0.7em] mb-12 ${isDark ? 'text-white/10' : 'text-gray-300'}`}>Artifact Codex</h5>
        <div className="space-y-4">
          {filePaths.map(path => (
            <button key={path} onClick={() => setSelectedFile(path)} className={`w-full text-left px-8 py-6 rounded-[28px] text-[14px] transition-all flex items-center gap-6 ${selectedFile === path ? 'bg-[#E6644C] text-white font-bold shadow-3xl scale-[1.03]' : (isDark ? 'text-white/30 hover:text-white/70 hover:bg-white/5' : 'text-gray-400 hover:text-[#1A1A1A] hover:bg-white border-gray-100 shadow-2xl')}`}>
              <FileCode size={24} /> {path.split('/').pop()}
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
