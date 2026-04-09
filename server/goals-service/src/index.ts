import { createServer } from "node:http";
import { CreateGoalUseCase } from "./application/use-cases/CreateGoalUseCase.js";
import { ListUserGoalsUseCase } from "./application/use-cases/ListUserGoalsUseCase.js";
import { UpdateGoalUseCase } from "./application/use-cases/UpdateGoalUseCase.js";
import { DeleteGoalUseCase } from "./application/use-cases/DeleteGoalUseCase.js";
import { AddTaskToGoalUseCase } from "./application/use-cases/AddTaskToGoalUseCase.js";
import { ToggleGoalTaskUseCase } from "./application/use-cases/ToggleGoalTaskUseCase.js";
import { RemoveTaskFromGoalUseCase } from "./application/use-cases/RemoveTaskFromGoalUseCase.js";
import { env } from "./infrastructure/config/env.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoGoalRepository } from "./infrastructure/persistence/MongoGoalRepository.js";
import { HttpGamificationNotifier } from "./infrastructure/integrations/HttpGamificationNotifier.js";
import { createApp } from "./presentation/http/createApp.js";

await connectMongo(env.goalsMongoUri);

const goalRepository = new MongoGoalRepository();
const gamificationNotifier =
  env.internalGamificationKey.length > 0
    ? new HttpGamificationNotifier(env.authServiceUrl, env.internalGamificationKey)
    : null;
const createGoalUseCase = new CreateGoalUseCase(goalRepository);
const listUserGoalsUseCase = new ListUserGoalsUseCase(goalRepository);
const updateGoalUseCase = new UpdateGoalUseCase(goalRepository, gamificationNotifier);
const deleteGoalUseCase = new DeleteGoalUseCase(goalRepository);
const addTaskUseCase = new AddTaskToGoalUseCase(goalRepository);
const toggleTaskUseCase = new ToggleGoalTaskUseCase(goalRepository, gamificationNotifier);
const removeTaskUseCase = new RemoveTaskFromGoalUseCase(goalRepository);

const app = createApp({
  createGoalUseCase,
  listUserGoalsUseCase,
  updateGoalUseCase,
  deleteGoalUseCase,
  addTaskUseCase,
  toggleTaskUseCase,
  removeTaskUseCase,
  jwtSecret: env.jwtSecret,
});
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`goals-service listening on port ${env.port}`);
});
