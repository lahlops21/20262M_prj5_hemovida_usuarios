import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EhLatin1 } from '../../common/validators/eh-latin1.validator';
import type { Perfil } from '../../generated/prisma/enums';
import { PERFIS_EQUIPE } from '../perfis';

const aparar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const aparar_e_minusculo = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// Corpo do POST /usuarios (ADMIN cadastra alguem da equipe).
// Com forbidNonWhitelisted, qualquer campo fora desta lista (cpf, status, id...) da 400.
export class CreateUsuarioDto {
  @IsIn(PERFIS_EQUIPE, {
    message: `perfil deve ser um de: ${PERFIS_EQUIPE.join(', ')}`,
  })
  perfil!: Perfil;

  @Transform(aparar)
  @IsString()
  @IsNotEmpty({ message: 'nomeCompleto e obrigatorio' })
  @MaxLength(150)
  @EhLatin1()
  nomeCompleto!: string;

  @Transform(aparar_e_minusculo)
  @IsEmail({}, { message: 'email invalido' })
  @MaxLength(200)
  @EhLatin1()
  email!: string;

  // Senha inicial definida pelo admin. Nao usamos trim: espaco pode fazer parte da senha.
  // O maximo em BYTES (72) e conferido no service, por causa do limite do bcrypt.
  @IsString()
  @MinLength(8, { message: 'senha deve ter no minimo 8 caracteres' })
  @MaxLength(72, { message: 'senha deve ter no maximo 72 caracteres' })
  senha!: string;

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @IsNotEmpty({ message: 'matricula nao pode ser vazia' })
  @MaxLength(30)
  @EhLatin1()
  matricula?: string | null;

  // Obrigatorio para GESTOR_DEMANDA e proibido para os demais (conferido no service).
  // E so um numero: o hospital mora no banco do MS3, sem chave estrangeira.
  @IsOptional()
  @IsInt({ message: 'hospitalId deve ser um numero inteiro' })
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  hospitalId?: number | null;
}
