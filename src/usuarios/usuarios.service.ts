import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { Perfil } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { ListarUsuariosQueryDto } from './dto/listar-usuarios-query.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PERFIS_EQUIPE } from './perfis';
import { paraResposta } from './usuario.mapper';

// Custo do bcrypt: quanto maior, mais lento para quem tenta adivinhar senhas.
// 12 e o valor do material do professor.
const BCRYPT_CUSTO = 12;

// O bcrypt so olha os primeiros 72 BYTES da senha; o resto seria ignorado em silencio.
const LIMITE_BYTES_SENHA = 72;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  // POST /usuarios
  async criar(dto: CreateUsuarioDto) {
    this.validarSenha(dto.senha);
    const hospitalId = dto.hospitalId ?? null;
    this.validarHospital(dto.perfil, hospitalId);
    await this.garantirEmailEMatriculaLivres(
      dto.email,
      dto.matricula ?? undefined,
    );

    const usuario = await this.prisma.usuario.create({
      data: {
        usuario_perfil: dto.perfil,
        usuario_nome_completo: dto.nomeCompleto,
        usuario_email: dto.email,
        usuario_senha_hash: await bcrypt.hash(dto.senha, BCRYPT_CUSTO),
        usuario_matricula: dto.matricula ?? null,
        usuario_hospital_id: hospitalId === null ? null : BigInt(hospitalId),
      },
    });
    return paraResposta(usuario);
  }

  // GET /usuarios?page=1&limit=10&perfil=...&ativo=...
  async listar({ page, limit, perfil, ativo }: ListarUsuariosQueryDto) {
    const where: Prisma.UsuarioWhereInput = {
      usuario_perfil: perfil ?? { in: [...PERFIS_EQUIPE] },
      ...(ativo !== undefined && { usuario_status: ativo }),
    };

    const [total, usuarios] = await Promise.all([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        orderBy: { usuario_id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: usuarios.map(paraResposta),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // GET /usuarios/:id
  async buscarPorId(id: bigint) {
    return paraResposta(await this.buscarEquipeOuFalhar(id));
  }

  // PUT /usuarios/:id
  async atualizar(id: bigint, dto: UpdateUsuarioDto) {
    const atual = await this.buscarEquipeOuFalhar(id);

    // Em PUT parcial o class-validator deixa passar "null" nos campos opcionais.
    // Estes campos nunca podem ficar vazios para a equipe.
    for (const campo of [
      'perfil',
      'nomeCompleto',
      'email',
      'senha',
      'ativo',
    ] as const) {
      if (dto[campo] === null) {
        throw new BadRequestException(`${campo} nao pode ser nulo`);
      }
    }

    if (dto.senha !== undefined) this.validarSenha(dto.senha);

    const perfilFinal = dto.perfil ?? atual.usuario_perfil;
    const hospitalFinal = this.resolverHospital(perfilFinal, dto, atual);
    this.validarHospital(perfilFinal, hospitalFinal);

    if (dto.email !== undefined || dto.matricula) {
      await this.garantirEmailEMatriculaLivres(
        dto.email,
        dto.matricula ?? undefined,
        id,
      );
    }

    // Nao deixa o sistema ficar sem nenhum ADMIN ativo (ninguem mais cadastraria a equipe).
    const deixaDeSerAdminAtivo =
      atual.usuario_perfil === Perfil.ADMIN &&
      atual.usuario_status &&
      (perfilFinal !== Perfil.ADMIN || dto.ativo === false);
    if (deixaDeSerAdminAtivo) await this.garantirOutroAdminAtivo();

    const data: Prisma.UsuarioUpdateInput = {
      usuario_hospital_id: hospitalFinal,
    };
    if (dto.perfil !== undefined) data.usuario_perfil = dto.perfil;
    if (dto.nomeCompleto !== undefined)
      data.usuario_nome_completo = dto.nomeCompleto;
    if (dto.email !== undefined) data.usuario_email = dto.email;
    if (dto.matricula !== undefined) data.usuario_matricula = dto.matricula;
    if (dto.ativo !== undefined) data.usuario_status = dto.ativo;
    if (dto.senha !== undefined) {
      data.usuario_senha_hash = await bcrypt.hash(dto.senha, BCRYPT_CUSTO);
    }

    const atualizado = await this.prisma.usuario.update({
      where: { usuario_id: id },
      data,
    });
    return paraResposta(atualizado);
  }

  // DELETE /usuarios/:id - nunca apaga a linha: so marca como inativo (usuario_status = 0).
  async desativar(id: bigint): Promise<void> {
    const atual = await this.buscarEquipeOuFalhar(id);

    if (atual.usuario_perfil === Perfil.ADMIN && atual.usuario_status) {
      await this.garantirOutroAdminAtivo();
    }

    await this.prisma.usuario.update({
      where: { usuario_id: id },
      data: { usuario_status: false },
    });
  }

  // ---------- regras internas ----------

  // Este modulo so enxerga a equipe: uma linha de DOADOR responde 404, igual a "nao existe".
  private async buscarEquipeOuFalhar(id: bigint) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { usuario_id: id },
    });
    if (!usuario || usuario.usuario_perfil === Perfil.DOADOR) {
      throw new NotFoundException('Usuario nao encontrado.');
    }
    return usuario;
  }

  private validarSenha(senha: string): void {
    if (Buffer.byteLength(senha, 'utf8') > LIMITE_BYTES_SENHA) {
      throw new BadRequestException(
        `senha deve ter no maximo ${LIMITE_BYTES_SENHA} bytes (acentos e simbolos contam mais de 1)`,
      );
    }
  }

  // GESTOR_DEMANDA precisa de hospital; os outros perfis nao podem ter.
  private validarHospital(perfil: Perfil, hospitalId: unknown): void {
    if (perfil === Perfil.GESTOR_DEMANDA && hospitalId === null) {
      throw new BadRequestException(
        'hospitalId e obrigatorio para o perfil GESTOR_DEMANDA',
      );
    }
    if (perfil !== Perfil.GESTOR_DEMANDA && hospitalId !== null) {
      throw new BadRequestException(
        'hospitalId so pode ser informado para o perfil GESTOR_DEMANDA',
      );
    }
  }

  // Num PUT, descobre qual sera o hospital final do usuario.
  private resolverHospital(
    perfilFinal: Perfil,
    dto: UpdateUsuarioDto,
    atual: { usuario_hospital_id: bigint | null },
  ): bigint | null {
    if (dto.hospitalId !== undefined) {
      return dto.hospitalId === null ? null : BigInt(dto.hospitalId);
    }
    // Saiu de GESTOR_DEMANDA sem dizer nada sobre hospital: limpamos o vinculo antigo.
    if (perfilFinal !== Perfil.GESTOR_DEMANDA) return null;
    return atual.usuario_hospital_id;
  }

  // Mensagem clara antes de ir ao banco. O UNIQUE do banco continua como rede de
  // seguranca (duas requisicoes ao mesmo tempo) e o filtro do Prisma vira 409.
  private async garantirEmailEMatriculaLivres(
    email?: string,
    matricula?: string,
    ignorarId?: bigint,
  ): Promise<void> {
    const filtros: Prisma.UsuarioWhereInput[] = [];
    if (email) filtros.push({ usuario_email: email });
    if (matricula) filtros.push({ usuario_matricula: matricula });
    if (filtros.length === 0) return;

    const existente = await this.prisma.usuario.findFirst({
      where: {
        OR: filtros,
        ...(ignorarId !== undefined && { NOT: { usuario_id: ignorarId } }),
      },
    });
    if (!existente) return;

    if (email && existente.usuario_email?.toLowerCase() === email) {
      throw new ConflictException('Ja existe um usuario com este e-mail.');
    }
    throw new ConflictException('Ja existe um usuario com esta matricula.');
  }

  private async garantirOutroAdminAtivo(): Promise<void> {
    const admins = await this.prisma.usuario.count({
      where: { usuario_perfil: Perfil.ADMIN, usuario_status: true },
    });
    if (admins <= 1) {
      throw new ConflictException(
        'Nao e possivel remover ou desativar o ultimo ADMIN ativo.',
      );
    }
  }
}
