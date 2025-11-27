import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Loader2, Sparkles, X, Clock, Layers, Film, ArrowUp, ChevronDown, ChevronUp, Settings2, Palette, Ban, Search } from "lucide-react";
import ScriptDisplay from './components/ScriptDisplay';

// --- ส่วนของ Firebase ---
import { auth, googleProvider, db } from './firebaseConfig';
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useState, useEffect, useRef } from 'react';

// --- Helper Function: Delay เพื่อลดโหลด Server ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Landing Page ---
const LandingPage = ({ onStart, user }) => (
  <div className="min-h-screen bg-dark-bg font-sans flex flex-col items-center justify-start pt-24 md:pt-32 text-center p-4 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-purple/20 rounded-full blur-[80px] animate-pulse"></div>
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-brand-pink/20 rounded-full blur-[80px] animate-pulse"></div>
    </div>

    <div className="relative z-10 max-w-3xl animate-fade-in w-full">
      <div className="mb-6 inline-block px-3 py-1 rounded-full bg-gray-800/80 border border-gray-700 backdrop-blur-sm text-yellow-400 text-[10px] md:text-xs font-bold tracking-wider shadow-lg">
        🗝️ กุญแจสู่ยอดวิวหลักล้าน
      </div>
      <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-gray-300 leading-snug mb-2">
        <span className="block">Content is King</span>
        <span className="block text-white mt-1">Speed is Money</span>
      </h1>
      
      {/* 🔥 เปลี่ยนชื่อตรงนี้ */}
      <div className="my-5">
        <span className="text-4xl md:text-6xl font-black tracking-tighter text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.4)] uppercase font-mono block transform scale-y-110">
          CONTENT FACTORY
        </span>
      </div>
      
      <h2 className="text-lg md:text-2xl font-bold leading-normal mb-8">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-pink to-brand-purple">
           เปลี่ยน "คำธรรมดา" ให้เป็น "ไวรัล" 🚀
        </span>
      </h2>
      <div className="mb-10 space-y-3">
        <p className="text-xs md:text-sm text-gray-500 font-light tracking-wide">
          หยุดเสียเวลา! โลกออนไลน์ไม่รอใคร...
        </p>
        <p className="text-base md:text-lg text-white font-medium px-4 leading-relaxed">
          ปลดล็อกความคิดสร้างสรรค์ของคุณ <br />
          เติมสต็อกคอนเทนต์ให้เต็ม
        </p>
      </div>
      <button 
        onClick={onStart}
        className="group relative px-10 py-3 text-lg font-bold text-white bg-white/5 border border-white/10 rounded-full overflow-hidden hover:bg-white/10 transition-all hover:scale-105 shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95"
      >
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-brand-pink/20 to-brand-purple/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <span className="relative flex items-center gap-2 text-base md:text-lg">
           {user ? "🚀 เริ่มสร้างสคริปต์เลย" : "🔐 เข้าสู่ระบบเพื่อใช้งาน"}
        </span>
      </button>
      {user && (
        <p className="mt-8 text-gray-600 text-[10px] uppercase tracking-widest opacity-50">
          LOGGED IN AS: {user.displayName}
        </p>
      )}
    </div>
  </div>
);

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

