import { ok, type Result } from "../result.js";
import type {
  IVaultRepository,
  TagCount,
} from "../../domain/repositories/IVaultRepository.js";

export type GetVaultTagsSuccess = {
  readonly tags: readonly TagCount[];
};

export class GetVaultTagsUseCase {
  constructor(private readonly vault: IVaultRepository) {}

  async execute(userId: string): Promise<Result<GetVaultTagsSuccess, never>> {
    const tags = await this.vault.countTagsByUserId(userId);
    return ok({ tags });
  }
}
