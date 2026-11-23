import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { cpfValido } from '../helpers/cpf';

@ValidatorConstraint({ name: 'cpfValido', async: false })
export class CpfValidoConstraint implements ValidatorConstraintInterface {
  validate(valor: unknown): boolean {
    return typeof valor === 'string' && cpfValido(valor);
  }
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} invalido (informe 11 digitos validos)`;
  }
}
