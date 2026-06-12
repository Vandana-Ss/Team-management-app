import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Shield } from 'lucide-react';

const SERVER_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || { name: 'User', email: '', plan: 'Member' }
  );
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Re-read user from localStorage whenever dropdown opens (picks up profile picture updates)
  useEffect(() => {
    if (isOpen) {
      const fresh = JSON.parse(localStorage.getItem('user') || '{}');
      if (fresh?.name) setUser(fresh);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const avatarUrl = user.profilePicture ? `${SERVER_BASE}${user.profilePicture}` : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors cursor-pointer text-left outline-none"
      >
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-[#001E2B]">{user.name}</span>
          <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">{user.plan || 'Member'}</span>
        </div>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white ring-1 ring-gray-100 shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#001E2B] text-[#00ED64] flex items-center justify-center font-bold shadow-sm border-2 border-white ring-1 ring-gray-100">
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,30,43,0.1)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">

          <div className="p-5 bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-50 flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#001E2B] text-[#00ED64] flex items-center justify-center font-bold text-sm shrink-0">
                {user.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-[#001E2B] text-sm truncate">{user.name}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{user.email}</p>
            </div>
          </div>

          <div className="p-2 space-y-1">
            <button
              onClick={() => { setIsOpen(false); navigate('/settings?tab=profile'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#001E2B] hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <User size={16} className="text-gray-400 group-hover:text-[#00ED64] transition-colors" />
              My Profile
            </button>
            <button
              onClick={() => { setIsOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#001E2B] hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <Settings size={16} className="text-gray-400 group-hover:text-[#001E2B] transition-colors" />
              Settings
            </button>
            <button
              onClick={() => { setIsOpen(false); navigate('/settings?tab=security'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#001E2B] hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <Shield size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              Security
            </button>
          </div>

          <div className="p-2 border-t border-gray-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-[#FCE8E6] rounded-xl transition-colors group"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
