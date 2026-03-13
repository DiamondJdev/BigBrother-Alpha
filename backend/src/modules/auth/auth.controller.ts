import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { BodyRequiredGuard } from "./guard/body-required.guard";
import { JwtAuthGuard } from "./guard/jwt-auth.guard";
import { createUserDto } from "./dto/CreateUser.dto";
import { loginUserDto } from "./dto/loginUser.dto";
import type { AuthenticatedRequest } from "../common/AuthenticatedRequest";
import type { Response as ExpressResponse } from "express";

/** Max-age values for auth cookies */
const ACCESS_TOKEN_MAX_AGE_S = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_S = 7 * 24 * 3600; // 7 days

function setAuthCookies(
  res: ExpressResponse,
  accessToken: string,
  refreshToken: string,
): void {
  const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
  };
  res.cookie("access_token", accessToken, {
    ...cookieBase,
    maxAge: ACCESS_TOKEN_MAX_AGE_S * 1000,
  });
  res.cookie("refresh_token", refreshToken, {
    ...cookieBase,
    maxAge: REFRESH_TOKEN_MAX_AGE_S * 1000,
  });
}

function clearAuthCookies(res: ExpressResponse): void {
  const cookieBase = { httpOnly: true, path: "/" };
  res.clearCookie("access_token", cookieBase);
  res.clearCookie("refresh_token", cookieBase);
}

@Controller("/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  /**
   * Handles user login authentication
   * @param loginUserDto - The login credentials containing username and password
   * @returns Promise resolving to authentication result with user data and token on success,
   *          or error response with status 400 if credentials are missing/invalid
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 } }) // 5 login attempts per minute
  @UseGuards(BodyRequiredGuard) // Checks input before hitting route
  async login(
    @Body() loginUserDto: loginUserDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<{
    message: string;
    accessToken: string;
    refreshToken: string;
    user: { id: string; username: string; role: string };
    token_type: string;
  }> {
    const result = await this.authService.login(loginUserDto);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      ...result,
      token_type: "bearer",
    };
  }

  /**
   *
   * @param createUserDto The login credentials containing username and password
   * @param res The response object used to set auth cookies on successful registration
   * @throws BadRequestException if registration fails due to invalid input or username already taken
   * @returns Promise resolving to registration result with user data and token on success,
   */
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { ttl: 60000, limit: 5 } }) // 5 registration attempts per minute
  @UseGuards(BodyRequiredGuard) // Checks input before hitting route
  async register(
    @Body() createUserDto: createUserDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<{
    message: string;
    accessToken: string;
    refreshToken: string;
    user: { id: string; username: string; role: string };
    token_type: string;
  }> {
    const result = await this.authService.register(createUserDto);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      ...result,
      token_type: "bearer",
    };
  }

  /**
   * Refreshes the authentication tokens for a logged-in user.
   * The refresh token can be supplied as an HttpOnly cookie
   *
   * WARNING: Cannot be supplied in the body or query params, only cookies
   *
   * @param refreshTokenDto - Optional DTO containing the refresh token
   * @param req - The authenticated request object containing user information
   * @param res - The response object used to set updated auth cookies
   * @returns Promise resolving to refreshed tokens and user data with token type
   * @throws UnauthorizedException if refresh token is invalid, expired, or missing
   */
  @Patch("refresh")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async refresh(
    @Request() req: AuthenticatedRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken)
      throw new UnauthorizedException("Refresh token is missing");
    const result = await this.authService.refresh(req, refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      ...result,
      token_type: "bearer",
    };
  }

  /**
   * Route to end user session by clearing auth cookies AND
   * Removing stored tokens from the database to invalidate the session server-side.
   *
   * !: Requires a valid JWT token in the Authorization header to identify the user session to log out.
   *
   * @param res - The response object used to clear auth cookies on logout
   * @returns void
   * @throws UnauthorizedException if user is not authenticated (should be handled by JwtAuthGuard)
   * @description Logs out the user by clearing authentication cookies. Requires a valid JWT token in the Authorization header to identify the user session to log out.
   */
  @Delete("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Request() req: AuthenticatedRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<void> {
    // Clear stored tokens from database to completely invalidate the session
    await this.authService.invalidateUserTokens(req.user.id);
    clearAuthCookies(res);
  }

  /**
   * Get current user information - requires authorization header with
   * valid JWT bearer token
   * @returns status 200 on success with user data
   * @throws UnauthorizedException if no valid JWT token is provided
   * @throws ForbiddenException if user does not have access
   */
  @Get("me")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req: AuthenticatedRequest): {
    data: { id: string; username: string; role: string };
  } {
    return {
      data: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      },
    };
  }
}
