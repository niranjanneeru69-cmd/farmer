import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, AlertCircle, Info, HelpCircle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  description = "This action cannot be undone.", 
  confirmText = "Delete", 
  cancelText = "Cancel", 
  type = "delete", // 'delete', 'confirm', 'info'
  icon: CustomIcon
}) => {
  
  const getIcon = () => {
    if (CustomIcon) return <CustomIcon className="w-6 h-6" />;
    switch (type) {
      case 'delete': return <Trash2 className="w-6 h-6" />;
      case 'confirm': return <HelpCircle className="w-6 h-6" />;
      case 'info': return <Info className="w-6 h-6" />;
      default: return <AlertCircle className="w-6 h-6" />;
    }
  };

  const getConfirmColor = () => {
    switch (type) {
      case 'delete': return 'bg-[#F76468] hover:bg-[#F55256] shadow-red-500/20';
      case 'confirm': return 'bg-[#4FD1C5] hover:bg-[#38B2AC] shadow-teal-500/20';
      default: return 'bg-[#9095C6] hover:bg-[#8085B6] shadow-purple-500/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#1A2622]/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="relative w-full max-w-[340px] bg-white rounded-[32px] shadow-2xl p-8 pt-10 text-center flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-gray-100/50 rounded-2xl flex items-center justify-center mb-5 text-gray-500">
               {getIcon()}
            </div>
            
            <h2 className="text-[22px] font-medium text-gray-800 tracking-tight mb-3">
              {title}
            </h2>
            
            <p className="text-[13.5px] font-normal leading-relaxed text-gray-500 max-w-[240px] mb-8">
              {description}
            </p>

            <div className="flex gap-3 w-full font-['Inter',sans-serif]">
              <button 
                onClick={onClose} 
                className="flex-1 h-[48px] bg-[#F1F2F4] text-gray-700 rounded-[24px] text-[15px] font-semibold hover:bg-gray-200 transition-colors"
              >
                 {cancelText}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }} 
                className={`flex-1 h-[48px] text-white rounded-[24px] text-[15px] font-semibold shadow-lg transition-colors ${getConfirmColor()}`}
              >
                 {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
