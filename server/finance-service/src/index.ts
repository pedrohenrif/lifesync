import { env } from "./infrastructure/config/env.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoTransactionRepository } from "./infrastructure/persistence/MongoTransactionRepository.js";
import { MongoInvestmentRepository } from "./infrastructure/persistence/MongoInvestmentRepository.js";
import { CreateTransactionUseCase } from "./application/use-cases/CreateTransactionUseCase.js";
import { GetFinancialSummaryUseCase } from "./application/use-cases/GetFinancialSummaryUseCase.js";
import { DeleteTransactionUseCase } from "./application/use-cases/DeleteTransactionUseCase.js";
import { CreateInvestmentUseCase } from "./application/use-cases/CreateInvestmentUseCase.js";
import { ListInvestmentsUseCase } from "./application/use-cases/ListInvestmentsUseCase.js";
import { UpdateInvestmentBalanceUseCase } from "./application/use-cases/UpdateInvestmentBalanceUseCase.js";
import { DeleteInvestmentUseCase } from "./application/use-cases/DeleteInvestmentUseCase.js";
import { createApp } from "./presentation/http/createApp.js";

async function bootstrap(): Promise<void> {
  await connectMongo(env.financeMongoUri);
  console.log("[finance-service] Connected to MongoDB");

  const transactionRepository = new MongoTransactionRepository();
  const investmentRepository = new MongoInvestmentRepository();

  const createTransactionUseCase = new CreateTransactionUseCase(transactionRepository);
  const getFinancialSummaryUseCase = new GetFinancialSummaryUseCase(transactionRepository);
  const deleteTransactionUseCase = new DeleteTransactionUseCase(transactionRepository);

  const createInvestmentUseCase = new CreateInvestmentUseCase(investmentRepository);
  const listInvestmentsUseCase = new ListInvestmentsUseCase(investmentRepository);
  const updateInvestmentBalanceUseCase = new UpdateInvestmentBalanceUseCase(investmentRepository);
  const deleteInvestmentUseCase = new DeleteInvestmentUseCase(investmentRepository);

  const app = createApp({
    jwtSecret: env.jwtSecret,
    createTransactionUseCase,
    getFinancialSummaryUseCase,
    deleteTransactionUseCase,
    createInvestmentUseCase,
    listInvestmentsUseCase,
    updateInvestmentBalanceUseCase,
    deleteInvestmentUseCase,
  });

  app.listen(env.port, () => {
    console.log(`[finance-service] Running on port ${env.port}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("[finance-service] Failed to start:", error);
  process.exit(1);
});
