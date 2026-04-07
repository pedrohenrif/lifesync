import { ok, type Result } from "../result.js";

export type PlaceholderHealthError = { readonly code: "UNAVAILABLE" };

/**
 * Use case de exemplo: um único método público `execute`, retorno Result.
 * Substituir por registro/login quando o domínio estiver definido.
 */
export class PlaceholderHealthUseCase {
  execute(): Result<{ readonly status: "ok" }, PlaceholderHealthError> {
    return ok({ status: "ok" });
  }
}
