import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
// 1. **FIXED IMPORT:** รวม Copy และ Check ไว้ในรายการเดียว
import { 
    Loader2, Sparkles, X, Clock, Layers, Film, ArrowUp, ChevronDown, ChevronUp, Settings2, 
    Palette, Ban, Search, FileText, Copy, Check 
} from "lucide-react"; 

// --- ส่วนของ Firebase --- 
// *** ผมได้ลบการนำเข้า Firebase (auth, db, provider) ออกไป เนื่องจากโค้ดนี้ไม่มีการเรียกใช้ระบบ Auth/DB แล้ว ตามที่เราตกลงกัน ***
import { useState, useEffect, useRef } from 'react';

// --- Helper Function: Delay เพื่อลดโหลด Server ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Component Helpers (Light Mode) ---

const AccentButton = ({ children, onClick, disabled, className = '', icon: Icon, type = 'button' }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-md active:scale-[0.98] whitespace-nowrap ${
            disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-300/50'
        } ${className}`}
    >
        {Icon && <Icon size={16} />}
        {children}
    </button>
);

const FormInput = ({ label, value, onChange, placeholder, type = 'text', step, min, max, icon: Icon, className = '' }) => (
    <div className={`flex flex-col space-y-2 ${className}`}>
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            {Icon && <Icon size={16} className="text-orange-500" />}
            {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            step={step}
            min={min}
            max={max}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder-gray-400 bg-white"
        />
    </div>
);

const DropdownSelect = ({ label, value, onChange, items, placeholder, icon: Icon, showDropdown, setShowDropdown, dropdownRef, className = '' }) => {
    // ใช้ useState และ useEffect ภายในเพื่อจัดการสถานะการกรอง
    const [searchTerm, setSearchTerm] = useState(value);
    
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    const filteredItems = items.filter(item => 
        item.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                {Icon && <Icon size={16} className="text-orange-500" />}
                {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => { 
                        onChange(e); 
                        setSearchTerm(e.target.value);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={placeholder}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder-gray-400 bg-white cursor-pointer"
                />
                <ChevronDown size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            {showDropdown && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {/* Input สำหรับการค้นหา */}
                    <div className="p-2 sticky top-0 bg-white border-b border-gray-200">
                         <input
                            type="text"
                            placeholder="ค้นหาสไตล์..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-sm"
                        />
                    </div>
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => { 
                                    onChange({ target: { value: item } }); 
                                    setShowDropdown(false); 
                                }}
                                className="px-3 py-2 text-gray-800 hover:bg-orange-50 cursor-pointer text-sm"
                            >
                                {item}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">ไม่พบสไตล์</div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- NEW COMPONENT: Copy Button Helper ---
const _CopyButton = ({ content, className = '' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation(); 
        // 🔑 ใช้ navigator.clipboard.writeText ในการคัดลอก
        navigator.clipboard.writeText(content); 
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-1.5 rounded-full text-white transition-colors duration-200 flex items-center justify-center flex-shrink-0 active:scale-[0.9] ${
                copied ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-600 hover:bg-orange-700'
            } ${className}`}
            title={copied ? "คัดลอกแล้ว!" : "คัดลอกข้อความ"}
        >
            {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
    );
};


// --- Script Display Component (Light Mode) ---

