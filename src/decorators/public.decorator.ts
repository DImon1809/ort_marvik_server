import { SetMetadata, ExecutionContext } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

const metadataKey = 'public';

export const Public = () => SetMetadata(metadataKey, true);

export const isPublic = (ctx: ExecutionContext, reflector: Reflector) => {
  return reflector.getAllAndOverride<boolean>(metadataKey, [
    ctx.getHandler(),
    ctx.getClass(),
  ]);
};
