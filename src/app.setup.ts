import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { habilitarBigIntEmJson } from './common/helpers/bigint-json';

// Configuracao compartilhada entre a API real (main.ts) e, mais adiante, os testes e2e.
export function configurarApp(app: INestApplication): void {
  habilitarBigIntEmJson();

  // Cabecalhos de seguranca HTTP (CSP, X-Frame-Options, HSTS...).
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove do body qualquer campo que o DTO nao declare
      forbidNonWhitelisted: true, // e recusa (400) em vez de ignorar em silencio
      transform: true, // converte o JSON para a classe do DTO
    }),
  );
}
