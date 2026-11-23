declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// O Prisma devolve BigInt (usuario_id e BIGINT) e o JSON.stringify nao sabe serializar
// BigInt: sem isto a API devolveria 500. Aqui o BigInt vira string nas respostas.
export function habilitarBigIntEmJson(): void {
  BigInt.prototype.toJSON = function (this: bigint): string {
    return this.toString();
  };
}
