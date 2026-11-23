import { plainToInstance } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL e obrigatoria' })
  @Matches(/^mysql:\/\//, { message: 'DATABASE_URL deve comecar com mysql://' })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET deve ter no minimo 32 caracteres' })
  JWT_SECRET!: string;

  @IsString()
  @Matches(/^\d+(ms|s|m|h|d)$/, {
    message: 'JWT_EXPIRES_IN deve ser algo como 15m, 1h ou 7d',
  })
  JWT_EXPIRES_IN!: string;

  @IsInt({ message: 'PORT deve ser um numero inteiro' })
  @Min(1)
  @Max(65535)
  PORT!: number;

  // Primeiro ADMIN (passo 4). Opcionais, mas se um for informado o outro tambem e obrigatorio.
  // Integracao com o MS1 (passo 5). Sem elas, o login de doador responde 503 e os
  // endpoints internos ficam fechados - o resto da API funciona normalmente.
  @ValidateIf((o: EnvironmentVariables) => !!o.SERVICE_KEY)
  @IsString()
  @MinLength(32, { message: 'SERVICE_KEY deve ter no minimo 32 caracteres' })
  SERVICE_KEY?: string;

  @ValidateIf((o: EnvironmentVariables) => !!o.MS1_BASE_URL)
  @Matches(/^https?:\/\/[^\s/]+(:\d+)?(\/\S*)?$/, {
    message: 'MS1_BASE_URL deve ser uma URL como http://localhost:7501',
  })
  MS1_BASE_URL?: string;

  @ValidateIf((o: EnvironmentVariables) => !!o.ADMIN_SEED_PASSWORD)
  @IsEmail({}, { message: 'ADMIN_SEED_EMAIL deve ser um e-mail valido' })
  @MaxLength(200)
  ADMIN_SEED_EMAIL?: string;

  @ValidateIf((o: EnvironmentVariables) => !!o.ADMIN_SEED_EMAIL)
  @IsString()
  @MinLength(12, {
    message: 'ADMIN_SEED_PASSWORD deve ter no minimo 12 caracteres',
  })
  @MaxLength(72, {
    message: 'ADMIN_SEED_PASSWORD deve ter no maximo 72 caracteres',
  })
  ADMIN_SEED_PASSWORD?: string;
}

// Falha cedo e alto: se faltar algo, a aplicacao morre no start dizendo exatamente o que e.
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validado = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const erros = validateSync(validado, { skipMissingProperties: false });

  if (erros.length > 0) {
    const detalhes = erros
      .map((erro) => Object.values(erro.constraints ?? {}).join('; '))
      .join('\n  - ');
    throw new Error(
      `Configuracao invalida. Rode com "npm run start:dev" (Infisical) ou crie um .env local:\n  - ${detalhes}\n`,
    );
  }
  return validado;
}
