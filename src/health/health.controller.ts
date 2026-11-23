import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  // Aberta de proposito: Docker/Jenkins checam a saude sem token.
  @Public()
  @Get()
  async verificar() {
    try {
      // Sem este SELECT 1, /health responderia 200 com o banco fora do ar.
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (erro) {
      this.logger.error(
        `Banco inacessivel: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
      throw new ServiceUnavailableException({
        status: 'erro',
        database: 'down',
      });
    }

    return {
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}
