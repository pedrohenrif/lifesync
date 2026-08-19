import { createServer } from "node:http";
import { CreateHabitUseCase } from "./application/use-cases/CreateHabitUseCase.js";
import { ListHabitsUseCase } from "./application/use-cases/ListHabitsUseCase.js";
import { ToggleHabitUseCase } from "./application/use-cases/ToggleHabitUseCase.js";
import { UpdateHabitUseCase } from "./application/use-cases/UpdateHabitUseCase.js";
import { DeleteHabitUseCase } from "./application/use-cases/DeleteHabitUseCase.js";
import { ListUserIdsWithPendingHabitsTodayUseCase } from "./application/use-cases/ListUserIdsWithPendingHabitsTodayUseCase.js";
import { env } from "./infrastructure/config/env.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoHabitRepository } from "./infrastructure/persistence/MongoHabitRepository.js";
import { HttpGamificationNotifier } from "./infrastructure/integrations/HttpGamificationNotifier.js";
import { createApp } from "./presentation/http/createApp.js";

await connectMongo(env.habitsMongoUri);

const habitRepository = new MongoHabitRepository();
const gamificationNotifier =
  env.internalGamificationKey.length > 0
    ? new HttpGamificationNotifier(env.authServiceUrl, env.internalGamificationKey)
    : null;
const createHabitUseCase = new CreateHabitUseCase(habitRepository);
const listHabitsUseCase = new ListHabitsUseCase(habitRepository);
const toggleHabitUseCase = new ToggleHabitUseCase(habitRepository, gamificationNotifier);
const updateHabitUseCase = new UpdateHabitUseCase(habitRepository);
const deleteHabitUseCase = new DeleteHabitUseCase(habitRepository);
const listUserIdsWithPendingHabitsTodayUseCase = new ListUserIdsWithPendingHabitsTodayUseCase(
  habitRepository,
);

const app = createApp({
  createHabitUseCase,
  listHabitsUseCase,
  toggleHabitUseCase,
  updateHabitUseCase,
  deleteHabitUseCase,
  listUserIdsWithPendingHabitsTodayUseCase,
  jwtSecret: env.jwtSecret,
  internalServiceKey: env.internalGamificationKey,
});
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`habits-service listening on port ${env.port}`);
});
