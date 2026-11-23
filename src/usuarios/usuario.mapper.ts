import type { Usuario } from '../generated/prisma/client';

// O PrismaService ja esconde usuario_senha_hash de todas as consultas (omit global).
export type UsuarioSemSenha = Omit<Usuario, 'usuario_senha_hash'>;

// O que a API devolve: nomes limpos (nao os nomes das colunas) e ids como numero,
// o mesmo formato do "sub" que vai no token. Nunca inclui senha nem hash.
export function paraResposta(u: UsuarioSemSenha) {
  return {
    id: Number(u.usuario_id),
    perfil: u.usuario_perfil,
    nomeCompleto: u.usuario_nome_completo,
    email: u.usuario_email,
    matricula: u.usuario_matricula,
    hospitalId:
      u.usuario_hospital_id === null ? null : Number(u.usuario_hospital_id),
    ativo: u.usuario_status,
    dataCriacao: u.usuario_data_criacao,
  };
}
