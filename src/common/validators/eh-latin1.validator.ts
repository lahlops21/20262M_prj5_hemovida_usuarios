import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// O banco da disciplina e latin1: emoji e simbolos fora desse conjunto seriam
// gravados errado (ou dariam erro). Recusamos antes, com uma mensagem clara.
export function EhLatin1(options?: ValidationOptions) {
  return function (objeto: object, propriedade: string): void {
    registerDecorator({
      name: 'ehLatin1',
      target: objeto.constructor,
      propertyName: propriedade,
      options,
      validator: {
        validate(valor: unknown): boolean {
          if (typeof valor !== 'string') return true;
          for (let i = 0; i < valor.length; i++) {
            if (valor.charCodeAt(i) > 255) return false;
          }
          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} contem caracteres que o banco nao consegue armazenar (emoji ou simbolos fora do latin1)`;
        },
      },
    });
  };
}
