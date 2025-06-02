'use client';

import { useState, useEffect } from 'react';
import { 
  MessageSquare, Clock, CheckCircle2, XCircle, 
  AlertTriangle, Package, Heart, Baby, Cake, Wine, 
  Users, ChefHat, CreditCard, Shield, Gift, Star,
  User, Calendar, MapPin, Edit3, Check, X, Bell,
  Filter, Search, RefreshCw, Eye, MoreVertical
} from 'lucide-react';
import { apiService } from '../../lib/api';

interface ServiceRequest {
  _id: string;
  restaurantId: string;
  tableId: string;
  serviceType: string;
  category?: string;
  title: string;
  details: {
    selectedOptions?: string[];
    note?: string;
    message?: string;
    requestId?: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  assignedTo?: any;
  createdAt: string;
  updatedAt: string;
}

export default function ServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadRequests();
    // Set up polling for real-time updates
    const interval = setInterval(loadRequests, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [filter]);

  const loadRequests = async () => {
    try {
      const restaurant = await apiService.restaurants.getMyRestaurant();
      const statusFilter = filter === 'all' ? undefined : filter;
      
      const data = await apiService.services.getServiceRequests(
        restaurant._id, 
        statusFilter
      );
      
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading service requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string, notes?: string) => {
    try {
      setIsUpdating(true);
      await apiService.services.updateServiceRequest(requestId, { status, notes });
      await loadRequests(); // Refresh the list
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating request status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getCategoryIcon = (category?: string) => {
    const icons = {
      takeout: Package,
      dietary: Heart,
      payment: CreditCard,
      special: Cake,
      family: Baby,
      beverage: Wine,
      seating: Users,
      menu: ChefHat
    };
    
    const IconComponent = category ? icons[category as keyof typeof icons] : MessageSquare;
    return IconComponent || MessageSquare;
  };

  const getCategoryColor = (category?: string) => {
    const colors = {
      takeout: 'text-blue-600 bg-blue-50 border-blue-200',
      dietary: 'text-red-600 bg-red-50 border-red-200',
      payment: 'text-green-600 bg-green-50 border-green-200',
      special: 'text-pink-600 bg-pink-50 border-pink-200',
      family: 'text-purple-600 bg-purple-50 border-purple-200',
      beverage: 'text-amber-600 bg-amber-50 border-amber-200',
      seating: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      menu: 'text-orange-600 bg-orange-50 border-orange-200'
    };
    
    return category ? colors[category as keyof typeof colors] : 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-600 bg-gray-100',
      medium: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      in_progress: 'text-blue-700 bg-blue-100 border-blue-300',
      completed: 'text-green-700 bg-green-100 border-green-300',
      cancelled: 'text-red-700 bg-red-100 border-red-300'
    };
    return colors[status as keyof typeof colors] || 'text-gray-700 bg-gray-100 border-gray-300';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredRequests = requests.filter(request => {
    if (filter !== 'all' && request.status !== filter) return false;
    if (searchTerm && !request.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !request.tableId.includes(searchTerm)) return false;
    return true;
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const inProgressRequests = requests.filter(r => r.status === 'in_progress');

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Requests</h2>
            <p className="text-gray-600">Manage customer special requests and service calls</p>
          </div>
          <button
            onClick={loadRequests}
            className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-xl font-bold text-yellow-800">{pendingRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">In Progress</p>
                <p className="text-xl font-bold text-blue-800">{inProgressRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Completed Today</p>
                <p className="text-xl font-bold text-green-800">
                  {requests.filter(r => r.status === 'completed' && 
                    new Date(r.updatedAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Requests</p>
                <p className="text-xl font-bold text-purple-800">{requests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by table or request..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Service Requests</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'No service requests yet' : `No ${filter} requests found`}
            </p>
          </div>
        ) : (
          filteredRequests.map((request, index) => {
            const Icon = getCategoryIcon(request.category);
            const categoryColor = getCategoryColor(request.category);
            const statusColor = getStatusColor(request.status);
            const priorityColor = getPriorityColor(request.priority);
            
            return (
              <div 
                key={request._id} 
                className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] border border-gray-100"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-2xl border ${categoryColor}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{request.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColor}`}>
                            {request.priority.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>Table {request.tableId}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatTime(request.createdAt)}</span>
                          </div>
                          {request.category && (
                            <span className="capitalize bg-gray-100 px-2 py-1 rounded-lg">
                              {request.category}
                            </span>
                          )}
                        </div>

                        {/* Selected Options */}
                        {request.details.selectedOptions && request.details.selectedOptions.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Selected Options:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.details.selectedOptions.map((option, idx) => (
                                <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs">
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Note */}
                        {request.details.note && (
                          <div className="bg-gray-50 rounded-xl p-3 mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Customer Note:</p>
                            <p className="text-gray-600">{request.details.note}</p>
                          </div>
                        )}

                        {/* Admin Notes */}
                        {request.adminNotes && (
                          <div className="bg-blue-50 rounded-xl p-3 mb-3">
                            <p className="text-sm font-medium text-blue-700 mb-1">Staff Notes:</p>
                            <p className="text-blue-600">{request.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateRequestStatus(request._id, 'in_progress')}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                        >
                          <Bell className="w-4 h-4" />
                          <span>Start</span>
                        </button>
                        <button
                          onClick={() => updateRequestStatus(request._id, 'completed')}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete</span>
                        </button>
                      </>
                    )}
                    
                    {request.status === 'in_progress' && (
                      <button
                        onClick={() => updateRequestStatus(request._id, 'completed')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowModal(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Request Details */}
      {showModal && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => {
            setShowModal(false);
            setSelectedRequest(null);
          }}
          onUpdate={updateRequestStatus}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
}

// Request Details Modal Component
function RequestDetailsModal({ 
  request, 
  onClose, 
  onUpdate, 
  isUpdating 
}: {
  request: ServiceRequest;
  onClose: () => void;
  onUpdate: (id: string, status: string, notes?: string) => void;
  isUpdating: boolean;
}) {
  const [status, setStatus] = useState(request.status);
  const [notes, setNotes] = useState(request.adminNotes || '');

  const handleUpdate = () => {
    onUpdate(request._id, status, notes);
  };

    const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const Icon = getCategoryIcon(request.category);
  const categoryColor = getCategoryColor(request.category);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-2xl border ${categoryColor}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{request.title}</h2>
                <p className="text-gray-600">Table {request.tableId} • {formatTime(request.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Request Details */}
          <div className="space-y-6">
            {/* Selected Options */}
            {request.details.selectedOptions && request.details.selectedOptions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Selected Options:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {request.details.selectedOptions.map((option, idx) => (
                    <div key={idx} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-sm">
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Note */}
            {request.details.note && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Customer Note:</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700">{request.details.note}</p>
                </div>
              </div>
            )}

            {/* Status Update */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Update Status:</h3>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pending' | 'in_progress' | 'completed' | 'cancelled')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Admin Notes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Staff Notes:</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes for your team..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Update Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get category icon
function getCategoryIcon(category?: string) {
  const icons = {
    takeout: Package,
    dietary: Heart,
    payment: CreditCard,
    special: Cake,
    family: Baby,
    beverage: Wine,
    seating: Users,
    menu: ChefHat
  };
  
  const IconComponent = category ? icons[category as keyof typeof icons] : MessageSquare;
  return IconComponent || MessageSquare;
}

// Helper function to get category color
function getCategoryColor(category?: string) {
  const colors = {
    takeout: 'text-blue-600 bg-blue-50 border-blue-200',
    dietary: 'text-red-600 bg-red-50 border-red-200',
    payment: 'text-green-600 bg-green-50 border-green-200',
    special: 'text-pink-600 bg-pink-50 border-pink-200',
    family: 'text-purple-600 bg-purple-50 border-purple-200',
    beverage: 'text-amber-600 bg-amber-50 border-amber-200',
    seating: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    menu: 'text-orange-600 bg-orange-50 border-orange-200'
  };
  
  return category ? colors[category as keyof typeof colors] : 'text-gray-600 bg-gray-50 border-gray-200';
}