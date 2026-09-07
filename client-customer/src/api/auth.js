import { request } from './client.js';
export const loginTable = (credentials, signal) => request('/api/auth/table/login', { method: 'POST', body: credentials, signal });
