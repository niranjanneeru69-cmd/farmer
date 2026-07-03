import React from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'

export default function DashboardLayout() {
  return (
    <div className="flex w-screen h-screen overflow-hidden p-[1rem] sm:p-[1.5rem]" style={{ background: '#ebf5ef' }}>
      {/* Floating Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F6FAFE] shadow-[0_20px_50px_rgba(0,10,20,0.05)] rounded-[2.5rem] relative">
        <div className="relative z-10 flex flex-col h-full w-full">
          <TopBar />
          <main className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 scrollbar-hide">
            <div className="mx-auto w-full max-w-[1280px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}