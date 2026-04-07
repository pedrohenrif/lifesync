import { createServer } from "node:http";
import { SaveJournalEntryUseCase } from "./application/use-cases/SaveJournalEntryUseCase.js";
import { GetMonthlyJournalUseCase } from "./application/use-cases/GetMonthlyJournalUseCase.js";
import { GetTodayEntryUseCase } from "./application/use-cases/GetTodayEntryUseCase.js";
import { env } from "./infrastructure/config/env.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoJournalRepository } from "./infrastructure/persistence/MongoJournalRepository.js";
import { createApp } from "./presentation/http/createApp.js";

await connectMongo(env.journalMongoUri);

const journalRepository = new MongoJournalRepository();
const saveJournalEntryUseCase = new SaveJournalEntryUseCase(journalRepository);
const getMonthlyJournalUseCase = new GetMonthlyJournalUseCase(journalRepository);
const getTodayEntryUseCase = new GetTodayEntryUseCase(journalRepository);

const app = createApp({
  saveJournalEntryUseCase,
  getMonthlyJournalUseCase,
  getTodayEntryUseCase,
  jwtSecret: env.jwtSecret,
});
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`journal-service listening on port ${env.port}`);
});
