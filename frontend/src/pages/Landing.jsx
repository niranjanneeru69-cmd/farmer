import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CloudSun, TrendingUp, Sprout, Shield, MessageSquareText, BarChart3, Menu, X, Check, MapPin, Mail, Phone, Star, ArrowRight } from 'lucide-react'

// Import new video file
import herovideo from '../hero/video1.mp4'

import farmer1 from '../hero/farmer1.jpg'
import farmer2 from '../hero/farmer2.jpg'
import farmer3 from '../hero/farmer3.jpg'
import farmer4 from '../hero/farmer4.jpg'
import farmer5 from '../hero/farmer5.jpg'
import farmer6 from '../hero/farmer6.jpg'
import review1 from '../hero/farmer_review1.jpg'
import review2 from '../hero/farmer_review2.jpg'
import review3 from '../hero/farmer_review3.jpg'
import review4 from '../hero/farmer_review4.jpg'
import Logo from '../components/Logo'

const FEATURES = [
  { icon: CloudSun, title: 'Smart Weather Alerts', desc: 'Real-time flood, drought & storm warnings tailored to your farm location.', color: 'bg-blue-50', iconColor: 'text-blue-500' },
  { icon: TrendingUp, title: 'Live Market Prices', desc: 'Track live mandi prices for 70+ crops. Know the exact best time to sell.', color: 'bg-amber-50', iconColor: 'text-amber-500' },
  { icon: Sprout, title: 'AI Crop Advisor', desc: 'Personalized recommendations for crops matching your soil and climate.', color: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { icon: Shield, title: 'Disease Detection', desc: 'Photo-based AI diagnosis powered by Google Vision. Quick treatment plans.', color: 'bg-rose-50', iconColor: 'text-rose-500' },
  { icon: MessageSquareText, title: 'Multilingual Chat', desc: 'Ask farming questions in 12 different Indian regional languages.', color: 'bg-purple-50', iconColor: 'text-purple-500' },
  { icon: BarChart3, title: 'Gov. Schemes Tracker', desc: 'Track all 15+ active government subsidies you may qualify for.', color: 'bg-teal-50', iconColor: 'text-teal-500' },
]

// Reusable Layer component using pure CSS sticky stacking with enhanced shadow and entry animations
const SectionLayer = ({ children, id, bgClass, zIndex }) => {
  const ref = React.useRef(null)

  // Track scroll while this section is stuck at the top
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  // Creates the "moving backwards" scale depth effect as the next section covers it
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92])

  return (
    <motion.section id={id} ref={ref} style={{ scale }} className={`sticky top-0 min-h-screen w-full flex flex-col justify-center ${bgClass} rounded-t-[3rem] md:rounded-t-[4rem] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] ${zIndex} overflow-hidden origin-top transform-gpu will-change-transform`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full flex flex-col pt-16 md:pt-20 pb-10 transform-gpu"
      >
        {children}
      </motion.div>
    </motion.section>
  )
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Hero section custom tracker for moving backwards effect
  const heroRef = React.useRef(null)
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.92])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      // Offset calculation for smooth scrolling due to sticky top nav
      const y = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
    setMenuOpen(false)
  }

  return (
    <div className="bg-[#FAF9F6] font-[Plus_Jakarta_Sans] selection:bg-emerald-200 selection:text-emerald-900">

      {/* Navbar */}
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-[90] transition-all duration-500 rounded-full border ${scrolled ? 'bg-[#9BA9A3]/50 backdrop-blur-xl border-white/40 shadow-xl' : 'bg-transparent border-transparent'} px-6 py-3`}>
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo dark={!scrolled} className="scale-90" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[['Products', 'features'], ['About Us', 'about'], ['Technology', 'technology'], ['Testimonials', 'testimonials'], ['Contact', 'footer']].map(([l, id]) => (
              <button key={l} onClick={() => scrollTo(id)} className={`text-sm font-semibold tracking-wide transition-colors ${scrolled ? 'text-gray-900 hover:text-emerald-800' : 'text-white hover:text-gray-200 drop-shadow-md'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className={`font-semibold text-sm px-4 py-2 rounded-full transition-colors ${scrolled ? 'text-gray-900 hover:bg-white/50' : 'text-white hover:bg-white/20'}`}>
              Login
            </Link>
            <Link to="/signup" className={`px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg ${scrolled ? 'bg-[#124326] text-white hover:bg-[#1A5C38]' : 'bg-[#4F6F5F] text-white hover:bg-[#1F3328]'}`}>
              Get Started
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className={`w-6 h-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} /> : <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} />}
          </button>
        </div>
      </nav>

      <main className="relative z-0">

        {/* HERO SECTION - Sticky Stack layout */}
        <motion.section ref={heroRef} style={{ scale: heroScale }} className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-0 bg-[#021f11] origin-top transform-gpu will-change-transform">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          >
            <source src={herovideo} type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-gradient-to-t from-[#021f11]/90 via-[#021f11]/40 to-transparent" />

          <div className="relative z-10 text-center max-w-4xl px-6 w-full flex flex-col items-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="text-white font-[Outfit] font-light tracking-tight leading-[1.1] mb-6"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
            >
              The best place to find <br /> your <span className="font-semibold italic text-emerald-100">Inner Peace</span> with nature
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-white/80 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-light"
            >
              Feeling ready to grow? Find the best location to reconnect with nature and find inner calm while cultivating success.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex justify-center gap-4"
            >
              <Link to="/signup" className="bg-[#4CAF7D] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#3d9166] transition-colors shadow-[0_0_20px_rgba(76,175,125,0.4)] hover:shadow-[0_0_30px_rgba(76,175,125,0.6)] text-sm flex items-center gap-2">
                Get Started
              </Link>
              <Link to="/login" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors text-sm">
                Login
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* ABOUT US SECTION */}
        <SectionLayer id="about" bgClass="bg-[#F9FDF5]" zIndex="z-10">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-300 rounded-full" />
          <div className="max-w-7xl mx-auto px-6 pt-10 pb-8 w-full grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Image Layout */}
            <div className="relative isolate w-full min-h-[500px]">
              <div className="absolute top-0 left-0 w-[70%] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl border-4 border-white">
                <img src={farmer1} className="w-full h-full object-cover" alt="Farmer" />
              </div>
              <div className="absolute bottom-0 -right-12 w-[65%] aspect-[4/3.3] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-[#F9FDF5] z-10">
                <img src={farmer4} className="w-full h-full object-cover" alt="Farmer" />
              </div>
              <svg className="absolute -left-10 top-1/2 -translate-y-1/2 w-full h-[120%] -z-10 text-[#BAD564]/30" viewBox="0 0 200 200" fill="none">
                <path d="M 0,100 C 50,200 150,0 200,100" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>

            {/* Right Content Layout */}
            <div className="-mt-8 pb-10">
              <div className="inline-block px-4 py-1.5 rounded-full border border-[#b2cfb2] bg-[#eef7ee] text-[#2c5e31] font-semibold text-sm mb-6 pb-2">
                About Our Agriculture
              </div>
              <h2 className="font-[Outfit] font-bold text-4xl md:text-5xl lg:text-[54px] text-[#0f3d27] leading-[1.1] mb-8 tracking-tight">
                Growing Naturally, Living Fully Nurturing Nature at Home
              </h2>

              <div className="flex flex-col sm:flex-row gap-8 mb-10">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50 flex flex-col items-center justify-center min-w-[200px]">
                  <h3 className="font-[Outfit] font-bold text-5xl text-[#185532] mb-2">15+</h3>
                  <p className="text-gray-500 font-semibold text-sm text-center">Years Of Experience</p>
                </div>

                <div className="flex flex-col gap-6 justify-center">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-[#Edf3cA] flex items-center justify-center shrink-0">
                      <Sprout className="w-6 h-6 text-[#4a6b22]" />
                    </div>
                    <div>
                      <h4 className="font-[Outfit] font-bold text-[#0f3d27] text-lg mb-1">Built for green living</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">At Farmiti, we believe that everyone deserves the joy of cultivating their own food.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-[#Edf3cA] flex items-center justify-center shrink-0">
                      <CloudSun className="w-6 h-6 text-[#4a6b22]" />
                    </div>
                    <div>
                      <h4 className="font-[Outfit] font-bold text-[#0f3d27] text-lg mb-1">Grow with intention</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">Our mission is to help reconnect people with the roots of their nourishment.</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm leading-loose mb-8">
                At Farmiti, we believe that real change begins at home — in the soil beneath your feet and the food you grow with your own hands. Our mission is to help individuals and families embrace sustainable living through smart farming, organic gardening, and eco-conscious choices powered by AI.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-2">
                <div className="space-y-3 w-full">
                  <p className="flex items-center gap-3 text-[#396340] font-semibold text-sm"><Check className="text-[#88b14a] w-5 h-5" /> Let nature do the talking.</p>
                  <p className="flex items-center gap-3 text-[#396340] font-semibold text-sm"><Check className="text-[#88b14a] w-5 h-5" /> Plant roots, grow change.</p>
                </div>
                <Link to="/about" className="bg-[#BAD564] hover:bg-[#a5bd56] text-[#2c5e31] px-8 py-3.5 rounded-full font-bold transition-colors whitespace-nowrap shadow-md text-sm">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </SectionLayer>

        {/* TECHNOLOGY / SECOND ABOUT SECTION */}
        <SectionLayer id="technology" bgClass="bg-[#FFFFFF]" zIndex="z-20">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-300 rounded-full" />
          <div className="max-w-7xl mx-auto px-6 py-10 w-full grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content Layout */}
            <div className="order-2 lg:order-1 pt-4">
              <div className="inline-block px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-800 font-semibold text-sm mb-6 pb-2">
                Empowered By AI
              </div>
              <h2 className="font-[Outfit] font-bold text-4xl md:text-5xl lg:text-[54px] text-gray-900 leading-[1.1] mb-6 tracking-tight">
                Modern Answers for Traditional Farming
              </h2>
              <p className="text-gray-600 text-sm leading-loose mb-8">
                Our technology bridges the wisdom of generations with the precision of modern data. Whether forecasting rainfall, identifying rare crop diseases instantly, or connecting farmers straight to premium buyers—Farmiti transforms your smartphone into the ultimate agricultural tool.
              </p>

              <div className="grid sm:grid-cols-2 gap-6 mb-10">
                <div className="bg-[#F9FDF5] p-5 rounded-3xl border border-gray-100 shadow-sm">
                  <Shield className="w-8 h-8 text-[#BAD564] mb-3" />
                  <h4 className="font-[Outfit] font-bold text-gray-900 text-lg mb-1">Instant Diagnosis</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">Snap a photo and get AI-driven disease analysis instantly.</p>
                </div>
                <div className="bg-[#F9FDF5] p-5 rounded-3xl border border-gray-100 shadow-sm">
                  <TrendingUp className="w-8 h-8 text-[#BAD564] mb-3" />
                  <h4 className="font-[Outfit] font-bold text-gray-900 text-lg mb-1">Higher Margins</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">Live price tracking across Indian markets helps you sell better.</p>
                </div>
              </div>

              <Link to="/features" className="inline-flex items-center gap-2 text-[#2c5e31] font-bold text-sm hover:text-[#185532] transition-colors">
                Discover our methodology <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right Image Layout */}
            <div className="relative isolate w-full min-h-[500px] order-1 lg:order-2">
              <div className="absolute top-0 right-0  w-[70%] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl border-4 border-white">
                <img src={farmer5} className="w-full h-full object-cover" alt="Farmer Tech" />
              </div>
              <div className="absolute bottom-0 left-0 w-[65%] aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white z-10">
                <img src={farmer6} className="w-full h-full object-cover" alt="Farmer Community" />
              </div>
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -z-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
            </div>
          </div>
        </SectionLayer>

        {/* FEATURES SECTION */}
        <SectionLayer id="features" bgClass="bg-[#F2F6F4]" zIndex="z-30">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-300 rounded-full" />
          <div className="w-full max-w-7xl mx-auto px-6 pb-10 -mt-8 md:-mt-16">
            <div className="text-center max-w-2xl mx-auto mb-12 pt-16 md:pt-24">
              <div className="inline-block px-4 py-1.5 rounded-full border border-emerald-200 bg-white text-emerald-800 font-semibold text-sm mb-4">
                Powerful Tools
              </div>
              <h2 className="font-[Outfit] font-bold text-4xl md:text-5xl text-gray-900 leading-[1.2] mb-4">Everything you need to grow successfully.</h2>
              <p className="text-gray-600">Our platform equips you with enterprise-grade tech simplified into actionable daily tasks.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc, color, iconColor }) => (
                <div key={title} className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gray-50 shadow-inner group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-7 h-7 ${iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 font-[Outfit]">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionLayer>

        {/* TESTIMONIALS SECTION */}
        <SectionLayer id="testimonials" bgClass="bg-[#FAF9F6]" zIndex="z-40">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-300 rounded-full" />
          <div className="w-full max-w-7xl mx-auto px-6 py-10">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <div className="inline-block px-4 py-1.5 rounded-full border border-[#b2cfb2] bg-[#eef7ee] text-[#2c5e31] font-semibold text-sm mb-4">
                Testimonials
              </div>
              <h2 className="font-[Outfit] font-bold text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">Voices from the Field</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Hear directly from the farmers whose livelihoods have transformed. From fighting unpredictable weather to navigating complex local mandi markets, our community is rewriting the rules of modern agriculture with simple, accessible AI.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { img: review1, name: "Harpreet Singh", loc: "Punjab", text: "ਮਾਰਕੀਟ ਰੁਝਾਨ ਦੀਆਂ ਚਿਤਾਵਨੀਆਂ ਨੇ ਮੈਨੂੰ ਸਸਤੇ ਵਿੱਚ ਵੇਚਣ ਤੋਂ ਬਚਾਇਆ। ਫਾਰਮਿਤੀ ਦੀ ਸਲਾਹ ਨੇ ਮੈਨੂੰ ਫਸਲ ਰੱਖਣ ਦਾ ਭਰੋਸਾ ਦਿੱਤਾ।" },
                { img: review2, name: "Bhavna Patel", loc: "Gujarat", text: "રોગગ્રસ્ત પાંદડાનો ફોટો લો અને તમને તરત જ ઇલાજ મળી જાય. આ એક અકલ્પનીય અને સચોટ સાધન છે!" },
                { img: review3, name: "Venkata Rao", loc: "Andhra Pradesh", text: "నాకు తగినట్లుగా ఇచ్చే పంట షెడ్యూల్ ద్వారా నేను సరైన సమయంలో నీరు, ఎరువులు వేయగలుగుతున్నాను. దిగుబడి 30% పెరిగింది." },
                { img: review4, name: "Rajesh Sharma", loc: "Madhya Pradesh", text: "सरकारी योजनाओं की ट्रैकिंग से मुझे एक ऐसी सब्सिडी मिली जिसके बारे में मुझे पता भी नहीं था। यह एक बेहतरीन प्लेटफॉर्म है।" }
              ].map((rev, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 hover:-translate-y-2 transition-transform duration-300 shadow-xl shadow-gray-200/50 flex flex-col h-full">
                  <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-[3px] border-[#BAD564] mb-5 shrink-0 bg-gray-100 shadow-inner">
                    <img src={rev.img} alt={rev.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="text-center flex-1 flex flex-col">
                    <div className="flex justify-center gap-1 mb-3">
                      {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-[#FACC15] fill-[#FACC15]" />)}
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic text-gray-600 mb-5 flex-1 line-clamp-4">"{rev.text}"</p>
                    <div>
                      <h4 className="font-semibold text-gray-900 font-[Outfit] text-lg leading-tight">{rev.name}</h4>
                      <p className="text-emerald-700 text-xs font-semibold uppercase tracking-wider mt-1">{rev.loc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionLayer>

        {/* FOOTER SECTION */}
        <section id="footer" className="sticky top-0 min-h-[70vh] w-full flex flex-col bg-[#124326] rounded-t-[3rem] md:rounded-t-[4rem] shadow-[0_-10px_30px_rgba(0,0,0,0.15)] z-50 overflow-hidden text-white pt-16 origin-top transform-gpu">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-400 rounded-full opacity-30" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-7xl mx-auto px-6 w-full flex-1 pt-10 transform-gpu"
          >
            {/* Top Contact Strip */}
            <div className="grid md:grid-cols-3 gap-8 pb-12 border-b border-white/10 items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                  <MapPin className="w-5 h-5 text-[#BAD564]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1.5">Location</p>
                  <p className="text-sm font-medium leading-tight text-gray-200">2323 Farming Road, Sector 5<br />New Delhi, ND 110001</p>
                </div>
              </div>

              <div className="flex items-center gap-4 md:border-l md:border-white/10 md:pl-8">
                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                  <Mail className="w-5 h-5 text-[#BAD564]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1.5">Email Us</p>
                  <p className="text-sm font-medium leading-tight text-gray-200">hello@farmiti.com<br />support@farmiti.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 md:border-l md:border-white/10 md:pl-8 justify-between flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                    <Phone className="w-5 h-5 text-[#BAD564]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1.5">Phone</p>
                    <p className="text-sm font-medium leading-tight text-gray-200">+91 98765 43210<br />+91 91234 56789</p>
                  </div>
                </div>
                <button className="bg-[#BAD564] hover:bg-[#a5bd56] text-[#124326] px-6 py-2.5 rounded-full font-bold text-sm transition-colors whitespace-nowrap shadow-md mt-4 sm:mt-0">
                  Contact Us
                </button>
              </div>
            </div>

            {/* Main Footer Links */}
            <div className="grid md:grid-cols-4 gap-12 py-16">

              <div className="md:col-span-1">
                <Logo dark={true} className="mb-6 scale-110 origin-left" />
                <p className="text-sm text-gray-300 leading-relaxed mb-8">
                  Farmiti is your trusted partner in AI-powered agriculture. From smart crop detection to market APIs, we help you grow fresh, healthy yields right where you live — sustainably, simply, and smartly.
                </p>
                <div className="flex bg-white/5 rounded-full p-1.5 border border-white/10">
                  <input type="email" placeholder="Email" className="bg-transparent border-none outline-none text-white px-4 text-sm w-full placeholder-gray-400" />
                  <button className="bg-[#BAD564] text-[#124326] px-5 py-2 rounded-full font-bold text-sm">Subscribe</button>
                </div>
              </div>

              <div className="space-y-4 md:pl-10">
                <h4 className="font-[Outfit] font-bold text-lg mb-6 text-white">Top Links</h4>
                {['Home Page', 'Our Farm', 'About Us', 'Our Service', 'Contact Us', 'Testimonials'].map(l => (
                  <a key={l} href="#" className="block text-sm text-gray-300 hover:text-[#BAD564] transition-colors">{l}</a>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-[Outfit] font-bold text-lg mb-6 text-white">Our Services</h4>
                {['Smart Weather', 'Disease Detection', 'Market Prices API', 'Soil Analysis', 'AI Crop Advisor', 'Gov. Schemes'].map(l => (
                  <a key={l} href="#" className="block text-sm text-gray-300 hover:text-[#BAD564] transition-colors">{l}</a>
                ))}
              </div>

              <div>
                <h4 className="font-[Outfit] font-bold text-lg mb-6 text-white">Working Hours</h4>
                <div className="space-y-3 text-sm text-gray-300 mb-8 border-b border-white/10 pb-6">
                  <div className="flex justify-between"><span>Mon-Fri :</span> <span className="font-semibold text-white">8:00 AM - 7:00 PM</span></div>
                  <div className="flex justify-between"><span>Sunday :</span> <span className="font-semibold text-white">2:00 PM - 9:00 PM</span></div>
                  <div className="flex justify-between"><span>Saturday :</span> <span className="text-gray-400">Close</span></div>
                </div>
                <div className="flex gap-3">
                  {['f', 'in', 'x', 'y'].map(s => (
                    <div key={s} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#BAD564] hover:text-[#124326] transition-colors cursor-pointer text-sm font-bold uppercase">
                      {s}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="w-full border-t border-white/10 pt-6 pb-8">
              <div className="flex flex-col md:flex-row justify-between items-center text-sm font-medium text-gray-400">
                <p>© Farmiti 2026. All Rights Reserved.</p>
                <p>Built With Care <span className="text-white/20 mx-2">|</span> Powered By Nature</p>
              </div>
            </div>
          </motion.div>
        </section>

      </main>
    </div>
  )
}