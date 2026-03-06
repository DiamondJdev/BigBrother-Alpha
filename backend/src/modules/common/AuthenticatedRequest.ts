export interface AuthenticatedRequest {
	user: {
		id: string;
		role: string;
		roles: string[];
		username: string;
	};
	cookies?: {
		refresh_token?: string;
		access_token?: string;
	};
}