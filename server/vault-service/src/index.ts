import { createServer } from "node:http";
import { CreateNoteUseCase } from "./application/use-cases/CreateNoteUseCase.js";
import { GetNotesByUserUseCase } from "./application/use-cases/GetNotesByUserUseCase.js";
import { UpdateNoteUseCase } from "./application/use-cases/UpdateNoteUseCase.js";
import { DeleteNoteUseCase } from "./application/use-cases/DeleteNoteUseCase.js";
import { GetVaultTagsUseCase } from "./application/use-cases/GetVaultTagsUseCase.js";
import { env } from "./infrastructure/config/env.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoVaultRepository } from "./infrastructure/persistence/MongoVaultRepository.js";
import { createApp } from "./presentation/http/createApp.js";

await connectMongo(env.vaultMongoUri);

const vaultRepository = new MongoVaultRepository();
const createNoteUseCase = new CreateNoteUseCase(vaultRepository);
const getNotesUseCase = new GetNotesByUserUseCase(vaultRepository);
const updateNoteUseCase = new UpdateNoteUseCase(vaultRepository);
const deleteNoteUseCase = new DeleteNoteUseCase(vaultRepository);
const getVaultTagsUseCase = new GetVaultTagsUseCase(vaultRepository);

const app = createApp({
  createNoteUseCase,
  getNotesUseCase,
  updateNoteUseCase,
  deleteNoteUseCase,
  getVaultTagsUseCase,
  jwtSecret: env.jwtSecret,
});
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`vault-service listening on port ${env.port}`);
});
