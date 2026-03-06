import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "../../jwt/jwt.service";
import { DbService } from "../../db/db.service";

interface RequestWithUser {
  headers: {
    authorization?: string;
  };
  cookies?: {
    access_token?: string;
  };
  user?: {
    id: string;
    username: string;
    role: string;
    roles: string[];
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dbService: DbService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;

    // Extract token from Authorization header or HttpOnly cookie
    let token: string | undefined;
    if (authorization && typeof authorization === 'string') {
      const [bearer, headerToken] = authorization.split(" ");
      if (bearer !== "Bearer" || !headerToken) throw new UnauthorizedException("Invalid authorization format");
      token = headerToken;
    } else if (request.cookies?.access_token) {
      token = request.cookies.access_token;
    } else {
      throw new UnauthorizedException("Authorization header or access_token cookie is missing");
    }


    try {
      // Verify the token
      const payload = await this.jwtService.verifyAndDecode(token);
      if (!payload || !payload.sub) throw new UnauthorizedException("Invalid token");

      const user = await this.dbService.findOne(payload.sub);
      if (!user) throw new UnauthorizedException("User not found");
      
      // Attach user info to request, including roles array for compatibility with RolesGuard
      request.user = {
        id: user.id!,
        username: user.username,
        role: user.role,
        roles: [user.role], // Convert single role to array for RolesGuard compatibility
      };

      return true;
    } catch {
      throw new UnauthorizedException("Token validation failed");
    }
  }
}