import { useState, useEffect, useRef } from 'react';
import { Plus, MoreVertical, LayoutDashboard, CheckCircle2, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'
import API from '../api/axios';

const Home = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const userName = localStorage.getItem('userName') || 'User';
  const menuRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const [totalCollaborators, setTotalCollaborators] = useState(0) 

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await API.get('/workspaces');
        setWorkspaces(response.data.workspaces);
        setTotalCollaborators(response.data.totalUniqueCollaborators)
      } catch (err) {
        console.error("Failed to fetch workspaces:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateWorkspace = async () => {
    try {
      const { data } = await API.post('/workspaces', { name: newWorkspaceName });
      toast.success("Workspace initialized!");
      setIsModalOpen(false);
      setNewWorkspaceName("");
      navigate(`/workspace/${data._id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create workspace";
      toast.error(errorMsg);
    }
  };

  const handleCopyLink = (code) => {
    const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
    const link = `${baseUrl}/join/${code}`
    navigator.clipboard.writeText(link);
    toast.info("Invite URL copied!");
    setActiveMenu(null);
  };

  const totalTasks = workspaces.reduce((sum, ws) => sum + (ws.taskCount || 0), 0);

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-[#001E2B] tracking-widest text-sm uppercase font-bold animate-pulse">Syncing Telemetry...</div>;

  return (
    <div className="space-y-8 pb-20 max-w-[1400px] mx-auto">
      
      <div className='flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4'>
        <div>
          <h1 className="text-3xl font-black text-[#001E2B] tracking-tight">Dashboard.</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Overview for {userName}.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#001E2B] text-[#00ED64] font-bold px-5 py-2 rounded-lg shadow-md hover:bg-black transition-all active:scale-95 whitespace-nowrap text-sm"
        >
          <Plus size={16} strokeWidth={3} />
          <span>New Workspace</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Workspaces', value: workspaces.length, icon: LayoutDashboard },
          { label: 'Total Tasks', value: totalTasks, icon: CheckCircle2 },
          { label: 'Collaborators', value: totalCollaborators, icon: Users }
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#001E2B] p-5 rounded-xl flex items-center justify-between border border-[#001E2B] hover:border-[#00ED64] transition-colors">
            <div>
              <p className="text-[#00ED64] text-[9px] font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
            </div>
            <div className="text-white/20">
              <stat.icon size={32} strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1">Your Workspaces</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.length > 0 ? (
            workspaces.map((ws) => (
              <div
                key={ws._id}
                onClick={() => navigate(`/workspace/${ws._id}`)}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#00ED64]/30 hover:-translate-y-1 transition-all duration-200 group cursor-pointer flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-[#001E2B] font-bold text-lg group-hover:bg-[#001E2B] group-hover:text-[#00ED64] transition-colors">
                    {ws?.name?.charAt(0).toUpperCase() || 'W'}
                  </div>

                  <div className="relative" ref={activeMenu === ws._id ? menuRef : null}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === ws._id ? null : ws._id); }}
                      className="text-gray-400 hover:text-[#001E2B] p-1.5 rounded-lg hover:bg-gray-100"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenu === ws._id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-2xl border border-gray-100 z-20 py-1.5 animate-in fade-in zoom-in-95">
                        <button onClick={(e) => { e.stopPropagation(); toast.info("Coming soon!"); }} className="w-full text-left px-4 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-50">Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); handleCopyLink(ws.inviteCode); }} className="w-full text-left px-4 py-2 text-[11px] font-bold text-[#001E2B] hover:bg-gray-50">Copy Link</button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-md font-bold text-[#001E2B] mb-3 line-clamp-1 group-hover:text-[#00684A] transition-colors">{ws.name}</h3>

                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center text-gray-400">
                  <span className="text-[10px] font-medium">{ws.totalCount} Collaborators</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-[#00ED64]" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">No workspaces initialized yet.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#001E2B]/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white max-w-sm w-full rounded-xl p-6 shadow-2xl border border-gray-100 relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-[#001E2B] mb-4">New Workspace</h2>
            <input
              type="text"
              placeholder="e.g. Core Engineering"
              className="w-full py-2.5 px-3 bg-gray-50 border border-gray-100 rounded-lg text-sm mb-4 outline-none focus:border-[#001E2B]"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreateWorkspace} className="flex-1 py-2 text-xs font-bold bg-[#001E2B] text-[#00ED64] rounded-lg">Initialize</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;