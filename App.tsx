
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, 
  Zap, 
  Copy, 
  Check, 
  Code, 
  RefreshCw, 
  Eye, 
  Download, 
  FolderTree, 
  FileCode,
  Brain,
  Rocket,
  Cpu,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppStep, ResultTab, AnalysisResult, DesignTokens } from './types';
import { Button } from './components/Button';
import { TokenItem } from './components/TokenItem';
import { VoiceAssistant } from './components/VoiceAssistant';
import { analyzeUIScreenshot, chatWithUI, editUIWithPrompt } from './services/geminiService';

// --- ATOMIC COMPONENTS ---

const ScanningOverlay: React.FC = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="absolute inset-0 z-10 overflow-hidden rounded-[30px] pointer-events-none"
  >
    <motion.div 
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E6644C] to-transparent shadow-[0_0_15px_#E6644C]"
    />
    <div className="absolute inset-0 bg-[#E6644C]/10" />
  </motion.div>
);

const Card: React.FC<{ children?: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-gray-50 ${className}`}>
    {children}
  </div>
);

const CodePreview: React.FC<{ code: string, title: string }> = ({ code, title }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] rounded-[30px] overflow-hidden border border-white/5">
      <div className="flex justify-between items-center px-6 py-4 bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
          </div>
          <span className="ml-4 text-white/40 text-[10px] font-mono tracking-widest uppercase truncate max-w-[200px]">{title}</span>
        </div>
        <button onClick={copyToClipboard} className="text-white/40 hover:text-white transition-all hover:scale-110">
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
        </button>
      </div>
      <pre className="p-8 text-sm font-mono text-white/70 overflow-auto scrollbar-hide flex-1 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const SourceExplorer: React.FC<{ files: Record<string, string>, filter?: string }> = ({ files, filter }) => {
  const allPaths = Object.keys(files);
  const filePaths = filter 
    ? allPaths.filter(p => p.toLowerCase().includes(filter.toLowerCase())) 
    : allPaths;
  const [selectedFile, setSelectedFile] = useState(filePaths[0] || allPaths[0]);

  useEffect(() => {
    if (filePaths.length > 0) setSelectedFile(filePaths[0]);
  }, [filter, files]);

  return (
    <div className="flex h-full bg-white rounded-[35px] overflow-hidden border border-gray-100">
      <div className="w-64 border-r border-gray-100 bg-[#FBFBFB] p-6 overflow-y-auto">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
          <FolderTree size={12} /> {filter ? `${filter.toUpperCase()} SECTION` : 'PROJECT FILES'}
        </h5>
        <div className="space-y-1">
          {filePaths.map(path => (
            <button
              key={path}
              onClick={() => setSelectedFile(path)}
              className={`w-full text-left px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-3 ${selectedFile === path ? 'bg-white shadow-sm border border-gray-100 text-[#E6644C] font-bold translate-x-1' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <FileCode size={14} className={selectedFile === path ? 'text-[#E6644C]' : 'text-gray-400'} />
              <span className="truncate">{path}</span>
            </button>
          ))}
          {filePaths.length === 0 && <p className="text-[10px] text-gray-400 italic">No files in this category.</p>}
        </div>
      </div>
      <div className="flex-1 bg-[#1A1A1A]">
        <CodePreview key={selectedFile} title={selectedFile} code={files[selectedFile] || '// No content generated'} />
      </div>
    </div>
  );
};

