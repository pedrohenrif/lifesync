import { createServer } from "node:http";
import { AiRunner } from "./application/services/AiRunner.js";
import { ParseFinanceCommandUseCase } from "./application/use-cases/ParseFinanceCommandUseCase.js";
import { SuggestNoteMetadataUseCase } from "./application/use-cases/SuggestNoteMetadataUseCase.js";
import { GetAiUsageUseCase } from "./application/use-cases/GetAiUsageUseCase.js";
import { env } from "./infrastructure/config/env.js";
import { OpenAiLanguageModel } from "./infrastructure/llm/OpenAiLanguageModel.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoAiUsageRepository } from "./infrastructure/persistence/MongoAiUsageRepository.js";
import { createApp } from "./presentation/http/createApp.js";

await connectMongo(env.aiMongoUri);

const languageModel = new OpenAiLanguageModel({
  apiKey: env.openAiApiKey,
  baseUrl: env.openAiBaseUrl,
  model: env.openAiModel,
  reasoningEffort: env.openAiReasoningEffort,
  timeoutMs: env.openAiTimeoutMs,
});

const usageRepository = new MongoAiUsageRepository();
const runner = new AiRunner(languageModel, usageRepository, env.monthlyBudgetUsd);

const app = createApp({
  parseFinanceCommandUseCase: new ParseFinanceCommandUseCase(runner),
  suggestNoteMetadataUseCase: new SuggestNoteMetadataUseCase(runner),
  getAiUsageUseCase: new GetAiUsageUseCase(
    usageRepository,
    env.monthlyBudgetUsd,
    env.openAiModel,
    languageModel.isEnabled(),
  ),
  jwtSecret: env.jwtSecret,
});

const server = createServer(app);

server.listen(env.port, () => {
  const status = languageModel.isEnabled()
    ? `model ${env.openAiModel}`
    : "OPENAI_API_KEY ausente — respostas de IA desabilitadas";
  console.log(`ai-service listening on port ${env.port} (${status})`);
});
