import { Perfil } from '../generated/prisma/enums';

// Equipe interna: cadastrada pelo ADMIN. O DOADOR nunca passa por este modulo:
// o cadastro dele nasce no MS1 e chega ao MS4 por um endpoint interno (passo 5).
export const PERFIS_EQUIPE = [
  Perfil.ADMIN,
  Perfil.RECEPCAO,
  Perfil.ENFERMAGEM,
  Perfil.GESTOR_ESTOQUE,
  Perfil.GESTOR_DEMANDA,
] as const;
