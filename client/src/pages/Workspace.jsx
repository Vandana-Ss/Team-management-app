import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Plus,
  ListTodo,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  X,
  Users as UsersIcon,
  Trash2,
  ChevronDown,
  Link as LinkIcon
} from 'lucide-react'
import API from '../api/axios'
import { toast } from 'react-toastify'
import ArchiveModal from '../components/ArchiveModal'

const Workspace = () => {
  const navigate = useNavigate()
  const { workspaceId } = useParams()

  const [workspaceName, setWorkspaceName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState('list')
  const [activeFilters, setActiveFilters] = useState({})
  const [members, setMembers] = useState([])
  const [pendingMembers, setPendingMembers] = useState([])
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)

  const [taskTitle, setTaskTitle] = useState("")
  const [taskDesc, setTaskDesc] = useState("")
  const [primaryAssigneeId, setPrimaryAssigneeId] = useState("")
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [hoveredUser, setHoveredUser] = useState(null)

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(null)

  const fetchWorkspaceData = useCallback(async (filters = {}) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams(filters).toString()
      const tasksUrl = queryParams ? `/tasks/${workspaceId}?${queryParams}` : `/tasks/${workspaceId}`

      const [wsRes, taskRes, memberRes] = await Promise.all([
        API.get('/workspaces'),
        API.get(tasksUrl),
        API.get(`/workspaces/${workspaceId}/members`)
      ])

      const found = wsRes.data.workspaces?.find(ws => ws._id === workspaceId)
      const name = found ? found.name : "My Workspace"
      setWorkspaceName(name)
      setInviteCode(found?.inviteCode || "")
      localStorage.setItem(`ws_${workspaceId}`, name)
      setTasks(taskRes.data)

      const allMembers = memberRes.data
      const activeMemberList = allMembers.filter(m => m.status === 'active' || !m.status)
      setMembers(activeMemberList)
      setPendingMembers(allMembers.filter(m => m.status === 'pending'))

      const currentUser = JSON.parse(localStorage.getItem('user'))
      const myMembership = activeMemberList.find(m => m.user?._id === currentUser?._id)
      setIsAdminUser(myMembership?.role === 'admin' || myMembership?.role === 'owner')

    } catch (err) {
      toast.error("Error syncing tasks")
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (workspaceId) fetchWorkspaceData()

    const handleOpenPending = () => setIsPendingModalOpen(true)
    window.addEventListener('openPendingRequests', handleOpenPending)
    return () => window.removeEventListener('openPendingRequests', handleOpenPending)
  }, [workspaceId, fetchWorkspaceData])

  const handleArchiveClick = (e, id, name, type) => {
    e.stopPropagation()
    setActiveItem({ id, name, type })
    setIsArchiveModalOpen(true)
  }

  const handleConfirmArchive = async () => {
    try { 
      if (activeItem.type === 'task') {
        await API.patch(`/tasks/${workspaceId}/${activeItem.id}/archive`, { action: 'archive' })
        setTasks(prevTasks => prevTasks.filter(task => task._id !== activeItem.id))
        toast.success("Task moved to archive bin")
        fetchWorkspaceData(activeFilters)
      } else {
        await API.patch(`/workspaces/${activeItem.id}/archive`, { action: 'archive' })
        toast.success("Workspace archived successfully")
        navigate('/workspaces')
      }

      setIsArchiveModalOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || "Archiving operation failed")
    }
  }

  const handleStatusUpdate = async (memberId, action) => {
    try {
      await API.patch(`/workspaces/${workspaceId}/members/${memberId}/status`, { action })
      toast.success(action === 'approve' ? "Member approved!" : "Request rejected")
      fetchWorkspaceData()
    } catch (err) {
      toast.error("Action failed")
    }
  }

  const handleFilterChange = (newFilter) => {
    const updatedFilters = { ...activeFilters, ...newFilter }
    Object.keys(updatedFilters).forEach(key => {
      if (updatedFilters[key] === "") delete updatedFilters[key]
    })
    setActiveFilters(updatedFilters)
    fetchWorkspaceData(updatedFilters)
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) {
      toast.error("Task title is required")
      return
    }
    try {
      const res = await API.post(`/tasks/${workspaceId}`, {
        title: taskTitle,
        description: taskDesc,
        primaryAssignee: primaryAssigneeId || null
      })
      toast.success("Task initialized!")
      setTasks([res.data, ...tasks])
      setIsNewTaskModalOpen(false)
      setTaskTitle("")
      setTaskDesc("")
      setPrimaryAssigneeId("")
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task")
    }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-gray-400 font-medium animate-pulse tracking-wide">Syncing Workspace...</div>

  return (
    <div className="space-y-6 pb-20 max-w-[1400px] mx-auto">
      
      <div className='flex justify-between items-end bg-gradient-to-r from-gray-50/50 to-white p-8 rounded-[1.5rem] shadow-sm border border-gray-100'>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#001E2B] tracking-tight">{workspaceName}</h1>
            {isAdminUser && (
              <button
                onClick={(e) => handleArchiveClick(e, workspaceId, workspaceName, 'workspace')}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                title="Archive Workspace"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          {inviteCode && (
            <p className="text-gray-400 mt-1.5 text-[10px] font-mono tracking-widest uppercase flex items-center gap-1.5">
              <LinkIcon size={10} /> Invite Code: {inviteCode}
            </p>
          )}
        </div>
        
        <button 
          onClick={() => setIsNewTaskModalOpen(true)}
          className="flex items-center gap-2 bg-[#001E2B] text-[#00ED64] font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:bg-black transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          <span className="text-sm tracking-wide">New Task</span>
        </button>
      </div>

      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#001E2B]/20 backdrop-blur-sm" onClick={() => setIsNewTaskModalOpen(false)}></div>
          <div className="bg-white border border-gray-100 max-w-lg w-full rounded-[1.5rem] shadow-2xl relative z-10 p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#001E2B] tracking-tight">Initialize Task</h2>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="p-2 text-gray-400 hover:text-[#001E2B] hover:bg-gray-50 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Task Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g., Fix authentication bug"
                  className="w-full py-3 px-4 bg-gray-50/80 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-[#00ED64] focus:ring-4 focus:ring-[#00ED64]/10 text-[#001E2B] text-sm font-medium transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Optional technical details..."
                  className="w-full py-3 px-4 bg-gray-50/80 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-[#00ED64] focus:ring-4 focus:ring-[#00ED64]/10 text-[#001E2B] text-sm font-medium transition-all min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Primary Assignee</label>
                <div className="relative group">
                  <select
                    value={primaryAssigneeId}
                    onChange={(e) => setPrimaryAssigneeId(e.target.value)}
                    className="w-full appearance-none py-3 pl-4 pr-10 bg-gray-50/80 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-[#00ED64] focus:ring-4 focus:ring-[#00ED64]/10 text-[#001E2B] text-sm font-medium transition-all cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m._id} value={m.user?._id}>{m.user?.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 text-sm font-bold bg-[#001E2B] text-[#00ED64] rounded-xl hover:shadow-lg hover:bg-black transition-all active:scale-95"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Requests Modal */}
      {isPendingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#001E2B]/20 backdrop-blur-sm" onClick={() => setIsPendingModalOpen(false)}></div>
          <div className="bg-white border border-gray-100 max-w-xl w-full rounded-[1.5rem] shadow-2xl relative z-10 p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#001E2B] flex items-center gap-2">
                <UsersIcon size={20} className="text-[#00ED64]" /> Access Requests
              </h2>
              <button onClick={() => setIsPendingModalOpen(false)} className="p-2 text-gray-400 hover:text-[#001E2B] hover:bg-gray-50 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {pendingMembers.length > 0 ? pendingMembers.map(req => (
                <div key={req._id} className="flex items-center justify-between bg-gray-50/80 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div>
                    <p className="font-bold text-[#001E2B] text-sm">{req.user?.name}</p>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">{req.user?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleStatusUpdate(req._id, 'reject')} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">Reject</button>
                    <button onClick={() => handleStatusUpdate(req._id, 'approve')} className="px-4 py-1.5 text-xs font-bold bg-[#001E2B] text-[#00ED64] rounded-lg transition-all active:scale-95 shadow-sm">Approve</button>
                  </div>
                </div>
              )) : <p className="text-center text-gray-400 text-sm py-8 font-medium">All caught up! No pending requests.</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-gray-50/50 p-2.5 pl-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-gray-400 pr-3 border-r border-gray-200">
            <Filter size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Filters</span>
          </div>

          <div className="relative group">
            <select
              value={activeFilters.primaryAssignee || ''}
              onChange={(e) => handleFilterChange({ primaryAssignee: e.target.value })}
              className="appearance-none text-[10px] font-bold uppercase tracking-wider text-[#001E2B] outline-none bg-white shadow-sm pl-3 pr-7 py-2 rounded-lg cursor-pointer transition-colors border border-gray-100 focus:border-gray-300"
            >
              <option value="">Assignee: All</option>
              {members.map(m => <option key={m._id} value={m.user?._id}>{m.user?.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          {[
            { label: 'Dev', key: 'devStatus' },
            { label: 'Unit Test', key: 'unitTestStatus' },
            { label: 'SIT', key: 'sitStatus' },
            { label: 'UAT', key: 'uatStatus' }
          ].map((phase) => (
            <div key={phase.key} className="relative group">
              <select
                value={activeFilters[phase.key] || ''}
                onChange={(e) => handleFilterChange({ [phase.key]: e.target.value })}
                className="appearance-none text-[10px] font-bold uppercase tracking-wider text-[#001E2B] outline-none bg-white shadow-sm pl-3 pr-7 py-2 rounded-lg cursor-pointer transition-colors border border-gray-100 focus:border-gray-300"
              >
                <option value="">{phase.label}: All</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                {phase.key === 'devStatus' ? (
                  <>
                    <option value="Checked In">Checked In</option>
                    <option value="Done">Done</option>
                  </>
                ) : (
                  <>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </>
                )}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          ))}
        </div>

        <div className="bg-white p-1 rounded-xl flex gap-1 border border-gray-100 shadow-sm">
          <button onClick={() => setViewType('grid')} className={`p-1.5 rounded-lg transition-all ${viewType === 'grid' ? 'bg-[#001E2B] text-[#00ED64] shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setViewType('list')} className={`p-1.5 rounded-lg transition-all ${viewType === 'list' ? 'bg-[#001E2B] text-[#00ED64] shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
            <TableIcon size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewType === 'list' ? (
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          {tasks.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-olive-300 text-[10px] text-gray-700 uppercase font-bold tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4">ID</th>
                    <th className="px-6 py-4">Task Title</th>
                    <th className="px-6 py-4">Assignee</th>
                    <th className="px-6 py-4">Development</th>
                    <th className="px-6 py-4">Unit Test</th>
                    <th className="px-6 py-4">SIT</th>
                    <th className="px-6 py-4">UAT</th>
                    {isAdminUser && <th className="px-8 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map(task => (
                    <tr key={task._id} onClick={() => navigate(`/workspace/${workspaceId}/task/${task._id}`)} className="hover:bg-[#F0FDF6] cursor-pointer transition-all group border-l-4 border-l-transparent hover:border-l-[#00ED64]">
                      <td className="px-8 py-2 text-xs font-mono font-medium text-green-700">#{task.numericId || 'N/A'}</td>
                      <td className="px-6 py-2 text-sm font-medium text-gray-700 group-hover:text-[#001E2B] group-hover:font-bold transition-all">{task.title}</td>
                      <td className="px-6 py-2 text-sm text-gray-600 font-medium">{task.primaryAssignee?.name || <span className="text-gray-300 italic">Unassigned</span>}</td>
                      <td className="px-6 py-2"><StatusBadge status={task.devStatus} /></td>
                      <td className="px-6 py-2"><StatusBadge status={task.unitTestStatus} /></td>
                      <td className="px-6 py-2"><StatusBadge status={task.sitStatus} /></td>
                      <td className="px-6 py-2"><StatusBadge status={task.uatStatus} /></td>
                      {isAdminUser && (
                        <td className="px-8 py-4 text-right">
                          <button
                            onClick={(e) => handleArchiveClick(e, task._id, task.title, 'task')}
                            className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <ListTodo size={24} className="text-gray-300" />
              </div>
              <p className="text-[#001E2B] font-bold text-lg mb-1">Your workspace is empty</p>
              <p className="text-sm text-gray-400">Create your first task to initialize the pipeline.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <div 
              key={task._id} 
              onClick={() => navigate(`/workspace/${workspaceId}/task/${task._id}`)} 
              className={`bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col border-t-4 ${
                task.priority === 'high' ? 'border-t-[#C5221F]' : 
                task.priority === 'medium' ? 'border-t-[#1E4E38]' : 
                'border-t-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-5">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-gray-400 group-hover:bg-[#001E2B] group-hover:text-[#00ED64] group-hover:border-[#001E2B] transition-colors">
                  <ListTodo size={18} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                    task.priority === 'high' ? 'bg-[#FCE8E6] text-[#C5221F]' : 
                    task.priority === 'medium' ? 'bg-[#E6F4EA] text-[#1E4E38]' : 
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {task.priority || 'Low'}
                  </span>
                  {isAdminUser && (
                    <button
                      onClick={(e) => handleArchiveClick(e, task._id, task.title, 'task')}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-[#001E2B] text-lg mb-2 group-hover:text-[#00ED64] transition-colors line-clamp-1">{task.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">{task.description || <span className="italic text-gray-300">No description provided...</span>}</p>
              
              <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                 <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">ID: #{task.numericId || 'N/A'}</span>
                 {task.primaryAssignee && (
                    <div className="flex items-center gap-1.5">
                       <div className="w-5 h-5 rounded-full bg-[#001E2B] text-[#00ED64] flex items-center justify-center text-[9px] font-bold">
                          {task.primaryAssignee.name.charAt(0)}
                       </div>
                       <span className="text-[11px] font-bold text-gray-600">{task.primaryAssignee.name.split(' ')[0]}</span>
                    </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleConfirmArchive}
        itemName={activeItem?.name || ""}
        itemType={activeItem?.type || "task"}
      />

    </div>
  )
}

const StatusBadge = ({ status }) => {
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Done':
      case 'Pass':
        return 'bg-green-200 text-[#1E4E38]'
      case 'In Progress':
        return 'bg-[#E8F0FE] text-[#1967D2]'
      case 'Fail':
        return 'bg-[#FCE8E6] text-[#C5221F]'
      case 'Checked In':
        return 'bg-[#F3E8FD] text-[#681DA8]'
      case 'Not Started':
        return 'bg-gray-50 text-gray-400 border border-gray-100'
      default:
        return 'bg-gray-50 text-gray-400 border border-gray-100'
    }
  }
  return <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase ${getStatusStyles(status)}`}>{status || 'Not Started'}</span>
}

export default Workspace