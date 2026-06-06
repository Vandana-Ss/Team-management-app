import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api/axios'
import {  toast } from 'react-toastify'

const JoinPage = () => {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const getDetails = async () => {
      try {
        const { data } = await API.get(`/workspaces/invite-info/${inviteCode}`)
        setWorkspace(data)
      } catch (err) {
        toast.error("Invalid or expired invite link")
        navigate('/home')
      }
    }
    getDetails()
  }, [inviteCode, navigate])

  const handleJoin = async () => {
    setIsSubmitting(true)
    try {
      await API.post(`/workspaces/join/${inviteCode}`)
      toast.success("Join request sent to the Admin!")
      navigate('/home')
    } catch (err) {
      toast.error(err.response?.data?.message || "Join request failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!workspace) return (
    <div className="h-screen flex items-center justify-center bg-[#F9FBFA]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00ED64]"></div>
    </div>
  )

  return (
    <div className="h-screen w-full bg-[#F9FBFA] flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-[#00ED64]/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#00ED64]/10 rounded-full blur-3xl"></div>

      <div className="bg-white/70 backdrop-blur-2xl border border-white/50 max-w-md w-full p-10 rounded-[40px] text-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="mb-6 inline-block rounded-3xl bg-[#F0FDF4] p-6 text-[#00684A] font-black text-3xl shadow-sm">
          {workspace.name.charAt(0)}
        </div>
        
        <h2 className="text-3xl font-bold text-[#001E2B] mb-2">Join {workspace.name}</h2>
        <p className="text-gray-500 mb-10 text-sm leading-relaxed">
          You've been invited to collaborate. Click below to request access from the Admin.
        </p>
        
        <button 
          onClick={handleJoin}
          disabled={isSubmitting}
          className="w-full bg-[#00ED64] text-[#001E2B] font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-[#00ED64]/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending Request...' : 'Request Access'}
        </button>

        <button 
          onClick={() => navigate('/home')}
          className="mt-6 text-gray-400 hover:text-[#001E2B] text-xs font-medium transition-colors"
        >
          Nevermind, take me home
        </button>
      </div>

    </div>
  )
}

export default JoinPage