import { SetMetadata } from '@nestjs/common';
import type { Perfil } from '../../generated/prisma/enums';

export const ROLES_KEY = 'roles';

// Restringe a rota a certos perfis: @Roles(Perfil.ADMIN)
export const Roles = (...perfis: Perfil[]) => SetMetadata(ROLES_KEY, perfis);
