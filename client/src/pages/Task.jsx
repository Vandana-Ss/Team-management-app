import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  MessageSquare,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  ChevronDown,
  X,
  Search
} from 'lucide-react';
import API from '../api/axios';
import CommentSection from '../components/CommentSection';
import { toast } from 'react-toastify';

const Task = () => {
  const { workspaceId, taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [primaryQuery, setPrimaryQuery] = useState('');
  const [secondaryQuery, setSecondaryQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [workspaceMembers, setWorkspaceMembers] = useState([]);

  useEffect(() => {
    const fetchTaskAndMembers = async () => {
      try {
        setLoading(true);
        const { data: taskData } = await API.get(`/tasks/${workspaceId}/${taskId}`);
        setTask(taskData);
        localStorage.setItem(`task_${taskId}`, JSON.stringify({ numericId: taskData.numericId, title: taskData.title }))
        setPrimaryQuery(taskData.primaryAssignee?.name || '');
        setSecondaryQuery(taskData.secondaryAssignee?.name || '');

        const { data: membersData } = await API.get(`/workspaces/${workspaceId}/members`);
        setWorkspaceMembers(membersData.filter(member => member.user).map(member => member.user));
      } catch (err) {
        toast.error("Task or Members not found");
        navigate(`/workspace/${workspaceId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchTaskAndMembers();
  }, [taskId, workspaceId, navigate]);

  const updateField = async (fieldName, value) => {
    try {
      const { data } = await API.patch(`/tasks/${workspaceId}/${taskId}`, {
        [fieldName]: value
      });
      setTask(data);
      toast.success(`${fieldName.replace(/([A-Z])/g, ' $1').trim()} updated`);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  useEffect(() => {
    const query = activeDropdown === 'primary' ? primaryQuery : secondaryQuery;
    if (!activeDropdown || query.length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await API.get(`/workspaces/${workspaceId}/search-members?query=${query}`);
        setSuggestions(data);
      } catch (err) {
        console.error("Search failed", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [primaryQuery, secondaryQuery, activeDropdown, workspaceId]);

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Done':
      case 'Pass':
        return 'bg-green-200 text-green-600 border-transparent shadow-md';
      case 'In Progress':
        return 'bg-blue-200 text-blue-600 border-blue-200 shadow-sm';
      case 'Fail':
        return 'bg-white text-red-600 border-red-200 shadow-sm';
      case 'Checked In':
        return 'bg-purple-200 text-purple-600 border-purple-200 shadow-sm';
      default:
        return 'bg-[#F8FAFC] text-gray-500 border-gray-200 shadow-inner hover:bg-white';
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-[#001E2B] tracking-widest text-sm uppercase font-bold animate-pulse">Syncing Telemetry...</div>;
  if (!task) return null;

  return (
    <div className="w-full space-y-4 pb-20 max-w-[1400px] mx-auto">
      
      <button
        onClick={() => navigate(`/workspace/${workspaceId}`)}
        className="flex items-center gap-2 text-gray-400 hover:text-[#001E2B] transition-all mb-2 group font-semibold text-xs tracking-widest uppercase"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1.5 transition-transform" />
        <span>Return</span>
      </button>

      <div className="bg-white rounded-xl shadow-[0_20px_50px_-12px_rgba(0,30,43,0.15)] border border-gray-200/60 overflow-hidden flex flex-col lg:flex-row h-[75vh]">
        
        {/* LEFT COLUMN */}
        <div className="flex-[2.5] border-r border-gray-100 overflow-y-auto custom-scrollbar bg-white">
          
          <div className="p-6 border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#001E2B] rounded text-[#00ED64] text-[10px] font-mono font-bold tracking-[0.2em] uppercase shadow-inner">
                <ClipboardList size={12} className="text-gray-400" />
                <span>ID-{task.numericId}</span>
              </div>

              <div className="relative group">
                <select
                  value={task.priority}
                  onChange={(e) => updateField('priority', e.target.value)}
                  className={`appearance-none text-[11px] font-bold uppercase tracking-wider pl-4 pr-8 py-1.5 rounded border outline-none transition-all cursor-pointer ${
                    task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-orange-600 border-transparent' : 
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <ChevronDown size={12} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${task.priority === 'medium' ? 'text-white' : 'text-gray-400'}`} />
              </div>
            </div>

            <input
              type="text"
              className="text-2xl font-black tracking-tight text-[#001E2B] bg-transparent border-none outline-none focus:ring-0 w-full p-0 placeholder-gray-200 transition-all"
              defaultValue={task.title}
              onBlur={(e) => {
                if (e.target.value !== task.title) updateField('title', e.target.value);
              }}
              placeholder="Task Designation..."
            />
          </div>

          <div className="p-6 space-y-6">
            
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Specifications</h3>
              <textarea
                className="w-full p-4 rounded-lg bg-[#F8FAFC] border border-transparent hover:border-gray-200 focus:bg-white focus:border-[#001E2B] focus:ring-1 focus:ring-[#001E2B] min-h-[100px] outline-none text-[#001E2B] transition-all resize-none text-sm font-medium leading-relaxed"
                defaultValue={task.description}
                onBlur={(e) => {
                  if (e.target.value !== (task.description || '')) {
                    updateField('description', e.target.value);
                  }
                }}
                placeholder="Initialize technical requirements..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Lead Developer', query: primaryQuery, setQuery: setPrimaryQuery, key: 'primaryAssignee', type: 'primary' },
                { label: 'Support Role', query: secondaryQuery, setQuery: setSecondaryQuery, key: 'secondaryAssignee', type: 'secondary' }
              ].map((field) => (
                <div key={field.type} className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{field.label}</label>
                  <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#001E2B] transition-colors" />
                    <input
                      type="text"
                      className="w-full py-2.5 pl-9 pr-9 bg-[#F8FAFC] border border-transparent rounded-lg outline-none focus:bg-white focus:border-[#001E2B] focus:ring-1 focus:ring-[#001E2B] text-[#001E2B] text-sm font-semibold transition-all"
                      value={field.query}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.setQuery(val);
                        if (val.trim() === '') {
                          updateField(field.key, null);
                          setActiveDropdown(null);
                        }
                      }}
                      onFocus={() => setActiveDropdown(field.type)}
                      placeholder="Assign personnel..."
                    />
                    {field.query && (
                      <button 
                        onClick={() => {
                          field.setQuery('');
                          updateField(field.key, null);
                          setActiveDropdown(null);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1 bg-[#F8FAFC] group-focus-within:bg-white"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>

                  {activeDropdown === field.type && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-1">
                      {suggestions.map((user) => (
                        <button
                          key={user._id}
                          className="w-full text-left px-3 py-2.5 hover:bg-[#001E2B] hover:text-white flex flex-col border-b border-gray-100 last:border-0 transition-colors group"
                          onClick={() => {
                            updateField(field.key, user._id);
                            field.setQuery(user.name);
                            setActiveDropdown(null);
                          }}
                        >
                          <span className="font-bold text-sm">{user.name}</span>
                          <span className="text-[10px] text-gray-400 group-hover:text-gray-300 font-mono mt-0.5">{user.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Workflow Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-[10px] font-bold text-[#001E2B] uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-100 pb-2">
                <CheckCircle2 size={14} className="text-[#00ED64]" /> Pipeline Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Development', key: 'devStatus', options: ['Not Started', 'In Progress', 'Checked In', 'Done'] },
                  { label: 'Unit Test', key: 'unitTestStatus', options: ['Not Started', 'In Progress', 'Pass', 'Fail'] },
                  { label: 'System Integration', key: 'sitStatus', options: ['Not Started', 'In Progress', 'Pass', 'Fail'] },
                  { label: 'User Acceptance', key: 'uatStatus', options: ['Not Started', 'In Progress', 'Pass', 'Fail'] }
                ].map((phase) => (
                  <div key={phase.key} className="p-2.5 rounded-lg border border-gray-100 bg-white flex flex-col gap-1.5 hover:border-gray-300 transition-colors shadow-sm">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{phase.label}</span>
                    <div className="relative">
                      <select
                        value={task[phase.key]}
                        onChange={(e) => updateField(phase.key, e.target.value)}
                        className={`w-full appearance-none border rounded text-[11px] font-bold py-1.5 pl-2 pr-6 outline-none transition-all cursor-pointer ${getStatusStyles(task[phase.key])}`}
                      >
                        {phase.options.map(opt => (
                          <option key={opt} value={opt} className="bg-white text-[#001E2B] font-semibold">
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${task[phase.key] === 'Done' || task[phase.key] === 'Pass' ? 'text-[#00ED64]' : 'text-gray-400'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 bg-[#F8FAFC] border-l border-gray-200 flex flex-col overflow-hidden relative">
          
          <div className="flex-1 flex flex-col min-h-0 p-6">
            <h3 className="text-[10px] font-bold text-[#001E2B] uppercase tracking-[0.2em] mb-3 flex items-center gap-2 shrink-0">
              <MessageSquare size={14} className="text-[#00ED64]" /> Communications
            </h3>

            <div className="flex-1 min-h-0 bg-white rounded-lg border border-gray-200 shadow-sm">
              <CommentSection
                taskId={taskId}
                workspaceMembers={workspaceMembers}
              />
            </div>
          </div>

          <div className="p-6 bg-[#001E2B] text-white shrink-0 shadow-[0_-10px_40px_rgba(0,30,43,0.1)]">
            <div className="space-y-2 mb-4">
              <label className="text-[10px] font-bold text-[#00ED64] uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar size={12} /> Target Deployment
              </label>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                onChange={(e) => updateField('dueDate', e.target.value)}
                className="w-full bg-white/10 border border-white/20 p-2.5 rounded text-sm font-semibold text-white focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64] outline-none transition-all cursor-pointer color-scheme-dark"
                style={{ colorScheme: 'dark' }} 
              />
            </div>
            
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono tracking-wide uppercase text-[10px]">Initialization</span>
                <span className="font-bold">{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono tracking-wide uppercase text-[10px]">Authored By</span>
                <span className="font-bold text-[#001E2B] bg-[#00ED64] px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider">{task.createdBy?.name}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Task;