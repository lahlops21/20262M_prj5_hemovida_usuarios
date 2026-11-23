import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginDoadorDto } from './dto/login-doador.dto';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // No maximo 5 tentativas por minuto para o mesmo IP + e-mail (depois disso: 429).
  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login/admin')
  loginAdmin(@Body() dto: LoginAdminDto) {
    return this.authService.loginEquipe(dto);
  }

  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login/doador')
  loginDoador(@Body() dto: LoginDoadorDto) {
    return this.authService.loginDoador(dto);
  }
}
