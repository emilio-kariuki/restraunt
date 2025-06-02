'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Bell, Coffee, Utensils, HelpCircle, CreditCard,
  Wine, Baby, Heart, AlertTriangle, CheckCircle2, Loader2,
  Clock, User, MessageSquare, Sparkles, Users, Cake
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  urgency: 'low' | 'medium' | 'high';
}

export default function ServicePage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  const serviceRequests: ServiceRequest[] = [
    {
      id: 'water',
      type: 'beverage',
      title: 'Water Refill',
      description: 'Request water or beverage refills for your table',
      icon: Coffee,
      color: 'bg-blue-500',
      urgency: 'low'
    },
    {
      id: 'order',
      type: 'order',
      title: 'Ready to Order',
      description: 'Let staff know you\'re ready to place an order',
      icon: Utensils,
      color: 'bg-green-500',
      urgency: 'medium'
    },
    {
      id: 'bill',
      type: 'payment',
      title: 'Request Bill',
      description: 'Ask for your check when you\'re ready to pay',
      icon: CreditCard,
      color: 'bg-purple-500',
      urgency: 'medium'
    },
    {
      id: 'assistance',
      type: 'help',
      title: 'General Assistance',
      description: 'Need help with something? We\'re here to assist',
      icon: HelpCircle,
      color: 'bg-orange-500',
      urgency: 'medium'
    },
    {
      id: 'recommendations',
      type: 'info',
      title: 'Menu Recommendations',
      description: 'Get personalized recommendations from our staff',
      icon: Sparkles,
      color: 'bg-pink-500',
      urgency: 'low'
    },
    {
      id: 'dietary',
      type: 'dietary',
      title: 'Dietary Assistance',
      description: 'Questions about allergens or dietary restrictions',
      icon: Heart,
      color: 'bg-red-500',
      urgency: 'high'
    },
    {
      id: 'kids',
      type: 'family',
      title: 'Kids Menu/High Chair',
      description: 'Request kids menu, high chair, or family amenities',
      icon: Baby,
      color: 'bg-indigo-500',
      urgency: 'low'
    },
    {
      id: 'celebration',
      type: 'special',
      title: 'Special Occasion',
      description: 'Celebrating? Let us know how we can make it special',
      icon: Cake,
      color: 'bg-yellow-500',
      urgency: 'low'
    },
    {
      id: 'wine',
      type: 'beverage',
      title: 'Wine Service',
      description: 'Request wine list or sommelier assistance',
      icon: Wine,
      color: 'bg-red-600',
      urgency: 'low'
    },
    {
      id: 'group',
      type: 'seating',
      title: 'Group Assistance',
      description: 'Help with large group seating or arrangements',
      icon: Users,
      color: 'bg-teal-500',
      urgency: 'medium'
    },
    {
      id: 'issue',
      type: 'problem',
      title: 'Report an Issue',
      description: 'Let us know if something isn\'t right',
      icon: AlertTriangle,
      color: 'bg-red-600',
      urgency: 'high'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Set estimated time based on urgency
      const times = {
        low: 5,
        medium: 3,
        high: 1
      };
      setEstimatedTime(times[selectedRequest.urgency]);

      // Reset after showing success
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedRequest(null);
        setAdditionalNotes('');
        setEstimatedTime(null);
      }, 5000);
    }, 1500);
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700'
    };
    const labels = {
      low: 'Low Priority',
      medium: 'Medium Priority',
      high: 'High Priority'
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${styles[urgency as keyof typeof styles]}`}>
        {labels[urgency as keyof typeof labels]}
      </span>
    );
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 text-black">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h1>
          <p className="text-gray-600 mb-6">
            Our staff has been notified and will assist you shortly.
          </p>
          
          {estimatedTime && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Estimated wait: {estimatedTime} minutes</span>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 transition-colors"
            >
              Back to Table
            </button>
            <button
              onClick={() => {
                setShowSuccess(false);
                setSelectedRequest(null);
                setAdditionalNotes('');
              }}
              className="w-full bg-blue-50 text-blue-700 py-3 rounded-xl hover:bg-blue-100 transition-colors"
            >
              Make Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Request Service</h1>
              <p className="text-sm text-gray-600">Table {tableId} • How can we help you?</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Options */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {serviceRequests.map((request) => {
            const Icon = request.icon;
            const isSelected = selectedRequest?.id === request.id;
            
            return (
              <button
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${request.color} text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{request.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                    {getUrgencyBadge(request.urgency)}
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Additional Notes */}
        {selectedRequest && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Additional Details (Optional)
            </h3>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Let us know any specific details or requests..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-2">
              Examples: "Need extra napkins", "Allergic to nuts", "Birthday celebration"
            </p>
          </div>
        )}

        {/* Submit Button */}
        {selectedRequest && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Request Summary</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${selectedRequest.color} text-white`}>
                    <selectedRequest.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedRequest.title}</p>
                    <p className="text-sm text-gray-600">Table {tableId}</p>
                  </div>
                </div>
                {additionalNotes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Note:</span> {additionalNotes}
                    </p>
                  </div>
                  )}
                  </div>
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending Request...</span>
                </>
                  ) : (
                <>
                  <Bell className="w-5 h-5" />
                  <span>Send Request to Staff</span>
                </>
                  )}
                </button>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-2 text-blue-700">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">
                  A staff member will be notified immediately
                </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                Expected response time: {selectedRequest.urgency === 'high' ? '1-2' : selectedRequest.urgency === 'medium' ? '3-5' : '5-8'} minutes
                  </p>
                </div>
                  </div>
                )}
                
                {/* Help Section */}
                <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6">
                  <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <HelpCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Need Immediate Assistance?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  For urgent matters or emergencies, you can always flag down a staff member directly.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                onClick={() => router.push(`/table/${params.restrauntId}/${tableId}`)}
                className="px-6 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 font-medium"
                  >
                Back to Menu
                  </button>
                  <button
                onClick={() => router.push(`/table/${params.restrauntId}/${tableId}/call-waiter`)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                Emergency Call
                  </button>
                </div>
                  </div>
                </div>
                
                {/* Footer Space */}
                <div className="h-8"></div>
                  </div>
                </div>
                  );
                }
                