const App = () => {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [credits, setCredits] = useState(0);
  const [progress, setProgress] = useState(0); 

  // --- Form Logic ---
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState(''); 
  const [duration, setDuration] = useState("15");
  const [clipCount, setClipCount] = useState(1);
  // 🔥 IMPORTANT: Default value set to 5 (Max safe limit)
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
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

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

  const filteredStyles = popularStyles.filter(s => 
    s.toLowerCase().includes(style.toLowerCase())
  );

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
        setClipCount(1);
        setShotCount(5); // ตั้งค่าเริ่มต้นใหม่เป็น 5
        setIsFormExpanded(true);
    }
  };

  const checkUserWallet = async (currentUser) => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setCredits(userSnap.data().credits);
    } else {
      await setDoc(userRef, {
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        credits: 10,
        createdAt: new Date()
      });
      setCredits(10);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) checkUserWallet(currentUser);
    });

    const handleClickOutside = (event) => {
        if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
            setShowStyleDropdown(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        unsubscribe();
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogin = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) setCurrentPage('app');
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    resetState(true);
    setCurrentPage('home');
  };

  const handleClearTopic = () => {
      setTopic('');
      setIsFormExpanded(true);
      setIsFinished(false);
  };

  const handleDownload = (scriptData, index) => {
    const safeHashtags = scriptData.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    const content = `TITLE: ${scriptData.title}
----------------------------------------
CONCEPT: ${scriptData.description}
HASHTAGS: ${safeHashtags}
VOICE OVER: ${scriptData.voice_over_script}
----------------------------------------
SHOTS:
${scriptData.shot_prompts.map((shot, i) => `[Shot ${i+1}] TH: ${shot.th} | EN: ${shot.en}`).join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = `script-${index + 1}.txt`;
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
  };

  // 🛑 ฟังก์ชันที่ถูกแก้ไขเพื่อใช้กลยุทธ์ SEQUENTIAL REQUEST 🛑
  const handleGenerateScript = async () => {
    // --- 0. Pre-checks ---
    if (!user) { 
        alert('กรุณาเข้าสู่ระบบก่อนใช้งานครับ'); 
        handleLogin(); 
        return; 
    }
    if (!apiKey) { setError('กรุณาใส่ API Key ก่อนครับ'); return; }
    if (!topic.trim()) { setError('กรุณาป้อนหัวข้อ'); return; }
    
    // 🔥 Hard Limit Check (ป้องกันการแก้ไข UI bypass)
    const currentDuration = Number(duration);
    const currentShotCount = Number(shotCount);
    
    // **บังคับใช้ลิมิตความปลอดภัย**
    if (currentDuration > 15 || currentShotCount > 5) {
      setError("⚠️ เกินลิมิตความปลอดภัย! ความยาวสูงสุด 15 วินาที / 5 ช็อตต่อคลิป");
      return;
    }

    const cost = clipCount;
    if (credits < cost) {
      setError(`⚠️ เครดิตไม่พอครับ! ต้องใช้ ${cost} เครดิต แต่มีแค่ ${credits}`);
      return;
    }

    // --- 1. Start ---
    resetState(false); 
    setScriptList([]); // ล้างรายการเก่าก่อนเริ่ม
    setIsLoading(true);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // --- 2. Sequential Generation Loop (การทำงานหลัก) ---
    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({
        model: selectedModel,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: scriptListSchema,
          temperature: 0.85,
        }
      });
      
      // วนลูปตามจำนวนคลิปที่ต้องการ (i = 0 ถึง clipCount - 1)
      for (let i = 0; i < clipCount; i++) {
        if (signal.aborted) throw new Error("User stopped generation");

        // คำนวณ Progress Bar ตามจำนวนคลิป
        const startProgress = Math.floor((i / clipCount) * 100);
        const endProgress = Math.floor(((i + 1) / clipCount) * 100);

        // อัปเดต Progress Bar อย่างรวดเร็วเพื่อให้ผู้ใช้รู้ว่าเกิดอะไรขึ้น
        setProgress(startProgress);

        // 🔥 ปรับสูตรคำนวณคำ (ใช้ค่าจาก Input ที่ถูกจำกัดแล้ว)
        const minWords = Math.ceil(currentDuration * 2.0);
        const maxWords = Math.ceil(currentDuration * 2.8);

        // --- สร้าง Prompt สำหรับ 1 คลิปเท่านั้น ---
        const prompt = `
          ROLE: นักจิตวิทยา + Creative Director
          TASK: สร้างสคริปต์ Short-Form Video (TikTok/Reels/Shorts) จำนวน 1 คลิป (คลิปที่ ${i + 1} จาก ${clipCount})
          TOPIC: "${topic}" (ความยาว ${currentDuration} วิ)
          TONE/STYLE: "${style || 'สนุก น่าติดตาม'}"
          
          STRUCTURE:
          - แต่ละคลิปต้องมี ${currentShotCount} Shots (Visual Breakdown)
          - Shot Prompt ต้องส่งมา 2 ภาษา (en, th)
          - Title & Script ต้องเป็นภาษาไทยที่ดึงดูดใจ (Hook ต้องแรง!)
          
          คำสั่งพิเศษ (Strict Rules):
          1. **Voice Over (บทพูด):** *สำคัญมาก* ต้องมีความยาวระหว่าง **${minWords} - ${maxWords} คำ** เท่านั้น! ห้ามเขียนยาวเกินนี้เด็ดขาด ให้ตัดคำฟุ่มเฟือยออก เอาเนื้อๆ เน้นพูดกระชับ
          2. **Hashtags:** ต้องมีเครื่องหมาย # นำหน้าทุกคำ
          3. **Shot Prompts:** ต้องเขียนเวลา Timeline ไว้ข้างหน้าคำบรรยายไทยเสมอ เช่น "[0-${Math.ceil(currentDuration / currentShotCount)}s] ภาพมุมกว้าง..."
        `;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }, { signal });

        if (signal.aborted) throw new Error("User stopped generation");

        const response = await result.response;
        const text = response.text();
        // เนื่องจากเราขอ 1 คลิป API จะส่งกลับมาเป็น Array ที่มี 1 องค์ประกอบ
        const jsonData = JSON.parse(text);
        
        // ตรวจสอบว่าได้ Array และมีสมาชิก
        const newScript = Array.isArray(jsonData) && jsonData.length > 0 ? jsonData[0] : null;

        if (!newScript) throw new Error("API response was empty or malformed.");

        // 🔥 อัปเดต List ทันที (แสดงผลทีละคลิป)
        setScriptList(prevList => [...prevList, newScript]);
        
        // อัปเดต Progress Bar จนถึงจุดสิ้นสุดของคลิปนี้
        setProgress(endProgress);

        // Delay 1.5 วินาที เพื่อลดโหลด Server และป้องกัน 429 Rate Limit
        await delay(1500); 
      }
      
      // --- 3. Finish Cleanup ---
      setProgress(100);
      setIsFinished(true);
      setIsLoading(false);
      setIsFormExpanded(false); 
      setExpandedIndex(null);

      if (user && !signal.aborted) {
        const newBalance = credits - cost;
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { credits: newBalance });
        setCredits(newBalance); 
      }

    } catch (err) {
        // --- 4. Error Handling Cleanup ---
        if (err.message === "User stopped generation" || signal.aborted) {
            console.log("Stopped by user");
            handleStopGeneration();
        } else {
            console.error(err);
            // ข้อความแจ้งเตือนที่ชัดเจนขึ้น
            setError(err.message.includes('JSON') || err.message.includes('aborted') || err.message.includes('400') || err.message.includes('500')
              ? "⚠️ การเชื่อมต่อหลุด/ข้อมูลไม่สมบูรณ์! โปรดลองใหม่อีกครั้ง หรือลดจำนวน Shot/ความยาวลง" 
              : "⚠️ เกิดข้อผิดพลาด: " + err.message);
            
            setIsLoading(false);
            setIsFinished(false);
            setIsFormExpanded(true);
        }
    }
  };

  const toggleAccordion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
    if (expandedIndex !== index) {
        setTimeout(() => {
            const element = document.getElementById(`script-item-${index}`);
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  };

  if (currentPage === 'home') {
    return <LandingPage onStart={() => user ? setCurrentPage('app') : handleLogin()} user={user} />;
  }

  const inputClass = "w-full p-3 bg-dark-accent border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 outline-none transition-all duration-300 hover:border-brand-purple focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/50";

  return (
    <div className="min-h-screen bg-dark-bg font-sans p-4 sm:p-6 lg:p-8 text-gray-100">
      <div className="max-w-5xl mx-auto">

        {/* --- Login Button (No Change) --- */}
        <div className="absolute top-4 right-4 z-50">
          {user ? (
            <div className="flex items-center gap-3 bg-gray-900/95 backdrop-blur-md border border-gray-700 p-1.5 pr-4 rounded-full shadow-2xl transition-all hover:border-brand-purple/50">
              <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border-2 border-brand-purple object-cover" />
              <div className="flex flex-col items-start justify-center mr-1">
                <span className="text-xs font-bold text-white truncate max-w-[100px] leading-tight">{user.displayName}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-yellow-400 font-bold">🪙 {credits}</span>
                  <a href="https://line.me/ti/p/ไอดีไลน์ของคุณ" target="_blank" rel="noreferrer" className="bg-green-600 hover:bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold no-underline transition-colors">+เติม</a>
                </div>
              </div>
              <div className="w-px h-6 bg-gray-700 mx-1"></div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="ออก">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-all text-sm">
              G เข้าสู่ระบบ
            </button>
          )}
        </div>

        {/* --- Header (ชื่อใหม่) --- */}
        <header className="text-center mt-24 mb-10 animate-fade-in">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-pink to-brand-purple">
              CONTENT FACTORY
            </span>
          </h1>
          <p className="text-lg text-gray-400">สร้างคอนเทนต์คุณภาพสูง ด้วยพลัง AI</p>
        </header>

        <main>
          <div className="bg-dark-card rounded-2xl shadow-2xl p-6 md:p-8 mb-10 border border-gray-800 animate-fade-in">
            <div className="flex flex-col space-y-6">
               
               {/* 1. Topic Input (No Change) */}
               <div>
                  <label className="text-lg font-bold text-white mb-3 block">หัวข้อคอนเทนต์:</label>
                  <div className="relative flex items-center">
                    
                    {/* ปุ่มเคลียร์ */}
                    {topic && (
                        <button 
                            onClick={handleClearTopic} 
                            disabled={isLoading} 
                            className={`absolute left-2 p-1.5 rounded-lg transition-colors z-10 
                              ${isFinished ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-lg cursor-pointer' : 'text-gray-400 hover:text-red-400 cursor-pointer'}
                              ${isLoading ? 'opacity-30 cursor-not-allowed' : ''}
                            `}
                            title={isFinished ? "กดเพื่อเริ่มใหม่" : "ล้างข้อความ"}
                        >
                            <X size={isFinished ? 22 : 18} strokeWidth={isFinished ? 3 : 2} />
                        </button>
                    )}

                    <input 
                        type="text" 
                        value={topic} 
                        onChange={(e) => setTopic(e.target.value)} 
                        placeholder="เช่น วิธีชงกาแฟให้อร่อย, รีวิวที่เที่ยวเชียงใหม่..." 
                        className={`w-full p-4 pr-14 pl-12 bg-dark-accent border-2 rounded-xl text-xl text-white placeholder-gray-500 outline-none transition-all duration-300 
                           ${isFinished 
                             ? 'border-green-500/50 opacity-60 cursor-not-allowed' 
                             : 'border-gray-700 hover:border-brand-purple focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/50'
                           }`}
                        onKeyDown={(e) => e.key === 'Enter' && !isFinished && handleGenerateScript()} 
                        disabled={isLoading || isFinished} 
                    />
                    
                    {/* 🔥 ปุ่ม Settings (กดได้ตลอด ยกเว้น Loading) */}
                    <div className="absolute right-2">
                        <button 
                            onClick={() => setIsFormExpanded(!isFormExpanded)} 
                            className={`p-2 rounded-lg transition-colors ${isFormExpanded ? 'text-brand-purple bg-brand-purple/10' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                            title={isFormExpanded ? "ซ่อนตัวเลือก" : "แสดงตัวเลือก"}
                            disabled={isLoading} // Disable แค่ตอนโหลด ตอนเสร็จกดได้!
                        >
                             {isFormExpanded ? <ChevronUp size={20}/> : <Settings2 size={20}/>}
                        </button>
                    </div>
                  </div>
                  
                  {/* ⚠️ Warning สำหรับลิมิตที่ถูกถอดออก */}
                  <p className="text-center text-red-400 text-sm font-medium">
                    ระบบจำกัดความยาวสูงสุดที่ 15 วินาที / 5 ช็อต เพื่อป้องกันการ Timeout
                  </p>
                </div>

               {/* 2. Options Grid (Collapsible) */}
               {isFormExpanded && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Style Combo Box (No Change) */}
                            <div className="relative" ref={styleDropdownRef}>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Palette size={12}/> แนวทาง / สไตล์</label>
                                <div className="relative">
                                    <input type="text" value={style} onChange={(e) => { setStyle(e.target.value); setShowStyleDropdown(true); }} onFocus={() => setShowStyleDropdown(true)} disabled={isLoading || isFinished} placeholder="เช่น ตลก, ทางการ..." className={`${inputClass} pr-8`} />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><ChevronDown size={16}/></div>
                                </div>
                                {showStyleDropdown && !isLoading && !isFinished && (
                                    <div className="absolute bottom-full left-0 w-full mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto no-scrollbar">
                                        {filteredStyles.length > 0 ? filteredStyles.map((s, i) => (
                                            <div key={i} className="px-4 py-2 hover:bg-brand-purple/20 cursor-pointer text-sm text-gray-200 border-b border-gray-700/50 last:border-0" onClick={() => { setStyle(s); setShowStyleDropdown(false); }}>{s}</div>
                                        )) : <div className="px-4 py-2 text-sm text-gray-500">ไม่พบสไตล์ที่ค้นหา</div>}
                                    </div>
                                )}
                            </div>

                            {/* จำนวนคลิป (No Change) */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Layers size={12}/> จำนวนคลิปที่ต้องการ</label>
                                <select value={clipCount} onChange={(e) => setClipCount(Number(e.target.value))} disabled={isLoading || isFinished} className={`${inputClass} text-center`}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => <option key={num} value={num}>{num} เรื่อง</option>)}
                                </select>
                            </div>

                            {/* ความยาว (แก้ไขลิมิต) */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Clock size={12}/> ความยาวคลิป</label>
                                <select value={duration} onChange={(e) => setDuration(e.target.value)} disabled={isLoading || isFinished} className={`${inputClass} text-center`}>
                                    <option value="5">5 วินาที</option>
                                    <option value="8">8 วินาที</option>
                                    <option value="12">12 วินาที</option>
                                    <option value="15">15 วินาที (Max)</option>
                                </select>
                            </div>

                            {/* Shots (แก้ไขลิมิต) */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Film size={12}/> จำนวน Shots / คลิป</label>
                                <select value={shotCount} onChange={(e) => setShotCount(Number(e.target.value))} disabled={isLoading || isFinished} className={`${inputClass} text-center`}>
                                    <option value="3">3 Shots</option>
                                    <option value="5">5 Shots (Max)</option>
                                </select>
                            </div>
                        </div>
                  </div>
               )}

               {/* 3. Generate Button (Fix Syntax Error Here) */}
              <button 
                  onClick={isLoading ? handleStopGeneration : handleGenerateScript} 
                  disabled={isFinished} 
                  className={`relative w-full h-14 overflow-hidden rounded-xl shadow-lg transition-all transform hover:scale-[1.01] border group mt-4 
                    ${isLoading 
                        ? 'bg-red-900/80 border-red-600 hover:bg-red-800 cursor-pointer' // Loading (Stop)
                        : isFinished // Finished?
                            ? 'bg-green-700 border-green-600 cursor-not-allowed opacity-100' // Finished (Done)
                            : 'bg-gray-800 border-gray-700 cursor-pointer' // Normal (Generate)
                    }
                  `}
              >
                  {/* Normal State */}
                  {!isLoading && !isFinished && (
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-pink to-brand-purple flex items-center justify-center">
                          <span className="text-lg font-bold text-white flex items-center gap-2"><Sparkles size={20}/> กดตรงนี้เพื่อเริ่มสร้าง</span>
                      </div>
                  )}

                  {/* Loading State */}
                  {isLoading && (
                      <>
                          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out opacity-30" style={{ width: `${progress}%` }}></div>
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                              <span className="text-lg font-bold text-white drop-shadow-md flex items-center gap-2 animate-pulse"><Ban size={20} className="text-red-400"/> หยุด / ยกเลิก ({progress}%)</span>
                          </div>
                      </>
                  )}

                  {/* Finished State (เปลี่ยนข้อความใหม่!) */}
                  {isFinished && !isLoading && (
                      <div className="absolute inset-0 bg-green-600 flex items-center justify-center animate-fade-in">
                          <span className="text-lg font-bold text-white flex items-center gap-2">✨ คอนเท้นต์พร้อมเสริฟ</span>
                      </div>
                  )}
              </button>

              {/* ข้อความแจ้งเตือนให้กดเริ่มใหม่ (No Change) */}
              {isFinished && (
                 <p className="text-center mt-3 text-gray-400 text-sm animate-pulse">
                    👆 กดปุ่ม <span className="text-red-400 font-bold">❌ (Clear)</span> ด้านบนซ้าย เพื่อเริ่มงานใหม่
                 </p>
              )}
            </div>
          </div>
          
          {/* --- Output Area (No Change) --- */}
          <div className="mt-6 space-y-4 pb-20">
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-center animate-fade-in">{error}</div>}
            {scriptList && scriptList.map((script, index) => {
                // ใช้ duration จาก state เดิม (duration) ซึ่งถูกจำกัดแล้ว
                const currentClipDuration = duration;
                const isOpen = expandedIndex === index;
                return (
                  <div id={`script-item-${index}`} key={index} className="bg-dark-card border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-brand-purple/50 animate-fade-in">
                     <div onClick={() => toggleAccordion(index)} className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'bg-brand-purple/10' : 'hover:bg-white/5'}`}>
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${isOpen ? 'bg-brand-purple text-white' : 'bg-gray-800 text-gray-400'}`}>#{index + 1}</div>
                            <h3 className={`text-base sm:text-lg font-medium truncate ${isOpen ? 'text-brand-pink' : 'text-gray-200'}`}>{script.title} <span className="text-xs text-gray-500 ml-2 font-normal">[{currentClipDuration}s]</span></h3>
                        </div>
                        <div className="text-gray-400">{isOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</div>
                     </div>
                     {isOpen && (
                        <div className="p-5 border-t border-gray-800 bg-dark-bg/50">
                            <div className="flex justify-end mb-4">
                                <button onClick={(e) => { e.stopPropagation(); handleDownload(script, index); }} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg border border-gray-600 text-sm transition-all hover:text-white">💾 Save Text</button>
                            </div>
                            <ScriptDisplay data={script} />
                        </div>
                     )}
                  </div>
                );
            })}
             {scriptList.length > 0 && (
                <div className="text-center pt-10 border-t border-gray-800 flex justify-center">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 bg-dark-accent hover:bg-brand-pink/20 text-white px-6 py-3 rounded-full transition-all shadow-lg border border-gray-700 hover:border-brand-pink"><ArrowUp size={18} /> กลับไปหน้าบนสุด</button>
                </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;