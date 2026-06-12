import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User, Shield, Bell, Building2, AlertTriangle,
  ChevronRight, Eye, EyeOff, Lock, Loader2,
  LogOut, CheckCircle2, Camera, Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../api/axios';

const SERVER_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

const getPasswordStrength = (pwd) => {
  if (!pwd) return null;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [pwd.length >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500', width: 'w-1/4' };
  if (score === 2) return { label: 'Fair', color: 'bg-yellow-400', textColor: 'text-yellow-500', width: 'w-2/4' };
  if (score === 3) return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500', width: 'w-3/4' };
  return { label: 'Strong', color: 'bg-[#00ED64]', textColor: 'text-green-600', width: 'w-full' };
};

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

const RoleBadge = ({ role }) => {
  const styles = {
    owner: 'bg-[#001E2B] text-[#00ED64]',
    admin: 'bg-blue-100 text-blue-700',
    member: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${styles[role] || styles.member}`}>
      {role}
    </span>
  );
};

const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-[#00ED64]' : 'bg-gray-200'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

  const tabs = [
    { id: 'profile',       label: 'My Profile',    icon: User,          desc: 'Personal info and avatar' },
    { id: 'security',      label: 'Security',       icon: Shield,        desc: 'Passwords and authentication' },
    { id: 'notifications', label: 'Notifications',  icon: Bell,          desc: 'Email and alert preferences' },
    { id: 'workspaces',    label: 'My Workspaces',  icon: Building2,     desc: 'Workspace memberships' },
    { id: 'danger',        label: 'Danger Zone',    icon: AlertTriangle, desc: 'Irreversible account actions' },
  ];

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
  };

  // Profile
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Security
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, newPass: false, confirm: false });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);

  // Workspaces
  const [workspaces, setWorkspaces] = useState([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const [leavingId, setLeavingId] = useState(null);

  // Danger Zone
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    API.get('/auth/me')
      .then(res => {
        setProfile({ name: res.data.name, email: res.data.email });
        setEmailNotifications(res.data.emailNotifications ?? true);
        setProfilePicture(res.data.profilePicture || null);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => {
        setProfileLoading(false);
        setNotifLoading(false);
      });

    API.get('/workspaces')
      .then(res => setWorkspaces(res.data.workspaces || []))
      .catch(() => toast.error('Failed to load workspaces'))
      .finally(() => setWorkspacesLoading(false));
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);
    try {
      const { data } = await API.patch('/auth/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfilePicture(data.profilePicture);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, profilePicture: data.profilePicture }));
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePicture = async () => {
    try {
      await API.delete('/auth/profile-picture');
      setProfilePicture(null);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, profilePicture: null }));
      toast.success('Profile picture removed');
    } catch {
      toast.error('Failed to remove picture');
    }
  };

  const handleProfileSave = async () => {
    if (!profile.name.trim()) return toast.error('Name cannot be empty');
    setProfileSaving(true);
    try {
      const { data } = await API.patch('/auth/profile', { name: profile.name.trim() });
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: data.name }));
      setProfile(p => ({ ...p, name: data.name }));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!passwords.current) return toast.error('Enter your current password');
    if (passwords.newPass.length < 6) return toast.error('New password must be at least 6 characters');
    if (passwords.newPass !== passwords.confirm) return toast.error('Passwords do not match');
    setPasswordSaving(true);
    try {
      await API.patch('/auth/password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPass
      });
      setPasswords({ current: '', newPass: '', confirm: '' });
      toast.success('Password updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleNotifToggle = async (val) => {
    setEmailNotifications(val);
    try {
      await API.patch('/auth/notifications', { emailNotifications: val });
      toast.success(val ? 'Email notifications enabled' : 'Email notifications disabled');
    } catch {
      setEmailNotifications(!val);
      toast.error('Failed to save preference');
    }
  };

  const handleLeave = async (workspaceId) => {
    setLeavingId(workspaceId);
    try {
      await API.delete(`/workspaces/${workspaceId}/leave`);
      setWorkspaces(ws => ws.filter(w => w._id !== workspaceId));
      toast.success('Left workspace successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave workspace');
    } finally {
      setLeavingId(null);
    }
  };

  const handleDeleteAccount = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (confirmEmail !== storedUser.email) return toast.error('Email does not match your account');
    setDeleting(true);
    try {
      await API.delete('/auth/account', { data: { email: confirmEmail } });
      localStorage.clear();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Account deletion failed');
      setDeleting(false);
    }
  };

  const strength = getPasswordStrength(passwords.newPass);
  const pwdFields = [
    { key: 'current', label: 'Current Password' },
    { key: 'newPass', label: 'New Password' },
    { key: 'confirm', label: 'Confirm New Password' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6">

      {/* Header */}
      <div className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-[#001E2B] tracking-tight">Settings & Preferences</h1>
        <p className="text-sm text-gray-400 mt-2 font-medium">Manage your account configurations and workspace memberships.</p>
      </div>

      {/* Layout */}
      <div className="flex flex-col md:flex-row gap-6">

        {/* Sidebar */}
        <div className="w-full md:w-80 shrink-0 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDanger = tab.id === 'danger';
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#001E2B] text-white border-transparent shadow-md'
                    : isDanger
                      ? 'bg-white text-gray-600 hover:bg-red-50 border-gray-100 hover:border-red-200'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${
                    isActive ? 'bg-white/10 text-[#00ED64]' : isDanger ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${isActive ? 'text-white' : isDanger ? 'text-red-600' : 'text-[#001E2B]'}`}>{tab.label}</p>
                    <p className={`text-[10px] uppercase tracking-widest mt-0.5 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{tab.desc}</p>
                  </div>
                </div>
                {isActive && <ChevronRight size={16} className="text-[#00ED64]" />}
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="flex-1 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-8 min-h-[60vh]">

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-300 max-w-xl">
              <h2 className="text-xl font-bold text-[#001E2B] mb-6 border-b border-gray-100 pb-4">Profile Information</h2>
              {profileLoading ? (
                <div className="flex items-center gap-3 text-gray-400 py-8">
                  <Loader2 size={18} className="animate-spin" /> Loading profile…
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className="relative w-20 h-20 rounded-full cursor-pointer group shrink-0"
                        title="Click to change photo"
                      >
                        {profilePicture ? (
                          <img
                            src={`${SERVER_BASE}${profilePicture}`}
                            alt="avatar"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow-md"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-[#001E2B] text-[#00ED64] flex items-center justify-center text-2xl font-bold shadow-md select-none">
                            {getInitials(profile.name)}
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {uploading
                            ? <Loader2 size={20} className="text-white animate-spin" />
                            : <Camera size={18} className="text-white" />
                          }
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                      {profilePicture && (
                        <button
                          onClick={handleRemovePicture}
                          className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-600 transition-colors font-semibold"
                        >
                          <Trash2 size={10} /> Remove
                        </button>
                      )}
                      {!profilePicture && (
                        <p className="text-[10px] text-gray-400">Click to upload</p>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[#001E2B] text-lg leading-tight">{profile.name}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{profile.email}</p>
                      <p className="text-[10px] text-gray-300 mt-2">JPEG, PNG, WebP or GIF · Max 2MB</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#001E2B]">Display Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      maxLength={50}
                      className="rounded-xl border border-gray-200 p-3 outline-none transition focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64] text-sm"
                      placeholder="Your name"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#001E2B]">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className="w-full rounded-xl border border-gray-200 p-3 pr-10 outline-none bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                      <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <p className="text-[11px] text-gray-400">Email address cannot be changed</p>
                  </div>

                  <button
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="flex items-center gap-2 bg-[#001E2B] text-[#00ED64] font-bold px-6 py-3 rounded-xl hover:bg-[#002d3f] transition disabled:opacity-60"
                  >
                    {profileSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {profileSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in duration-300 max-w-xl">
              <h2 className="text-xl font-bold text-[#001E2B] mb-6 border-b border-gray-100 pb-4">Change Password</h2>
              <div className="space-y-5">
                {pwdFields.map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#001E2B]">{label}</label>
                    <div className="relative">
                      <input
                        type={showPwd[key] ? 'text' : 'password'}
                        value={passwords[key]}
                        onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-gray-200 p-3 pr-10 outline-none transition focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPwd[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {key === 'newPass' && passwords.newPass && strength && (
                      <div className="mt-1 space-y-1">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                        </div>
                        <p className={`text-[11px] font-semibold ${strength.textColor}`}>{strength.label}</p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-1">
                  <p className="text-[11px] text-gray-400 mb-4">Use at least 6 characters with a mix of uppercase, numbers, and symbols for a strong password.</p>
                  <button
                    onClick={handlePasswordSave}
                    disabled={passwordSaving}
                    className="flex items-center gap-2 bg-[#001E2B] text-[#00ED64] font-bold px-6 py-3 rounded-xl hover:bg-[#002d3f] transition disabled:opacity-60"
                  >
                    {passwordSaving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                    {passwordSaving ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="animate-in fade-in duration-300 max-w-xl">
              <h2 className="text-xl font-bold text-[#001E2B] mb-6 border-b border-gray-100 pb-4">Notification Preferences</h2>
              {notifLoading ? (
                <div className="flex items-center gap-3 text-gray-400 py-8">
                  <Loader2 size={18} className="animate-spin" /> Loading…
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:border-gray-200 transition">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <Bell size={18} className="text-[#001E2B]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#001E2B]">Mention Notifications</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Email me when I'm @mentioned in task comments</p>
                      </div>
                    </div>
                    <Toggle value={emailNotifications} onChange={handleNotifToggle} />
                  </div>
                  <p className="text-[11px] text-gray-400 px-1">
                    When disabled, you won't receive email alerts for @mentions. Activity is still visible inside the app.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MY WORKSPACES */}
          {activeTab === 'workspaces' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-[#001E2B] mb-6 border-b border-gray-100 pb-4">My Workspaces</h2>
              {workspacesLoading ? (
                <div className="flex items-center gap-3 text-gray-400 py-8">
                  <Loader2 size={18} className="animate-spin" /> Loading workspaces…
                </div>
              ) : workspaces.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Building2 size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">No workspaces yet</p>
                  <p className="text-sm mt-1">Create or join a workspace to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workspaces.map(ws => (
                    <div key={ws._id} className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-gray-200 bg-gray-50 transition">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#001E2B] text-[#00ED64] flex items-center justify-center font-bold text-sm select-none shrink-0">
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-[#001E2B] truncate">{ws.name}</p>
                            <RoleBadge role={ws.role} />
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {ws.totalCount} member{ws.totalCount !== 1 ? 's' : ''} · {ws.taskCount} task{ws.taskCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button
                          onClick={() => navigate(`/workspace/${ws._id}`)}
                          className="text-xs font-semibold text-[#001E2B] bg-white border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition"
                        >
                          Open
                        </button>
                        {ws.role !== 'owner' && (
                          <button
                            onClick={() => handleLeave(ws._id)}
                            disabled={leavingId === ws._id}
                            className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {leavingId === ws._id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                            Leave
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="animate-in fade-in duration-300 max-w-xl">
              <h2 className="text-xl font-bold text-red-600 mb-6 border-b border-red-100 pb-4">Danger Zone</h2>
              <div className="border border-red-200 rounded-2xl p-6 bg-red-50 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-xl shrink-0 mt-0.5">
                    <AlertTriangle size={18} className="text-red-500" />
                  </div>
                  <div>
                    <p className="font-bold text-red-700 text-sm">Delete Account Permanently</p>
                    <p className="text-[12px] text-red-500 mt-1 leading-relaxed">
                      This action is <strong>irreversible</strong>. The following will be permanently deleted:
                    </p>
                    <ul className="mt-2 space-y-1 text-[12px] text-red-500 list-disc list-inside">
                      <li>Your profile and login credentials</li>
                      <li>All workspaces you own and their tasks</li>
                      <li>Your membership in all other workspaces</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-red-700">
                    Type your email address to confirm
                  </label>
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={e => setConfirmEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="rounded-xl border border-red-200 bg-white p-3 outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-300 text-sm"
                  />
                </div>

                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || !confirmEmail.trim()}
                  className="flex items-center gap-2 bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                  {deleting ? 'Deleting account…' : 'Delete My Account'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
