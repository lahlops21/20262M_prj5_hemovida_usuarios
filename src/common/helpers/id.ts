import { BadRequestException } from '@nestjs/common';

// Os ids sao BIGINT. Lemos o id da URL como texto e so aceitamos digitos:
// "abc", "-1", "1.5" ou um numero gigante viram 400 em vez de erro no banco.
export function lerId(valor: string): bigint {
  if (!/^\d{1,18}$/.test(valor)) {
    throw new BadRequestException('id deve ser um numero inteiro positivo');
  }
  return BigInt(valor);
}
