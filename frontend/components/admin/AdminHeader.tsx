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
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Admin</h1>
            <p className="text-gray-600 mt-1">Manage your restaurant operations</p>
          </div>
          <div className="flex items-center space-x-3">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {IconComponent && <IconComponent className="w-5 h-5 inline mr-2" />}
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={onLogout}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}