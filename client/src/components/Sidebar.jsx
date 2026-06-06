import { LayoutDashboard, FolderKanban, Users, Settings, LogOut, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link, useLocation, useParams, NavLink } from 'react-router-dom'
import API from '../api/axios'
import { toast } from 'react-toastify'

const Sidebar = () => {
  const location = useLocation()
  const { workspaceId } = useParams()

  const [members, setMembers] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isMembersOpen, setIsMembersOpen] = useState(false)

  const userString = localStorage.getItem('user')
  const currentUser = userString && userString !== "undefined" ? JSON.parse(userString) : null

  const fetchSidebarData = async () => {
    try {
      const { data } = await API.get(`/workspaces/${workspaceId}/members`)
      setMembers(data.filter(m => m.status === 'active' || !m.status))
      setPendingCount(data.filter(m => m.status === 'pending').length)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (workspaceId) fetchSidebarData()
  }, [workspaceId])

  const myMembership = members.find(m => m.user?._id === currentUser?._id)
  const isAdmin = myMembership?.role === 'admin' || myMembership?.role === 'owner'

  const openPendingModal = () => window.dispatchEvent(new CustomEvent('openPendingRequests'))

  return (
    <div className="w-64 bg-[#001E2B] text-white flex flex-col p-6 shadow-xl h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-[#00ED64] p-2 rounded-lg">
          <div className="w-4 h-4 bg-[#001E2B]" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
        </div>
        <h1 className="text-xl font-bold">SyncNode</h1>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
        {[
          { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/home' },
          { icon: <FolderKanban size={20} />, label: 'Workspaces', path: '/workspaces' },
          { icon: <Settings size={20} />, label: 'Settings', path: '/settings' }
        ].map(item => (
          <Link key={item.path} to={item.path} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-[#00ED64] text-[#001E2B] font-bold' : 'hover:bg-white/5 text-gray-400'}`}>
            {item.icon} <span>{item.label}</span>
          </Link>
        ))}

        <NavLink
          to={`/archive-bin`}
          className={({ isActive }) =>
            `flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
              ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-amber-400'
            }`
          }
        >
          <Trash2 size={20} />
          <span>Archive Bin</span>
        </NavLink>

        {workspaceId && (
          <div className="pt-4 border-t border-white/5 mt-4 space-y-2">
            <button onClick={() => setIsMembersOpen(!isMembersOpen)} className="w-full flex items-center justify-between px-4 py-3 text-gray-400 hover:bg-white/5 rounded-xl transition-all">
              <div className="flex items-center gap-4"><Users size={20} /> <span className="font-medium text-sm">Members</span></div>
              {isMembersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isMembersOpen && (
              <div className="ml-8 mt-2 space-y-3 animate-in fade-in slide-in-from-top-1">
                {members.map(member => (
                  <div key={member._id} className="flex items-center gap-3 px-2 py-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${member.role === 'admin' ? 'bg-[#00ED64]' : 'bg-gray-600'}`}></div>
                    <span className="text-xs text-gray-400 truncate max-w-28">{member.user?.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sidebar Notification Item */}
            {isAdmin && (
              <button onClick={openPendingModal} className="w-full flex items-center justify-between px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-[#00ED64] rounded-xl transition-all">
                <div className="flex items-center gap-4">
                  <Users size={20} className="text-orange-400" />
                  <span className="font-medium text-sm">Access Requests</span>
                </div>
                {pendingCount > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingCount}</span>}
              </button>
            )}
          </div>
        )}
      </nav>

      <button onClick={() => { localStorage.clear(); window.location.href = '/' }} className="mt-auto flex items-center gap-4 px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all">
        <LogOut size={20} /> <span className="font-medium">Logout</span>
      </button>
    </div>
  )
}

export default Sidebar