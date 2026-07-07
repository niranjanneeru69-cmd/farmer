import React from 'react';

export default function Logo({ className = '', dark = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon echoing the "greenish" reference (4 leaf/seed shapes forming a square) */}
      <div className="relative w-8 h-8 flex flex-wrap gap-0.5 shrink-0 justify-center items-center">
        <div className="w-[14px] h-[14px] bg-[#FACC15] rounded-tl-full rounded-br-full" />
        <div className="w-[14px] h-[14px] bg-[#FACC15] rounded-tr-full rounded-bl-full" />
        <div className="w-[14px] h-[14px] bg-[#FACC15] rounded-tr-full rounded-bl-full" />
        <div className="w-[14px] h-[14px] bg-[#FACC15] rounded-tl-full rounded-br-full" />
      </div>
      <span className={`font-display font-medium text-xl md:text-2xl tracking-tight lowercase ${dark ? 'text-white' : 'text-forest'}`}>
        farmiti
      </span>
    </div>
  );
}
