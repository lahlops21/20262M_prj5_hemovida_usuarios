import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginAdminDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email invalido' })
  @MaxLength(200)
  email!: string;

  // Sem limite minimo aqui: no login so comparamos. Limite maximo evita corpo gigante.
  @IsString()
  @MaxLength(200)
  senha!: string;
}
