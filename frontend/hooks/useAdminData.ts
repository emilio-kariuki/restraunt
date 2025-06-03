import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';
import { Order, MenuItem, Restaurant } from '../types/admin';

export const useAdminData = (activeTab: string, authToken: string | null, isAuthenticated: boolean) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      // Remove restaurantId from filters since it's handled by authentication
      const data = await apiService.orders.getOrders({
        limit: 100, // Increased limit for admin
        sortBy: 'orderTime',
        sortOrder: 'desc'
      });
      setOrders(data.orders || []);
    } catch (error) {
      throw error;
    }
  };

  const loadMenu = async () => {
    try {
      const restaurantData = await apiService.restaurants.getMyRestaurant();
      const restaurantId = restaurantData.restaurant._id;
      const data = await apiService.menu.getMenu(restaurantId);
      
      const items: MenuItem[] = [];
      Object.entries(data.menu).forEach(([category, categoryItems]: [string, any]) => {
        categoryItems.forEach((item: any) => {
          items.push({ ...item, category });
        });
      });
      setMenuItems(items);
    } catch (error) {
      throw error;
    }
  };

  const loadRestaurant = async () => {
    try {
      const data = await apiService.restaurants.getMyRestaurant();
      setRestaurant(data.restaurant);
    } catch (error) {
      throw error;
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'dashboard') {
        await Promise.all([loadOrders(), loadMenu(), loadRestaurant()]);
      } else if (activeTab === 'orders') {
        await loadOrders();
      } else if (activeTab === 'menu') {
        await loadMenu();
      } else if (activeTab === 'tables') {
        await loadRestaurant();
      } else if (activeTab === 'reports') {
        await loadOrders();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authToken && isAuthenticated) {
      loadData();
    }
  }, [authToken, isAuthenticated, activeTab]);

  return {
    orders,
    menuItems,
    restaurant,
    isLoading,
    error,
    loadOrders,
    loadMenu,
    loadRestaurant,
    setOrders,
    setMenuItems,
    setRestaurant,
    setError
  };
};