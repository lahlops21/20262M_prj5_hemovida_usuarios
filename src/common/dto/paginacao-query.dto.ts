import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Parametros de paginacao lidos da URL: GET /usuarios?page=2&limit=10
export class PaginacaoQueryDto {
  // Tudo na URL chega como texto. O @Type converte para numero antes de validar.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
