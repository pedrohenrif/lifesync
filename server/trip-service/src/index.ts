import { createServer } from "node:http";
import { CreateTripUseCase } from "./application/use-cases/CreateTripUseCase.js";
import { ListTripsUseCase } from "./application/use-cases/ListTripsUseCase.js";
import { GetTripUseCase } from "./application/use-cases/GetTripUseCase.js";
import { UpdateTripUseCase } from "./application/use-cases/UpdateTripUseCase.js";
import { DeleteTripUseCase } from "./application/use-cases/DeleteTripUseCase.js";
import { AddPackingItemUseCase } from "./application/use-cases/AddPackingItemUseCase.js";
import { UpdatePackingItemUseCase } from "./application/use-cases/UpdatePackingItemUseCase.js";
import { RemovePackingItemUseCase } from "./application/use-cases/RemovePackingItemUseCase.js";
import { AddChecklistItemUseCase } from "./application/use-cases/AddChecklistItemUseCase.js";
import { UpdateChecklistItemUseCase } from "./application/use-cases/UpdateChecklistItemUseCase.js";
import { RemoveChecklistItemUseCase } from "./application/use-cases/RemoveChecklistItemUseCase.js";
import { env } from "./infrastructure/config/env.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoTripRepository } from "./infrastructure/persistence/MongoTripRepository.js";
import { createApp } from "./presentation/http/createApp.js";

await connectMongo(env.tripsMongoUri);

const tripRepository = new MongoTripRepository();

const app = createApp({
  createTripUseCase: new CreateTripUseCase(tripRepository),
  listTripsUseCase: new ListTripsUseCase(tripRepository),
  getTripUseCase: new GetTripUseCase(tripRepository),
  updateTripUseCase: new UpdateTripUseCase(tripRepository),
  deleteTripUseCase: new DeleteTripUseCase(tripRepository),
  addPackingItemUseCase: new AddPackingItemUseCase(tripRepository),
  updatePackingItemUseCase: new UpdatePackingItemUseCase(tripRepository),
  removePackingItemUseCase: new RemovePackingItemUseCase(tripRepository),
  addChecklistItemUseCase: new AddChecklistItemUseCase(tripRepository),
  updateChecklistItemUseCase: new UpdateChecklistItemUseCase(tripRepository),
  removeChecklistItemUseCase: new RemoveChecklistItemUseCase(tripRepository),
  jwtSecret: env.jwtSecret,
});

const server = createServer(app);

server.listen(env.port, () => {
  console.log(`trip-service listening on port ${env.port}`);
});
