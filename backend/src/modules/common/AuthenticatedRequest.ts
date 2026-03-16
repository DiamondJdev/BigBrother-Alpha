import { UserRole } from "./utils/userRole.enum";

export interface AuthenticatedRequest {
	user: {
		id: string;
		roles: UserRole[];
		username: string;
	};
	cookies?: {
		refreshToken?: string;
		accessToken?: string;
	};
}