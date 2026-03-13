import { IsDate, IsString } from "class-validator";
import { UserRole } from "src/modules/common/utils/userRole.enum";

/**
 * DTO for returning user data without sensitive information 
 * like password and refresh token.
 */
export class userReturnDto {
    @IsString()
    id: string;

    @IsString()
    username: string;

    @IsDate()
    createdAt: Date;

    @IsString()
    roles: UserRole[];
}
