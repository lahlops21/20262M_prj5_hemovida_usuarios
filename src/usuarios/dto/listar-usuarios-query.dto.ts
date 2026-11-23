import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { PaginacaoQueryDto } from '../../common/dto/paginacao-query.dto';
import type { Perfil } from '../../generated/prisma/enums';
import { PERFIS_EQUIPE } from '../perfis';

// GET /usuarios?page=1&limit=10&perfil=ENFERMAGEM&ativo=true
export class ListarUsuariosQueryDto extends PaginacaoQueryDto {
  @IsOptional()
  @IsIn(PERFIS_EQUIPE, {
    message: `perfil deve ser um de: ${PERFIS_EQUIPE.join(', ')}`,
  })
  perfil?: Perfil;

  // Na URL tudo e texto: convertemos "true"/"false" antes de validar.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'ativo deve ser true ou false' })
  ativo?: boolean;
}
