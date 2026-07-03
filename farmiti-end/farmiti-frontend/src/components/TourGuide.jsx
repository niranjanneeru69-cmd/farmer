import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { ChevronRight, ChevronLeft, X, Sparkles, ArrowRight, ArrowDown, ArrowUp, ArrowLeft } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { farmerAPI } from '../api/services'

const TOUR_CONTENT = {
  // ... (keeping same content)
  '/dashboard': [
    { target: '#dashboard-welcome', titleKey: 'tour_dash_welcome_title', contentKey: 'tour_dash_welcome_desc', position: 'bottom' },
    { target: '#weather-card', titleKey: 'tour_dash_weather_title', contentKey: 'tour_dash_weather_desc', position: 'bottom' },
    { target: '#topbar-search', titleKey: 'searchPlaceholder', contentKey: 'searchPlaceholder', position: 'bottom' },
    { target: '#activity-log', titleKey: 'tour_dash_activity_title', contentKey: 'tour_dash_activity_desc', position: 'left' },
    { target: '#dashboard-market', titleKey: 'market', contentKey: 'tour_market_search_desc', position: 'left' },
    { target: '#active-containers', titleKey: 'tour_dash_containers_title', contentKey: 'tour_dash_containers_desc', position: 'top' },
    { target: '#topbar-notifs', titleKey: 'tour_dash_notifs_title', contentKey: 'tour_dash_notifs_desc', position: 'bottom' },
    { target: '#tour-guide-btn', titleKey: 'tour_dash_help_title', contentKey: 'tour_dash_help_desc', position: 'bottom' }
  ],
  '/weather': [
    { target: '#weather-metrics', titleKey: 'tour_weather_metrics_title', contentKey: 'tour_weather_metrics_desc', position: 'bottom' },
    { target: '#weather-sms-toggle', titleKey: 'tour_weather_sms_title', contentKey: 'tour_weather_sms_desc', position: 'bottom' },
    { target: '#weather-forecast', titleKey: 'tour_weather_forecast_title', contentKey: 'tour_weather_forecast_desc', position: 'top' }
  ],
  '/market-prices': [
    { target: '#market-search', titleKey: 'tour_market_search_title', contentKey: 'tour_market_search_desc', position: 'bottom' },
    { target: '#market-table', titleKey: 'tour_market_table_title', contentKey: 'tour_market_table_desc', position: 'top' },
    { target: '#market-trends', titleKey: 'tour_market_trends_title', contentKey: 'tour_market_trends_desc', position: 'top' },
    { target: '#market-insight', titleKey: 'tour_market_insight_title', contentKey: 'tour_market_insight_desc', position: 'top' }
  ],
  '/disease-detection': [
    { target: '#disease-upload', titleKey: 'tour_disease_upload_title', contentKey: 'tour_disease_upload_desc', position: 'bottom' },
    { target: '#disease-history', titleKey: 'tour_disease_history_title', contentKey: 'tour_disease_history_desc', position: 'top' }
  ],
  '/crop-recommendation': [
    { target: '#crops-form', titleKey: 'tour_crops_form_title', contentKey: 'tour_crops_form_desc', position: 'bottom' },
    { target: '#crops-btn', titleKey: 'tour_crops_btn_title', contentKey: 'tour_crops_btn_desc', position: 'bottom' },
    { target: '#crops-results', titleKey: 'tour_crops_results_title', contentKey: 'tour_crops_results_desc', position: 'right' },
    { target: '#crops-radar', titleKey: 'tour_crops_radar_title', contentKey: 'tour_crops_radar_desc', position: 'top' }
  ]
}

