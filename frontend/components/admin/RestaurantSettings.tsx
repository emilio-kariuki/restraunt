'use client';

import { useState, useEffect } from 'react';
import { 
  Save, Upload, Globe, Phone, Mail, MapPin, 
  Clock, DollarSign, Settings as SettingsIcon, 
  Camera, Facebook, Instagram, Twitter, Star,
  Bell, Users, CreditCard, CheckCircle, Loader2,
  Trash2, AlertTriangle, BarChart3, Database,
  QrCode, Percent
} from 'lucide-react';
import { RestaurantProfile } from '../../types/admin';
import { apiService } from '../../lib/api';

interface RestaurantSettingsProps {
  restaurant: RestaurantProfile | null;
  onUpdate: () => void;
  onNotification: (type: 'success' | 'error', message: string) => void;
}

export default function RestaurantSettings({ 
  restaurant, 
  onUpdate, 
  onNotification 
}: RestaurantSettingsProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'settings' | 'hours' | 'reset'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    tablesCount: 0,
    menuItemsCount: 0,
    totalOrdersCount: 0,
    activeOrdersCount: 0,
    totalRevenue: 0
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    priceRange: 'moderate',
    facebook: '',
    instagram: '',
    twitter: ''
  });

  const [settings, setSettings] = useState({
    allowCashPayment: true,
    allowSplitPayment: true,
    enableReservations: false,
    enableWaitingList: false,
    maxWaitTime: 15,
    autoConfirmOrders: false,
    requirePhoneForOrders: true,
    enableOrderNotifications: true,
    taxRate: 0.08 // Add tax rate state
  });

  const [operatingHours, setOperatingHours] = useState({
    monday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    sunday: { isOpen: true, openTime: '10:00', closeTime: '21:00' }
  });

  useEffect(() => {
    if (restaurant) {
      setProfileForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        cuisine: restaurant.cuisine || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        website: restaurant.website || '',
        priceRange: restaurant.priceRange || 'moderate',
        facebook: restaurant.socialMedia?.facebook || '',
        instagram: restaurant.socialMedia?.instagram || '',
        twitter: restaurant.socialMedia?.twitter || ''
      });

      if (restaurant.settings) {
        setSettings({
          allowCashPayment: restaurant.settings.allowCashPayment ?? true,
          allowSplitPayment: restaurant.settings.allowSplitPayment ?? true,
          enableReservations: restaurant.settings.enableReservations ?? false,
          enableWaitingList: restaurant.settings.enableWaitingList ?? false,
          maxWaitTime: restaurant.settings.maxWaitTime ?? 15,
          autoConfirmOrders: restaurant.settings.autoConfirmOrders ?? false,
          requirePhoneForOrders: restaurant.settings.requirePhoneForOrders ?? true,
          enableOrderNotifications: restaurant.settings.enableOrderNotifications ?? true,
          taxRate: restaurant.settings.taxRate ?? 0.08 // Load tax rate
        });
      }

      if (restaurant.settings?.operatingHours) {
        const hours = restaurant.settings.operatingHours;
        setOperatingHours({
          monday: { isOpen: !(hours.monday as any)?.closed, openTime: (hours.monday as any)?.open || '09:00', closeTime: (hours.monday as any)?.close || '22:00' },
          tuesday: { isOpen: !(hours.tuesday as any)?.closed, openTime: (hours.tuesday as any)?.open || '09:00', closeTime: (hours.tuesday as any)?.close || '22:00' },
          wednesday: { isOpen: !(hours.wednesday as any)?.closed, openTime: (hours.wednesday as any)?.open || '09:00', closeTime: (hours.wednesday as any)?.close || '22:00' },
          thursday: { isOpen: !(hours.thursday as any)?.closed, openTime: (hours.thursday as any)?.open || '09:00', closeTime: (hours.thursday as any)?.close || '22:00' },
          friday: { isOpen: !(hours.friday as any)?.closed, openTime: (hours.friday as any)?.open || '09:00', closeTime: (hours.friday as any)?.close || '23:00' },
          saturday: { isOpen: !(hours.saturday as any)?.closed, openTime: (hours.saturday as any)?.open || '09:00', closeTime: (hours.saturday as any)?.close || '23:00' },
          sunday: { isOpen: !(hours.sunday as any)?.closed, openTime: (hours.sunday as any)?.open || '10:00', closeTime: (hours.sunday as any)?.close || '21:00' }
        });
      }
    }

    loadStats();
  }, [restaurant]);

  const loadStats = async () => {
    try {
      const response = await apiService.restaurants.getRestaurantStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        name: profileForm.name,
        description: profileForm.description,
        cuisine: profileForm.cuisine,
        address: profileForm.address,
        phone: profileForm.phone,
        email: profileForm.email,
        website: profileForm.website,
        priceRange: profileForm.priceRange,
        socialMedia: {
          facebook: profileForm.facebook,
          instagram: profileForm.instagram,
          twitter: profileForm.twitter
        }
      };

      await apiService.restaurants.updateRestaurantSettings(updateData);
      onNotification('success', 'Restaurant profile updated successfully!');
      onUpdate();
      
      // Update local storage if needed for consistent UI updates
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('restaurantUpdated', { detail: updateData });
        window.dispatchEvent(event);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      onNotification('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Validate tax rate
      if (settings.taxRate < 0 || settings.taxRate > 1) {
        onNotification('error', 'Tax rate must be between 0% and 100%');
        setIsSaving(false);
        return;
      }

      // Convert operating hours format for backend
      const backendOperatingHours = Object.keys(operatingHours).reduce((acc, day) => {
        const dayData = operatingHours[day as keyof typeof operatingHours];
        acc[day] = {
          open: dayData.openTime,
          close: dayData.closeTime,
          closed: !dayData.isOpen
        };
        return acc;
      }, {} as any);

      const settingsData = {
        settings: {
          ...settings,
          operatingHours: backendOperatingHours
        }
      };

      await apiService.restaurants.updateRestaurantSettings(settingsData);
      onNotification('success', 'Restaurant settings updated successfully!');
      onUpdate();
      
      // Broadcast settings update
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('restaurantSettingsUpdated', { detail: settings });
        window.dispatchEvent(event);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      onNotification('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (resetType: 'tables' | 'menu' | 'orders' | 'all') => {
    const confirmMessages = {
      tables: 'This will delete all tables and their QR codes. Are you sure?',
      menu: 'This will delete all menu items. Are you sure?',
      orders: 'This will delete all orders and reset table statuses. Are you sure?',
      all: 'This will delete ALL restaurant data (tables, menu, orders). This cannot be undone. Are you sure?'
    };

    if (!confirm(confirmMessages[resetType])) return;

    setIsSaving(true);
    try {
      await apiService.restaurants.resetRestaurant(resetType);
      onNotification('success', `Restaurant ${resetType} cleared successfully!`);
      onUpdate();
      loadStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset data';
      onNotification('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: SettingsIcon },
    { id: 'settings', label: 'Settings', icon: CreditCard },
    { id: 'hours', label: 'Operating Hours', icon: Clock },
    { id: 'reset', label: 'Reset Data', icon: Database }
  ];

  const cuisineTypes = [
    'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 
    'French', 'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Other'
  ];

  const priceRanges = [
    { value: 'budget', label: 'Budget ($)', description: 'Under $15 per person' },
    { value: 'moderate', label: 'Moderate ($$)', description: '$15-30 per person' },
    { value: 'upscale', label: 'Upscale ($$$)', description: '$30-60 per person' },
    { value: 'fine-dining', label: 'Fine Dining ($$$$)', description: 'Over $60 per person' }
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-8 text-black">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Restaurant Settings</h2>
        <p className="text-gray-600 mt-1">Manage your restaurant profile and preferences</p>
      </div>

      {/* Section Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
        <div className="flex space-x-2">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <SettingsIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Restaurant Profile</h3>
                <p className="text-gray-600">Update your restaurant's basic information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter restaurant name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                    placeholder="Describe your restaurant..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisine Type</label>
                  <select
                    value={profileForm.cuisine}
                    onChange={(e) => setProfileForm({ ...profileForm, cuisine: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select cuisine type</option>
                    {cuisineTypes.map((cuisine) => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
                  <div className="space-y-3">
                    {priceRanges.map((range) => (
                      <label key={range.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          value={range.value}
                          checked={profileForm.priceRange === range.value}
                          onChange={(e) => setProfileForm({ ...profileForm, priceRange: e.target.value })}
                          className="text-blue-600"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{range.label}</p>
                          <p className="text-sm text-gray-600">{range.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <textarea
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                      placeholder="Enter restaurant address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="restaurant@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://yourrestaurant.com"
                    />
                  </div>
                </div>

                {/* Social Media */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900">Social Media</h5>
                  
                  <div className="relative">
                    <Facebook className="absolute left-4 top-4 w-5 h-5 text-blue-600" />
                    <input
                      type="url"
                      value={profileForm.facebook}
                      onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Facebook page URL"
                    />
                  </div>

                  <div className="relative">
                    <Instagram className="absolute left-4 top-4 w-5 h-5 text-pink-600" />
                    <input
                      type="url"
                      value={profileForm.instagram}
                      onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Instagram profile URL"
                    />
                  </div>

                  <div className="relative">
                    <Twitter className="absolute left-4 top-4 w-5 h-5 text-blue-400" />
                    <input
                      type="url"
                      value={profileForm.twitter}
                      onChange={(e) => setProfileForm({ ...profileForm, twitter: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Twitter profile URL"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Restaurant Settings</h3>
                <p className="text-gray-600">Configure your restaurant's operational preferences</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Settings */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Settings
                </h4>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">Accept Cash Payments</p>
                      <p className="text-sm text-gray-600">Allow customers to pay with cash</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allowCashPayment}
                      onChange={(e) => setSettings({ ...settings, allowCashPayment: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">Allow Split Payments</p>
                      <p className="text-sm text-gray-600">Enable bill splitting between customers</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allowSplitPayment}
                      onChange={(e) => setSettings({ ...settings, allowSplitPayment: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </label>
                </div>

                {/* Tax Rate Setting */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Percent className="w-4 h-4 mr-2" />
                    Tax Rate
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={(settings.taxRate * 100).toFixed(2)}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        taxRate: Math.min(1, Math.max(0, parseFloat(e.target.value) / 100)) || 0 
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="8.00"
                    />
                    <p className="text-sm text-gray-600">
                      Current rate: {(settings.taxRate * 100).toFixed(2)}% 
                      (e.g., $10.00 + tax = ${(10 * (1 + settings.taxRate)).toFixed(2)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Settings */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Order Settings
                </h4>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">Auto-Confirm Orders</p>
                      <p className="text-sm text-gray-600">Automatically confirm incoming orders</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoConfirmOrders}
                      onChange={(e) => setSettings({ ...settings, autoConfirmOrders: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">Require Phone Number</p>
                      <p className="text-sm text-gray-600">Require customers to provide phone number</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.requirePhoneForOrders}
                      onChange={(e) => setSettings({ ...settings, requirePhoneForOrders: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">Order Notifications</p>
                      <p className="text-sm text-gray-600">Send notifications for order updates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableOrderNotifications}
                      onChange={(e) => setSettings({ ...settings, enableOrderNotifications: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Customer Experience */}
              <div className="space-y-6 lg:col-span-2">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Customer Experience
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">Enable Reservations</p>
                      <p className="text-sm text-gray-600">Allow customers to make table reservations</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableReservations}
                      onChange={(e) => setSettings({ ...settings, enableReservations: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">Enable Waiting List</p>
                      <p className="text-sm text-gray-600">Allow customers to join waiting list</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableWaitingList}
                      onChange={(e) => setSettings({ ...settings, enableWaitingList: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </label>
                </div>

                <div className="p-4 border border-gray-200 rounded-xl max-w-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maximum Wait Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={settings.maxWaitTime}
                    onChange={(e) => setSettings({ ...settings, maxWaitTime: parseInt(e.target.value) || 15 })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all font-semibold shadow-lg disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operating Hours Section */}
      {activeSection === 'hours' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Operating Hours</h3>
                <p className="text-gray-600">Set your restaurant's opening and closing times</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {days.map((day) => (
                <div key={day} className="flex items-center space-x-4 p-6 border border-gray-200 rounded-xl hover:bg-gray-50">
                  <div className="w-24">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={operatingHours[day as keyof typeof operatingHours].isOpen}
                        onChange={(e) => setOperatingHours({
                          ...operatingHours,
                          [day]: { ...operatingHours[day as keyof typeof operatingHours], isOpen: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="font-semibold text-gray-900 capitalize">{day}</span>
                    </label>
                  </div>
                  
                  {operatingHours[day as keyof typeof operatingHours].isOpen ? (
                    <div className="flex items-center space-x-4 flex-1">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Open</label>
                        <input
                          type="time"
                          value={operatingHours[day as keyof typeof operatingHours].openTime}
                          onChange={(e) => setOperatingHours({
                            ...operatingHours,
                            [day]: { ...operatingHours[day as keyof typeof operatingHours], openTime: e.target.value }
                          })}
                          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Close</label>
                        <input
                          type="time"
                          value={operatingHours[day as keyof typeof operatingHours].closeTime}
                          onChange={(e) => setOperatingHours({
                            ...operatingHours,
                            [day]: { ...operatingHours[day as keyof typeof operatingHours], closeTime: e.target.value }
                          })}
                          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <span className="text-red-600 font-medium">Closed</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-purple-600 text-white px-8 py-4 rounded-xl hover:bg-purple-700 transition-all font-semibold shadow-lg disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Hours
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Data Section */}
      {activeSection === 'reset' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Reset Restaurant Data</h3>
                <p className="text-gray-600">Clear specific data or start fresh with a clean slate</p>
              </div>
            </div>

            {/* Current Stats */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Current Data Overview
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.tablesCount}</p>
                  <p className="text-sm text-gray-600">Tables</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.menuItemsCount}</p>
                  <p className="text-sm text-gray-600">Menu Items</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.totalOrdersCount}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.activeOrdersCount}</p>
                  <p className="text-sm text-gray-600">Active Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">${stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </div>
            </div>

            {/* Reset Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clear Tables */}
              <div className="border border-orange-200 rounded-2xl p-6 hover:bg-orange-50 transition-colors">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900">Clear Tables</h5>
                    <p className="text-sm text-gray-600">Remove all tables and QR codes</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  This will delete all {stats.tablesCount} tables and their associated QR codes. Table configurations will need to be recreated.
                </p>
                <button
                  onClick={() => handleReset('tables')}
                  disabled={isSaving || stats.tablesCount === 0}
                  className="w-full bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Tables ({stats.tablesCount})
                </button>
              </div>

              {/* Clear Menu */}
              <div className="border border-green-200 rounded-2xl p-6 hover:bg-green-50 transition-colors">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <SettingsIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900">Clear Menu</h5>
                    <p className="text-sm text-gray-600">Remove all menu items</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  This will delete all {stats.menuItemsCount} menu items. You'll need to recreate your menu from scratch.
                </p>
                <button
                  onClick={() => handleReset('menu')}
                  disabled={isSaving || stats.menuItemsCount === 0}
                  className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Menu Items ({stats.menuItemsCount})
                </button>
              </div>

              {/* Clear Orders */}
              <div className="border border-purple-200 rounded-2xl p-6 hover:bg-purple-50 transition-colors">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900">Clear Orders</h5>
                    <p className="text-sm text-gray-600">Remove all order history</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  This will delete all {stats.totalOrdersCount} orders and reset table statuses. Revenue history will be lost.
                </p>
                <button
                  onClick={() => handleReset('orders')}
                  disabled={isSaving || stats.totalOrdersCount === 0}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Orders ({stats.totalOrdersCount})
                </button>
              </div>

              {/* Complete Reset */}
              <div className="border border-red-200 rounded-2xl p-6 hover:bg-red-50 transition-colors">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900">Complete Reset</h5>
                    <p className="text-sm text-gray-600">Clear everything - start fresh</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  This will delete ALL data: tables, menu items, and orders. This action cannot be undone!
                </p>
                <button
                  onClick={() => handleReset('all')}
                  disabled={isSaving}
                  className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Reset Everything
                </button>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <h5 className="font-semibold text-yellow-800 mb-2">Important Notice</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• These actions cannot be undone</li>
                    <li>• Make sure to backup any important data before proceeding</li>
                    <li>• Active orders will be cancelled when clearing orders</li>
                    <li>• Customers with pending orders will need to be notified</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}