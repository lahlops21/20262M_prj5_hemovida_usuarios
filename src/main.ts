import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configurarApp(app);

  const config = app.get(ConfigService);

  // Atras de um gateway, o IP real vem no cabecalho X-Forwarded-For. TRUST_PROXY = quantos
  // proxies confiaveis existem na frente (1 = so o gateway). 0 = ignora o cabecalho (padrao).
  // So use >0 se o MS4 NAO for acessivel direto pela internet, senao qualquer um forja o IP.
  const proxies = config.get<number>('TRUST_PROXY', 0);
  if (proxies > 0) app.set('trust proxy', proxies);

  const porta = config.getOrThrow<number>('PORT');

  await app.listen(porta);
  Logger.log(`API no ar em http://localhost:${porta}`, 'Bootstrap');
}

void bootstrap();
