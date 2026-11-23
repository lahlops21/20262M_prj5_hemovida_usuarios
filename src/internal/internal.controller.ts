import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { lerId } from '../common/helpers/id';
import { CriarUsuarioDoadorDto } from './dto/criar-usuario-doador.dto';
import { InternalService } from './internal.service';

// Rotas INTERNAS: so outros microsservicos (MS1) chamam, com x-service-key.
// @Public() so desliga o JWT; quem protege aqui e o ServiceKeyGuard.
// O gateway/front NAO deve expor o prefixo /internal.
@Public()
@UseGuards(ServiceKeyGuard)
@Controller('internal/usuarios')
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Post('doador')
  async criarDoador(
    @Body() dto: CriarUsuarioDoadorDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.internalService.criarOuObterDoador(dto);
    res.status(resultado.criado ? 201 : 200);
    return { id: resultado.id };
  }

  @Post(':id/desativar')
  @HttpCode(204)
  async desativar(@Param('id') id: string): Promise<void> {
    await this.internalService.desativarDoador(lerId(id));
  }
}
