import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Perfil } from '../generated/prisma/enums';
import { lerId } from '../common/helpers/id';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { ListarUsuariosQueryDto } from './dto/listar-usuarios-query.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuariosService } from './usuarios.service';

// Todas as rotas deste controller: so ADMIN (o login e global, ver app.module.ts).
@Roles(Perfil.ADMIN)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  criar(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.criar(dto);
  }

  @Get()
  listar(@Query() query: ListarUsuariosQueryDto) {
    return this.usuariosService.listar(query);
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.usuariosService.buscarPorId(lerId(id));
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.atualizar(lerId(id), dto);
  }

  // Nao apaga: marca como inativo. Para reativar, use PUT com { "ativo": true }.
  @Delete(':id')
  @HttpCode(204)
  async desativar(@Param('id') id: string): Promise<void> {
    await this.usuariosService.desativar(lerId(id));
  }
}
