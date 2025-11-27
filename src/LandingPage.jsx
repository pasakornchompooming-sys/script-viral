import React from 'react';
import { Sparkles, Zap, Smartphone, ArrowRight, Clock } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-brand-purple transition-all duration-300 shadow-lg">
        <Icon size={32} className="text-brand-pink mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

const LandingPage = ({ onStart, user }) => {
    return (
        <div className="min-h-screen bg-dark-bg font-sans text-gray-100 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl mx-auto text-center py-20">
                
                {/* Header Section */}
                <header className="mb-12">
                    <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-pink to-brand-purple">
                            AI CONTENT FACTORY
                        </span>
                    </h1>
                    <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
                        สร้างสคริปต์วิดีโอสั้น (Short-Form) คุณภาพสูง
                        ที่พร้อมให้คุณถ่ายทำได้ทันทีในไม่กี่วินาที
                    </p>
                </header>

                {/* Call to Action Button */}
                <button 
                    onClick={onStart} 
                    className="bg-gradient-to-r from-brand-pink to-brand-purple text-white px-10 py-4 rounded-full text-xl font-bold shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-brand-purple/50 flex items-center justify-center gap-3 mx-auto"
                >
                    <Zap size={24} /> 
                    {user ? "เข้าสู่ระบบ (Go to App)" : "เริ่มต้นสร้างคอนเทนต์ (Login)"}
                    <ArrowRight size={20} />
                </button>
                <p className="text-sm text-gray-500 mt-4">ทดลองใช้ฟรี 10 เครดิต!</p>

                {/* Features Section */}
                <section className="mt-20">
                    <h2 className="text-3xl font-bold text-white mb-8">ทำไมต้องใช้ Content Factory?</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <FeatureCard 
                            icon={Sparkles} 
                            title="สคริปต์ไวรัล" 
                            description="AI วิเคราะห์เทรนด์และสร้าง Hook ที่ดึงดูดผู้ชมให้หยุดดูคลิปของคุณทันที"
                        />
                        <FeatureCard 
                            icon={Smartphone} 
                            title="พร้อมถ่ายทำ" 
                            description="แบ่งฉาก (Shot), Audio, Visual, และ Text-on-Screen ครบถ้วนตามมาตรฐาน TikTok/Reels"
                        />
                        <FeatureCard 
                            icon={Clock} 
                            title="ประหยัดเวลา" 
                            description="สร้าง 10 คลิปในเวลาไม่ถึง 2 นาที ไม่ต้องนั่งคิดจนหัวหมุนอีกต่อไป"
                        />
                    </div>
                </section>
                
                {/* Footer */}
                <footer className="mt-20 border-t border-gray-800 pt-8">
                    <p className="text-sm text-gray-500">
                        Powered by Gemini AI. &copy; {new Date().getFullYear()} Content Factory.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;