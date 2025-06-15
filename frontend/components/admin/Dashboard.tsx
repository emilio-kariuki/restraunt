'use client';

import { Package, Clock, DollarSign, Users } from 'lucide-react';
import { Order, Restaurant } from '../../types/admin';
import { getDashboardStats, getStatusColor, getTableStatusColor } from '../../utils/adminUtils';

interface DashboardProps {
  orders: Order[];
  menuItems: any[];
  restaurant: Restaurant | null;
  setActiveTab: (tab: any) => void;
}

export default function Dashboard({ orders, menuItems, restaurant, setActiveTab }: DashboardProps) {
  const stats = getDashboardStats(orders, menuItems, restaurant);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold">Today's Orders</p>
              <p className="text-4xl font-bold">{stats.totalOrders}</p>
              <div className="w-16 h-1 bg-blue-300 rounded-full mt-2"></div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-semibold">Active Orders</p>
              <p className="text-4xl font-bold">{stats.activeOrders}</p>
              <div className="w-16 h-1 bg-green-300 rounded-full mt-2"></div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-semibold">Today's Revenue</p>
              <p className="text-4xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
              <div className="w-16 h-1 bg-purple-300 rounded-full mt-2"></div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-semibold">Menu Items</p>
              <p className="text-4xl font-bold">{stats.totalMenuItems}</p>
              <div className="w-16 h-1 bg-orange-300 rounded-full mt-2"></div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Recent Orders</h3>
            <button
              onClick={() => setActiveTab('orders')}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-sm px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-200 border border-gray-200">
                <div>
                  <p className="font-bold text-gray-900 text-lg">Table {order.tableId}</p>
                  <p className="text-sm text-gray-600 font-medium">#{order._id.slice(-6)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Table Status</h3>
            <button
              onClick={() => setActiveTab('tables')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Manage Tables
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {restaurant?.tables.slice(0, 4).map(table => (
              <div key={table.tableNumber} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-semibold text-gray-900 mb-2">Table {table.tableNumber}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getTableStatusColor(table.status)}`}>
                  {table.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}