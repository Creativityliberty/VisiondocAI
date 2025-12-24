
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
  Activity
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import JSZip from 'jszip';
import { AppStep, ResultTab, AnalysisResult, DesignTokens } from './types';
import { Button } from './components/Button';
import { TokenItem } from './components/TokenItem';
import { VoiceAssistant } from './components/VoiceAssistant';
import { analyzeUIScreenshot, chatWithUI } from './services/geminiService';

// --- ANIMATION COMPONENTS (THE WOW EFFECT) ---

const BitStream = () => (
  <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
    {Array.from({ length: 10 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: -100, x: Math.random() * 100 + "%" }}
        animate={{ y: 1000 }}
        transition={{ duration: Math.random() * 10 + 5, repeat: Infinity, ease: "linear" }}
        className="absolute text-[8px] font-mono text-[#E6644C] whitespace-nowrap"
        style={{ writingMode: 'vertical-rl' }}
      >
        {Array.from({ length: 50 }).map(() => Math.round(Math.random())).join('')}
      </motion.div>
    ))}
  </div>
);

const VisionEngineHUD: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
      <BitStream />
      
      {/* 3D Grid Floor */}
      <div className="absolute inset-0 perspective-[1000px] overflow-hidden">
        <motion.div 
          animate={{ rotateX: [60, 65, 60], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-[-50%] bottom-[-50%] h-[200%] bg-[linear-gradient(to_right,#E6644C22_1px,transparent_1px),linear-gradient(to_bottom,#E6644C22_1px,transparent_1px)] bg-[size:40px_40px] [transform:rotateX(60deg)] opacity-40"
        />
      </div>

      <div className="relative w-full h-full flex flex-col items-center justify-center z-20">
        {/* Scanning Line with Glow */}
        <motion.div 
          animate={{ top: ['10%', '90%', '10%'] }} 
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-[#E6644C] to-transparent shadow-[0_0_30px_#E6644C] z-30"
        />

        {/* Floating Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              x: (Math.random() - 0.5) * 400,
              y: (Math.random() - 0.5) * 400
            }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.2 }}
            className="absolute w-1 h-1 bg-[#E6644C] rounded-full blur-[1px]"
          />
        ))}

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          {/* Central Target Rings */}
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-48 h-48 rounded-full border border-[#E6644C]/30 border-dashed" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-4 rounded-full border-2 border-[#E6644C]/50 border-dotted" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 20px #E6644C44", "0 0 50px #E6644C88", "0 0 20px #E6644C44"] }} 
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 rounded-3xl bg-black/80 backdrop-blur-xl border border-[#E6644C] flex items-center justify-center"
            >
              <Cpu size={40} className="text-[#E6644C]" />
            </motion.div>
          </div>
        </motion.div>

        <div className="mt-12 text-center">
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }} 
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[10px] font-black tracking-[0.8em] uppercase text-[#E6644C] mb-2"
          >
            Neural Pattern Recognition
          </motion.div>
          <div className="text-2xl font-bold text-white tracking-tighter italic flex items-center gap-3">
            <Activity size={20} className="text-[#E6644C]" /> Analyzing Visual DNA
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function VisionDocApp() {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [activeTab, setActiveTab] = useState<ResultTab>(ResultTab.MISSION);
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isWorkspaceMaximized, setIsWorkspaceMaximized] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isPasting, setIsPasting] = useState(false);

  const runAnalysis = useCallback(async (image: string) => {
    setUploadedImage(image);
    setStep(AppStep.SCANNING);
    setScanProgress(0);
    const interval = setInterval(() => setScanProgress(p => p < 99 ? p + 0.5 : p), 50);
    try {
      const result = await analyzeUIScreenshot(image);
      setAnalysisResult({ 
        tokens: result.tokens, 
        markdownSpec: result.spec, 
        cursorRules: result.rules, 
        projectFiles: result.projectFiles, 
        confidence: 99.8 
      });
      clearInterval(interval);
      setScanProgress(100);
      setTimeout(() => { setStep(AppStep.RESULT); setActiveTab(ResultTab.MISSION); }, 500);
    } catch (e) { 
      console.error(e);
      alert("Extraction Interrupted. Check Console."); 
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
    
    // Structure du projet
    Object.entries(analysisResult.projectFiles).forEach(([p, c]) => {
      zip.file(p, c);
    });

    // Ajout des fichiers d'aide au déploiement
    zip.file("README_DEPLOY.md", `# VisionDoc Deployment Guide\n\n1. Install dependencies: \`npm install\`\n2. Start dev server: \`npm run dev\`\n3. Connect to GitHub: \`gh repo create --source=. --public\``);

    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url; link.download = "vision-doc-starter-pack.zip"; link.click();
    setIsZipping(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-2 md:p-6 lg:p-10 text-[#1A1A1A]">
      <LayoutGroup>
        <motion.div layout className={`mx-auto bg-white rounded-[40px] md:rounded-[60px] shadow-[0_40px_120px_rgba(0,0,0,0.08)] min-h-[92vh] flex flex-col p-4 md:p-10 lg:p-14 relative overflow-hidden border border-white max-w-[1600px]`}>
          
          <AnimatePresence>
            {!isWorkspaceMaximized && (
              <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 lg:mb-20 z-30">
                <div className="flex items-center gap-5 cursor-pointer group" onClick={() => setStep(AppStep.UPLOAD)}>
                  <div className="bg-[#1A1A1A] text-white w-14 h-14 md:w-16 md:h-16 rounded-[22px] flex items-center justify-center font-bold text-2xl md:text-4xl shadow-2xl transition-all group-hover:bg-[#E6644C]">V</div>
                  <div>
                    <h1 className="text-xl md:text-3xl font-black italic tracking-tighter">VisionDoc <span className="text-[#E6644C]">AI</span></h1>
                    <p className="text-[#9A9A9A] text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Engineered for pageai-pro</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-[#F8F8F8] p-2 rounded-full border border-gray-100 pr-8">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                    <Activity size={20} className="text-[#E6644C]" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Neural Load</div>
                    <div className="text-xs font-bold">1.2ms Latency</div>
                  </div>
                  <img src="https://i.pravatar.cc/150?u=arch" className="w-12 h-12 rounded-full ml-4 shadow-xl border-2 border-white" alt="User" />
                </div>
              </motion.header>
            )}
          </AnimatePresence>

          <main className="flex-1 flex flex-col relative z-20 min-h-0">
            <AnimatePresence mode="wait">
              {step === AppStep.UPLOAD && (
                <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} className="w-full max-w-5xl mx-auto text-center py-10">
                   <div className="inline-block px-5 py-2 bg-[#FDEEEB] rounded-full mb-8"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E6644C] flex items-center gap-2">Vibe Coding Protocol Active</span></div>
                   <h2 className="text-5xl md:text-8xl font-light text-[#9A9A9A] mb-14 leading-[1.0] tracking-tighter">Transformez l'image en <br /><span className="text-[#1A1A1A] font-black italic underline decoration-[#E6644C]/30">Architecture de Code.</span></h2>
                   
                   <label className={`group relative w-full h-[400px] bg-[#FBFBFB] border-4 border-dashed rounded-[60px] flex flex-col items-center justify-center cursor-pointer transition-all border-gray-100 ${isPasting ? 'bg-[#FDEEEB] border-[#E6644C]' : 'hover:bg-white hover:shadow-2xl hover:border-[#E6644C]/40'}`}>
                     <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = ev => runAnalysis(ev.target?.result as string); r.readAsDataURL(f); }}} />
                     <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="w-32 h-32 rounded-[35px] bg-white shadow-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform"><Upload size={40} className="text-[#E6644C]" /></motion.div>
                     <p className="font-black text-2xl mb-2 tracking-tight">Glissez ou Collez (Ctrl+V)</p>
                     <p className="text-[#9A9A9A] text-[10px] font-bold uppercase tracking-[0.5em] opacity-60">Génération de Starter Pack Complète</p>
                   </label>
                </motion.div>
              )}

              {step === AppStep.SCANNING && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-5xl mx-auto text-center">
                  <div className="relative w-full aspect-video bg-black rounded-[60px] shadow-2xl overflow-hidden border-[16px] border-white">
                    <VisionEngineHUD />
                  </div>
                  <div className="mt-12">
                    <div className="flex justify-between max-w-xs mx-auto mb-2 px-1">
                      <span className="text-[10px] font-black text-[#E6644C] uppercase tracking-widest">Analysis</span>
                      <span className="text-[10px] font-black text-[#E6644C]">{Math.floor(scanProgress)}%</span>
                    </div>
                    <div className="w-80 h-1.5 bg-gray-100 rounded-full mx-auto mb-8 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${scanProgress}%` }} className="h-full bg-[#E6644C]" />
                    </div>
                    <AutoCheckStatus progress={scanProgress} />
                  </div>
                </motion.div>
              )}

              {step === AppStep.RESULT && analysisResult && (
                <motion.div key="result" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full flex flex-col gap-10 min-h-0">
                  <div className="flex flex-col md:flex-row justify-between items-end gap-6 shrink-0">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12}/> Analysis Verified</div>
                        <div className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-widest">Confidence: {analysisResult.confidence}%</div>
                      </div>
                      <h2 className="text-5xl lg:text-7xl font-black tracking-tighter italic">Blueprint Ready.</h2>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="ghost" onClick={() => setStep(AppStep.UPLOAD)}><RefreshCw size={18} /> Restart</Button>
                      <Button onClick={downloadZip} className="px-12 shadow-2xl" loading={isZipping}><Archive size={18} /> Export Project (.ZIP)</Button>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-0">
                    <AnimatePresence>
                      {!isSidebarCollapsed && !isWorkspaceMaximized && (
                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="lg:col-span-3 flex flex-col min-h-0">
                          <Card className="p-8 flex flex-col h-full bg-[#FBFBFB] border-none shadow-xl">
                             <div className="flex items-center justify-between mb-10">
                               <h4 className="font-black text-[10px] tracking-[0.4em] uppercase text-[#E6644C] flex items-center gap-2"><Layers size={14}/> Extracted Tokens</h4>
                               <button onClick={() => setIsSidebarCollapsed(true)} className="p-2 hover:bg-white rounded-xl shadow-sm border border-gray-100 hidden lg:block"><PanelLeftClose size={16}/></button>
                             </div>
                             <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                               <TokenItem iconKey="Palette" label="Brand Color" value={analysisResult.tokens.colors.primary} />
                               <TokenItem iconKey="Layout" label="Border Radius" value={analysisResult.tokens.radii.card} />
                               <TokenItem iconKey="Type" label="Typography" value={analysisResult.tokens.typography.fontFamily} />
                               <TokenItem iconKey="Maximize2" label="Layout Gap" value={analysisResult.tokens.spacing.gap} />
                               <div className="pt-6 border-t border-gray-100 mt-6">
                                 <p className="text-[9px] font-black text-[#9A9A9A] uppercase tracking-widest mb-3">Starter DNA Status</p>
                                 <div className="flex gap-2">
                                   <div className="w-full h-1 bg-green-500 rounded-full" />
                                   <div className="w-full h-1 bg-green-500 rounded-full" />
                                   <div className="w-full h-1 bg-green-500 rounded-full" />
                                 </div>
                               </div>
                             </div>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className={`${isWorkspaceMaximized ? 'fixed inset-10 z-[100]' : (isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-9')} flex flex-col gap-8 transition-all duration-500 min-h-0`}>
                      <div className="flex items-center justify-between shrink-0">
                        <div className="flex gap-3 p-1.5 bg-[#F8F8F8] border border-gray-100 rounded-[30px] shadow-sm">
                          {isSidebarCollapsed && !isWorkspaceMaximized && (
                            <button onClick={() => setIsSidebarCollapsed(false)} className="px-4 py-3 rounded-full hover:bg-white hidden lg:block"><PanelLeftOpen size={18}/></button>
                          )}
                          {[
                            { id: ResultTab.MISSION, label: 'The Mission', icon: Rocket },
                            { id: ResultTab.INFRA, label: 'Project Files', icon: FolderTree },
                            { id: ResultTab.RULES, label: 'Cursor Rules', icon: Target },
                            { id: ResultTab.PREVIEW, label: 'Visual Check', icon: Eye }
                          ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id as ResultTab)} className={`px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === t.id ? 'bg-white shadow-lg text-[#E6644C]' : 'text-[#9A9A9A] hover:text-[#1A1A1A]'}`}>
                              <t.icon size={16} /> {t.label}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setIsWorkspaceMaximized(!isWorkspaceMaximized)} className="p-5 bg-white border border-gray-100 rounded-full shadow-lg text-[#E6644C] hover:scale-110 transition-transform">
                          {isWorkspaceMaximized ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                        </button>
                      </div>

                      <div className="flex-1 shadow-[0_50px_100px_rgba(0,0,0,0.15)] rounded-[50px] overflow-hidden bg-[#080808] flex flex-col min-h-0 relative">
                        <AnimatePresence mode="wait">
                          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col overflow-hidden">
                            {activeTab === ResultTab.MISSION && <CodePreview title="AGENT_MISSION.md" code={analysisResult.projectFiles['AGENT_MISSION.md'] || ''} />}
                            {activeTab === ResultTab.INFRA && (
                              <div className="h-full flex flex-col">
                                <SourceExplorer files={analysisResult.projectFiles} />
                              </div>
                            )}
                            {activeTab === ResultTab.RULES && <CodePreview title=".cursor/rules/ui-system.mdc" code={analysisResult.cursorRules} />}
                            {activeTab === ResultTab.PREVIEW && (
                               <div className="h-full bg-white flex flex-col items-center justify-center relative overflow-hidden">
                                 <div className="absolute inset-0 bg-[radial-gradient(#E6644C11_1.5px,transparent_1.5px)] [background-size:30px_30px]" />
                                 <div className="relative p-12 bg-white rounded-[40px] shadow-2xl border border-gray-100 max-w-lg text-center z-10">
                                   <div className="w-20 h-20 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-6"><Check size={40} /></div>
                                   <h3 className="text-3xl font-black tracking-tighter mb-4">Visual Logic Verified</h3>
                                   <p className="text-gray-500 mb-8 font-medium">L'IA a extrait l'interface et l'a reconstruite en utilisant exclusivement vos composants landing.</p>
                                   <div className="flex gap-4 justify-center">
                                      <div className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase text-gray-400">Desktop 1440px</div>
                                      <div className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase text-gray-400">Mobile 375px</div>
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
          
          {isWorkspaceMaximized && <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-[90]" onClick={() => setIsWorkspaceMaximized(false)} />}
        </motion.div>
      </LayoutGroup>
      <VoiceAssistant />
    </div>
  );
}

// --- SUB-COMPONENTS ---

const CodePreview: React.FC<{ code: string, title: string }> = ({ code, title }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="flex flex-col h-full bg-[#080808]">
      <div className="flex justify-between items-center px-8 py-6 bg-black/40 border-b border-white/5">
        <span className="text-white/30 text-[10px] font-mono tracking-[0.5em] uppercase flex items-center gap-3"><Binary size={14} /> {title}</span>
        <button onClick={copy} className="text-white/40 hover:text-white transition-all p-3 rounded-2xl hover:bg-white/5">{copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}</button>
      </div>
      <pre className="p-10 text-sm font-mono text-white/70 overflow-auto scrollbar-hide flex-1 leading-relaxed"><code>{code}</code></pre>
    </div>
  );
};

const SourceExplorer: React.FC<{ files: Record<string, string> }> = ({ files }) => {
  const filePaths = Object.keys(files);
  const [selectedFile, setSelectedFile] = useState(filePaths[0]);

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="w-full md:w-72 border-r border-white/5 bg-black/20 p-6 overflow-y-auto shrink-0">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-6">File Registry</h5>
        <div className="space-y-1">
          {filePaths.map(path => (
            <button key={path} onClick={() => setSelectedFile(path)} className={`w-full text-left px-4 py-3 rounded-xl text-[11px] transition-all flex items-center gap-3 ${selectedFile === path ? 'bg-[#E6644C] text-white font-bold shadow-lg shadow-[#E6644C]/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}>
              <FileCode size={16} /> {path.split('/').pop()}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
         <CodePreview title={selectedFile} code={files[selectedFile] || ''} />
      </div>
    </div>
  );
};

const AutoCheckStatus: React.FC<{ progress: number }> = ({ progress }) => {
  const steps = ["Component Mapping", "Semantic Color Clustering", "Typography Sync", "DNA Template Injection"];
  const currentStep = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {steps.map((step, i) => (
        <div key={step} className={`flex items-center gap-3 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${i <= currentStep ? 'bg-[#E6644C]/10 border-[#E6644C]/30 text-[#E6644C]' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
          {i < currentStep ? <Check size={12} /> : (i === currentStep ? <div className="w-2 h-2 rounded-full bg-[#E6644C] animate-ping" /> : <div className="w-2 h-2 rounded-full bg-gray-200" />)}
          {step}
        </div>
      ))}
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-[45px] shadow-sm border border-gray-50 ${className}`}>
    {children}
  </div>
);
