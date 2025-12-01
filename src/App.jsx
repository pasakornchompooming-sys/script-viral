import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { 
    Loader2, Sparkles, X, Layers, Film, ArrowUp, Settings2, 
    Palette, Image as ImageIcon, PlusCircle, Video as VideoIcon, 
    MonitorPlay, Wand2, FileSpreadsheet, Package, Check, Play, Copy, Mic, 
    Zap, Brain, Megaphone, Clapperboard, ChevronDown, ChevronUp,
    User, CreditCard, Trash2, RotateCcw, Edit3, Languages, FileText // ✅ เพิ่ม FileText ตรงนี้แล้ว
} from "lucide-react"; 

import { useState, useEffect, useRef } from 'react';

// --- CONFIG ---
const SERVER_URL = "http://119.59.103.159:5000"; 

// --- STYLES (8 แบบ) ---
const STYLE_OPTIONS = [
    { id: 'funny', label: '😂 ตลก / แกงตัวเอง', desc: 'เน้นฮา พากย์เสียงหลง', color: 'from-yellow-400 to-orange-500' },
    { id: 'lifestyle', label: '✨ ชีวิตดี๊ดี / Vlog', desc: 'อวดไลฟ์สไตล์ คุมโทน', color: 'from-sky-400 to-blue-500' },
    { id: 'hard-sell', label: '🔥 ขายดุดัน', desc: 'โปรแรง รีบตำ', color: 'from-red-500 to-rose-600' },
    { id: 'story', label: '🎬 เล่าเรื่อง / Story', desc: 'มีจุดพีค มีตอนจบ', color: 'from-purple-600 to-slate-900' },
    { id: 'soft-sell', label: '🤫 ป้ายยาเนียนๆ', desc: 'เหมือนเพื่อนมาบอก', color: 'from-pink-400 to-rose-400' },
    { id: 'expert', label: '🧠 ผู้เชี่ยวชาญ', desc: 'ความรู้แน่นๆ', color: 'from-emerald-500 to-teal-700' },
    { id: 'howto', label: '🛠️ How-to / สอนทำ', desc: 'ทีละขั้นตอน เข้าใจง่าย', color: 'from-blue-500 to-indigo-600' },
    { id: 'news', label: '📢 ข่าวด่วน / กระแส', desc: 'ทันเหตุการณ์ ตื่นเต้น', color: 'from-rose-500 to-red-700' },
];

// --- Helpers ---
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

const cleanAndParseJSON = (text) => {
    try {
        let clean = text.replace(/```json|```/g, '').trim();
        const start = clean.indexOf('[');
        const end = clean.lastIndexOf(']');
        if (start !== -1 && end !== -1) clean = clean.substring(start, end + 1);
        else if (start !== -1) clean = clean.substring(start) + ']';
        else if (clean.startsWith('{')) clean = '[' + clean + ']';
        return JSON.parse(clean);
    } catch (e) {
        try { return JSON.parse(text.replace(/```json|```/g, '').trim() + '}]'); } 
        catch (e2) { return null; }
    }
};

// --- COMPONENTS ---

