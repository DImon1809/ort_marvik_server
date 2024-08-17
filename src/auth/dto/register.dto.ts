import { IsEmail, IsString, MinLength, Validate } from 'class-validator';

import { IsValidPassword } from 'src/decorators/password-validator';

export class RegisterDto {
  @IsString()
  userName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(6)
  @Validate(IsValidPassword)
  repeatPassword: string;
}
