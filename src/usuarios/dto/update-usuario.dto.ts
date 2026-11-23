import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto';

// PUT /usuarios/:id - todos os campos do cadastro, mas opcionais. Mais "ativo",
// que reativa (true) ou desativa (false) o usuario.
export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @IsOptional()
  @IsBoolean({ message: 'ativo deve ser true ou false' })
  ativo?: boolean;
}
