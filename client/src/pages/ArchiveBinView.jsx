import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, CheckSquare, RotateCcw, ArrowLeft, Trash } from 'lucide-react'
import API from '../api/axios'
import { toast } from 'react-toastify'

const ArchiveBinView = () => {
  const navigate = useNavigate()
  const [archivedItems, setArchivedItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchArchiveBin = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      const response = await API.get('/archives', { 
        headers: { Authorization: `Bearer ${token}` }
      })
      setArchivedItems(response.data)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load archive bin")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArchiveBin()
  }, [fetchArchiveBin])

  const handleRestore = async (archiveId, itemId, itemType, associatedWorkspaceId) => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      if (itemType === 'task') {
        await API.patch(`/tasks/${associatedWorkspaceId}/${itemId}/archive`, 
          { action: 'restore' }, 
          { headers }
        )
        toast.success("Task restored successfully!")
      } else {
        await API.patch(`/workspaces/${itemId}/archive`, 
          { action: 'restore' }, 
          { headers }
        )
        toast.success("Workspace restored successfully!")
      }

      setArchivedItems(prevItems => prevItems.filter(item => item._id !== archiveId))
      fetchArchiveBin()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore item")
    }
  }

  if (loading) return <div className="p-10 animate-pulse text-gray-400 text-center font-bold uppercase tracking-widest">Loading Archive Bin...</div>

  return (
    <div className="space-y-6 p-8 pb-20 max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/home')} 
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#001E2B] flex items-center gap-2">
            <Trash className="text-amber-600" size={24} /> Global Archive Bin
          </h1>
          <p className="text-xs text-gray-400">Review, audit, or restore assets across your whole account space.</p>
        </div>
      </div>

      {/* Unified List View */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {archivedItems.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-amber-50 text-[11px] text-amber-800 uppercase font-black tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-8 py-4">Type</th>
                <th className="px-6 py-4">Item Name / Details</th>
                <th className="px-6 py-4">Archived At</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {archivedItems.map((item) => {
                const isWorkspace = item.itemType === 'workspace'
                const name = isWorkspace ? item.workspace?.name : item.task?.title
                const targetId = isWorkspace ? item.workspace?._id : item.task?._id
                const workspaceContextId = isWorkspace ? item.workspace?._id : item.task?.workspace

                return (
                  <tr key={item._id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="px-8 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        isWorkspace ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {isWorkspace ? <Folder size={12} /> : <CheckSquare size={12} />}
                        {item.itemType}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-[#001E2B]">{name || "Deleted Asset"}</p>
                      {!isWorkspace && item.task?.description && (
                        <p className="text-xs text-gray-400 line-clamp-1">{item.task.description}</p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {new Date(item.archivedAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium'
                      })}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleRestore(item._id, targetId, item.itemType, workspaceContextId)}
                        className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold bg-[#00ED64] text-[#001E2B] rounded-xl hover:shadow-md transition-all active:scale-95"
                        title="Restore Item"
                      >
                        <RotateCcw size={14} />
                        <span>Restore</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 px-4">
            <p className="text-gray-400 font-medium mb-1">Your Archive Bin is clean!</p>
            <p className="text-s text-gray-400">No workspaces or tasks have been archived within this scope view.</p>
          </div>
        )}
      </div>

    </div>
  )
}

export default ArchiveBinView