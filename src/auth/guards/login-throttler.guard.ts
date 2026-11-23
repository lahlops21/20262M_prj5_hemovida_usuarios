import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Limita tentativas por IP + e-mail (equipe) ou CPF (doador). Com um gateway/Next na frente, o IP e sempre o
// mesmo servidor; por isso o e-mail/CPF entra na chave (senao um usuario bloquearia todos).
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const corpo = req.body as { email?: unknown; cpf?: unknown } | undefined;
    const identificador =
      typeof corpo?.email === 'string'
        ? corpo.email.trim().toLowerCase()
        : typeof corpo?.cpf === 'string'
          ? corpo.cpf.replace(/\D/g, '')
          : '';
    return Promise.resolve(`${String(req.ip)}|${identificador}`);
  }
}
