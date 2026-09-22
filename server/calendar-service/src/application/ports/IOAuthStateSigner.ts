/**
 * O parâmetro `state` do OAuth precisa ser assinado: é o único elo entre o
 * usuário que iniciou o fluxo e o callback, que a Google chama sem cookies.
 */
export interface IOAuthStateSigner {
  sign(userId: string): string;
  /** Retorna o userId, ou null se o state for inválido, expirado ou de outro propósito. */
  verify(state: string): string | null;
}
