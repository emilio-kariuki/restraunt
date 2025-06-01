'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Utensils, Eye, Bell, MessageCircle, MapPin, 
  Users, Clock, AlertCircle, ChevronRight,
  Phone, Star, Wifi, Coffee, ShoppingBag,
  Award, Sparkles, Heart, Shield
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
    }, 800);
  };

  const actions = [
    {
      id: 'order',
      title: 'Order Food & Drinks',
      description: 'Browse our menu and place your order instantly',
      icon: Utensils,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      badge: 'Most Popular',
      badgeColor: 'bg-green-100 text-green-700'
    },
    {
      id: 'view',
      title: 'View Menu',
      description: 'Explore our delicious offerings and specialties',
      icon: Eye,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badge: null,
      badgeColor: ''
    },
    {
      id: 'service',
      title: 'Request Service',
      description: 'Call for assistance or special requests',
      icon: Bell,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      badge: 'Quick Response',
      badgeColor: 'bg-orange-100 text-orange-700'
    },
    {
      id: 'talk',
      title: 'Talk to Us',
      description: 'Contact staff or share your feedback',
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      badge: null,
      badgeColor: ''
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Utensils className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading your dining experience</h2>
          <p className="text-gray-500">Please wait while we prepare your table...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl shadow-lg border border-gray-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={loadTableData}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Container */}
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg relative overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full opacity-30 -translate-y-8 translate-x-8"></div>
        <div className="absolute top-20 left-0 w-24 h-24 bg-green-100 rounded-full opacity-30 -translate-x-8"></div>

        {/* Header Section */}
        <div className="relative">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
          
          {/* Content */}
          <div className="relative p-8 pt-16 pb-12 text-white">
            <div className="text-center">
              {/* Restaurant icon */}
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto border border-white/30 shadow-lg">
                  <Utensils className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-700" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-3 text-white">{restaurant?.name}</h1>
              
              {/* Table info */}
              <div className="flex items-center justify-center text-blue-100 text-sm mb-6 space-x-4">
                <div className="flex items-center bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>Table {table?.number}</span>
                </div>
                <div className="flex items-center bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{table?.capacity} seats</span>
                </div>
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <span className="ml-2 text-green-200 font-medium">
                    {restaurant?.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>
                <div className="flex items-center text-blue-200">
                  <Wifi className="w-4 h-4 mr-2" />
                  <span className="font-medium">Free WiFi</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="px-6 -mt-6 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 text-red-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Welcome to Your Table!</h2>
                <Heart className="w-5 h-5 text-red-500 ml-2" />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Choose an option below to get started. Our digital menu system makes dining 
                <span className="font-semibold text-blue-600"> safe, easy, and contactless</span>.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-8">
            {actions.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.id;
              
              return (
                <button
                  key={action.id}
                  onClick={() => handleActionSelect(action.id)}
                  disabled={isSelected}
                  className={`relative w-full p-6 rounded-3xl transition-all duration-300 transform overflow-hidden ${
                    isSelected 
                      ? `bg-gradient-to-r ${action.color} text-white scale-95 shadow-lg` 
                      : `${action.bgColor} border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] active:scale-95`
                  }`}
                >
                  {/* Background decoration for unselected state */}
                  {!isSelected && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/50 rounded-full -translate-y-8 translate-x-8"></div>
                  )}
                  
                  {/* Badge */}
                  {action.badge && !isSelected && (
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold ${action.badgeColor}`}>
                      {action.badge}
                    </div>
                  )}
                  
                  <div className="flex items-center relative z-10">
                    <div className={`p-4 rounded-2xl ${isSelected ? 'bg-white/20 backdrop-blur-sm' : 'bg-white shadow-md'} mr-4 flex-shrink-0`}>
                      <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : action.iconColor}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {action.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                        {action.description}
                      </p>
                    </div>
                    <ChevronRight className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-400'} flex-shrink-0`} />
                  </div>
                  
                  {isSelected && (
                    <div className="mt-4 flex items-center justify-center text-white text-sm">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span className="font-medium">Preparing your experience...</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Restaurant Info Footer */}
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200 shadow-sm">
            <div className="text-center">
              {/* Rating section */}
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center bg-yellow-50 rounded-full px-4 py-2 border border-yellow-200">
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">4.8</span>
                  <span className="text-xs text-gray-500 ml-1">(1,200+ reviews)</span>
                </div>
              </div>
              
              {/* Contact info */}
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center justify-center text-gray-600 bg-white rounded-2xl py-3 px-4 shadow-sm">
                  <Phone className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="font-medium">{restaurant?.phone}</span>
                </div>
                <div className="flex items-center justify-center text-gray-600 bg-white rounded-2xl py-3 px-4 shadow-sm">
                  <Clock className="w-4 h-4 mr-2 text-green-500" />
                  <span className="font-medium">Open until 11:00 PM</span>
                </div>
              </div>

              {/* Additional features */}
              <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-500">
                  <Shield className="w-3 h-3 mr-1 text-green-500" />
                  <span>Contactless</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Award className="w-3 h-3 mr-1 text-blue-500" />
                  <span>Award Winning</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Coffee className="w-3 h-3 mr-1 text-amber-500" />
                  <span>Fresh Daily</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}