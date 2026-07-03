import React, { useState } from 'react'
import { Heart, MessageCircle, Share2, Bookmark, Plus, TrendingUp, Users, Award, Send, X } from 'lucide-react'

const POSTS = [
  { id: 1, author: 'Ravi Kumar', loc: 'Thanjavur, TN', crop: 'Rice Farmer', time: '2 hours ago', tag: 'Success Story', tagColor: 'bg-green-100 text-green-700', title: 'My tomato crop doubled this season using drip irrigation!', content: 'After switching to drip irrigation in March, I reduced water usage by 40% and my tomato yield went from 8 to 14 tonnes/acre. Initial cost ₹35,000 — fully recovered in one season!', img: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=600&q=80', likes: 234, comments: 47, saved: true, avatar: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=80&q=80' },
  { id: 2, author: 'Lakshmi Devi', loc: 'Erode, TN', crop: 'Vegetable Farmer', time: '5 hours ago', tag: 'Question', tagColor: 'bg-blue-100 text-blue-700', title: 'Best organic pesticide for chilli thrips?', content: 'My chilli crop is being attacked by thrips. Leaves are curling up. I want to use organic methods. Has anyone tried neem oil or spinosad? Please share your experience!', img: null, likes: 56, comments: 89, saved: false, avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&q=80' },
  { id: 3, author: 'Suresh Patil', loc: 'Nashik, MH', crop: 'Onion Farmer', time: '1 day ago', tag: 'Market Tip', tagColor: 'bg-amber-100 text-amber-700', title: "Onion prices expected to rise 25% in November — here's why", content: "Based on 15 years of experience, prices always spike in Oct–Nov due to festival demand + rabi crop delays. If you have storage, hold your stock now. Last year I earned ₹200 extra per quintal.", img: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600&q=80', likes: 412, comments: 134, saved: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80' },
]

const EXPERTS = [
  { name: 'Dr. Arjun Sharma', title: 'Soil Scientist, ICAR', followers: '12.4K', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=80&q=80', verified: true },
  { name: 'Priya Nair', title: 'Organic Farming Expert', followers: '8.7K', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&q=80', verified: true },
  { name: 'Rajan Pillai', title: 'Agri Entrepreneur', followers: '6.2K', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80', verified: false },
]

export default function Community() {
  const [posts, setPosts] = useState(POSTS)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPost, setNewPost] = useState('')
  const toggleLike = (id) => setPosts(p => p.map(post => post.id === id ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 } : post))
  const toggleSave = (id) => setPosts(p => p.map(post => post.id === id ? { ...post, saved: !post.saved } : post))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[{ icon: Users, l: 'Members', v: '2.4M+', c: 'text-green-600 bg-green-50' }, { icon: MessageCircle, l: 'Posts Today', v: '1,247', c: 'text-blue-600 bg-blue-50' }, { icon: Award, l: 'Experts Online', v: '34', c: 'text-amber-600 bg-amber-50' }].map(({ icon: I, l, v, c }) => (
          <div key={l} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${c} rounded-xl flex items-center justify-center shrink-0`}><I className="w-5 h-5" /></div>
            <div><p className="font-display text-xl font-bold text-forest">{v}</p><p className="text-gray-400 text-xs">{l}</p></div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold">F</div>
              <button onClick={() => setShowNewPost(true)} className="flex-1 text-left px-4 py-2.5 bg-gray-100 rounded-xl text-gray-400 text-sm hover:bg-gray-200 transition-colors">Share your farming experience...</button>
              <button onClick={() => setShowNewPost(true)} className="btn-primary text-sm py-2"><Plus className="w-4 h-4" />Post</button>
            </div>
            {showNewPost && (
              <div className="mt-3 space-y-3">
                <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share a tip, ask a question, or celebrate your harvest!" rows={4} className="input resize-none text-sm" />
                <div className="flex items-center justify-between">
                  <button onClick={() => { setShowNewPost(false); setNewPost('') }} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
                  <button className="btn-primary text-sm"><Send className="w-3.5 h-3.5" />Share Post</button>
                </div>
              </div>
            )}
          </div>

          {posts.map(post => (
            <div key={post.id} className="card overflow-hidden rounded-2xl">
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3"><img src={post.avatar} className="w-9 h-9 rounded-full object-cover" alt="" /><div><p className="text-sm font-semibold text-gray-800">{post.author}</p><p className="text-xs text-gray-400">{post.loc} · {post.time}</p></div></div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${post.tagColor}`}>{post.tag}</span>
                </div>
                <h3 className="font-display font-bold text-forest text-base mb-1.5">{post.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{post.content}</p>
              </div>
              {post.img && <img src={post.img} className="w-full h-52 object-cover" alt="" />}
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}><Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500' : ''}`} />{post.likes}</button>
                  <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-500 transition-colors"><MessageCircle className="w-4 h-4" />{post.comments}</button>
                  <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-green-500 transition-colors"><Share2 className="w-4 h-4" /></button>
                </div>
                <button onClick={() => toggleSave(post.id)} className={`transition-colors ${post.saved ? 'text-amber-500' : 'text-gray-400 hover:text-amber-400'}`}><Bookmark className={`w-4 h-4 ${post.saved ? 'fill-amber-500' : ''}`} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="card p-5 rounded-2xl">
            <h3 className="font-display font-bold text-forest mb-4">Top Farm Experts</h3>
            {EXPERTS.map(e => (
              <div key={e.name} className="flex items-center gap-3 mb-4 last:mb-0">
                <div className="relative"><img src={e.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />{e.verified && <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white"><span className="text-white text-[9px] font-bold">✓</span></span>}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800">{e.name}</p><p className="text-xs text-gray-400 truncate">{e.title}</p><p className="text-xs text-green-600">{e.followers} followers</p></div>
                <button className="btn-outline py-1.5 px-3 text-xs">Follow</button>
              </div>
            ))}
          </div>
          <div className="card p-5 rounded-2xl">
            {[{ t: '#TomatoPrice', p: '2.4K posts' }, { t: '#KharifSeason2025', p: '1.8K posts' }, { t: '#OrganicFarming', p: '1.2K posts' }, { t: '#DroughtAlert', p: '987 posts' }, { t: '#RiceBlast', p: '743 posts' }].map(({ t: topic, p }) => (
              <button key={topic} className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition-colors">
                <span className="text-sm text-green-700 font-semibold">{topic}</span><span className="text-xs text-gray-400">{p}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
