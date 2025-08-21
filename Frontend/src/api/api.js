import axios from 'axios';

const api = axios.create({
  //during development or buld use below baseURL
  //baseURL: window.location.origin + "/api",
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' }
});

export default api;