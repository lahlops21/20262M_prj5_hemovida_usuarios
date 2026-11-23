import type { Request } from 'express';
import type { Perfil } from '../generated/prisma/enums';

// Contrato do token (o MS1 e o MS3 dependem disto - nao mude sem avisar a equipe):
// HS256, mesmo JWT_SECRET nos servicos, sub NUMERICO, claim "role", hospitalId so p/ GESTOR_DEMANDA.
export interface JwtPayload {
  sub: number;
  role: Perfil;
  hospitalId?: number;
}

export type RequisicaoAutenticada = Request & { user?: JwtPayload };
