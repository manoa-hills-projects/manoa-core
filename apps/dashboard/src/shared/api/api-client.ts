import ky from "ky";
import { env } from "@/env";

export interface ApiResponse<T> {
	data: T[];
	metadata: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export const api = ky.create({
	prefixUrl: env.VITE_API_URL || "http://localhost:8787/api",
	credentials: "include",
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
