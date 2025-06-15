'use client';

import { TrendingUp, Package, QrCode, Download, Settings, MenuIcon, Table } from 'lucide-react';

interface AdminHeaderProps {
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'orders' | 'menu' | 'tables' | 'reports' | 'settings') => void;
  onLogout: () => void;
}

export default function AdminHeader({ activeTab, setActiveTab, onLogout }: AdminHeaderProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'menu', label: 'Menu', icon: MenuIcon },
    { id: 'tables', label: 'Tables', icon: QrCode },
    { id: 'reports', label: 'Reports', icon: Download },
    { id: 'services', label: 'Services', icon: Table },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 shadow-xl border-b border-white/20 backdrop-blur-md">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Restaurant Admin</h1>
            <p className="text-gray-600 mt-2 text-lg font-medium">Manage your restaurant operations with ease</p>
          </div>
          <div className="flex items-center space-x-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105' 
                      : 'bg-white/80 backdrop-blur-md text-gray-700 hover:bg-white border border-white/30'
                  }`}
                >
                  {IconComponent && <IconComponent className="w-5 h-5 inline mr-2" />}
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={onLogout}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}