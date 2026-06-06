import React, { useState } from 'react';
import { User, Shield, Bell, Key, Database, ChevronRight } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User, desc: 'Personal info and avatar' },
    { id: 'security', label: 'Security', icon: Shield, desc: 'Passwords and authentication' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email and alert preferences' },
    { id: 'api', label: 'API & Webhooks', icon: Key, desc: 'Developer integrations' },
    { id: 'data', label: 'Data Management', icon: Database, desc: 'Exports and account deletion' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6">
      
      {/* Settings Header */}
      <div className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#001E2B] tracking-tight">Settings & Preferences</h1>
          <p className="text-sm text-gray-400 mt-2 font-medium">Manage your account configurations and workspace integrations.</p>
        </div>
      </div>

      {/* Main Settings Layout (Sidebar + Content) */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-80 shrink-0 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border ${
                  isActive 
                    ? 'bg-[#001E2B] text-white border-transparent shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-white/10 text-[#00ED64]' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-[#001E2B]'}`}>{tab.label}</p>
                    <p className={`text-[10px] uppercase tracking-widest mt-0.5 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{tab.desc}</p>
                  </div>
                </div>
                {isActive && <ChevronRight size={16} className="text-[#00ED64]" />}
              </button>
            )
          })}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-8 min-h-[60vh]">
          
          {/* Dynamic Content Rendering */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-[#001E2B] mb-6 border-b border-gray-100 pb-4">Profile Information</h2>
              {/* TODO: Add simple Profile form here */}
              <p className="text-gray-400 italic">Profile form fields will go here...</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-[#001E2B] mb-6 border-b border-gray-100 pb-4">Security Settings</h2>
              {/* TODO: Add Password update form here */}
              <p className="text-gray-400 italic">Password update fields will go here...</p>
            </div>
          )}

          {/* ... Add other tabs as needed ... */}

        </div>
      </div>
    </div>
  );
};

export default Settings;