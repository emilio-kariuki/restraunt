'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Utensils, Eye, Bell, MessageCircle, MapPin, 
  Users, AlertCircle, ArrowRight,
  Phone, Star, Wifi, 
  Shield, 
  CreditCard, 
  CheckCircle, Gift,
  QrCode, Share2,
  Info, Headphones
} from 'lucide-react';
import { apiService } from '../../../../lib/api';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  isOpen: boolean;
  operatingHours: any;
  acceptsCash?: boolean;
  allowsSplitPayment?: boolean;
  hasWaitingSystem?: boolean;
  averageRating?: number;
  totalReviews?: number;
}

interface Table {
  number: string;
  capacity: number;
  status: string;
  available: boolean;
  currentPhase?: string;
}

interface WaitingInfo {
  isWaiting: boolean;
  position: number;
  estimatedWaitTime: number;
}

export default function TableLandingPage() {
  const params = useParams();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [waitingInfo, setWaitingInfo] = useState<WaitingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadTableData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [restaurantId, tableId]);

  const loadTableData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Validate parameters first
      if (!restaurantId || !tableId) {
        throw new Error('Restaurant ID and Table ID are required');
      }
      
      // Fetch actual table and restaurant data from API
      const tableData = await apiService.tables.getTableInfo(restaurantId, tableId);
      
      if (tableData.restaurant && tableData.table) {
        // Set restaurant data using actual API response
        setRestaurant({
          id: tableData.restaurant._id || tableData.restaurant.id,
          name: tableData.restaurant.name,
          address: tableData.restaurant.address,
          phone: tableData.restaurant.phone,
          isOpen: tableData.restaurant.isOpen,
          operatingHours: tableData.restaurant.operatingHours,
          acceptsCash: tableData.restaurant.settings?.allowCashPayment ?? true,
          allowsSplitPayment: tableData.restaurant.settings?.allowSplitPayment ?? true,
          averageRating: 4.6, // This should come from reviews API
          totalReviews: 284
        });
        
        // Set table data using actual API response
        setTable({
          number: tableData.table.tableNumber || tableData.table.number,
          capacity: tableData.table.capacity,
          status: tableData.table.status,
          available: tableData.table.status === 'available',
          currentPhase: tableData.table.currentPhase || "seated"
        });
      } else {
        throw new Error('Table or restaurant not found');
      }
    } catch (err: any) {
      console.error('Error loading table data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load table data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    
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
        case 'reviews':
          window.location.href = `${baseUrl}/reviews`;
          break;
        case 'special':
          window.location.href = `${baseUrl}/special-requests`;
          break;
        case 'talk':
          window.location.href = `${baseUrl}/contact`;
          break;
      }
    }, 300);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < rating ? 'text-amber-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getTableStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'occupied':
        return 'bg-blue-100 text-blue-700';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-700';
      case 'cleaning':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTableStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'In Use';
      case 'reserved':
        return 'Reserved';
      case 'cleaning':
        return 'Being Cleaned';
      default:
        return 'Unknown';
    }
  };

  const getWelcomeMessage = () => {
    if (!table) return "Welcome to your table!";
    
    switch (table.status?.toLowerCase()) {
      case 'occupied':
        return "Welcome to your table!";
      case 'available':
        return "This table is ready for you!";
      case 'reserved':
        return "Your reservation is confirmed!";
      default:
        return "Welcome to your table!";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-lg text-center max-w-sm w-full mx-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Utensils className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Getting your table ready</h2>
          <p className="text-gray-500 text-sm">Loading table information...</p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Table Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadTableData}
            className="bg-blue-500 text-white px-6 py-3 rounded-2xl hover:bg-blue-600 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!restaurant || !table) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg text-center max-w-md w-full">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Table Information Unavailable</h1>
          <p className="text-gray-600 mb-6">We couldn't load the table information. Please try again.</p>
          <button 
            onClick={loadTableData}
            className="bg-blue-500 text-white px-6 py-3 rounded-2xl hover:bg-blue-600 transition-colors font-medium"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Status Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Table {table.number} Active</span>
            </div>
            <div className="text-sm text-gray-500">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Restaurant Header Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-1">{restaurant.name}</h1>
                <div className="flex items-center space-x-1 mb-2">
                  {renderStars(Math.round(restaurant.averageRating || 0))}
                  <span className="text-xs text-gray-500 ml-1">
                    {restaurant.averageRating?.toFixed(1)} ({restaurant.totalReviews})
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{restaurant.address}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                  restaurant.isOpen 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {restaurant.isOpen ? 'Open' : 'Closed'}
                </div>
                <QrCode className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">#{table.number}</div>
                <div className="text-xs text-gray-500">Table</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{table.capacity}</div>
                <div className="text-xs text-gray-500">Seats</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-bold px-2 py-1 rounded-full ${getTableStatusColor(table.status)}`}>
                  {getTableStatusText(table.status)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{getWelcomeMessage()}</h3>
              <p className="text-sm text-gray-600">Ready to start your dining experience?</p>
            </div>
            <div className="text-2xl">🍽️</div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleActionSelect('order')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-4 transition-all duration-200 transform hover:scale-[0.98] active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Utensils className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Order Food & Drinks</h3>
                  <p className="text-blue-100 text-sm">Browse our full menu</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => handleActionSelect('view')}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 rounded-2xl p-4 transition-all duration-200 transform hover:scale-[0.98] active:scale-95 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">View My Orders</h3>
                  <p className="text-gray-600 text-sm">Track your order status</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Quick Services Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleActionSelect('service')}
            className="bg-white rounded-2xl p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">Call Service</h3>
              <p className="text-xs text-gray-600">Get assistance</p>
            </div>
          </button>

          <button
            onClick={() => handleActionSelect('reviews')}
            className="bg-white rounded-2xl p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">Reviews</h3>
              <p className="text-xs text-gray-600">Share feedback</p>
            </div>
          </button>

          <button
            onClick={() => handleActionSelect('special')}
            className="bg-white rounded-2xl p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Gift className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">Special Requests</h3>
              <p className="text-xs text-gray-600">Allergies & more</p>
            </div>
          </button>

          <button
            onClick={() => handleActionSelect('talk')}
            className="bg-white rounded-2xl p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Headphones className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">Chat</h3>
              <p className="text-xs text-gray-600">Talk to staff</p>
            </div>
          </button>
        </div>

        {/* Restaurant Features */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Info className="w-4 h-4 mr-2 text-blue-500" />
            What's Available
          </h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Free WiFi</span>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Cards Accepted</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Group Friendly</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Safe Dining</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Need Help?</h3>
            <Phone className="w-5 h-5 text-gray-300" />
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Call Restaurant</span>
              <span className="font-medium">{restaurant.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Hours</span>
              <span className="font-medium">
                {restaurant.isOpen ? 'Currently Open' : 'Currently Closed'}
              </span>
            </div>
          </div>
          
          <button className="w-full mt-3 bg-white/10 hover:bg-white/20 rounded-xl py-2 text-center transition-colors">
            <Share2 className="w-4 h-4 inline mr-2" />
            Share Table Link
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 mb-8">
          <p className="text-xs text-gray-500 mb-2">
            Scan the QR code to return to this page
          </p>
          <div className="flex items-center justify-center space-x-3">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-xs text-gray-600">Verified Table</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-gray-600">Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 m-4 text-center shadow-2xl">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-700 font-medium">Opening...</p>
          </div>
        </div>
      )}
    </div>
  );
}