const StyleCard = ({ item, isSelected, onClick }) => (
    <div onClick={() => onClick(item.label)} className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 overflow-hidden group ${isSelected ? 'border-orange-500 bg-orange-50 scale-[1.02] shadow-md' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
        <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-br ${item.color} opacity-20 rounded-bl-full -mr-2 -mt-2`}></div>
        <h3 className="font-bold text-gray-800 text-xs md:text-sm relative z-10">{item.label}</h3>
        <p className="text-[10px] text-gray-500 mt-0.5 relative z-10">{item.desc}</p>
        {isSelected && <div className="absolute top-1 right-1 text-orange-600"><Check size={12} /></div>}
    </div>
);

const SceneCard = ({ scene, index, userImages, onRegenImage }) => {
    const isUserAsset = scene.asset_type === 'user_image';
    const assetIndex = scene.asset_index - 1; 
    const displayImage = (isUserAsset && userImages[assetIndex]) ? userImages[assetIndex] : null;
    
    const [isEnglish, setIsEnglish] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyPrompt = () => {
        const textToCopy = isEnglish ? scene.visual_prompt_en : scene.visual_prompt_th;
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="min-w-[280px] w-[280px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-all group shrink-0">
            <div className="bg-gray-800 px-3 py-2 flex justify-between items-center">
                <span className="text-xs font-bold text-white">SCENE {index + 1}</span>
                <span className="text-xs text-gray-300">{(index * 3)}s - {(index * 3) + 3}s</span>
            </div>
            
            <div className="aspect-video bg-slate-50 relative border-b border-gray-100 overflow-hidden flex items-center justify-center group/visual">
                 {displayImage ? (
                     <>
                        <img src={displayImage} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm shadow-sm border border-white/20">
                            รูป User #{scene.asset_index}
                        </div>
                     </>
                 ) : (
                     <div className="p-4 text-center w-full h-full flex flex-col items-center justify-center relative">
                        <Wand2 size={24} className="text-orange-400 mb-2 opacity-50" />
                        <p className="text-xs text-gray-600 font-medium line-clamp-3 italic leading-relaxed px-2 transition-all">
                            "{isEnglish ? scene.visual_prompt_en : scene.visual_prompt_th}"
                        </p>
                        
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => onRegenImage(index, scene.visual_prompt_en)} className="bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-bold flex items-center gap-1">
                                <Zap size={12} className="fill-white"/> สร้างภาพ
                            </button>
                        </div>
                     </div>
                 )}

                 <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button 
                        onClick={() => setIsEnglish(!isEnglish)} 
                        className="bg-white/90 hover:bg-white text-gray-600 text-[10px] px-2 py-1.5 rounded-l-lg border-r border-gray-200 shadow-sm font-bold transition-all"
                    >
                        {isEnglish ? 'EN' : 'TH'}
                    </button>
                    <button 
                        onClick={handleCopyPrompt} 
                        className={`bg-white/90 hover:bg-white p-1.5 rounded-r-lg shadow-sm transition-all ${isCopied ? 'text-green-600' : 'text-gray-500 hover:text-blue-600'}`}
                        title="Copy Prompt"
                    >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                 </div>
            </div>

            <div className="p-4 bg-white flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Mic size={14} className="text-orange-600" />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">บทพากย์ (TH)</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium leading-relaxed font-sans">"{scene.voiceover}"</p>
                </div>
            </div>
        </div>
    );
};

const ResultRow = ({ script, index, userImages, onExportTXT, isExpanded, onToggle }) => {
    return (
        <div className={`bg-white border transition-all duration-300 overflow-hidden mb-4 ${isExpanded ? 'rounded-2xl shadow-md border-orange-200 ring-1 ring-orange-100' : 'rounded-xl border-gray-200 hover:border-gray-300'}`}>
            <div 
                className={`p-4 flex justify-between items-start cursor-pointer ${isExpanded ? 'bg-orange-50/50' : 'bg-white'}`}
                onClick={onToggle}
            >
                <div className="flex gap-3 items-start overflow-hidden">
                    <div className={`w-8 h-8 mt-1 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm transition-colors shrink-0 ${isExpanded ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        #{index + 1}
                    </div>
                    <div className="min-w-0">
                        <h3 className={`font-bold text-base line-clamp-2 leading-tight ${isExpanded ? 'text-gray-900' : 'text-gray-600'}`}>{script.concept_name}</h3>
                        <p className="text-xs text-blue-600 mt-1 truncate">
                            {(script.hashtags || []).map(tag => `#${tag}`).join(' ')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    {isExpanded ? <ChevronUp size={20} className="text-orange-500"/> : <ChevronDown size={20} className="text-gray-400"/>}
                </div>
            </div>

            {isExpanded && (
                <div className="animate-slide-down">
                    <div className="px-4 py-2 bg-white border-y border-orange-100 text-xs text-gray-600 flex gap-2 items-center">
                        <Brain size={14} className="text-indigo-500 shrink-0"/>
                        <span className="italic truncate">"{script.insight}" - Hook: {script.hook}</span>
                    </div>
                    <div className="p-4 bg-slate-50 overflow-x-auto custom-scrollbar">
                        <div className="flex gap-3 items-stretch pl-1"> 
                            {(script.scenes || []).map((scene, i) => (
                                <SceneCard key={i} scene={scene} index={i} userImages={userImages} onRegenImage={(idx, prompt) => alert(`[VPS REQUEST]\nPrompt: ${prompt}`)} />
                            ))}
                            <div className="min-w-[60px] flex flex-col justify-center items-center opacity-30 border-l border-dashed border-gray-300 ml-2 pl-4">
                                <Package size={16} className="text-gray-400 mb-1"/>
                                <span className="text-[9px] font-bold text-gray-400">END</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-3 bg-white border-t border-gray-100 flex justify-end">
                        <button onClick={(e) => { e.stopPropagation(); onExportTXT(script, index); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-black transition-all shadow-sm">
                            <FileText size={14} /> Export TXT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN APP ---
const App = () => {
    const [topic, setTopic] = useState('');
    const [style, setStyle] = useState(''); 
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    
    const [isVideoExpanded, setIsVideoExpanded] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isInputCollapsed, setIsInputCollapsed] = useState(false); 
    const [expandedResultId, setExpandedResultId] = useState(0); 

    const [scriptList, setScriptList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0); 
    const [error, setError] = useState(null);
    const [statusText, setStatusText] = useState('');

    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const timerRef = useRef(null); 
    const profileMenuRef = useRef(null);
    const resultsRef = useRef(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [profileMenuRef]);

    const handleClearAll = () => {
        setTopic('');
        setStyle('');
        setSelectedImages([]);
        setImagePreviews([]);
        setVideoFile(null);
        setVideoPreview(null);
        setScriptList([]);
        setError(null);
        setIsInputCollapsed(false);
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedImages.length > 5) return alert("สูงสุด 5 รูป");
        setSelectedImages([...selectedImages, ...files]);
        setImagePreviews([...imagePreviews, ...files.map(f => URL.createObjectURL(f))]);
    };

    const handleVideoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
    };

    const handleExportTXT = (script, index) => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; 
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-').substring(0, 5); 
        
        const safeTitle = script.concept_name.replace(/[^a-z0-9ก-๙ ]/gi, '_').substring(0, 30);
        const filename = `${dateStr}_${timeStr}_${safeTitle}.txt`;

        let content = `TITLE: ${script.concept_name}\n`;
        content += `HASHTAGS: ${(script.hashtags || []).map(t => `#${t}`).join(' ')}\n`;
        content += `HOOK: ${script.hook}\n`;
        content += `INSIGHT: ${script.insight}\n`;
        content += `====================================\n\n`;

        script.scenes.forEach((scene, i) => {
            content += `[SCENE ${i + 1}] (~3-5s)\n`;
            content += `VISUAL: ${scene.visual_prompt_th}\n`;
            content += `VOICEOVER: "${scene.voiceover}"\n`;
            content += `------------------------------------\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerateScript = async () => {
        if (!apiKey) return setError('⚠️ API Key ไม่ถูกต้อง');
        if (!topic.trim() && selectedImages.length === 0 && !videoFile) return setError('กรุณาใส่ข้อมูล: ข้อความ, รูปภาพ หรือ วิดีโอ อย่างใดอย่างหนึ่ง');
        
        setScriptList([]); setError(null); setIsLoading(true); setProgress(0); setElapsedTime(0);
        
        try {
            const hasText = !!topic.trim();
            const hasImages = selectedImages.length > 0;
            const hasVideo = !!videoFile;
            let scenarioMode = "TEXT_ONLY";
            if (hasImages && hasVideo) scenarioMode = "MIXED_MEDIA";
            else if (hasImages) scenarioMode = "IMAGES_ONLY";
            else if (hasVideo) scenarioMode = "VIDEO_ONLY";

            setStatusText(`กำลังเชื่อมต่อ AI...`);

            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return 95;
                    const increment = Math.random() * 2;
                    return prev + increment;
                });
            }, 500);

            const contentParts = [{ text: `โหมด: ${scenarioMode}\nโจทย์: "${topic}"\nสไตล์: "${style || 'ทั่วไป'}"` }];
            for (const file of selectedImages) {
                contentParts.push({ inline_data: { mime_type: file.type, data: await fileToBase64(file) } });
            }
            if (hasVideo) contentParts.push({ text: "[USER UPLOADED A VIDEO]" });

            const systemPrompt = `
                คุณคือ AI Director หน้าที่คือ "สร้าง Storyboard" สำหรับทำคลิปสั้น
                
                **เงื่อนไขการทำงาน (Strict Rules):**
                1. **Time Budget:** คุมความยาวคลิปรวมให้อยู่ในช่วง **15-30 วินาที**
                2. **Assets:** ต้องนำ Assets (รูป/วิดีโอ) มาเรียงลำดับ (Sequence) เพื่อเล่าเรื่อง
                3. **Visualizer:** ถ้าไม่มีรูป ให้เขียน Prompt (EN) สำหรับสร้างภาพให้ละเอียด
                
                **กระบวนการคิด (3 Roles):**
                1. **Analyst:** สแกน Input หา Insight
                2. **Marketer:** - **ชื่อเรื่อง (concept_name):** ตั้งชื่อคลิปให้น่าสนใจ พาดหัวแบบ Clickbait หรือใช้จิตวิทยาหยุดนิ้วโป้ง **ความยาวประมาณ 40-60 ตัวอักษร**
                   - **Hashtags:** คิดคำคมหรือคำไวรัล 3-5 คำ
                   - **Hook:** ประโยคเปิดคลิปที่แรง
                3. **Director:** กำกับ Scene และเขียนบทพากย์ (Voiceover) ภาษาพูดที่เป็นธรรมชาติ คุมเวลาพูดให้พอดีกับภาพ

                **Output Structure (JSON):**
                - concept_name: ชื่อไอเดีย (ยาว 40-60 ตัวอักษร)
                - insight: สิ่งที่ Analyst มองเห็น
                - hook: ประโยคเปิด
                - scenes: Array ของฉาก
                  - asset_type: 'user_image' | 'user_video' | 'generated'
                  - asset_index: ลำดับรูปที่ user ส่งมา (เริ่มที่ 1)
                  - visual_prompt_th: คำอธิบายภาพ
                  - visual_prompt_en: Prompt ภาษาอังกฤษ
                  - voiceover: บทพากย์
                - hashtags: [tag1, tag2, tag3]

                **คำสั่งสุดท้าย:** ให้สร้าง Storyboard มาแค่ 3 แบบ (3 Concepts) เท่านั้น!
            `;

            const responseSchema = {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        concept_name: { type: SchemaType.STRING },
                        insight: { type: SchemaType.STRING },
                        hook: { type: SchemaType.STRING },
                        scenes: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { asset_type: { type: SchemaType.STRING }, asset_index: { type: SchemaType.NUMBER }, visual_prompt_th: { type: SchemaType.STRING }, visual_prompt_en: { type: SchemaType.STRING }, voiceover: { type: SchemaType.STRING } }, required: ["asset_type", "voiceover", "visual_prompt_en"] } },
                        hashtags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                    },
                    required: ["concept_name", "insight", "hook", "scenes", "hashtags"]
                }
            };

            const model = "gemini-2.0-flash";
            
            setStatusText(`กำลังสร้าง Storyboard (${model})...`);
            console.log(`Using fixed model: ${model}`);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({
                    contents: [{ role: "user", parts: contentParts }],
                    generationConfig: { 
                        responseMimeType: "application/json", 
                        responseSchema: responseSchema, 
                        maxOutputTokens: 8192, 
                        temperature: 0.8 
                    },
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
            });

            if (response.status === 429) { 
                throw new Error(`โมเดล ${model} ถูกใช้งานหนักเกินไป (Rate Limit) กรุณารอสัก 1-2 นาทีแล้วลองใหม่ครับ`);
            }
            
            if (!response.ok) { 
                throw new Error(`Server Error: ${response.status}`);
            }

            const result = await response.json();
            if (!result.candidates || result.candidates.length === 0) {
                throw new Error("AI ไม่ตอบสนอง (No candidates)");
            }

            const resultText = result.candidates[0].content.parts[0].text;
            const fullList = cleanAndParseJSON(resultText);
            
            if (!fullList) throw new Error("ข้อมูลผิดพลาด (JSON Error) ลองใหม่ครับ");

            setScriptList(Array.isArray(fullList) ? fullList : [fullList]);
            
            setIsInputCollapsed(true);
            setExpandedResultId(0);
            
            clearInterval(interval);
            clearInterval(timerRef.current);
            setProgress(100);

            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);

        } catch (error) {
            console.error(error);
            setError(error.message);
            clearInterval(timerRef.current);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans text-gray-900 pb-20">
            {/* --- HEADER --- */}
            <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-2.5 rounded-xl shadow-lg shadow-orange-100">
                            <Sparkles size={20}/>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-sm font-black text-gray-900 tracking-wide">CONTENT</span>
                            <span className="text-sm font-black text-orange-600 tracking-wide">FACTORY</span>
                        </div>
                    </div>

                    <div className="relative" ref={profileMenuRef}>
                        <button 
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 p-1 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-orange-100 transition-all"
                        >
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
                        </button>

                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-50">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full"/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">คุณนักสร้างคอนเทนต์</p>
                                        <p className="text-xs text-gray-500">user@example.com</p>
                                    </div>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-3 mb-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-orange-800 flex items-center gap-1"><Zap size={12}/> เครดิตคงเหลือ</span>
                                        <span className="text-lg font-black text-orange-600">50</span>
                                    </div>
                                    <div className="w-full bg-orange-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-orange-500 h-full w-1/2"></div>
                                    </div>
                                </div>
                                <button className="w-full py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                                    <CreditCard size={14}/> เติมเครดิต (Top-up)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* --- INPUT SECTION --- */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-5 relative transition-all duration-500 ease-in-out overflow-hidden ${isInputCollapsed ? 'max-h-20 bg-gray-50' : 'max-h-[1200px]'}`}>
                            
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3 cursor-pointer" onClick={() => setIsInputCollapsed(!isInputCollapsed)}>
                                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Settings2 size={18} className="text-orange-500"/> ข้อมูลตั้งต้น
                                </h2>
                                <div className="flex gap-2">
                                    {isInputCollapsed ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronUp size={18} className="text-gray-400"/>}
                                    <button onClick={(e) => { e.stopPropagation(); handleClearAll(); }} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="ล้างข้อมูล">
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>

                            <div className={`space-y-5 transition-opacity duration-300 ${isInputCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">1. โจทย์ / สินค้า / เรื่องที่อยากเล่า</label>
                                    <textarea 
                                        value={topic} onChange={e => setTopic(e.target.value)}
                                        placeholder="เช่น รีวิวคอลลาเจนผิวใส, เที่ยวเชียงใหม่คนเดียว, บ่นเรื่องงาน..."
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-orange-500 outline-none h-24 resize-none transition-all placeholder-gray-300"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">2. รูปภาพประกอบ (ถ้ามี)</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {imagePreviews.map((src, i) => (
                                            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                                                <img src={src} className="w-full h-full object-cover" />
                                                <button onClick={() => {
                                                    const newImgs = [...selectedImages]; newImgs.splice(i, 1); setSelectedImages(newImgs);
                                                    const newPrevs = [...imagePreviews]; newPrevs.splice(i, 1); setImagePreviews(newPrevs);
                                                }} className="absolute top-0 right-0 bg-black/50 text-white p-0.5 hover:bg-red-500 transition-colors"><X size={10}/></button>
                                            </div>
                                        ))}
                                        <button onClick={() => fileInputRef.current.click()} className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 transition-all shrink-0 bg-gray-50">
                                            <PlusCircle size={18} />
                                        </button>
                                    </div>
                                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleImageSelect} accept="image/*" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-xs font-bold text-gray-500 block">3. วิดีโอ (ถ้ามี)</label>
                                        <button 
                                            onClick={() => setIsVideoExpanded(!isVideoExpanded)}
                                            className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline"
                                        >
                                            {isVideoExpanded ? 'ซ่อน' : 'เพิ่มวิดีโอ'} {isVideoExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                        </button>
                                    </div>
                                    {isVideoExpanded && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            {!videoFile ? (
                                                <div onClick={() => videoInputRef.current.click()} className="border-2 border-dashed border-blue-100 bg-blue-50/50 rounded-xl p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors group">
                                                    <VideoIcon size={24} className="mx-auto text-blue-300 group-hover:text-blue-500 mb-2 transition-colors"/>
                                                    <span className="text-xs text-blue-600 font-bold">คลิกเพื่ออัปโหลดวิดีโอ</span>
                                                </div>
                                            ) : (
                                                <div className="relative rounded-xl overflow-hidden bg-black border border-gray-200 shadow-md">
                                                    <video src={videoPreview} className="w-full max-h-40 object-contain" />
                                                    <button onClick={() => {setVideoFile(null); setVideoPreview(null)}} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"><X size={12}/></button>
                                                </div>
                                            )}
                                            <input type="file" ref={videoInputRef} onChange={handleVideoSelect} className="hidden" accept="video/*" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">4. สไตล์ (Mood)</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                        {STYLE_OPTIONS.map((opt) => (
                                            <StyleCard key={opt.id} item={opt} isSelected={style === opt.label} onClick={setStyle} />
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerateScript} 
                                    disabled={isLoading} 
                                    className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isLoading ? <Loader2 className="animate-spin"/> : <Sparkles className="text-yellow-400 fill-yellow-400"/>}
                                    {isLoading ? 'กำลังสร้าง...' : 'เริ่มสร้าง Storyboard'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- OUTPUT SECTION --- */}
                    <div className="lg:col-span-7 space-y-4" ref={resultsRef}>
                        {scriptList.length > 0 ? (
                            <div className="animate-fade-in">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clapperboard className="text-orange-600" size={24}/>
                                    <h2 className="text-xl font-black text-gray-900">STORYBOARD RESULT ({scriptList.length})</h2>
                                </div>
                                {scriptList.map((script, idx) => (
                                    <ResultRow 
                                        key={idx} 
                                        script={script} 
                                        index={idx} 
                                        userImages={imagePreviews} 
                                        onExportTXT={handleExportTXT} 
                                        isExpanded={expandedResultId === idx} 
                                        onToggle={() => setExpandedResultId(expandedResultId === idx ? -1 : idx)} 
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl min-h-[400px] bg-gray-50/50">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                    <LayoutIcon size={40} className="text-gray-300"/>
                                </div>
                                <p className="text-sm font-medium text-gray-500">รอข้อมูลเพื่อสร้าง Storyboard...</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {isLoading && (
                <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin flex items-center justify-center"></div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-black text-gray-800">{elapsedTime}s</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">AI Director Working...</h3>
                    <p className="text-sm text-gray-500 mb-6 animate-pulse">{statusText}</p>
                    <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LayoutIcon = ({size, className}) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>);

export default App;