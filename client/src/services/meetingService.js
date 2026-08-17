import api from './api';

export const meetingService = {
  async getMeetings(params = {}) {
    const res = await api.get('/meetings', { params });
    return res.data;
  },

  async getMeetingById(id) {
    const res = await api.get(`/meetings/${id}`);
    return res.data;
  },

  async createMeeting(formData) {
    // Check if formData is instance of FormData (for file upload)
    const isFormData = formData instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await api.post('/meetings', formData, config);
    return res.data;
  },

  async updateMeeting(id, data) {
    const res = await api.put(`/meetings/${id}`, data);
    return res.data;
  },

  async deleteMeeting(id) {
    const res = await api.delete(`/meetings/${id}`);
    return res.data;
  },

  async processMeetingAI(id) {
    const res = await api.post(`/meetings/${id}/process`);
    return res.data;
  },

  async processAI(id) {
    const res = await api.post(`/meetings/${id}/process`);
    return res.data;
  }
};
