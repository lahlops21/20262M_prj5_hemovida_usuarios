import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

// O driver "mariadb" so aceita URLs que comecam com mariadb://, mas a CLI do Prisma
// exige mysql://. Mantemos UMA variavel (DATABASE_URL) e convertemos aqui.
function paraUrlDoDriver(url: string): string {
  return url.replace(/^mysql:\/\//, 'mariadb://');
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      adapter: new PrismaMariaDb(
        paraUrlDoDriver(config.getOrThrow<string>('DATABASE_URL')),
      ),
      // Nenhuma consulta da aplicacao devolve o hash da senha. O unico ponto que
      // precisa dele (o login) vai pedir explicitamente com omit: { usuario_senha_hash: false }.
      omit: {
        usuario: { usuario_senha_hash: true },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    // Com o adapter do MariaDB, o $connect() sozinho NAO derruba o start quando o banco
    // esta inacessivel (testado). O SELECT 1 forca uma consulta de verdade: se o banco
    // estiver fora do ar ou a senha estiver errada, a aplicacao morre aqui, no start,
    // e o log "Conectado" deixa de ser mentira.
    await this.$queryRaw`SELECT 1`;
    this.logger.log('Conectado ao banco de dados');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Desconectado do banco de dados');
  }
}
