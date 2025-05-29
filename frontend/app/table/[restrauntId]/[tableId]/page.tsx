'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Utensils, Eye, Bell, MessageCircle, MapPin, 
  Users, Clock, AlertCircle, ChevronRight,
  Phone, Star, Wifi
} from 'lucide-react';
import { apiService } from '../../../../lib/api';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  isOpen: boolean;
  operatingHours: any;
}

interface Table {
  number: string;
  capacity: number;
  status: string;
  available: boolean;
}

export default function TableLandingPage() {
  const params = useParams();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useEffect(() => {
    loadTableData();
  }, [restaurantId, tableId]);

  const loadTableData = async () => {
    try {
      setError(null);
      const tableData = await apiService.tables.getTableInfo(restaurantId, tableId);
      setRestaurant(tableData.restaurant);
      setTable(tableData.table);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    
    // Redirect based on action after a brief delay for visual feedback
    setTimeout(() => {
      const baseUrl = `/table/${restaurantId}/${tableId}`;
      switch (action) {
        case 'order':
          window.location.href = `${baseUrl}/menu`;
          break;
        case 'view':
          window.location.href = `${baseUrl}/view`;
          break;
        case 'service':
          window.location.href = `${baseUrl}/service`;
          break;
        case 'talk':
          window.location.href = `${baseUrl}/contact`;
          break;
      }
    }, 500);
  };

  const actions = [
    {
      id: 'order',
      title: 'Order Food & Drinks',
      description: 'Browse our menu and place your order',
      icon: Utensils,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      id: 'view',
      title: 'View Menu',
      description: 'Browse our delicious offerings',
      icon: Eye,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      id: 'service',
      title: 'Request Service',
      description: 'Call for assistance or special requests',
      icon: Bell,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      id: 'talk',
      title: 'Talk to Us',
      description: 'Contact staff or leave feedback',
      icon: MessageCircle,
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dining experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-red-500 mb-6">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadTableData}
            className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header Section */}
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"></div>
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          
          {/* Content */}
          <div className="relative p-8 pt-12 text-white">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">{restaurant?.name}</h1>
              <div className="flex items-center justify-center text-blue-100 text-sm mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                <span>Table {table?.number}</span>
                <span className="mx-2">•</span>
                <Users className="w-4 h-4 mr-1" />
                <span>{table?.capacity} seats</span>
              </div>
              
              {/* Status Indicators */}
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center text-green-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  {restaurant?.isOpen ? 'Open Now' : 'Closed'}
                </div>
                <div className="flex items-center text-blue-200">
                  <Wifi className="w-4 h-4 mr-2" />
                  Free WiFi
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="p-6 -mt-4 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Your Table!</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Choose an option below to get started. Our digital menu system makes dining easy and contactless.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {actions.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.id;
              
              return (
                <button
                  key={action.id}
                  onClick={() => handleActionSelect(action.id)}
                  disabled={isSelected}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 transform ${
                    isSelected 
                      ? `bg-gradient-to-r ${action.color} text-white scale-95 shadow-xl` 
                      : `${action.bgColor} border-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] active:scale-95`
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl ${isSelected ? 'bg-white bg-opacity-20' : action.bgColor} mr-4`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : action.iconColor}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {action.title}
                      </h3>
                      <p className={`text-sm ${isSelected ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
                        {action.description}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  
                  {isSelected && (
                    <div className="mt-4 flex items-center justify-center text-white text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Loading...
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Restaurant Info Footer */}
          <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">4.8 (1,200+ reviews)</span>
              </div>
              
              <div className="flex items-center justify-center text-gray-600 text-sm space-x-4">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  <span>{restaurant?.phone}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Open until 11:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}