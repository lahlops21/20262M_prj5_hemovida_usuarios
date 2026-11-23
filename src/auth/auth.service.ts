import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Perfil } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { PERFIS_EQUIPE } from '../usuarios/perfis';
import type { JwtPayload } from './auth.types';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginDoadorDto } from './dto/login-doador.dto';

// Hash de uma senha qualquer. Se o e-mail nao existe, comparamos contra ele mesmo assim,
// para a resposta demorar o mesmo tempo e ninguem descobrir quais e-mails existem.
const HASH_FALSO = bcrypt.hashSync('senha-que-ninguem-usa', 12);

const ERRO_LOGIN = 'E-mail ou senha invalidos.';
const ERRO_LOGIN_DOADOR = 'CPF ou data de nascimento invalidos.';

// Tempo maximo esperando o MS1. Passou disso, respondemos 503 em vez de travar o login.
const TIMEOUT_MS1_MS = 5000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // POST /auth/login/admin - serve para toda a equipe (ADMIN, RECEPCAO, ENFERMAGEM, gestores).
  async loginEquipe({ email, senha }: LoginAdminDto) {
    // O PrismaService esconde o hash; aqui pedimos de volta, so para conferir a senha.
    const usuario = await this.prisma.usuario.findUnique({
      where: { usuario_email: email },
      omit: { usuario_senha_hash: false },
    });

    const hash = usuario?.usuario_senha_hash ?? HASH_FALSO;
    const senhaCorreta = await bcrypt.compare(senha, hash);

    const podeEntrar =
      usuario !== null &&
      senhaCorreta &&
      usuario.usuario_status &&
      (PERFIS_EQUIPE as readonly Perfil[]).includes(usuario.usuario_perfil);
    if (!podeEntrar) throw new UnauthorizedException(ERRO_LOGIN);

    return this.emitirToken(usuario);
  }

  // POST /auth/login/doador - o MS4 NAO guarda data de nascimento: pergunta ao MS1,
  // que e o dono desse dado, se CPF + data conferem para um doador ativo.
  async loginDoador({ cpf, dataNascimento }: LoginDoadorDto) {
    const confere = await this.perguntarAoMs1(cpf, dataNascimento);

    const usuario = await this.prisma.usuario.findUnique({
      where: { usuario_cpf: cpf },
    });
    // Mesma resposta para "CPF nao existe", "data errada" e "usuario inativo".
    if (
      !confere ||
      !usuario ||
      !usuario.usuario_status ||
      usuario.usuario_perfil !== Perfil.DOADOR
    ) {
      throw new UnauthorizedException(ERRO_LOGIN_DOADOR);
    }
    return this.emitirToken(usuario);
  }

  private async perguntarAoMs1(
    cpf: string,
    dataNascimento: string,
  ): Promise<boolean> {
    const baseUrl = this.config.get<string>('MS1_BASE_URL');
    const chave = this.config.get<string>('SERVICE_KEY');
    if (!baseUrl || !chave) {
      this.logger.error('MS1_BASE_URL/SERVICE_KEY nao configurados.');
      throw new ServiceUnavailableException('Login de doador indisponivel.');
    }

    try {
      const resposta = await fetch(
        `${baseUrl.replace(/\/$/, '')}/internal/doadores/validar-login`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-service-key': chave,
          },
          body: JSON.stringify({ cpf, dataNascimento }),
          signal: AbortSignal.timeout(TIMEOUT_MS1_MS),
        },
      );
      if (!resposta.ok) throw new Error(`MS1 respondeu ${resposta.status}`);
      const corpo = (await resposta.json()) as { valido?: unknown };
      return corpo.valido === true;
    } catch (erro) {
      // MS1 fora do ar, lento ou com erro: 503 (nao e culpa do doador, entao nao e 401).
      this.logger.error(
        `Falha ao consultar o MS1: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
      throw new ServiceUnavailableException('Login de doador indisponivel.');
    }
  }

  private async emitirToken(usuario: {
    usuario_id: bigint;
    usuario_perfil: Perfil;
    usuario_hospital_id: bigint | null;
  }) {
    const payload: JwtPayload = {
      sub: Number(usuario.usuario_id),
      role: usuario.usuario_perfil,
      ...(typeof usuario.usuario_hospital_id === 'bigint' && {
        hospitalId: Number(usuario.usuario_hospital_id),
      }),
    };
    const accessToken = await this.jwt.signAsync(payload);
    const { exp, iat } = this.jwt.decode<{ exp: number; iat: number }>(
      accessToken,
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: exp - iat,
      role: usuario.usuario_perfil,
    };
  }
}
