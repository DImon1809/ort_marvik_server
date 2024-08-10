import { IsEmail, IsString, MinLength, Validate } from 'class-validator';

import { IsValidPassword } from 'src/decorators/password-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @Validate(IsValidPassword)
  password: string;
}
