import api from './api';

const notificationService = {
  // Get all notifications (paginated)
  getNotifications: async (page = 0, size = 10) => {
    const response = await api.get(`/notifications?page=${page}&size=${size}`);
    return response.data;
  },

  // Get unread notifications
  getUnreadNotifications: async () => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread/count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    const response = await api.delete('/notifications/clear-all');
    return response.data;
  }
};

export default notificationService;

