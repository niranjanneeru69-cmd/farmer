import React from 'react'
import { useToast } from '../context/ToastContext'
import { X, Bell, Info, AlertTriangle, CheckCircle2, ChevronRight, Activity, Calendar } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { notificationAPI } from '../api/services'

const TYPE_STYLES = {
  success: {
    bg: 'bg-white/95',
    border: 'border-green-100',
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    bar: 'bg-green-500',
  },
  error: {
    bg: 'bg-white/95',
    border: 'border-red-100',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50',
    bar: 'bg-red-500',
  },
  warning: {
    bg: 'bg-white/95',
    border: 'border-amber-100',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    bar: 'bg-amber-500',
  },
  info: {
    bg: 'bg-white/95',
    border: 'border-blue-100',
    icon: Info,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    bar: 'bg-blue-500',
  },
  calendar: {
    bg: 'bg-white/95',
    border: 'border-indigo-100',
    icon: Calendar,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    bar: 'bg-indigo-500',
  }
}

// Toast notifications container
export default function ToastContainer() {
  const { toasts, removeToast } = useToast()
  const { t } = useLang()
  const navigate = useNavigate()

  return (
    <div className="fixed top-8 right-8 z-[10000] flex flex-col gap-4 pointer-events-none max-h-[90vh] overflow-visible pr-2 font-['Plus_Jakarta_Sans',sans-serif]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = TYPE_STYLES[toast.type || 'info'] || TYPE_STYLES.info
          const Icon = style.icon

          return (
            <motion.div
              key={toast.id}
              initial={{ x: 120, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 50, opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              layout
              className={`pointer-events-auto relative w-[400px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[28px] border ${style.border} ${style.bg} overflow-hidden backdrop-blur-xl group`}
            >
              <div className="p-5 flex gap-4">
                <div className={`w-12 h-12 rounded-2xl ${style.iconBg} flex items-center justify-center shrink-0`}>
                   <Icon className={`w-6 h-6 ${style.iconColor}`} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col gap-1">
                       <h4 className="text-[16px] font-bold tracking-tight text-gray-900 leading-tight">
                         {toast.title}
                       </h4>
                       {toast.isLive && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-100 rounded-full w-fit">
                            <Activity className="w-3 h-3 text-red-500" />
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-none">Live Alert</span>
                          </div>
                       )}
                    </div>
                    <button 
                      onClick={() => removeToast(toast.id)}
                      className="p-1 -mr-1 -mt-1 rounded-full transition-all text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-[13px] font-medium leading-relaxed text-gray-500 mt-1">
                    {toast.message}
                  </p>
                  
                  {(toast.link || toast.type === 'calendar') && (
                    <button 
                      onClick={() => {
                        navigate(toast.link || '/calendar')
                        removeToast(toast.id)
                        if (toast.notifId) notificationAPI.delete(toast.notifId).catch(() => {})
                      }}
                      className="mt-4 px-5 py-2.5 bg-gray-900 text-white hover:bg-black rounded-2xl text-[12px] font-bold shadow-lg shadow-gray-900/10 transition-all flex items-center gap-2 w-fit"
                    >
                      {toast.actionLabel || (toast.type === 'calendar' ? 'See Event' : (t('viewDetails') || 'View Details'))} 
                      <ChevronRight className="w-4 h-4"/>
                    </button>
                  )}
                </div>
              </div>
              
              {!toast.persistent && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: 0 }}
                    transition={{ duration: 6, ease: 'linear' }}
                    className={`h-full ${style.bar}`}
                  />
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