export default function TourGuide() {
  const { t, lang } = useLang()
  const { farmer } = useAuth()
  const location = useLocation()
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const observerRef = useRef(null)
  
  const currentPath = location.pathname
  const steps = useMemo(() => TOUR_CONTENT[currentPath] || [], [currentPath])

  useEffect(() => {
    const handleStart = () => {
      if (steps.length > 0) {
        setStep(0)
        setActive(true)
      }
    }
    window.addEventListener('start-tour', handleStart)
    
    // Auto-start for first-time users on EVERY page that has tour steps
    // Once the global flag is set (user completed or skipped), never auto-start again
    const tourDone = localStorage.getItem('farmiti_tour_done')
    if (!tourDone && steps.length > 0) {
      // Small delay to let the page render its DOM targets
      const timer = setTimeout(handleStart, 1500)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('start-tour', handleStart)
      }
    }

    return () => window.removeEventListener('start-tour', handleStart)
  }, [currentPath, steps, farmer])

  // Voice Assistance (Text-to-Speech)
  useEffect(() => {
    if (active && steps[step]) {
      const speak = () => {
        // Stop any current speech
        window.speechSynthesis.cancel();

        const title = t(steps[step].titleKey);
        const content = t(steps[step].contentKey);
        const textToSpeak = `${title}. ${content}`;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Map app language codes to BCP 47 tags
        const langMap = {
          en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', 
          kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', pa: 'pa-IN', 
          bn: 'bn-IN', gu: 'gu-IN', or: 'or-IN', ur: 'ur-IN'
        };
        
        const targetLang = langMap[lang] || 'en-US';
        utterance.lang = targetLang;
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1;

        // Better voice selection with robust matching
        const voices = window.speechSynthesis.getVoices();
        const findVoice = (target) => {
          const mainLang = target.split('-')[0];
          // Try exact match first
          let v = voices.find(v => v.lang === target || v.lang.replace('_', '-') === target);
          // Try main language match (e.g., 'hi')
          if (!v) v = voices.find(v => v.lang.startsWith(mainLang));
          return v;
        };

        const selectedVoice = findVoice(targetLang);
        if (selectedVoice) utterance.voice = selectedVoice;

        window.speechSynthesis.speak(utterance);
      };

      // Delay slightly to allow the transition to feel natural
      const timer = setTimeout(speak, 500);
      return () => {
        clearTimeout(timer);
        window.speechSynthesis.cancel();
      };
    } else {
      window.speechSynthesis.cancel();
    }
  }, [active, step, steps, lang, t]);

  useEffect(() => {
    if (active && steps[step]) {
      const el = document.querySelector(steps[step].target)
      
      const updateRect = () => {
        if (el) {
          const r = el.getBoundingClientRect()
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height, found: true })
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          // If element not found, set a center-screen "virtual" rect
          setRect({ 
            top: window.innerHeight / 2 - 50, 
            left: window.innerWidth / 2 - 50, 
            width: 100, 
            height: 100, 
            found: false 
          })
        }
      }

      updateRect()
      
      if (el) {
        // Watch for size changes
        if (observerRef.current) observerRef.current.disconnect()
        observerRef.current = new ResizeObserver(updateRect)
        observerRef.current.observe(el)
        
        window.addEventListener('resize', updateRect)
        window.addEventListener('scroll', updateRect, true)
        return () => {
          window.removeEventListener('resize', updateRect)
          window.removeEventListener('scroll', updateRect, true)
          observerRef.current?.disconnect()
        }
      } else {
        // element missing? just wait. User might need to perform an action.
        const i = setInterval(updateRect, 1000)
        return () => clearInterval(i)
      }
    } else {
       setRect(null)
    }
  }, [active, step, steps])

  if (!active || steps.length === 0) return null

  const current = steps[step]

  const markTourDone = () => {
    localStorage.setItem('farmiti_tour_done', 'true')
    // Also try to persist to backend (fails silently if column doesn't exist)
    farmerAPI.completeTour().catch(() => {})
  }

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      setActive(false)
      markTourDone()
    }
  }

  const handleSkip = () => {
    setActive(false)
    markTourDone()
  }

  // Ensure rect exists before rendering mask
  if (!rect) return null
  
  // Padding around the masked element
  const padding = window.innerWidth < 768 ? 10 : 20;

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* SVG Mask Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect 
            x={rect.left - padding} 
            y={rect.top - padding} 
            width={rect.width + (padding * 2)} 
            height={rect.height + (padding * 2)} 
              rx="20" 
              fill="black" 
            />
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="rgba(0,0,0,0.7)" 
          mask="url(#tour-mask)" 
          className="backdrop-blur-[3px] transition-all duration-300"
          onClick={handleSkip}
        />
      </svg>
      
      {/* Focus Border */}
      <motion.div 
        initial={false}
        animate={{
          top: rect.top - (padding + 2),
          left: rect.left - (padding + 2),
          width: rect.width + (padding * 2) + 4,
          height: rect.height + (padding * 2) + 4,
        }}
        className="absolute border-[3px] border-[#4CAF7D] rounded-[22px] shadow-[0_0_30px_rgba(76,175,125,0.6)] pointer-events-none z-10"
      />

      {/* Floating Animated Arrow */}
      <AnimatePresence mode='wait'>
         <motion.div
           key={`arrow-${step}`}
           initial={{ opacity: 0, scale: 0.5 }}
           animate={{ opacity: 1, scale: 1 }}
           className="absolute pointer-events-none z-20"
           style={{
             top: current.position === 'bottom' ? rect.top + rect.height + padding : current.position === 'top' ? rect.top - (padding + 30) : rect.top + rect.height/2 - 16,
             left: current.position === 'right' ? rect.left + rect.width + padding : current.position === 'left' ? rect.left - (padding + 30) : rect.left + rect.width/2 - 16,
           }}
         >
           <motion.div
             animate={{ 
               y: current.position === 'bottom' ? [-10, 0, -10] : current.position === 'top' ? [10, 0, 10] : 0,
               x: current.position === 'right' ? [-10, 0, -10] : current.position === 'left' ? [10, 0, 10] : 0
             }}
             transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
             className="text-[#4CAF7D] drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
           >
              {current.position === 'bottom' && <ArrowUp className="w-10 h-10" strokeWidth={3} />}
              {current.position === 'top' && <ArrowDown className="w-10 h-10" strokeWidth={3} />}
              {current.position === 'right' && <ArrowLeft className="w-10 h-10" strokeWidth={3} />}
              {current.position === 'left' && <ArrowRight className="w-10 h-10" strokeWidth={3} />}
           </motion.div>
         </motion.div>
      </AnimatePresence>

      {/* Guide Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: 0,
          // Dynamic positioning with collision detection improved to prevent overlapping the padded mask
          top: !rect.found ? window.innerHeight / 2 - 140 : (() => {
            const spaceBelow = window.innerHeight - (rect.top + rect.height);
            const spaceAbove = rect.top;
            const extraGapY = padding + 40; // Keeps pop-ups well away from the border glow
            
            if (current.position === 'bottom') {
              return spaceBelow < 300 && spaceAbove > 300 ? rect.top - 320 : Math.min(window.innerHeight - 340, rect.top + rect.height + extraGapY);
            }
            if (current.position === 'top') {
              return spaceAbove < 300 && spaceBelow > 300 ? rect.top + rect.height + extraGapY : Math.max(20, rect.top - 320);
            }
            return Math.max(20, Math.min(window.innerHeight - 340, rect.top + rect.height / 2 - 160));
          })(),
          left: !rect.found ? window.innerWidth / 2 - 160 : (() => {
            const spaceRight = window.innerWidth - (rect.left + rect.width);
            const spaceLeft = rect.left;
            const extraGapX = padding + 40;

            if (current.position === 'right') {
              return spaceRight < 340 && spaceLeft > 340 ? rect.left - 370 : Math.min(window.innerWidth - 340, rect.left + rect.width + extraGapX);
            }
            if (current.position === 'left') {
              return spaceLeft < 340 && spaceRight > 340 ? rect.left + rect.width + extraGapX : Math.max(20, rect.left - 370);
            }
            return Math.max(20, Math.min(window.innerWidth - 340, rect.left + rect.width / 2 - 160));
          })()
        }}
        className="absolute w-80 bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] pointer-events-auto border border-white/50 overflow-hidden ring-1 ring-black/10 z-30"
      >
        <div className="p-7">
           <div className="flex justify-between items-center mb-5">
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-200/50">Step {step + 1} of {steps.length}</span>
              <button onClick={handleSkip} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                 <X className="w-4 h-4 text-gray-400" />
              </button>
           </div>
           
           <h3 className="text-xl font-bold text-gray-900 mb-2.5 flex items-center gap-2.5 tracking-tight italic">
             <Sparkles className="w-5.5 h-5.5 text-amber-500 fill-amber-200" /> {t(current.titleKey)}
           </h3>
           <p className="text-[13.5px] text-gray-600 leading-relaxed mb-8 font-medium">
             {t(current.contentKey)}
           </p>

           <div className="flex justify-between items-center gap-4">
              <button 
                onClick={handleSkip}
                className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors px-2 underline decoration-gray-200 underline-offset-4"
              >
                {t('skip') || 'Skip Tour'}
              </button>
              
              <div className="flex gap-2.5">
                {step > 0 && (
                   <button 
                    onClick={() => setStep(s => s - 1)}
                    className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all border border-gray-100"
                   >
                     <ChevronLeft className="w-5 h-5" />
                   </button>
                )}
                <button 
                  onClick={handleNext}
                  className="px-7 h-12 bg-gradient-to-br from-[#1A5C38] to-[#0D3320] text-white rounded-2xl text-[13px] font-bold flex items-center gap-2.5 hover:shadow-lg hover:shadow-green-900/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  {step === steps.length - 1 ? (t('gotIt') || 'Start Farming!') : (t('next') || 'Next Step')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
           </div>
        </div>
        
        {/* Visual Progress Line */}
        <div className="h-1.5 bg-gray-50 w-full overflow-hidden">
           <motion.div 
             className="h-full bg-gradient-to-r from-emerald-400 to-[#1A5C38]"
             initial={{ width: '0%' }}
             animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
             transition={{ type: "spring", stiffness: 50, damping: 15 }}
           />
        </div>
      </motion.div>
    </div>
  )
}
