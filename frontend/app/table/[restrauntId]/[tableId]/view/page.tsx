'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, Filter, Info, Clock, Flame, Leaf, Star,
  AlertCircle, ChevronDown, ChevronUp, X, Utensils, Wine,
  Coffee, IceCream2, Soup, Pizza, Salad, Cake
} from 'lucide-react';
import { apiService } from '../../../../../lib/api';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  allergens?: string[];
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  preparationTime?: number;
  calories?: number;
}

export default function ViewMenuPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    vegetarian: false,
    spicy: false,
    popular: false,
    priceRange: 'all'
  });
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    loadMenu();
  }, [restaurantId, tableId]);

  const loadMenu = async () => {
    try {
      setError(null);
      const data = await apiService.tables.getTableMenu(restaurantId, tableId);
      setRestaurant(data.restaurant);
      setMenu(data.menu);
      // Expand all categories by default
      setExpandedCategories(Object.keys(data.menu));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      appetizers: Soup,
      mains: Pizza,
      desserts: Cake,
      beverages: Coffee,
      salads: Salad,
      wines: Wine,
      default: Utensils
    };
    const Icon = icons[category.toLowerCase()] || icons.default;
    return <Icon className="w-5 h-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      appetizers: 'bg-orange-100 text-orange-800',
      mains: 'bg-blue-100 text-blue-800',
      desserts: 'bg-pink-100 text-pink-800',
      beverages: 'bg-green-100 text-green-800'
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const filterItems = (items: MenuItem[]) => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.vegetarian) {
      filtered = filtered.filter(item => item.isVegetarian);
    }

    if (filters.spicy) {
      filtered = filtered.filter(item => item.isSpicy);
    }

    if (filters.popular) {
      filtered = filtered.filter(item => item.isPopular);
    }

    if (filters.priceRange !== 'all') {
      switch (filters.priceRange) {
        case 'under10':
          filtered = filtered.filter(item => item.price < 10);
          break;
        case '10to20':
          filtered = filtered.filter(item => item.price >= 10 && item.price <= 20);
          break;
        case 'over20':
          filtered = filtered.filter(item => item.price > 20);
          break;
      }
    }

    return filtered;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.vegetarian) count++;
    if (filters.spicy) count++;
    if (filters.popular) count++;
    if (filters.priceRange !== 'all') count++;
    return count;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Menu</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-8 py-3 rounded-full hover:bg-gray-700 transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold text-gray-900">{restaurant?.name} Menu</h1>
              <p className="text-sm text-gray-600">Browse our complete menu</p>
            </div>
            <button
              onClick={() => router.push(`/table/${restaurantId}/${tableId}/menu`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Order Now
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-xl flex items-center space-x-2 transition-colors ${
                showFilters || activeFiltersCount() > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              {activeFiltersCount() > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount()}
                </span>
              )}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters({ ...filters, vegetarian: !filters.vegetarian })}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    filters.vegetarian
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Leaf className="w-4 h-4" />
                  <span>Vegetarian</span>
                </button>
                <button
                  onClick={() => setFilters({ ...filters, spicy: !filters.spicy })}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    filters.spicy
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>Spicy</span>
                </button>
                <button
                  onClick={() => setFilters({ ...filters, popular: !filters.popular })}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    filters.popular
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>Popular</span>
                </button>
              </div>
              
              <div className="pt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Price Range</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters({ ...filters, priceRange: 'all' })}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      filters.priceRange === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, priceRange: 'under10' })}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      filters.priceRange === 'under10'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Under $10
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, priceRange: '10to20' })}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      filters.priceRange === '10to20'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    $10-$20
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, priceRange: 'over20' })}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      filters.priceRange === 'over20'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Over $20
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-6">
          {Object.entries(menu).map(([category, items]) => {
            const filteredItems = filterItems(items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={category} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                      {getCategoryIcon(category)}
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-gray-900 capitalize">{category}</h2>
                      <p className="text-sm text-gray-600">{filteredItems.length} items</p>
                    </div>
                  </div>
                  {expandedCategories.includes(category) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedCategories.includes(category) && (
                  <div className="border-t">
                    {filteredItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                          index !== filteredItems.length - 1 ? 'border-b' : ''
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{item.name}</h3>
                              <div className="flex items-center space-x-1">
                                {item.isPopular && (
                                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                                    <Star className="w-3 h-3 mr-1" />
                                    Popular
                                  </span>
                                )}
                                {item.isVegetarian && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    <Leaf className="w-3 h-3" />
                                  </span>
                                )}
                                {item.isSpicy && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                    <Flame className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                            
                            {(item.preparationTime || item.calories) && (
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                {item.preparationTime && (
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {item.preparationTime} min
                                  </span>
                                )}
                                {item.calories && (
                                  <span>{item.calories} cal</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">${item.price.toFixed(2)}</p>
                            <button className="mt-2 text-blue-600 text-sm hover:text-blue-700">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">{selectedItem.description}</p>
              
              <div className="flex items-center space-x-3">
                {selectedItem.isVegetarian && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center text-sm">
                    <Leaf className="w-4 h-4 mr-1" />
                    Vegetarian
                  </span>
                )}
                {selectedItem.isSpicy && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center text-sm">
                    <Flame className="w-4 h-4 mr-1" />
                    Spicy
                  </span>
                )}
                {selectedItem.isPopular && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center text-sm">
                    <Star className="w-4 h-4 mr-1" />
                    Popular
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-2xl font-bold text-gray-900">${selectedItem.price.toFixed(2)}</p>
                </div>
                {selectedItem.preparationTime && (
                  <div>
                    <p className="text-sm text-gray-600">Prep Time</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedItem.preparationTime} min</p>
                  </div>
                )}
              </div>

              {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Allergen Information</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.allergens.map(allergen => (
                      <span key={allergen} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.calories && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Nutritional Information</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedItem.calories} calories</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  router.push(`/table/${restaurantId}/${tableId}/menu`);
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Order This Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}