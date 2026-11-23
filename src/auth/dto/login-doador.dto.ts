import { Transform } from 'class-transformer';
import { Matches, Validate } from 'class-validator';
import { CpfValidoConstraint } from '../../common/validators/cpf.validator';

export class LoginDoadorDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @Validate(CpfValidoConstraint)
  cpf!: string;

  // Formato AAAA-MM-DD (o mesmo que o MS1 guarda). Comparado como texto, sem fuso horario.
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'dataNascimento deve estar no formato AAAA-MM-DD',
  })
  dataNascimento!: string;
}
