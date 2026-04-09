import { createServer } from "node:http";
import { CompleteOnboardingUseCase } from "./application/use-cases/CompleteOnboardingUseCase.js";
import { GetMeUseCase } from "./application/use-cases/GetMeUseCase.js";
import { LoginUseCase } from "./application/use-cases/LoginUseCase.js";
import { RegisterUserUseCase } from "./application/use-cases/RegisterUserUseCase.js";
import { ListPendingUsersUseCase } from "./application/use-cases/ListPendingUsersUseCase.js";
import { ReviewUserUseCase } from "./application/use-cases/ReviewUserUseCase.js";
import { CreatePersonalRewardUseCase } from "./application/use-cases/CreatePersonalRewardUseCase.js";
import { RedeemPersonalRewardUseCase } from "./application/use-cases/RedeemPersonalRewardUseCase.js";
import { ApplyInternalGamificationEventUseCase } from "./application/use-cases/ApplyInternalGamificationEventUseCase.js";
import { env } from "./infrastructure/config/env.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoUserRepository } from "./infrastructure/persistence/MongoUserRepository.js";
import { BcryptPasswordService } from "./infrastructure/security/BcryptPasswordService.js";
import { JwtTokenService } from "./infrastructure/security/JwtTokenService.js";
import { createApp } from "./presentation/http/createApp.js";

await connectMongo(env.authMongoUri);

const userRepository = new MongoUserRepository();
const passwordHasher = new BcryptPasswordService();
const tokenGenerator = new JwtTokenService(env.jwtSecret);
const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  passwordHasher,
);
const loginUseCase = new LoginUseCase(
  userRepository,
  passwordHasher,
  tokenGenerator,
);
const getMeUseCase = new GetMeUseCase(userRepository);
const completeOnboardingUseCase = new CompleteOnboardingUseCase(userRepository);
const listPendingUsersUseCase = new ListPendingUsersUseCase(userRepository);
const reviewUserUseCase = new ReviewUserUseCase(userRepository);
const createPersonalRewardUseCase = new CreatePersonalRewardUseCase(userRepository);
const redeemPersonalRewardUseCase = new RedeemPersonalRewardUseCase(userRepository);
const applyInternalGamificationEventUseCase = new ApplyInternalGamificationEventUseCase(
  userRepository,
);

const app = createApp({
  registerUserUseCase,
  loginUseCase,
  getMeUseCase,
  completeOnboardingUseCase,
  listPendingUsersUseCase,
  reviewUserUseCase,
  createPersonalRewardUseCase,
  redeemPersonalRewardUseCase,
  applyInternalGamificationEventUseCase,
  jwtSecret: env.jwtSecret,
  internalGamificationKey: env.internalGamificationKey,
});
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`auth-service listening on port ${env.port}`);
});
