// Centralized API, WebSocket, and file upload endpoints
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

export const API_BASE = BASE_URL;
export const API_URL = BASE_URL ? `${BASE_URL}/api` : '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'));

export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${BASE_URL}${cleanPath}`;
};
