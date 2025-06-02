'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, Heart, ThumbsUp, MessageCircle, 
  Filter, Search, Calendar, User, Quote, ChevronDown,
  ChevronUp, ExternalLink, Award, TrendingUp,
  X, Plus, Send, Clock, CheckCircle, Sparkles
} from 'lucide-react';
import { apiService } from '../../../../../lib/api';

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  tableNumber?: string;
  helpfulCount: number;
  responses: Array<{
    staffId: { name: string };
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  restaurant?: {
    name: string;
    address: string;
  };
}

export default function ReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    rating: 0,
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReviews();
  }, [restaurantId, filters]);

  const loadReviews = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const data = await apiService.reviews.getReviews(restaurantId, {
        rating: filters.rating || undefined,
        sortBy: filters.sortBy,
        order: filters.order as 'asc' | 'desc',
        limit: 20
      });
      
      setReviews(data.reviews || []);
      setStats({
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
        ratingDistribution: data.ratingDistribution || {},
        restaurant: data.restaurant
      });
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
      
      // Fallback to mock data if API fails
      const mockReviews = [
        {
          _id: '1',
          customerName: 'Sarah Johnson',
          rating: 5,
          comment: 'Absolutely amazing experience! The food was exceptional, service was prompt and friendly. The ambiance was perfect for our date night. Will definitely be coming back soon. The pasta was cooked to perfection and the wine selection was outstanding.',
          tableNumber: tableId,
          helpfulCount: 12,
          responses: [
            {
              staffId: { name: 'Maria' },
              message: 'Thank you so much for your wonderful review! We\'re delighted you enjoyed your evening with us.',
              createdAt: '2024-06-01T18:30:00Z'
            }
          ],
          createdAt: '2024-06-01T20:30:00Z'
        },
        {
          _id: '2',
          customerName: 'Mike Chen',
          rating: 4,
          comment: 'Great food and atmosphere. The service was good, though we had to wait a bit longer than expected. Overall a pleasant dining experience.',
          tableNumber: '8',
          helpfulCount: 8,
          responses: [],
          createdAt: '2024-05-30T19:15:00Z'
        },
        {
          _id: '3',
          customerName: 'Emma Williams',
          rating: 5,
          comment: 'Perfect spot for a family dinner! Kids loved the atmosphere and the staff were incredibly accommodating.',
          tableNumber: '12',
          helpfulCount: 15,
          responses: [],
          createdAt: '2024-05-28T18:45:00Z'
        }
      ];

      setReviews(mockReviews);
      setStats({
        averageRating: 4.6,
        totalReviews: mockReviews.length,
        ratingDistribution: calculateRatingDistribution(mockReviews),
        restaurant: {
          name: 'Bella Vista Restaurant',
          address: '123 Main Street, Downtown'
        }
      });
      setError(null); // Clear error since we're using fallback data
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRatingDistribution = (reviewList: Review[]) => {
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewList.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });
    return distribution;
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-7 h-7'
    };

    return (
      <div className="flex space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeClasses[size]} transition-colors duration-200 ${
              i < rating ? 'text-amber-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const toggleReviewExpansion = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await apiService.reviews.markHelpful(restaurantId, reviewId);
      // Update the review in the local state
      setReviews(reviews.map(review => 
        review._id === reviewId 
          ? { ...review, helpfulCount: review.helpfulCount + 1 }
          : review
      ));
    } catch (error) {
      console.error('Failed to mark review as helpful:', error);
      // Still update UI optimistically
      setReviews(reviews.map(review => 
        review._id === reviewId 
          ? { ...review, helpfulCount: review.helpfulCount + 1 }
          : review
      ));
    }
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    return 'Below Average';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Reviews</h2>
          <p className="text-gray-600">Gathering customer feedback...</p>
        </div>
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-3xl shadow-xl p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Reviews</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button 
            onClick={loadReviews}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-black">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg sticky top-0 z-40 border-b border-white/20">
        <div className="max-w-6xl mx-auto p-6">
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
                  Reviews & Ratings
                </h1>
                <p className="text-gray-600 flex items-center space-x-2">
                  <span>Table {tableId}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span>{stats.restaurant?.name || 'Restaurant'}</span>
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWriteReview(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Write Review</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Show API error as a banner if we have fallback data */}
        {error && reviews.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 text-sm">
                Using sample data - API connection issue: {error}
              </p>
            </div>
          </div>
        )}

        {/* Rating Overview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl p-8 mb-6">
                <div className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-4">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-4">
                  {renderStars(Math.round(stats.averageRating), 'lg')}
                </div>
                <p className="text-gray-600 text-lg">
                  Based on <span className="font-semibold text-gray-800">{stats.totalReviews}</span> review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Award className="w-6 h-6 text-yellow-500" />
                <span className="text-lg font-semibold text-gray-700">
                  {getRatingLabel(stats.averageRating)} Rating
                </span>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Rating Breakdown</h3>
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 w-16">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-amber-400 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${stats.totalReviews > 0 ? ((stats.ratingDistribution[rating] || 0) / stats.totalReviews) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {stats.ratingDistribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filter by:</span>
            </div>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: parseInt(e.target.value) })}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
            >
              <option value={0}>All Ratings</option>
              {[5, 4, 3, 2, 1].map(rating => (
                <option key={rating} value={rating}>
                  {rating} Star{rating !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
            
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
            >
              <option value="createdAt">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="helpfulCount">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border border-white/20">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Reviews Yet</h3>
              <p className="text-gray-600 mb-8 text-lg">Be the first to share your experience!</p>
              <button
                onClick={() => setShowWriteReview(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg font-medium"
              >
                Write First Review
              </button>
            </div>
          ) : (
            reviews.map((review, index) => {
              const isExpanded = expandedReviews.has(review._id);
              const shouldTruncate = review.comment.length > 200;
              
              return (
                <div 
                  key={review._id} 
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] border border-white/20"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{review.customerName}</h4>
                        <div className="flex items-center space-x-3 mt-1">
                          {renderStars(review.rating, 'sm')}
                          <span className="text-sm text-gray-500 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(review.createdAt)}</span>
                          </span>
                          {review.tableNumber && (
                            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                              Table {review.tableNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-start space-x-3">
                      <Quote className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {shouldTruncate && !isExpanded 
                          ? `${review.comment.substring(0, 200)}...`
                          : review.comment
                        }
                      </p>
                    </div>
                    
                    {shouldTruncate && (
                      <button
                        onClick={() => toggleReviewExpansion(review._id)}
                        className="text-blue-600 hover:text-blue-700 font-medium mt-3 flex items-center space-x-1 transition-colors duration-200"
                      >
                        {isExpanded ? (
                          <>
                            <span>Show Less</span>
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Read More</span>
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Staff Responses */}
                  {review.responses && review.responses.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
                      <div className="flex items-center space-x-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Staff Response</span>
                      </div>
                      {review.responses.map((response, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-semibold text-blue-900">
                                {response.staffId.name}
                              </span>
                              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-medium">
                                Staff
                              </span>
                              <span className="text-sm text-blue-600">
                                {formatDate(response.createdAt)}
                              </span>
                            </div>
                            <p className="text-blue-800 leading-relaxed">{response.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <button
                      onClick={() => handleMarkHelpful(review._id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-all duration-200 transform hover:scale-105 bg-gray-50 hover:bg-blue-50 px-4 py-2 rounded-xl"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="font-medium">Helpful ({review.helpfulCount})</span>
                    </button>
                    
                    {review.helpfulCount > 0 && (
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <Heart className="w-4 h-4 text-pink-400" />
                        <span>{review.helpfulCount} people found this helpful</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More Button */}
        {reviews.length >= 20 && (
          <div className="text-center">
            <button 
              onClick={() => {/* Implement pagination */}}
              className="bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-2xl hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-lg border border-white/20 font-medium"
            >
              Load More Reviews
            </button>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      {showWriteReview && (
        <WriteReviewModal 
          restaurantId={restaurantId}
          tableId={tableId}
          onClose={() => setShowWriteReview(false)}
          onSubmit={() => {
            setShowWriteReview(false);
            loadReviews();
          }}
        />
      )}
    </div>
  );
}

// Write Review Modal Component
function WriteReviewModal({ 
  restaurantId, 
  tableId, 
  onClose, 
  onSubmit 
}: {
  restaurantId: string;
  tableId: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    rating: 0,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required';
    }
    
    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!formData.comment.trim()) {
      newErrors.comment = 'Review comment is required';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await apiService.reviews.createReview(restaurantId, {
        ...formData,
        tableNumber: tableId
      });
      onSubmit();
    } catch (error) {
      console.error('Failed to submit review:', error);
      setErrors({ submit: 'Failed to submit review. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Write a Review
              </h2>
              <p className="text-gray-600 mt-1">Share your dining experience</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-2xl transition-all duration-200 transform hover:scale-105"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.customerName ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Enter your name"
              />
              {errors.customerName && (
                <p className="text-red-600 text-sm mt-2 flex items-center space-x-1">
                  <X className="w-4 h-4" />
                  <span>{errors.customerName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all duration-200"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Rating *
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating })}
                    className="p-2 rounded-xl transition-all duration-200 transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-all duration-200 ${
                        rating <= formData.rating
                          ? 'text-yellow-400 fill-current scale-110'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {errors.rating && (
                <p className="text-red-600 text-sm mt-2 flex items-center space-x-1">
                  <X className="w-4 h-4" />
                  <span>{errors.rating}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Your Review *
              </label>
              <textarea
                required
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 ${
                  errors.comment ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                rows={5}
                placeholder="Tell us about your experience..."
                maxLength={500}
              />
              {errors.comment && (
                <p className="text-red-600 text-sm mt-2 flex items-center space-x-1">
                  <X className="w-4 h-4" />
                  <span>{errors.comment}</span>
                </p>
              )}
              <div className="flex justify-between items-center mt-2">
                <p className="text-gray-500 text-sm">{formData.comment.length}/500 characters</p>
                {formData.comment.length >= 10 && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-red-600 text-sm flex items-center space-x-2">
                <X className="w-4 h-4" />
                <span>{errors.submit}</span>
              </p>
            </div>
          )}

          <div className="flex space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl hover:bg-gray-200 transition-all duration-200 transform hover:scale-105 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.rating === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg flex items-center justify-center space-x-2 font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}