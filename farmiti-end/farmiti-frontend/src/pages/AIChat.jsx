import React, { useState, useRef, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { chatAPI } from '../api/services'
import { Send, Bot, User, Trash2, Lightbulb, Copy, Globe, Leaf, Volume2, VolumeX, Square, Mic, MicOff, Edit2 } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'

export default function AIChat() {
  const { t, lang, changeLang, allLangs } = useLang()
  const { farmer } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [histLoading, setHistLoading] = useState(true)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  const [chatLang, setChatLang] = useState(lang)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  
  const bottomRef = useRef()
  const inputRef = useRef()
  
  const avatarSrc = farmer?.avatar_url
    ? (farmer.avatar_url.startsWith('/uploads') ? `http://localhost:8000${farmer.avatar_url}` : farmer.avatar_url)
    : null

  const SUGGESTIONS = [
    t('sug_fertilizer'), t('sug_irrigation'),
    t('sug_pests'), t('sug_harvest'),
    t('sug_drought'), t('sug_ph'),
    t('sug_sell'), t('sug_schemes')
  ]

  useEffect(() => {
    chatAPI.getHistory().then(r => {
      const hist = r.data.messages || []
      if (!hist.length) {
        setMessages([{ id: 'welcome', role: 'assistant', content: t('aiWelcome'), created_at: new Date() }])
      } else setMessages(hist)
    }).catch(() => { }).finally(() => setHistLoading(false))
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const speakText = (text) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ''))
    
    const langMap = {
      en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', 
      kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', pa: 'pa-IN', 
      bn: 'bn-IN', gu: 'gu-IN', or: 'or-IN', ur: 'ur-PK'
    }
    
    const targetLang = langMap[chatLang] || 'en-US'
    utterance.lang = targetLang
    utterance.rate = 0.9
    
    // Better voice selection with robust matching
    const voices = window.speechSynthesis.getVoices()
    const findVoice = (target) => {
      const mainLang = target.split('-')[0]
      // Try exact match first
      let v = voices.find(v => v.lang === target || v.lang.replace('_', '-') === target)
      // Try main language match (e.g., 'hi')
      if (!v) v = voices.find(v => v.lang.startsWith(mainLang))
      return v
    }

    const selectedVoice = findVoice(targetLang)
    if (selectedVoice) utterance.voice = selectedVoice

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const toggleAutoSpeak = () => {
    const newState = !autoSpeak
    setAutoSpeak(newState)
    if (!newState) {
      stopSpeaking()
    }
  }

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    const langMap = {
      en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', 
      kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', pa: 'pa-IN', 
      bn: 'bn-IN', gu: 'gu-IN', or: 'or-IN', ur: 'ur-PK'
    }
    
    recognition.lang = langMap[chatLang] || 'en-US'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = (e) => {
      console.error('Speech error:', e)
      setIsListening(false)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + ' ' + transcript)
      // Optional: Auto-send if transcript is long enough? 
      // For now, just fill the input.
    }

    recognition.start()
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const userMsg = { id: Date.now(), role: 'user', content: msg, created_at: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const res = await chatAPI.send(msg, chatLang)
      const reply = res.data.reply
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply, created_at: new Date() }])
      if (autoSpeak) speakText(reply)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || t('error')
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: errorMsg, created_at: new Date() }])
      if (autoSpeak) speakText(errorMsg)
    } finally { setLoading(false) }
  }

  const clearHistory = async () => {
    await chatAPI.clearHistory().catch(() => { })
    setMessages([{ id: 'cleared', role: 'assistant', content: t('chatCleared'), created_at: new Date() }])
  }

  const renderContent = (text) => {
    if (!text) return null
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} className="ml-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: bold }} />
      if (line === '') return <div key={i} className="h-1.5" />
      return <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: bold }} />
    })
  }

  const currentChatLang = allLangs.find(l => l.code === chatLang)

  return (
    <div className="flex flex-col animate-fade-in" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="card p-4 mb-4 flex items-center gap-3 rounded-3xl">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #1A5C38 0%, #0D3320 100%)' }}>
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg leading-none" style={{ color: '#0D3320' }}>{t('kisanAI')} {t('aiAssistant')}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4CAF7D' }} />
            <span className="text-xs text-gray-400">{t('poweredByGemini')} · {currentChatLang?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutoSpeak}
            className={`p-2 rounded-xl transition-colors ${autoSpeak ? 'bg-[#EDFAF3] text-[#1A5C38]' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
            title={autoSpeak ? 'Auto-Speak On' : 'Auto-Speak Off'}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium transition-colors hover:opacity-80"
              style={{ background: '#F5F7F2', color: '#1A5C38' }}>
              <Globe className="w-3.5 h-3.5" /> {currentChatLang?.flag} {currentChatLang?.name}
            </button>
            {showLangPicker && (
              <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-card-lg border border-gray-100 overflow-hidden z-50 max-h-60 overflow-y-auto">
                {allLangs.map(l => (
                  <button key={l.code} onClick={() => { setChatLang(l.code); setShowLangPicker(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left text-sm transition-colors ${chatLang === l.code ? 'font-semibold' : 'text-gray-700'}`}
                    style={chatLang === l.code ? { background: '#EDFAF3', color: '#1A5C38' } : {}}>
                    {l.flag} {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setDeleteConfirmOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-500" title={t('clearChat')}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && !histLoading && (
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />{t('recommendCrops')}
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="px-3 py-1.5 text-xs bg-white rounded-2xl text-gray-700 hover:shadow-card transition-all font-medium border border-gray-100 hover:border-[#C8E6D4]"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
        {histLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#C8E6D4] border-t-[#1A5C38] rounded-full animate-spin" />
          </div>
        ) : messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}
              style={{
                background: msg.role === 'assistant'
                  ? 'linear-gradient(135deg, #1A5C38, #0D3320)'
                  : 'linear-gradient(135deg, #E8A020, #d4911a)'
              }}>
              {msg.role === 'assistant'
                ? <Bot className="w-4.5 h-4.5 text-white" />
                : (avatarSrc
                  ? <img src={avatarSrc} alt="" className="w-full h-full rounded-2xl object-cover" />
                  : <span className="text-white text-xs font-bold">{farmer?.name?.[0] || 'F'}</span>)}
            </div>
            <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : ''}`}>
              <div className={`px-4 py-3 rounded-3xl text-sm leading-relaxed ${msg.role === 'user'
                  ? 'text-white'
                  : 'bg-white shadow-card text-gray-800 border border-gray-100'
                }`} style={msg.role === 'user' ? {
                  background: 'linear-gradient(135deg, #1A5C38, #0D3320)',
                  borderRadius: '20px 4px 20px 20px'
                } : { borderRadius: '4px 20px 20px 20px' }}>
                {msg.role === 'assistant'
                  ? <div className="space-y-0.5">{renderContent(msg.content)}</div>
                  : <p>{msg.content}</p>}
              </div>
              {msg.role === 'assistant' ? (
                <div className="flex items-center gap-1 px-1">
                  <span className="text-[11px] text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => navigator.clipboard.writeText(msg.content)}
                    className="p-1 hover:text-[#1A5C38] text-gray-300 transition-colors rounded" title="Copy">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                    className={`p-1 transition-colors rounded ${isSpeaking ? 'text-red-500 hover:text-red-600' : 'text-gray-300 hover:text-[#1A5C38]'}`} title={isSpeaking ? "Stop Speaking" : "Speak"}>
                    {isSpeaking ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-1 justify-end">
                  <button onClick={() => { setInput(msg.content); inputRef.current?.focus(); }}
                    className="p-1 hover:text-[#E8A020] text-gray-300 transition-colors rounded" title="Edit Message">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <span className="text-[11px] text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, #1A5C38, #0D3320)' }}>
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="bg-white shadow-card border border-gray-100 rounded-3xl px-4 py-3" style={{ borderRadius: '4px 20px 20px 20px' }}>
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: `${d}ms`, background: '#4CAF7D' }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 card p-3 rounded-3xl">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={t('askQuestion')}
            rows={2}
            className="flex-1 px-4 py-3 rounded-2xl border text-sm resize-none outline-none transition-all placeholder-gray-400"
            style={{ background: '#F5F7F2', borderColor: '#E8EDE4', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            onFocus={e => e.target.style.borderColor = '#4CAF7D'}
            onBlur={e => e.target.style.borderColor = '#E8EDE4'}
          />
          <button
            onClick={toggleListening}
            className={`p-3.5 rounded-2xl transition-all flex-shrink-0 hover:-translate-y-0.5 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-3.5 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white flex-shrink-0 hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #1A5C38, #0D3320)' }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 px-1">
          {t('enterToSend')} · {t('shiftEnter')} · {t('respondingIn')}: <strong>{currentChatLang?.name}</strong>
        </p>
      </div>
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={clearHistory}
        title={t('deleteConfirm') || 'Clear Chat History?'}
        description="Your entire conversation with KisanAI will be permanently deleted."
      />
    </div>
  )
}
