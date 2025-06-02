export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'ready': return 'bg-green-100 text-green-800 border-green-200';
    case 'served': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getTableStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800 border-green-200';
    case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
    case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const getStatusButtonText = (currentStatus: string) => {
  switch (currentStatus) {
    case 'pending': return 'Confirm Order';
    case 'confirmed': return 'Start Preparing';
    case 'preparing': return 'Mark Ready';
    case 'ready': return 'Mark Served';
    default: return 'Update Status';
  }
};

export const getNextStatus = (currentStatus: string) => {
  switch (currentStatus) {
    case 'pending': return 'confirmed';
    case 'confirmed': return 'preparing';
    case 'preparing': return 'ready';
    case 'ready': return 'served';
    default: return currentStatus;
  }
};

export const getDashboardStats = (orders: any[], menuItems: any[], restaurant: any) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);
  const activeOrders = orders.filter(order => !['served', 'completed', 'cancelled'].includes(order.status));
  const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  
  return {
    totalOrders: todayOrders.length,
    activeOrders: activeOrders.length,
    totalRevenue,
    totalMenuItems: menuItems.length,
    totalTables: restaurant?.tables.length || 0
  };
};