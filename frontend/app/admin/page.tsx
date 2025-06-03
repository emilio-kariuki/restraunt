'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../../lib/api';
import { Restaurant, MenuItemForm, MenuItem, TableForm, RestaurantProfile } from '../../types/admin';
import MenuItemModal from '../../components/admin/MenuItemModal';

// Components
import LoginForm from '../../components/admin/LoginForm';
import AdminHeader from '../../components/admin/AdminHeader';
import Dashboard from '../../components/admin/Dashboard';
import OrdersManagement from '../../components/admin/OrdersManagement';
import MenuManagement from '../../components/admin/MenuManagement';
import TableManagement from '../../components/admin/TableManagement';
import ReportsSection from '../../components/admin/ReportsSection';
import RestaurantSettings from '../../components/admin/RestaurantSettings';
import QRModal from '../../components/admin/QRModal';
import ServiceRequests from '../../components/admin/ServiceRequests';
import { useAdminData } from '@/hooks/useAdminData';
import TableModal from '@/components/admin/TableModal';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'tables' | 'services' | 'reports' | 'settings'>('dashboard');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  
  // Form states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState<MenuItemForm>({
    name: '',
    description: '',
    price: '',
    category: '',
    allergens: '',
    allergenNotes: '',
    dietaryInfo: [],
    available: true,
    customizations: []
  });
  
  const [tableForm, setTableForm] = useState<TableForm>({
    tableNumber: '',
    capacity: ''
  });
  const [showTableModal, setShowTableModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use custom hook for data management
  const {
    orders,
    restaurant,
    isLoading: isDataLoading,
    error,
    loadOrders,
    loadRestaurant,
    setError
  } = useAdminData(activeTab, authToken, isAuthenticated);

  // Enhanced loadMenuItems function
  const loadMenuItems = async (forceRefresh: boolean = false) => {
    try {
      if (!restaurant?._id) {
        console.log('Restaurant ID not available, skipping menu load');
        return;
      }

      if (isLoadingMenu && !forceRefresh) {
        console.log('Menu already loading, skipping');
        return;
      }

      setIsLoadingMenu(true);
      console.log('Loading menu items for restaurant:', restaurant._id);
      
      const response = await apiService.menu.getMenu(restaurant._id);
      
      // Handle different response structures
      let items: MenuItem[] = [];
      if (response?.success && Array.isArray(response.items)) {
        items = response.items;
      } else if (response?.data && Array.isArray(response.data)) {
        items = response.data;
      } else if (Array.isArray(response)) {
        items = response;
      } else if (response?.menu && Array.isArray(response.menu)) {
        items = response.menu;
      } else if (response?.items && Array.isArray(response.items)) {
        items = response.items;
      }

      setMenuItems(items);
      console.log(`Successfully loaded ${items.length} menu items`);

    } catch (error: any) {
      console.error('Error loading menu items:', error);
      
      // Only show error if it's not a 404 (no menu items yet)
      if (error.response?.status !== 404) {
        setNotification({
          type: 'error',
          message: error.message || 'Failed to load menu items'
        });
      }
      
      // Set empty array on error
      setMenuItems([]);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Auto-clear notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auth check and initialization - REMOVED loadMenuItems from here
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      // Don't load menu items here - restaurant data isn't available yet
    }
  }, []);

  // Load menu items when restaurant data becomes available
  useEffect(() => {
    if (restaurant?._id && isAuthenticated) {
      console.log('Restaurant data available, loading menu items');
      loadMenuItems();
    }
  }, [restaurant?._id, isAuthenticated]);

  // Load menu items when switching to menu tab (with restaurant check)
  useEffect(() => {
    if (activeTab === 'menu' && restaurant?._id && isAuthenticated) {
      console.log('Menu tab activated, ensuring menu items are loaded');
      loadMenuItems();
    }
  }, [activeTab, restaurant?._id, isAuthenticated]);

  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    setNotification({ type: 'success', message: 'Login successful!' });
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAuthToken(null);
    setIsAuthenticated(false);
    setMenuItems([]); // Clear menu items on logout
    setNotification({ type: 'success', message: 'Logged out successfully' });
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiService.orders.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      setNotification({ 
        type: 'success', 
        message: `Order updated to ${newStatus}` 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update order';
      setNotification({ type: 'error', message });
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  // Menu Item handlers
  const handleAddMenuItem = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!menuItemForm.name.trim()) {
        setNotification({
          type: 'error',
          message: 'Item name is required'
        });
        return;
      }

      if (!menuItemForm.description.trim()) {
        setNotification({
          type: 'error',
          message: 'Description is required'
        });
        return;
      }

      if (!menuItemForm.price || parseFloat(menuItemForm.price) <= 0) {
        setNotification({
          type: 'error',
          message: 'Valid price is required'
        });
        return;
      }

      if (!menuItemForm.category) {
        setNotification({
          type: 'error',
          message: 'Category is required'
        });
        return;
      }

      // Check if restaurant exists
      if (!restaurant?._id) {
        setNotification({
          type: 'error',
          message: 'Restaurant data not available'
        });
        return;
      }

      // Prepare menu item data
      const menuItemData = {
        name: menuItemForm.name.trim(),
        description: menuItemForm.description.trim(),
        price: parseFloat(menuItemForm.price),
        category: menuItemForm.category,
        allergens: menuItemForm.allergens?.split(',').map(a => a.trim()).filter(Boolean) || [],
        allergenNotes: menuItemForm.allergenNotes?.trim() || '',
        dietaryInfo: menuItemForm.dietaryInfo || [],
        available: menuItemForm.available !== false,
        customizations: menuItemForm.customizations || [],
        restaurantId: restaurant._id
      };

      if (editingMenuItem) {
        // Update existing item
        await apiService.menu.updateMenuItem(editingMenuItem._id, menuItemData);
        setNotification({
          type: 'success',
          message: `${menuItemData.name} updated successfully`
        });
      } else {
        // Create new item
        await apiService.menu.createMenuItem(menuItemData);
        setNotification({
          type: 'success',
          message: `${menuItemData.name} added successfully`
        });
      }

      // Reset form and close modal
      setMenuItemForm({
        name: '',
        description: '',
        price: '',
        category: '',
        allergens: '',
        allergenNotes: '',
        dietaryInfo: [],
        available: true,
        customizations: []
      });
      setEditingMenuItem(null);
      setShowMenuItemModal(false);
      
      // Force refresh menu items
      await loadMenuItems(true);

    } catch (error: any) {
      console.error('Error saving menu item:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to save menu item'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuItemForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : item.allergens || '',
      allergenNotes: item.allergenNotes || '',
      dietaryInfo: item.dietaryInfo || [],
      available: item.available !== false,
      customizations: item.customizations || []
    });
    setShowMenuItemModal(true);
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await apiService.menu.deleteMenuItem(itemId);
      setNotification({
        type: 'success',
        message: 'Menu item deleted successfully'
      });
      // Force refresh after deletion
      await loadMenuItems(true);
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to delete menu item'
      });
    }
  };

  // Table management functions
  const handleUpdateTable = async (tableNumber: string, updates: any) => {
    try {
      setIsLoading(true);
      await apiService.restaurants.updateTable(tableNumber, updates);
      
      // Refresh restaurant data
      await loadRestaurant();
      
      setNotification({
        type: 'success',
        message: `Table ${tableNumber} updated successfully`
      });
    } catch (error) {
      console.error('Error updating table:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update table'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTable = async (tableNumber: string) => {
    try {
      setIsLoading(true);
      await apiService.restaurants.deleteTable(tableNumber);
      
      // Refresh restaurant data
      await loadRestaurant();
      
      setNotification({
        type: 'success',
        message: `Table ${tableNumber} deleted successfully`
      });
    } catch (error: any) {
      console.error('Error deleting table:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete table'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = async (tableNumber: string) => {
    try {
      if (!restaurant) return;
      
      const qrData = await apiService.restaurants.getTableQR(tableNumber, restaurant._id);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = qrData.qrCode;
      link.download = `table-${tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setNotification({
        type: 'success',
        message: `QR code for Table ${tableNumber} downloaded`
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      setNotification({
        type: 'error',
        message: 'Failed to generate QR code'
      });
    }
  };

  const handleDownloadAllQR = async () => {
    try {
      if (!restaurant?.tables.length) return;
      
      setNotification({
        type: 'success',
        message: 'Downloading QR codes...'
      });
      
      // Generate and download QR codes for all tables
      for (const table of restaurant.tables) {
        await handleGenerateQR(table.tableNumber);
        // Add a small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setNotification({
        type: 'success',
        message: 'All QR codes downloaded successfully'
      });
    } catch (error) {
      console.error('Error downloading QR codes:', error);
      setNotification({
        type: 'error',
        message: 'Failed to download some QR codes'
      });
    }
  };

  // Table addition handler
  const handleAddTable = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate form
      if (!tableForm.tableNumber.trim()) {
        setNotification({
          type: 'error',
          message: 'Table number is required'
        });
        return;
      }

      if (!tableForm.capacity || parseInt(tableForm.capacity) < 1) {
        setNotification({
          type: 'error',
          message: 'Valid capacity is required'
        });
        return;
      }

      // Check for duplicate table numbers
      if (restaurant?.tables.some(table => table.tableNumber === tableForm.tableNumber.trim())) {
        setNotification({
          type: 'error',
          message: 'Table number already exists'
        });
        return;
      }

      const tableData = {
        tableNumber: tableForm.tableNumber.trim(),
        capacity: parseInt(tableForm.capacity),
        status: 'available' // Default status
      };

      await apiService.restaurants.addTable(tableData);
      
      // Reset form and close modal
      setTableForm({ tableNumber: '', capacity: '' });
      setShowTableModal(false);
      
      // Refresh restaurant data to show new table
      await loadRestaurant();
      
      setNotification({
        type: 'success',
        message: `Table ${tableData.tableNumber} added successfully`
      });
    } catch (error: any) {
      console.error('Error adding table:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to add table'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login form
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center backdrop-blur-sm ${
          notification.type === 'success' 
            ? 'bg-green-50/90 border border-green-200 text-green-800' 
            : 'bg-red-50/90 border border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-3" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-3" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <AdminHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={logout} 
      />

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <span className="text-red-700 flex-1">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-600 hover:text-red-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            orders={orders}
            menuItems={menuItems}
            restaurant={restaurant}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersManagement 
            orders={orders}
            isLoading={isLoading}
            onRefresh={loadOrders}
            onUpdateOrderStatus={updateOrderStatus}
          />
        )}

        {activeTab === 'menu' && (
          <MenuManagement
            menuItems={menuItems}
            isLoading={isLoadingMenu || isDataLoading}
            onAddItem={() => setShowMenuItemModal(true)}
            onEditItem={handleEditMenuItem}
            onDeleteItem={handleDeleteMenuItem}
            onRefresh={() => loadMenuItems(true)} // Add manual refresh
          />
        )}

        {activeTab === 'tables' && (
          <TableManagement
            restaurant={restaurant}
            isLoading={isLoading}
            onAddTable={() => setShowTableModal(true)}
            onGenerateQR={handleGenerateQR}
            onDownloadQR={handleDownloadAllQR}
            onUpdateTable={handleUpdateTable}
            onDeleteTable={handleDeleteTable}
          />
        )}

        {activeTab === 'services' && (
          <ServiceRequests />
        )}

        {activeTab === 'reports' && (
          <ReportsSection 
            orders={orders}
            restaurant={restaurant} // Add this prop
            isLoading={isLoading}
          />
        )}

        {activeTab === 'settings' && (
          <RestaurantSettings
            restaurant={restaurant as RestaurantProfile | null}
            onUpdate={loadRestaurant}
            onNotification={showNotification}
          />
        )}
      </main>

      {/* Modals */}
      {showMenuItemModal && (
        <MenuItemModal 
          editingMenuItem={editingMenuItem}
          menuItemForm={menuItemForm}
          setMenuItemForm={setMenuItemForm}
          onSubmit={handleAddMenuItem}
          onClose={() => {
            setShowMenuItemModal(false);
            setEditingMenuItem(null);
            setMenuItemForm({
              name: '',
              description: '',
              price: '',
              category: '',
              allergens: '',
              allergenNotes: '',
              dietaryInfo: [],
              available: true,
              customizations: []
            });
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {showTableModal && (
        <TableModal
          tableForm={tableForm}
          setTableForm={setTableForm}
          onSubmit={handleAddTable}
          onClose={() => {
            setShowTableModal(false);
            setTableForm({ tableNumber: '', capacity: '' });
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {showQRModal && selectedTable && restaurant && (
        <QRModal 
          selectedTable={selectedTable}
          restaurant={restaurant}
          onClose={() => {
            setShowQRModal(false);
            setSelectedTable(null);
          }}
          onDownload={() => {}}
        />
      )}
    </div>
  );
}