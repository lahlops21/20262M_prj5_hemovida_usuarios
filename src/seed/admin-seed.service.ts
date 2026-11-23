import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { Perfil } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

// Cria o primeiro ADMIN quando a API sobe, se ele ainda nao existir.
// - Idempotente: rodar 10 vezes cria 1 so. Nunca altera a senha de quem ja existe.
// - So faz INSERT (a conta do banco da disciplina nao pode alterar tabelas).
// - A senha vem do Infisical/.env (ADMIN_SEED_PASSWORD) e NUNCA vai para o codigo nem para o log.
@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config
      .get<string>('ADMIN_SEED_EMAIL')
      ?.trim()
      .toLowerCase();
    const senha = this.config.get<string>('ADMIN_SEED_PASSWORD');

    if (!email || !senha) {
      this.logger.warn(
        'ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD nao definidos: nenhum ADMIN sera criado automaticamente.',
      );
      return;
    }

    const jaExiste = await this.prisma.usuario.findUnique({
      where: { usuario_email: email },
    });
    if (jaExiste) {
      this.logger.log('ADMIN inicial ja existe: nada a fazer.');
      return;
    }

    try {
      await this.prisma.usuario.create({
        data: {
          usuario_perfil: Perfil.ADMIN,
          usuario_nome_completo: 'Administrador',
          usuario_email: email,
          usuario_senha_hash: await bcrypt.hash(senha, 12),
        },
      });
      this.logger.log(`ADMIN inicial criado (${email}).`);
    } catch (erro) {
      // Duas instancias subindo juntas: a outra venceu a corrida. Tudo bem.
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        this.logger.log('ADMIN inicial ja existe: nada a fazer.');
        return;
      }
      throw erro;
    }
  }
}
