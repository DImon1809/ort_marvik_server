import { Token } from '@prisma/client';

export interface ITokens {
  accessToken: string;
  refreshToken: Partial<Token>;
}

export interface IJwtPayload {
  id: string;
  email: string;
}
