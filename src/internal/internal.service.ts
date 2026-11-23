import { Injectable, NotFoundException } from '@nestjs/common';
import { Perfil } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CriarUsuarioDoadorDto } from './dto/criar-usuario-doador.dto';

@Injectable()
export class InternalService {
  constructor(private readonly prisma: PrismaService) {}

  // Idempotente por CPF: se o MS1 repetir a chamada (timeout, retry), nao duplica.
  // Se o usuario existia mas estava inativo (MS1 desfez um cadastro antes), reativa.
  async criarOuObterDoador({ cpf, nomeCompleto }: CriarUsuarioDoadorDto) {
    const existente = await this.prisma.usuario.findUnique({
      where: { usuario_cpf: cpf },
    });
    if (existente) {
      if (!existente.usuario_status) {
        await this.prisma.usuario.update({
          where: { usuario_id: existente.usuario_id },
          data: { usuario_status: true },
        });
      }
      return { id: Number(existente.usuario_id), criado: false };
    }

    const novo = await this.prisma.usuario.create({
      data: {
        usuario_perfil: Perfil.DOADOR,
        usuario_cpf: cpf,
        usuario_nome_completo: nomeCompleto ?? null,
      },
    });
    return { id: Number(novo.usuario_id), criado: true };
  }

  // Usado pelo MS1 para desfazer: se salvar o doador falhou, o usuario criado fica inativo.
  async desativarDoador(id: bigint): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { usuario_id: id },
    });
    if (!usuario || usuario.usuario_perfil !== Perfil.DOADOR) {
      throw new NotFoundException('Usuario nao encontrado.');
    }
    await this.prisma.usuario.update({
      where: { usuario_id: id },
      data: { usuario_status: false },
    });
  }
}
