import { Bell, UserCircle, ChevronLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import API from '../api/axios'
import ProfileDropdown from './ProfileDropdown'


const formatBreadcrumb = (pathname) => {
  const labelMap = {
    home: 'Dashboard',
    workspaces: 'All Workspaces',
    workspace: 'Workspace',
    settings: 'Settings',
    'archive-bin': 'Archive Bin',
    task: 'Task',
  }
  return pathname
    .split('/')
    .filter(Boolean)
    .map(seg => {
      if (/^[0-9a-fA-F]{24}$/.test(seg)) {
        const ws = localStorage.getItem(`ws_${seg}`)
        if (ws) return ws
        try {
          const t = JSON.parse(localStorage.getItem(`task_${seg}`) || '{}')
          if (t.numericId) return `#${t.numericId}`
        } catch (_) {}
        return '...'
      }
      return labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')
    })
    .join('  /  ')
}

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const workspaceId = location.pathname.split('/')[2]
  const [hasPending, setHasPending] = useState(false)
  const isHomePage = location.pathname === '/home'

  useEffect(() => {
    const checkPending = async () => {
      if (!workspaceId || isHomePage || location.pathname.includes('workspaces')) {
        setHasPending(false)
        return
      }
      try {
        const { data } = await API.get(`/workspaces/${workspaceId}/members`)
        setHasPending(data.some(m => m.status === 'pending'))
      } catch (err) { console.error(err) }
    }
    checkPending()
  }, [workspaceId, location.pathname, isHomePage])

  const openPendingModal = () => window.dispatchEvent(new CustomEvent('openPendingRequests'))

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 relative z-60">
      <div className="flex items-center gap-4">
        {!isHomePage && <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><ChevronLeft size={20} /></button>}
        <div className="text-sm text-gray-400 font-medium">{formatBreadcrumb(location.pathname)}</div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative group">
          <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-all">
            <Bell size={22} />
            {hasPending && <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>}
          </button>

          <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-4xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-5">
            <h4 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">Notifications</h4>
            {hasPending ? (
              <div onClick={openPendingModal} className="p-4 hover:bg-orange-50 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-orange-100">
                <p className="text-xs font-bold text-[#001E2B]">Attention Required</p>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">There are pending join requests waiting for your approval in this workspace. Click to manage them.</p>
              </div>
            ) : <p className="text-xs text-gray-400 text-center py-6">You're all caught up!</p>}
          </div>
        </div>

        <ProfileDropdown />
      </div>
    </header>
  )
}
export default Navbar