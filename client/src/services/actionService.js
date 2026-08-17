import api from './api';

export const actionService = {
  async getActionItems(params = {}) {
    const res = await api.get('/action-items', { params });
    return res.data;
  },

  async createActionItem(data) {
    const res = await api.post('/action-items', data);
    return res.data;
  },

  async updateActionItem(id, data) {
    const res = await api.put(`/action-items/${id}`, data);
    return res.data;
  },

  async deleteActionItem(id) {
    const res = await api.delete(`/action-items/${id}`);
    return res.data;
  },

  async getDashboardStats() {
    const res = await api.get('/dashboard');
    return res.data;
  }
};
