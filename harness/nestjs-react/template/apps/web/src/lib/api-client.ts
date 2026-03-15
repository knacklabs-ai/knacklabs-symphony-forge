import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message ?? error.message;
    return Promise.reject({ status, message, original: error });
  },
);

export async function getHealth() {
  const { data } = await apiClient.get('/api/v1/health/live');
  return data as { status: string; timestamp: string };
}
