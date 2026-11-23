import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator';
import { EhLatin1 } from '../../common/validators/eh-latin1.validator';
import { CpfValidoConstraint } from '../../common/validators/cpf.validator';

// Corpo que o MS1 envia ao MS4 quando um doador se cadastra.
export class CriarUsuarioDoadorDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @Validate(CpfValidoConstraint)
  cpf!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @EhLatin1()
  nomeCompleto?: string;
}
