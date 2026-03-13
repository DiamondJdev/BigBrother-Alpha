import { UserRole } from "./utils/userRole.enum";

export interface AuthenticatedRequest {
	user: {
		id: string;
		role: UserRole;
		username: string;
	};
	cookies?: {
		refresh_token?: string;
		access_token?: string;
	};
}