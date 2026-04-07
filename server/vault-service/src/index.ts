import { createServer } from "node:http";
import { CreateNoteUseCase } from "./application/use-cases/CreateNoteUseCase.js";
import { GetNotesByUserUseCase } from "./application/use-cases/GetNotesByUserUseCase.js";
import { DeleteNoteUseCase } from "./application/use-cases/DeleteNoteUseCase.js";
import { env } from "./infrastructure/config/env.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoVaultRepository } from "./infrastructure/persistence/MongoVaultRepository.js";
import { createApp } from "./presentation/http/createApp.js";

await connectMongo(env.vaultMongoUri);

const vaultRepository = new MongoVaultRepository();
const createNoteUseCase = new CreateNoteUseCase(vaultRepository);
const getNotesUseCase = new GetNotesByUserUseCase(vaultRepository);
const deleteNoteUseCase = new DeleteNoteUseCase(vaultRepository);

const app = createApp({
  createNoteUseCase,
  getNotesUseCase,
  deleteNoteUseCase,
  jwtSecret: env.jwtSecret,
});
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`vault-service listening on port ${env.port}`);
});
