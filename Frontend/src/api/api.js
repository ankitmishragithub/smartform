import axios from 'axios';

const api = axios.create({
  baseURL: window.location.origin + "/api",
  headers: { 'Content-Type': 'application/json' }
});

export default api;
