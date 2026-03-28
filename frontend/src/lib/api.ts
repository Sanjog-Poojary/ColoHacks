import axios from 'axios';
import { auth } from './firebaseClient';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  const activeShopId = localStorage.getItem('activeShopId');
  if (activeShopId) {
    config.headers['X-Shop-Id'] = activeShopId;
  }
  return config;
});

export default api;