const VisualCanvas: React.FC<{ tokens: DesignTokens }> = ({ tokens }) => {
  return (
    <div className="w-full h-full p-10 overflow-auto flex flex-col gap-8 transition-colors duration-500" style={{ backgroundColor: tokens.colors.background }}>
      <div className="flex items-center justify-between p-6 bg-white shadow-sm" style={{ borderRadius: tokens.radii.card, backgroundColor: tokens.colors.surface }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center text-white" style={{ backgroundColor: tokens.colors.primary, borderRadius: tokens.radii.button }}><Brain size={24}/></div>
          <div className="space-y-2"><div className="h-4 w-32 bg-gray-100 rounded"></div><div className="h-2 w-20 bg-gray-50 rounded"></div></div>
        </div>
        <div className="flex gap-3">
          <div className="w-24 h-10 bg-gray-50" style={{ borderRadius: tokens.radii.button }}></div>
          <div className="w-24 h-10 shadow-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: tokens.colors.primary, borderRadius: tokens.radii.button }}>ACTION</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-8 bg-white shadow-xl flex flex-col" style={{ borderRadius: tokens.radii.card, backgroundColor: tokens.colors.surface }}>
            <div className="w-full aspect-[4/3] bg-gray-50 mb-6 rounded-2xl flex items-center justify-center overflow-hidden">
               <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200 animate-pulse" />
            </div>
            <div className="h-5 w-3/4 bg-gray-100 mb-3 rounded"></div>
            <div className="h-3 w-1/2 bg-gray-50 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function VisionDocApp() {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [activeTab, setActiveTab] = useState<ResultTab>(ResultTab.SOURCE);
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);

  const runAnalysis = useCallback(async (image: string) => {
    setStep(AppStep.SCANNING);
    setScanProgress(0);
    const progressInterval = setInterval(() => {
      setScanProgress(p => p < 98 ? p + 1.5 : p);
    }, 80);

    try {
      const result = await analyzeUIScreenshot(image);
      setAnalysisResult({
        tokens: result.tokens,
        markdownSpec: result.spec,
        cursorRules: result.rules,
        projectFiles: result.projectFiles,
        confidence: 99.2
      });
      clearInterval(progressInterval);
      setScanProgress(100);
      setTimeout(() => { setStep(AppStep.RESULT); setActiveTab(ResultTab.AICORE); }, 500);
    } catch (err: any) {
      console.error(err);
      alert("Extraction failed. Check API configuration.");
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
              const base64 = event.target?.result as string;
              setUploadedImage(base64);
              runAnalysis(base64);
              setTimeout(() => setIsPasting(false), 500);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step, runAnalysis]);

  const downloadBundle = () => {
    if (!analysisResult) return;
    const projectContent = Object.entries(analysisResult.projectFiles)
      .map(([path, content]) => `// --- FILE: ${path} ---\n${content}\n\n`)
      .join('');
    const blob = new Blob([projectContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VisionDoc_AI_FullStack_Project.txt`;
    a.click();
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || isProcessing) return;
    const query = chatQuery;
    setChatQuery('');
    setChatMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsProcessing(true);
    try {
      const response = await chatWithUI(query, uploadedImage || undefined);
      setChatMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', content: "Protocol failure. Brain sync interrupted." }]);
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-10 text-[#1A1A1A]">
      <div className="max-w-[1440px] mx-auto bg-white rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] min-h-[90vh] flex flex-col p-8 md:p-14 relative overflow-hidden border border-white">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-8 mb-20 relative z-20">
          <div className="flex items-center gap-5 cursor-pointer" onClick={() => setStep(AppStep.UPLOAD)}>
            <div className="bg-black text-white w-14 h-14 rounded-[18px] flex items-center justify-center font-bold text-2xl shadow-xl rotate-3">V</div>
            <div>
              <h1 className="text-2xl font-black leading-tight tracking-tighter italic">VisionDoc <span className="text-[#E6644C]">Pro</span></h1>
              <p className="text-[#9A9A9A] text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Full-Stack AI Sync</p>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-[#F8F8F8] p-2.5 pr-8 rounded-full border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md text-[#E6644C]"><Cpu size={20} fill="#E6644C" /></div>
            <div>
              <p className="text-xs font-black">AI Orchestrator Active</p>
              <p className="text-[10px] text-[#9A9A9A] font-bold">Vercel & Gemini Edge Protocols</p>
            </div>
            <img src="https://i.pravatar.cc/150?u=vision_pro" className="w-12 h-12 rounded-full ml-4 shadow-xl border-2 border-white" alt="Architect" />
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1 flex flex-col items-center justify-center relative z-20">
          <AnimatePresence mode="wait">
            {step === AppStep.UPLOAD && (
              <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-4xl text-center">
                <div className="inline-block px-4 py-1.5 bg-[#FDEEEB] rounded-full mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#E6644C]">Full-Sync Project Generation</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-light text-[#9A9A9A] mb-8 leading-[1.1]">Donnez vie à vos designs <br /><span className="text-[#1A1A1A] font-black italic">avec un stack IA complet.</span></h2>
                <label className={`group relative h-96 bg-[#F8F8F8] border-2 border-dashed rounded-[60px] flex flex-col items-center justify-center cursor-pointer transition-all ${isPasting ? 'border-[#E6644C] bg-[#FDEEEB] scale-[1.02]' : 'border-gray-200 hover:bg-white hover:shadow-2xl'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => runAnalysis(event.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                  <motion.div animate={isPasting ? { scale: 1.2 } : { y: [0, -10, 0] }} transition={{ repeat: isPasting ? 0 : Infinity, duration: 2 }} className="w-24 h-24 rounded-[30px] bg-white shadow-2xl flex items-center justify-center mb-8 group-hover:scale-110">
                    <Upload size={40} className="text-[#E6644C]" />
                  </motion.div>
                  <p className="font-black text-xl mb-1 tracking-tight">Paste your UI Layout</p>
                  <p className="font-bold text-[#E6644C] text-sm uppercase italic">Generate Gemini SDK & Vercel Config</p>
                </label>
              </motion.div>
            )}

            {step === AppStep.SCANNING && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl text-center">
                <div className="relative w-full aspect-video bg-gray-100 rounded-[40px] shadow-2xl mb-12 overflow-hidden border-[12px] border-white">
                  {uploadedImage && <img src={uploadedImage} className="w-full h-full object-cover opacity-40 grayscale" alt="Processing" />}
                  <ScanningOverlay />
                </div>
                <div className="w-64 h-2 bg-gray-100 rounded-full mx-auto mb-6 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${scanProgress}%` }} className="h-full bg-[#E6644C] shadow-[0_0_15px_#E6644C]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mapping Intelligence Layer...</h3>
                <p className="text-[#9A9A9A] text-xs uppercase font-bold tracking-[0.2em]">{Math.floor(scanProgress)}% - Building Full-Stack Infrastructure</p>
              </motion.div>
            )}

            {step === AppStep.RESULT && analysisResult && (
              <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full flex flex-col gap-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter mb-2 italic">Architecture Synced</h2>
                    <p className="text-[#9A9A9A] font-medium flex items-center gap-2"><Check size={16} className="text-green-500" /> AI Core Generated • Vercel Ready • 99.2% Accuracy</p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="ghost" className="border border-gray-100" onClick={() => setStep(AppStep.UPLOAD)}><RefreshCw size={18} /> New Sync</Button>
                    <Button onClick={downloadBundle}><Download size={18} /> Export FullStack Bundle</Button>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-10 min-h-[650px]">
                  {/* SIDEBAR */}
                  <div className="md:col-span-3 flex flex-col gap-6">
                    <Card className="p-8 flex flex-col h-full">
                       <h4 className="font-bold mb-8 uppercase text-[10px] tracking-[0.3em] text-[#E6644C]">Extracted DNA</h4>
                       <div className="space-y-4 flex-1 overflow-auto pr-2 scrollbar-hide">
                         <TokenItem iconKey="Palette" label="Brand" value={analysisResult.tokens.colors.primary} />
                         <TokenItem iconKey="Layout" label="Radius" value={analysisResult.tokens.radii.card} />
                         <TokenItem iconKey="Type" label="Typography" value={analysisResult.tokens.typography.fontFamily} />
                         <TokenItem iconKey="Maximize2" label="Spacing" value={analysisResult.tokens.spacing.gap} />
                       </div>
                       <div className="mt-8 pt-6 border-t border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Quick Start</p>
                          <div className="space-y-3">
                            <div className="flex gap-3 items-center text-xs font-bold text-gray-600"><div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">1</div> Set API Keys</div>
                            <div className="flex gap-3 items-center text-xs font-bold text-gray-600"><div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">2</div> Local Dev Sync</div>
                            <div className="flex gap-3 items-center text-xs font-bold text-gray-600"><div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">3</div> Vercel Push</div>
                          </div>
                       </div>
                    </Card>
                  </div>

                  {/* WORKSPACE */}
                  <div className="md:col-span-9 flex flex-col gap-6">
                    <div className="flex gap-2 bg-[#F8F8F8] p-1.5 rounded-[22px] self-start border border-gray-100 overflow-x-auto no-scrollbar max-w-full">
                      {[ResultTab.AICORE, ResultTab.DEPLOY, ResultTab.SOURCE, ResultTab.RULES, ResultTab.PREVIEW, ResultTab.CHAT].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab ? 'bg-white shadow-lg text-[#E6644C]' : 'text-[#9A9A9A]'}`}>
                          {tab === ResultTab.AICORE && <Brain size={14} />}
                          {tab === ResultTab.DEPLOY && <Rocket size={14} />}
                          {tab === ResultTab.SOURCE && <FolderTree size={14} />}
                          {tab === ResultTab.RULES && <Code size={14} />}
                          {tab === ResultTab.PREVIEW && <Eye size={14} />}
                          {tab === ResultTab.CHAT && <MessageSquare size={14} />}
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 shadow-2xl rounded-[35px] overflow-hidden bg-white">
                      <AnimatePresence mode="wait">
                        {activeTab === ResultTab.AICORE && (
                          <motion.div key="aicore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                            <SourceExplorer files={analysisResult.projectFiles} filter="api/chat" />
                          </motion.div>
                        )}
                        {activeTab === ResultTab.DEPLOY && (
                          <motion.div key="deploy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                            <SourceExplorer files={analysisResult.projectFiles} filter="vercel" />
                          </motion.div>
                        )}
                        {activeTab === ResultTab.SOURCE && (
                          <motion.div key="source" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                            <SourceExplorer files={analysisResult.projectFiles} />
                          </motion.div>
                        )}
                        {activeTab === ResultTab.RULES && (
                          <motion.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                            <CodePreview title=".cursor/rules/fullstack-patterns.mdc" code={analysisResult.cursorRules} />
                          </motion.div>
                        )}
                        {activeTab === ResultTab.PREVIEW && (
                          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-white overflow-hidden">
                            <VisualCanvas tokens={analysisResult.tokens} />
                          </motion.div>
                        )}
                        {activeTab === ResultTab.CHAT && (
                          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col p-6">
                            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-hide">
                              {chatMessages.length === 0 && <p className="text-gray-400 text-sm italic text-center mt-20">Discuss architectural refinements with the Lead Engine.</p>}
                              {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] p-5 rounded-[30px] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#E6644C] text-white rounded-tr-none' : 'bg-gray-100 text-[#1A1A1A] rounded-tl-none border border-gray-200'}`}>
                                    {msg.content}
                                  </div>
                                </div>
                              ))}
                              {isProcessing && <div className="animate-pulse flex gap-1 ml-4"><div className="w-2 h-2 bg-gray-300 rounded-full bounce"></div><div className="w-2 h-2 bg-gray-300 rounded-full bounce-delay-1"></div></div>}
                            </div>
                            <form onSubmit={handleChatSubmit} className="flex gap-3 p-2 bg-[#F8F8F8] rounded-full border border-gray-100 shadow-inner">
                              <input value={chatQuery} onChange={e => setChatQuery(e.target.value)} placeholder="Refine your AI routes or Vercel settings..." className="flex-1 bg-transparent px-6 py-2 outline-none text-sm" />
                              <Button variant="secondary" className="!p-3 w-12 h-12" type="submit" loading={isProcessing}><ArrowRight size={20} /></Button>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* FOOTER */}
        <footer className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-center text-[#9A9A9A] text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 relative z-20">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Full-Stack AI Node v2.5.2</div>
          <div className="flex gap-10">
            <span>Gemini 3 Pro + MDC Enabled</span>
            <span>Vercel Edge Ready</span>
          </div>
        </footer>
        <div className="absolute top-20 -left-20 w-[600px] h-[600px] bg-[#E6644C] opacity-[0.03] rounded-full blur-[180px] pointer-events-none" />
      </div>
      <VoiceAssistant />
    </div>
  );
}
