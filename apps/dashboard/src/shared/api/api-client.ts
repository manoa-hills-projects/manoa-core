import ky from 'ky';

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || 'http://localhost:8787/api',
//   hooks: {
//     beforeRequest: [
//       request => {
//         // Aquí puedes meter el token de Better Auth si lo necesitas
//         const token = localStorage.getItem('auth_token');
//         if (token) request.headers.set('Authorization', `Bearer ${token}`);
//       }
//     ]
//   }
});