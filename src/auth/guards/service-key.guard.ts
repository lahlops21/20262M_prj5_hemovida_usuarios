import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

// Protege os endpoints INTERNOS (chamados so por outros microsservicos, nunca pelo front).
// Quem chama manda o cabecalho "x-service-key" com o segredo compartilhado (SERVICE_KEY).
@Injectable()
export class ServiceKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(contexto: ExecutionContext): boolean {
    const esperada = this.config.get<string>('SERVICE_KEY');
    const recebida = contexto.switchToHttp().getRequest<Request>().headers[
      'x-service-key'
    ];

    // Sem SERVICE_KEY configurada o endpoint fica FECHADO (nunca aberto por esquecimento).
    if (!esperada || typeof recebida !== 'string') {
      throw new UnauthorizedException('Chave de servico invalida.');
    }
    const a = Buffer.from(recebida);
    const b = Buffer.from(esperada);
    // timingSafeEqual exige o mesmo tamanho; comparar em tempo constante evita vazar a chave.
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Chave de servico invalida.');
    }
    return true;
  }
}
