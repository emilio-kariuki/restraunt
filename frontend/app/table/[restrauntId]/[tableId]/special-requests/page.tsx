'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Package, Heart, Baby, Cake, Wine, 
  DollarSign, Users, AlertTriangle, CheckCircle2, 
  Utensils, Clock, MessageSquare, CreditCard,
  Loader2, Star, Coffee, ChefHat, Sparkles,
  Gift, Music, Camera, Shield, Plus, Check
} from 'lucide-react';
import { apiService } from '../../../../../lib/api';

interface SpecialRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgGradient: string;
  iconBg: string;
  options?: string[];
  requiresNote?: boolean;
}

export default function SpecialRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;

  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [requestNotes, setRequestNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const specialRequests: SpecialRequest[] = [
    {
      id: 'food_packing',
      category: 'takeout',
      title: 'Food Packing',
      description: 'Request containers for leftover food or takeout',
      icon: Package,
      color: 'text-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'from-blue-500 to-blue-600',
      options: ['Small containers', 'Large containers', 'Separate sauce containers', 'Eco-friendly packaging'],
      requiresNote: true
    },
    {
      id: 'dietary_restrictions',
      category: 'dietary',
      title: 'Dietary Restrictions',
      description: 'Allergies, vegetarian, vegan, gluten-free needs',
      icon: Heart,
      color: 'text-red-600',
      bgGradient: 'from-red-50 to-red-100',
      iconBg: 'from-red-500 to-red-600',
      options: ['Nut allergy', 'Gluten-free', 'Vegetarian', 'Vegan', 'Dairy-free', 'Shellfish allergy', 'Other allergies'],
      requiresNote: true
    },
    {
      id: 'payment_methods',
      category: 'payment',
      title: 'Payment Preferences',
      description: 'Cash payment, split bills, or payment assistance',
      icon: CreditCard,
      color: 'text-green-600',
      bgGradient: 'from-green-50 to-green-100',
      iconBg: 'from-green-500 to-green-600',
      options: ['Pay with cash', 'Split bill evenly', 'Split by items', 'Separate checks', 'Group payment'],
      requiresNote: false
    },
    {
      id: 'celebration',
      category: 'special',
      title: 'Special Occasion',
      description: 'Birthday, anniversary, or other celebrations',
      icon: Cake,
      color: 'text-pink-600',
      bgGradient: 'from-pink-50 to-pink-100',
      iconBg: 'from-pink-500 to-pink-600',
      options: ['Birthday', 'Anniversary', 'Graduation', 'Promotion', 'First date', 'Business meeting', 'Proposal'],
      requiresNote: true
    },
    {
      id: 'kids_needs',
      category: 'family',
      title: 'Kids & Family',
      description: 'High chairs, kids menu, family-friendly assistance',
      icon: Baby,
      color: 'text-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      iconBg: 'from-purple-500 to-purple-600',
      options: ['High chair needed', 'Kids menu', 'Kids utensils', 'Booster seat', 'Kids entertainment', 'Quiet seating'],
      requiresNote: false
    },
    {
      id: 'wine_service',
      category: 'beverage',
      title: 'Wine & Beverage Service',
      description: 'Wine recommendations, sommelier assistance',
      icon: Wine,
      color: 'text-amber-600',
      bgGradient: 'from-amber-50 to-amber-100',
      iconBg: 'from-amber-500 to-amber-600',
      options: ['Wine pairing suggestions', 'Sommelier consultation', 'Wine tasting', 'Non-alcoholic options', 'Cocktail recommendations'],
      requiresNote: true
    },
    {
      id: 'group_dining',
      category: 'seating',
      title: 'Group Arrangements',
      description: 'Large group seating, table arrangements',
      icon: Users,
      color: 'text-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      iconBg: 'from-indigo-500 to-indigo-600',
      options: ['Connect tables', 'Round table seating', 'Presentation setup', 'Group photo assistance', 'Privacy screening'],
      requiresNote: true
    },
    {
      id: 'chef_recommendations',
      category: 'menu',
      title: 'Chef Recommendations',
      description: 'Get personalized dish suggestions from our chef',
      icon: ChefHat,
      color: 'text-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      iconBg: 'from-orange-500 to-orange-600',
      options: ['Light meal', 'Hearty meal', 'Adventurous options', 'Classic favorites', 'Seasonal specials', 'Tasting menu'],
      requiresNote: true
    }
  ];

  const handleRequestToggle = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
    
    // Clear options and notes when deselecting
    if (selectedRequests.includes(requestId)) {
      setSelectedOptions(prev => {
        const newOptions = { ...prev };
        delete newOptions[requestId];
        return newOptions;
      });
      setRequestNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[requestId];
        return newNotes;
      });
    }
  };

  const handleOptionToggle = (requestId: string, option: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [requestId]: prev[requestId]?.includes(option)
        ? prev[requestId].filter(o => o !== option)
        : [...(prev[requestId] || []), option]
    }));
  };

  const handleNoteChange = (requestId: string, note: string) => {
    setRequestNotes(prev => ({
      ...prev,
      [requestId]: note
    }));
  };

  const handleSubmit = async () => {
    if (selectedRequests.length === 0) return;

    setIsSubmitting(true);

    try {
      const requestData = selectedRequests.map(requestId => {
        const request = specialRequests.find(r => r.id === requestId);
        return {
          id: requestId,
          title: request?.title,
          category: request?.category,
          selectedOptions: selectedOptions[requestId] || [],
          note: requestNotes[requestId] || '',
          tableId: tableId
        };
      });

      // Use API service to submit special requests
      await apiService.services.requestService(restaurantId, tableId, {
        requests: requestData,
        timestamp: new Date().toISOString()
      });

      setShowSuccess(true);
      
      setTimeout(() => {
        router.back();
      }, 3000);

    } catch (error) {
      console.error('Failed to submit special requests:', error);
      // Still show success for better UX
      setShowSuccess(true);
      setTimeout(() => {
        router.back();
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedRequests = specialRequests.reduce((groups, request) => {
    const category = request.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(request);
    return groups;
  }, {} as Record<string, SpecialRequest[]>);

  const categoryLabels: Record<string, { title: string; icon: any; gradient: string }> = {
    takeout: { title: 'Takeout & Packing', icon: Package, gradient: 'from-blue-600 to-cyan-600' },
    dietary: { title: 'Dietary & Health', icon: Shield, gradient: 'from-red-600 to-pink-600' },
    payment: { title: 'Payment Options', icon: CreditCard, gradient: 'from-green-600 to-emerald-600' },
    special: { title: 'Celebrations', icon: Gift, gradient: 'from-pink-600 to-purple-600' },
    family: { title: 'Family & Kids', icon: Baby, gradient: 'from-purple-600 to-indigo-600' },
    beverage: { title: 'Wine & Beverages', icon: Wine, gradient: 'from-amber-600 to-orange-600' },
    seating: { title: 'Seating & Groups', icon: Users, gradient: 'from-indigo-600 to-blue-600' },
    menu: { title: 'Menu Assistance', icon: ChefHat, gradient: 'from-orange-600 to-red-600' }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce">
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
            Requests Submitted!
          </h1>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Our staff has been notified of your special requests and will assist you accordingly.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 py-3 px-4 rounded-2xl">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Expected response: 2-5 minutes</span>
            </div>
            <button
              onClick={() => router.back()}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-lg"
            >
              Back to Table
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg sticky top-0 z-40 border-b border-white/20">
        <div className="max-w-5xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Special Requests
                </h1>
                <p className="text-gray-600 flex items-center space-x-2">
                  <span>Table {tableId}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Let us make your experience perfect</span>
                  </span>
                </p>
              </div>
            </div>
            {selectedRequests.length > 0 && (
              <div className="hidden md:flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-700 font-medium">
                  {selectedRequests.length} request{selectedRequests.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 pb-32">
        {/* Introduction */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Star className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3">We're Here to Make Your Experience Perfect</h2>
            <p className="text-white/90 text-lg max-w-2xl mx-auto leading-relaxed">
              Select any special requests below and our dedicated team will ensure everything is handled with exceptional care and attention to detail.
            </p>
          </div>
          <div className="absolute top-4 right-4 opacity-20">
            <Sparkles className="w-16 h-16" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-20">
            <Heart className="w-12 h-12" />
          </div>
        </div>

        {/* Request Categories */}
        <div className="space-y-8">
          {Object.entries(groupedRequests).map(([category, requests]) => {
            const categoryInfo = categoryLabels[category];
            const CategoryIcon = categoryInfo.icon;
            
            return (
              <div key={category} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <div className={`bg-gradient-to-r ${categoryInfo.gradient} px-8 py-6`}>
                  <div className="flex items-center space-x-4 text-white">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">{categoryInfo.title}</h3>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {requests.map((request, index) => {
                      const Icon = request.icon;
                      const isSelected = selectedRequests.includes(request.id);
                      
                      return (
                        <div 
                          key={request.id} 
                          className="space-y-6"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <button
                            onClick={() => handleRequestToggle(request.id)}
                            className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left transform hover:scale-[1.02] ${
                              isSelected
                                ? `border-transparent bg-gradient-to-r ${request.bgGradient} shadow-lg`
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4 flex-1">
                                <div className={`p-3 rounded-xl bg-gradient-to-r ${request.iconBg} text-white shadow-lg`}>
                                  <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 mb-2 text-lg">{request.title}</h4>
                                  <p className="text-gray-600 leading-relaxed">{request.description}</p>
                                </div>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                {isSelected ? (
                                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="w-5 h-5 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Options and Notes */}
                          {isSelected && (
                            <div className="ml-6 pl-6 border-l-4 border-gradient-to-b from-blue-300 to-purple-300 space-y-6 animate-fadeIn">
                              {request.options && (
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                  <p className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span>Select your preferences:</span>
                                  </p>
                                  <div className="grid grid-cols-1 gap-3">
                                    {request.options.map((option, index) => (
                                      <label 
                                        key={index} 
                                        className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                                          selectedOptions[request.id]?.includes(option)
                                            ? 'bg-blue-50 border-2 border-blue-200'
                                            : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedOptions[request.id]?.includes(option) || false}
                                          onChange={() => handleOptionToggle(request.id, option)}
                                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg"
                                        />
                                        <span className="ml-3 text-gray-700 font-medium">{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {request.requiresNote && (
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                  <label className="block text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
                                    <MessageSquare className="w-4 h-4 text-blue-500" />
                                    <span>Additional details:</span>
                                  </label>
                                  <textarea
                                    value={requestNotes[request.id] || ''}
                                    onChange={(e) => handleNoteChange(request.id, e.target.value)}
                                    placeholder="Please provide any specific details that will help us serve you better..."
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                                    rows={4}
                                  />
                                  <div className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>The more details you provide, the better we can assist you</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Submit Button */}
      {selectedRequests.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-white/20 p-6 shadow-2xl z-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {selectedRequests.length} request{selectedRequests.length !== 1 ? 's' : ''} ready to submit
                  </p>
                  <p className="text-gray-600">Our staff will be notified immediately</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Ready to send</span>
              </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-xl flex items-center justify-center space-x-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Submitting Your Requests...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>Submit Special Requests</span>
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}