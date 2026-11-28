import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

// GET /usuarios/nomes?ids=1,13,20
export class ConsultarNomesQueryDto {
  // Na URL tudo e texto: "1,13" vira [1, 13]. Valor vazio ou com letras vira NaN e falha no IsInt.
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined) return value;
    const partes = (Array.isArray(value) ? value : [value]) as unknown[];
    return partes
      .flatMap((parte) => String(parte).split(','))
      .map((id) => (id.trim() === '' ? NaN : Number(id)));
  })
  @IsArray({ message: 'ids deve ser uma lista separada por virgula, ex.: ids=1,13' })
  @ArrayNotEmpty({ message: 'informe ao menos um id' })
  @ArrayMaxSize(50, { message: 'ids aceita no maximo 50 valores' })
  @IsInt({ each: true, message: 'cada id deve ser um numero inteiro' })
  @Min(1, { each: true, message: 'cada id deve ser positivo' })
  ids!: number[];
}
