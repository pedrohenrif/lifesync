import { createServer } from "node:http";
import { CreateHabitUseCase } from "./application/use-cases/CreateHabitUseCase.js";
import { ListHabitsUseCase } from "./application/use-cases/ListHabitsUseCase.js";
import { ToggleHabitUseCase } from "./application/use-cases/ToggleHabitUseCase.js";
import { UpdateHabitUseCase } from "./application/use-cases/UpdateHabitUseCase.js";
import { DeleteHabitUseCase } from "./application/use-cases/DeleteHabitUseCase.js";
import { env } from "./infrastructure/config/env.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoHabitRepository } from "./infrastructure/persistence/MongoHabitRepository.js";
import { createApp } from "./presentation/http/createApp.js";

await connectMongo(env.habitsMongoUri);

const habitRepository = new MongoHabitRepository();
const createHabitUseCase = new CreateHabitUseCase(habitRepository);
const listHabitsUseCase = new ListHabitsUseCase(habitRepository);
const toggleHabitUseCase = new ToggleHabitUseCase(habitRepository);
const updateHabitUseCase = new UpdateHabitUseCase(habitRepository);
const deleteHabitUseCase = new DeleteHabitUseCase(habitRepository);

const app = createApp({
  createHabitUseCase,
  listHabitsUseCase,
  toggleHabitUseCase,
  updateHabitUseCase,
  deleteHabitUseCase,
  jwtSecret: env.jwtSecret,
});
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`habits-service listening on port ${env.port}`);
});