const ScriptDisplay = ({ script, index, isOpen, toggleOpen, handleDownload }) => {
    // 1. ADDED: Ref for the component container
    const scriptRef = useRef(null); 
    const [shotLang, setShotLang] = useState('th');
    const [thumbLang, setThumbLang] = useState('th');

    const currentClipDuration = (script.shot_prompts?.length || 0) > 0 
        ? `${(script.shot_prompts.length * 3) + 3}`
        : '15';

    const color = (index % 3 === 0) ? 'bg-blue-600' : (index % 3 === 1) ? 'bg-teal-600' : 'bg-red-600';

    const safeHashtags = script.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');

    // 2. MODIFIED: useEffect for scrolling when the script opens
    useEffect(() => {
        // เมื่อเปิด (isOpen = true) และมี Ref 
        if (isOpen && scriptRef.current) {
            // Delay 100ms เพื่อให้แน่ใจว่าการขยายตัวเสร็จสิ้นก่อนเลื่อน
            setTimeout(() => {
                scriptRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    // 'start' puts the top of the element at the top of the viewport (ใช้ร่วมกับ scroll-mt-24)
                    block: 'start' 
                });
            }, 100); 
        }
    }, [isOpen]);

    return (
        // 3. IMPORTANT: ADDED: ref={scriptRef} to the main container & **scroll-mt-24** for padding due to sticky header
        <div 
            ref={scriptRef} 
            className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl scroll-mt-24"
        >
            {/* Header / Collapse Bar */}
            <div
                className={`p-4 md:p-5 flex justify-between items-center cursor-pointer transition-colors ${isOpen ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                onClick={toggleOpen}
            >
                {/* แก้ไข: ใช้ flex-grow เพื่อให้ชื่อหัวข้อใช้พื้นที่ว่างทั้งหมด 
                    และใช้ items-start เพื่อให้ title ที่ขึ้นบรรทัดใหม่ไม่ดันเลขลำดับลงมา
                */}
                <div className="flex items-start gap-4 flex-grow min-w-0 pr-4"> 
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-sm flex-shrink-0 ${color}`}>
                        {index + 1}
                    </div>
                    {/* แก้ไข: ลบ 'truncate' และใช้ 'leading-snug break-words' เพื่อให้ข้อความตัดคำขึ้นบรรทัดใหม่ได้
                    */}
                    <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug break-words"> 
                        {script.title || "Untitled Script"}
                    </h3>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="flex items-center gap-1 text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        <Clock size={16} className="text-orange-500"/>
                        {currentClipDuration}s
                    </span>
                    <div className="text-gray-500">
                        {isOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            {isOpen && (
                <div className="p-4 md:p-6 border-t border-gray-200 bg-white">
                    <div className="flex justify-end mb-6">
                        <AccentButton 
                            onClick={(e) => { e.stopPropagation(); handleDownload(script, index); }} 
                            className="!py-2 !px-3"
                            icon={FileText}
                        >
                            ดาวน์โหลดสคริปต์ (.txt)
                        </AccentButton>
                    </div>

                    {/* Section: Overview (Add Copy Button) */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                            <h4 className="flex items-center gap-2 text-base font-bold text-gray-700">
                                <Layers size={18} className="text-orange-600"/> สรุปคอนเซปต์ (Concept)
                            </h4>
                            {/* Pass content to the copy button */}
                            {script.description && <_CopyButton content={script.description} className="!p-2" />}
                        </div>
                        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50 shadow-inner text-gray-800 text-sm leading-relaxed">
                            <p className="whitespace-pre-wrap">{script.description}</p>
                        </div>
                    </div>

                    {/* Section: Voice Over (Add Copy Button) */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                            <h4 className="flex items-center gap-2 text-base font-bold text-gray-700">
                                <Sparkles size={18} className="text-orange-600"/> บทพูด (Voice Over)
                            </h4>
                            {/* Pass content to the copy button */}
                            {script.voice_over_script && <_CopyButton content={script.voice_over_script} className="!p-2" />}
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 whitespace-pre-wrap text-gray-900 text-sm shadow-inner font-mono">
                            <p className='leading-relaxed'>{script.voice_over_script}</p>
                        </div>
                    </div>

                    {/* Section: Shots / Visuals (Add Toggle and Copy Button per Shot) */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                            <h4 className="flex items-center gap-2 text-base font-bold text-gray-700">
                                <Film size={18} className="text-orange-600"/> Shot List & Prompt
                            </h4>
                            {/* Language Toggle for Shots */}
                            <div className="flex rounded-full overflow-hidden bg-gray-200 text-xs font-semibold flex-shrink-0">
                                <button
                                    onClick={() => setShotLang('th')}
                                    className={`px-3 py-1 transition-all ${shotLang === 'th' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                                >
                                    TH
                                </button>
                                <button
                                    onClick={() => setShotLang('en')}
                                    className={`px-3 py-1 transition-all ${shotLang === 'en' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                        <ul className="space-y-3">
                            {script.shot_prompts.map((shot, i) => {
                                const content = shotLang === 'th' ? shot.th : shot.en;
                                const secondaryContent = shotLang === 'th' ? shot.en : shot.th;
                                const secondaryLabel = shotLang === 'th' ? 'Prompt EN:' : 'คำอธิบาย TH:';
                                
                                return (
                                    <li key={i} className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm hover:border-orange-300 transition-colors flex flex-col justify-between items-start gap-2">
                                        <div className="flex justify-between items-center w-full">
                                            <p className="font-semibold text-sm text-gray-800 leading-relaxed max-w-[90%]">
                                                <span className="text-orange-600 font-extrabold mr-2">SHOT {i + 1}</span>
                                                {content}
                                            </p>
                                            {/* Copy button for the selected language content */}
                                            <_CopyButton content={content} />
                                        </div>
                                        {/* Show the secondary language underneath for context */}
                                        <p className="text-xs text-gray-500 w-full pt-1 border-t border-gray-100">
                                            <span className="font-mono italic">{secondaryLabel}</span> {secondaryContent}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Section: Thumbnail & Hashtags (Add Toggle and Copy Buttons) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            {/* Thumbnail Header & Copy/Toggle */}
                            <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                                <h4 className="flex items-center gap-2 text-base font-bold text-gray-700">
                                    <Palette size={18} className="text-orange-600"/> Thumbnail Prompt
                                </h4>
                                <div className="flex gap-2 items-center flex-shrink-0">
                                    <div className="flex rounded-full overflow-hidden bg-gray-200 text-xs font-semibold">
                                        <button
                                            onClick={() => setThumbLang('th')}
                                            className={`px-3 py-1 transition-all ${thumbLang === 'th' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                                        >
                                            TH
                                        </button>
                                        <button
                                            onClick={() => setThumbLang('en')}
                                            className={`px-3 py-1 transition-all ${thumbLang === 'en' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                                        >
                                            EN
                                        </button>
                                    </div>
                                    {script.thumbnail_prompt && <_CopyButton content={thumbLang === 'th' ? script.thumbnail_prompt.th : script.thumbnail_prompt.en} className="!p-2" />}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                                <p className="font-semibold text-gray-800 leading-relaxed">
                                    {thumbLang === 'th' ? script.thumbnail_prompt.th : script.thumbnail_prompt.en}
                                </p>
                            </div>
                        </div>
                        <div>
                            {/* Hashtags Header & Copy Button */}
                            <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                                <h4 className="flex items-center gap-2 text-base font-bold text-gray-700">
                                    <Search size={18} className="text-orange-600"/> Hashtags
                                </h4>
                                {script.hashtags.length > 0 && <_CopyButton content={safeHashtags} className="!p-2" />}
                            </div>
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 min-h-[50px]">
                                {script.hashtags.map((tag, i) => (
                                    <span key={i} className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-medium">
                                        #{tag.replace(/^#/, '')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Landing Page (Light Mode) ---
const LandingPage = ({ onStart }) => (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col items-center justify-start pt-24 md:pt-32 text-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-50">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/50 rounded-full blur-[80px] animate-pulse"></div>
            <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-yellow-200/50 rounded-full blur-[80px] animate-pulse"></div>
        </div>

        <div className="relative z-10 max-w-3xl animate-fade-in w-full">
            <div className="mb-6 inline-block px-3 py-1 rounded-full bg-white border border-gray-300 backdrop-blur-sm text-orange-600 text-[10px] md:text-xs font-bold tracking-wider shadow-lg">
                🗝️ กุญแจสู่ยอดวิวหลักล้าน
            </div>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-gray-700 leading-snug mb-2">
                <span className="block">Content is King</span>
                <span className="block text-gray-900 mt-1">Speed is Money</span>
            </h1>
            
            <div className="my-5">
                <span className="text-4xl md:text-6xl font-black tracking-tighter text-orange-600 drop-shadow-[0_0_20px_rgba(234,88,12,0.5)] uppercase font-mono block transform scale-y-110">
                    CONTENT FACTORY
                </span>
            </div>
            
            <h2 className="text-lg md:text-2xl font-bold leading-normal mb-8">
                <span className="text-orange-500">
                    เปลี่ยน "คำธรรมดา" ให้เป็น "ไวรัล" 🚀
                </span>
            </h2>
            <div className="mb-10 space-y-3">
                <p className="text-xs md:text-sm text-gray-500 font-light tracking-wide">
                    หยุดเสียเวลา! โลกออนไลน์ไม่รอใคร...
                </p>
                <p className="text-base md:text-lg text-gray-800 font-medium px-4 leading-relaxed">
                    ปลดล็อกความคิดสร้างสรรค์ของคุณ <br />
                    เติมสต็อกคอนเทนต์ให้เต็ม
                </p>
            </div>
            <AccentButton 
                onClick={onStart}
                className="!px-10 !py-3 !text-lg !rounded-full !shadow-lg shadow-orange-500/50"
                icon={ArrowUp}
            >
                🚀 เริ่มสร้างสคริปต์เลย
            </AccentButton>
            <p className="mt-8 text-gray-500 text-[10px] uppercase tracking-widest opacity-80">
                ระบบทำงานโดยไม่ต้องเข้าสู่ระบบ
            </p>
        </div>
    </div>
);


// --- Schema Definition ---
const scriptListSchema = {
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            title: { type: SchemaType.STRING, description: "ชื่อคลิปภาษาไทย" },
            thumbnail_prompt: { 
                type: SchemaType.OBJECT,
                properties: {
                    en: { type: SchemaType.STRING, description: "Prompt ภาษาอังกฤษ" },
                    th: { type: SchemaType.STRING, description: "คำอธิบายภาพภาษาไทย" }
                },
                required: ["en", "th"]
            },
            shot_prompts: { 
                type: SchemaType.ARRAY, 
                items: { 
                    type: SchemaType.OBJECT,
                    properties: {
                        en: { type: SchemaType.STRING, description: "Prompt ภาษาอังกฤษ" },
                        th: { type: SchemaType.STRING, description: "คำอธิบายภาพและมุมกล้อง (ต้องระบุเวลา เช่น [0-3s])" }
                    },
                    required: ["en", "th"]
                }, 
                description: "รายการภาพ Shot Prompts" 
            },
            voice_over_script: { type: SchemaType.STRING, description: "บทพูดภาษาไทย (สั้น กระชับ เนื้อๆ)" },
            description: { type: SchemaType.STRING, description: "คำอธิบายคลิป" },
            hashtags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["title", "thumbnail_prompt", "shot_prompts", "voice_over_script", "description", "hashtags"]
    }
};


// --- Main Application Component ---

const App = () => {
    
    // ✅ FIX: เปลี่ยนไปใช้ 'app' ทันที
    const [currentPage, setCurrentPage] = useState('app'); 
    
    const [progress, setProgress] = useState(0); 

    // --- Form Logic ---
    const [topic, setTopic] = useState('');
    const [style, setStyle] = useState(''); 
    const [duration, setDuration] = useState("15");
    // ✅ ค่าคงที่
    const [shotCount, setShotCount] = useState(5); 
    const [isFormExpanded, setIsFormExpanded] = useState(true);
    
    // Dropdown Logic
    const [showStyleDropdown, setShowStyleDropdown] = useState(false);
    const styleDropdownRef = useRef(null);
    const abortControllerRef = useRef(null);
    const intervalRef = useRef(null);

    const [scriptList, setScriptList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false); 
    const [error, setError] = useState(null);
    const [expandedIndex, setExpandedIndex] = useState(null);

    const selectedModel = "gemini-2.0-flash"; 
    
    // 🔑 ใช้ VITE_GEMINI_API_KEY เท่านั้น
    // const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

    // แก้ไขเป็นชื่อใหม่
    const apiKey = import.meta.env.VITE_GEMINI_PROD_KEY;
    
    // 💡 ตัวช่วยตรวจสอบ: แสดงผลใน console เมื่อ component ถูกโหลด
    useEffect(() => {
        console.log("--- API Key Check (App.jsx) ---");
        if (apiKey) {
            console.log("VITE_GEMINI_API_KEY loaded: YES (Starts with: " + apiKey.substring(0, 5) + "...)");
        } else {
            console.error("VITE_GEMINI_API_KEY loaded: NO. Please check .env.local and restart the server.");
        }
        
        const handleClickOutside = (event) => {
            if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
                setShowStyleDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [apiKey]);


    const popularStyles = [
        "😂 ตลก / กวนโอ๊ย", "🥊 ผัวเมียตีกัน / ปัญหาชีวิตคู่", "📈 หุ้น / การลงทุน / Crypto",
        "✈️ ท่องเที่ยว / Vlog", "👻 เล่าเรื่องผี / สยองขวัญ", "🔥 ขายของดุดัน (Hard Sale)",
        "🎓 สาระความรู้ / How-to", "✨ แรงบันดาลใจ / สู้ชีวิต", "🍲 รีวิวอาหาร / พากิน",
        "🗣️ สรุปข่าว / ดราม่าโซเชียล", "🔮 สายมู / ดูดวง / ฮวงจุ้ย", "💰 ปลดหนี้ / ออมเงิน",
        "💪 ลดความอ้วน / สุขภาพ", "💄 แต่งหน้า / แฟชั่น / ความสวย", "💔 อกหัก / เศร้า / เหงา",
        "🏠 แต่งบ้าน / รีวิวของใช้", "🚗 รีวิวรถ / ยานยนต์", "📱 ไอที / แกดเจ็ต / ทริคมือถือ",
        "🐶 สัตว์เลี้ยง / ทาสแมว", "🎮 เกมเมอร์ / สตรีมเกม", "🎬 สปอยล์หนัง / เล่าซีรีส์",
        "🕵️ คดีปริศนา / จับโกหก", "⛺ แคมป์ปิ้ง / เดินป่า", "🎱 เสี่ยงโชค / เลขเด็ด",
        "🌱 เกษตร / ปลูกผัก", "🌏 ประวัติศาสตร์ / รอบโลก", "🧘 จิตวิทยา / พัฒนาตนเอง",
        "🎤 ASMR / ผ่อนคลาย", "📚 เล่านิทาน / ตำนาน", "📢 ทางการ / ข่าวประชาสัมพันธ์"
    ];

    // *** โค้ดส่วนนี้ไม่ได้ใช้จริง แต่ถูกเก็บไว้สำหรับ DropdownSelect Component ***
    // const filteredStyles = popularStyles.filter(s => 
    //     s.toLowerCase().includes(style.toLowerCase())
    // );
    // ***

    const resetState = (fullReset = false) => {
        setError(null);
        setIsLoading(false);
        setIsFinished(false);
        setProgress(0);
        setExpandedIndex(null);
        
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (abortControllerRef.current) abortControllerRef.current.abort();

        if (fullReset) {
            setTopic('');
            setStyle('');
            setScriptList([]);
            setDuration("15");
            // ✅ ค่าคงที่
            setShotCount(5); 
            setIsFormExpanded(true);
        }
    };


    const handleClearTopic = () => {
        setTopic('');
        setIsFormExpanded(true);
        setIsFinished(false);
        setScriptList([]);
        setError(null);
    };

    const handleDownload = (scriptData, index) => {
        const safeHashtags = scriptData.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
        const content = `TITLE: ${scriptData.title}
----------------------------------------
CONCEPT: ${scriptData.description}
HASHTAGS: ${safeHashtags}

VOICE OVER:
${scriptData.voice_over_script}

----------------------------------------
SHOTS:
${scriptData.shot_prompts.map((shot, i) => `[SHOT ${i+1}] TH: ${shot.th}\n(EN: ${shot.en})`).join('\n\n')}`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(blob);
        element.download = `script-${index + 1}-${scriptData.title}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsLoading(false);
        setProgress(0);
        setIsFormExpanded(true);
        setIsFinished(false);
        setError("การสร้างสคริปต์ถูกยกเลิกแล้ว");
        clearInterval(intervalRef.current);
    };

    const handleGenerateScript = async () => {
        // --- 0. Pre-checks ---
        if (!apiKey || apiKey.length < 10) { 
            setError('⚠️ API Key ไม่ถูกโหลด! กรุณาตรวจสอบว่าคุณใส่ค่าในไฟล์ .env.local ภายใต้ชื่อ VITE_GEMINI_API_KEY และได้ Restart Server แล้ว'); 
            return; 
        }
        if (!topic.trim()) { setError('กรุณาป้อนหัวข้อก่อนครับ'); return; }
        
        const currentDuration = Number(duration);
        const currentShotCount = Number(shotCount);
        // ✅ ค่าคงที่ใหม่: จำนวนคลิปที่ต้องสร้าง
        const CLIP_COUNT = 5; 
        
        // บังคับใช้ลิมิตความปลอดภัย
        if (currentDuration > 15 || currentShotCount > 5) {
            setError("⚠️ เกินลิมิตความปลอดภัย! ความยาวสูงสุด 15 วินาที / 5 ช็อตต่อคลิป");
            return;
        }

        // --- 1. Start ---
        resetState(false); 
        setScriptList([]);
        setIsLoading(true);
        setIsFormExpanded(false); 

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        // --- 2. Generation Process ---
        try {
            
            // Start Progress Interval
            setProgress(1); 
            intervalRef.current = setInterval(() => {
                setProgress(prev => {
                    // ✅ อัปเดตการคำนวณ Progress ด้วย CLIP_COUNT
                    const nextStep = prev + (100 / (CLIP_COUNT * 4)); 
                    return Math.min(nextStep, 99);
                });
            }, 1500); 

            // Define System Instruction
            const systemInstruction = `
                คุณคือทีม Content Factory AI ที่ประกอบด้วย **นักจิตวิทยา (Psychologist)**, **นักการตลาด (Marketer)**, และ **Scriptwriter มืออาชีพ**

                **กระบวนการทำงาน (Workflow Priority):**
                1. **นักการตลาด (Marketer):** กำหนดหัวข้อหลักและสไตล์ที่ผู้ใช้ป้อนมา และสร้าง **5 แนวคิด/มุมมอง (Angle)** ที่แตกต่างกันโดยสิ้นเชิงและไม่ซ้ำกัน โดยเน้นที่ Keyword, Trend, และ Searchability เพื่อให้มั่นใจว่าแต่ละคลิปมีโอกาสเป็นไวรัลสูงสุด
                2. **นักจิตวิทยา (Psychologist):** ตรวจสอบแต่ละ Angle ที่นักการตลาดกำหนด และออกแบบ **The Hook (3 วินาทีแรก)** และกำหนด **Emotional Resonance** (เช่น ตลก, อยากรู้, โกรธ) ที่ชัดเจนที่สุดเพื่อดึงดูดผู้ชมให้ดูจนจบ
                3. **Scriptwriter (ผู้กำกับ/Technical Executor):** ทำหน้าที่เป็นผู้ดำเนินการขั้นสุดท้าย โดยรับกลยุทธ์และ Hook มา **เขียนบทพูด (Voice Over)** และที่สำคัญคือต้อง **กำกับภาพ (Shot Prompts)** โดยระบุมุมกล้อง/ฉากอย่างละเอียดพร้อมเวลา (TH) และสร้าง Prompt ภาษาอังกฤษ (EN) เพื่อให้พร้อมสำหรับการผลิตด้วย AI / Editor ทันที

                **ภารกิจหลัก:** สร้างสคริปต์วิดีโอสั้นจำนวน 5 คลิป โดยใช้หลักการดังนี้:

                **จากมุมมองของนักจิตวิทยา (Psychologist):**
                1. **The Hook (3 วินาทีแรก):** บทพูดและช็อตแรกต้องมีพลังดึงดูดสูงสุด สร้างความอยากรู้, สร้างความขัดแย้ง, หรือสร้างความรู้สึกร่วมทันที (Relatability)
                2. **Emotional Resonance:** เนื้อหาต้องกระตุ้นอารมณ์ใดอารมณ์หนึ่งที่รุนแรง เพื่อให้ผู้ชมดูจนจบ

                **จากมุมมองของนักการตลาด (Marketer):**
                1. **Trend & SEO:** ชื่อคลิปและคำอธิบายต้องใช้ Keyword ที่เกี่ยวข้องกับหัวข้อและสไตล์เพื่อช่วยในการค้นหา (Searchability) และถูกออกแบบมาให้มีโอกาสถูกดันโดย Algorithm
                2. **Hashtags:** ต้องเลือกแฮชแท็กที่ตรงกับสไตล์และมีโอกาสเป็นไวรัลสูง
                3. **Clear Value:** เนื้อหาต้องนำเสนอ "คุณค่า" ที่ชัดเจน (เช่น สอน, แก้ปัญหา, ให้ความบันเทิง) ภายในเวลาสั้นที่สุด
                4. **Variety Focus (สำคัญ):** ต้องสร้างสคริปต์ ${CLIP_COUNT} คลิป โดยแต่ละสคริปต์จะต้องมี **แนวคิดหลัก (Core Concept), มุมมอง (Angle) และ โทนเสียง (Tone)** ที่แตกต่างกันโดยสิ้นเชิง โดยทั้งหมดต้องสอดคล้องกับสไตล์หลักที่เลือก เพื่อหลีกเลี่ยงการทำคอนเทนต์ที่ซ้ำซ้อนกัน **(ต้องสุ่มมุมมองให้แตกต่างโดยอัตโนมัติ)**

                **โครงสร้างทางเทคนิค:**
                1. **ความยาว:** สคริปต์ทั้งหมดต้องมีความยาวไม่เกิน ${currentDuration} วินาที โดยบทพูดต้องสั้น กระชับ และดึงดูด
                2. **Shot Prompts:** ต้องสร้าง Shot Prompts ไม่เกิน ${currentShotCount} ช็อต โดยแต่ละช็อตต้องมีคำอธิบายภาพและมุมกล้องที่ชัดเจน (ภาษาไทย) และต้องระบุเวลาเริ่มต้นและสิ้นสุดของช็อตนั้นๆ (เช่น [0-3s])
                3. **Prompt ภาษาอังกฤษ:** สำหรับ Shot Prompt และ Thumbnail Prompt ทุกช็อตต้องมี Prompt ภาษาอังกฤษ (en) สำหรับใช้สร้างรูปภาพหรือวิดีโอด้วย AI
                4. **สไตล์:** ใช้สไตล์หลักคือ "${style || 'ทั่วไป'}"
                5. **รูปแบบผลลัพธ์:** ต้องตอบกลับเป็น JSON Array ตาม Schema ที่กำหนดให้เท่านั้น (ห้ามมีคำพูดใดๆ นอกเหนือจาก JSON)
            `;


            const payload = {
                contents: [
                    // ✅ อัปเดต Payload: ใช้ CLIP_COUNT
                    { role: "user", parts: [{ text: `สร้างสคริปต์วิดีโอสั้นจำนวน ${CLIP_COUNT} คลิป ในหัวข้อ: "${topic}" โดยใช้สไตล์ "${style || 'ทั่วไป'}" โครงสร้างทั้ง ${CLIP_COUNT} คลิปนี้ต้องมี **แนวคิด (Concept) และมุมมอง (Angle)** ที่แตกต่างกันอย่างชัดเจน และต้องสุ่มมุมมองให้ไม่ซ้ำกัน` }] } 
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: scriptListSchema,
                },
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                }
            };

            const maxRetries = 3;
            let responseData = null;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                if (signal.aborted) throw new Error("Aborted");

                if (attempt > 0) {
                    console.log(`Retrying API call: Attempt ${attempt + 1}`);
                    await delay(Math.pow(2, attempt) * 1000); 
                }

                try {
                    // ใช้ apiKey ที่มาจาก .env ในการเรียก API
                    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        signal: signal,
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    
                    if (result.candidates && result.candidates.length > 0) {
                        const jsonText = result.candidates[0].content?.parts[0]?.text;
                        if (jsonText) {
                            // 💡 การตรวจสอบเบื้องต้นก่อน JSON.parse เพื่อหลีกเลี่ยง syntax error
                            let cleanedJsonText = jsonText.trim();
                            if (cleanedJsonText.startsWith("```json")) {
                                cleanedJsonText = cleanedJsonText.substring(7, cleanedJsonText.lastIndexOf("```")).trim();
                            }
                            responseData = JSON.parse(cleanedJsonText);
                            break; 
                        }
                    }
                    throw new Error("No valid JSON response from model.");
                } catch (e) {
                    if (e.name === 'AbortError' || e.message.includes("Aborted")) throw e;
                    if (attempt === maxRetries - 1) throw e;
                }
            }
            
            if (signal.aborted) throw new Error("Aborted");
            
            if (responseData && Array.isArray(responseData)) {
                setScriptList(responseData);
            } else {
                throw new Error("Invalid response format received.");
            }
            
            // --- 3. Finish ---
            setProgress(100);
            setIsFinished(true);
            setIsLoading(false);
            clearInterval(intervalRef.current);
            // 💡 อัตโนมัติ: เปิดสคริปต์แรกเมื่อสร้างเสร็จ
            if (responseData.length > 0) setExpandedIndex(0); 

        } catch (error) {
            if (error.message.includes("Aborted")) {
                console.log("Generation aborted by user.");
                setError("การสร้างถูกยกเลิก");
            } else {
                console.error("API Generation Error:", error);
                if (error.message.includes("400")) {
                    setError(`เกิดข้อผิดพลาดในการเชื่อมต่อ (HTTP 400 Bad Request): สาเหตุส่วนใหญ่คือ API Key ไม่ถูกต้องหรือไม่ถูกโหลด!`);
                } else {
                    setError(`เกิดข้อผิดพลาดในการสร้างสคริปต์: ${error.message || 'Unknown Error'}`);
                }
            }
            setIsLoading(false);
            setProgress(0);
            setIsFormExpanded(true);
            clearInterval(intervalRef.current);
        }
    };


    // --- Main App Render ---
    // ✅ FIX: เปลี่ยนให้ไปหน้า app ทันที
    if (currentPage === 'home') {
        return <LandingPage onStart={() => setCurrentPage('app')} />; 
    }
    
    // App UI (Light Mode)
    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
        {/* Header (Sticky) */}
        <header className="sticky top-0 z-20 bg-white shadow-md">
            <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                {isFinished && (
                <button onClick={handleClearTopic} className="text-orange-600 hover:text-orange-700 transition-colors">
                    <ArrowUp size={24} className="rotate-[-90deg]"/>
                </button>
                )}
                <h1 className="text-xl font-black text-gray-900 tracking-tight">
                CONTENT <span className="text-orange-600">FACTORY</span>
                </h1>
            </div>
            
            <div className="flex items-center space-x-3">
                {/* ✅ FIX: ลบ Credit และ Logout ออก */}
                <span className="text-gray-500 text-sm">ไม่ต้องเข้าสู่ระบบ</span>
            </div>
            </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 md:p-6 pb-20">
            
            {/* Error Box */}
            {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-xl mb-6 shadow-md">
                <div className="flex items-center">
                <Ban size={20} className="mr-3"/>
                <p className="font-semibold text-sm">{error}</p>
                </div>
                
            </div>
            )}
            
            {/* Script Generation Form */}
            <div className="bg-white p-5 md:p-8 rounded-xl shadow-lg border border-gray-200 mb-6">
            
            {/* Header Section */}
            <div 
                className="flex justify-between items-center cursor-pointer mb-5"
                onClick={() => setIsFormExpanded(prev => !prev)}
            >
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <Settings2 size={24} className="text-orange-600"/> 
                สร้างสคริปต์วิดีโอสั้น
                </h2>
                {isFormExpanded ? <ChevronUp size={24} className="text-gray-500"/> : <ChevronDown size={24} className="text-gray-500"/>}
            </div>

            {/* Form Fields (Expandable) */}
            {isFormExpanded && (
                <div className="space-y-6 animate-fade-in pt-3">
                <FormInput
                    label="หัวข้อที่ต้องการสร้าง (ยิ่งละเอียด ยิ่งดี)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="เช่น: วิธีทำเงินจาก AI โดยไม่ต้องเขียนโค้ด"
                    icon={Sparkles}
                />

                <DropdownSelect
                    label="เลือกสไตล์/หมวดหมู่ของคลิป"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="เช่น: 📈 หุ้น / การลงทุน / Crypto"
                    items={popularStyles.filter(s => s.toLowerCase().includes(style.toLowerCase()))}
                    icon={Palette}
                    showDropdown={showStyleDropdown}
                    setShowDropdown={setShowStyleDropdown}
                    dropdownRef={styleDropdownRef}
                />

                <div className="grid grid-cols-1 gap-4"> 
                    {/* ✅ FIX: ลบ input clipCount ออกไป */}
                    <FormInput
                    label="จำนวน Shot ต่อคลิป (สูงสุด 5)"
                    type="number"
                    value={shotCount}
                    onChange={(e) => setShotCount(Math.min(5, Math.max(1, Number(e.target.value))))}
                    min="1"
                    max="5"
                    icon={Film}
                    />
                </div>
                </div>
            )}
            
            {/* Action Button */}
            <div className={`flex mt-6 ${isLoading ? 'justify-between' : 'justify-end'}`}>
                {isLoading && (
                <AccentButton 
                    onClick={handleStopGeneration} 
                    className="!bg-red-500 hover:!bg-red-600 shadow-red-300/50"
                    icon={Ban}
                >
                    หยุดการสร้าง
                </AccentButton>
                )}
                
                {!isLoading && (
                <AccentButton 
                    onClick={handleGenerateScript} 
                    disabled={!topic.trim() || isLoading}
                    icon={Sparkles}
                >
                    สร้างสคริปต์ 5 คลิป
                </AccentButton>
                )}
            </div>
            </div>

            {/* Loading/Progress Indicator */}
            {isLoading && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full border-t-4 border-orange-500">
                <Loader2 size={36} className="text-orange-500 animate-spin mb-4" />
                <p className="text-lg font-bold text-gray-800 mb-2">กำลังสร้างสคริปต์ 5 คลิป...</p>
                <p className="text-sm text-gray-500 mb-4">โปรดรอสักครู่ ห้ามปิดหน้าจอ</p>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                    className="h-full bg-orange-500 transition-all duration-1000 ease-in-out" 
                    style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-xs font-medium text-gray-600 mt-2">{Math.round(progress)}%</p>
                <AccentButton 
                    onClick={handleStopGeneration} 
                    className="!bg-red-500 hover:!bg-red-600 shadow-red-300/50 mt-4 !text-sm"
                    icon={Ban}
                >
                    หยุดการสร้าง
                </AccentButton>
                </div>
            </div>
            )}

            {/* Script Results */}
            {scriptList.length > 0 && (
            <div className="space-y-4">
                <h2 className="text-2xl font-extrabold text-gray-900 mt-8 mb-4">
                ผลลัพธ์: สคริปต์ที่สร้างแล้ว ({scriptList.length} คลิป)
                </h2>
                {scriptList.map((script, index) => (
                <ScriptDisplay
                    key={index}
                    script={script}
                    index={index}
                    isOpen={expandedIndex === index}
                    toggleOpen={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    handleDownload={handleDownload}
                />
                ))}
            </div>
            )}
        </main>
        </div>
    );
};

export default App;