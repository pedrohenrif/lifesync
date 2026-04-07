import { createServer } from "node:http";
import { GetMeUseCase } from "./application/use-cases/GetMeUseCase.js";
import { LoginUseCase } from "./application/use-cases/LoginUseCase.js";
import { RegisterUserUseCase } from "./application/use-cases/RegisterUserUseCase.js";
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

const app = createApp({
  registerUserUseCase,
  loginUseCase,
  getMeUseCase,
  jwtSecret: env.jwtSecret,
});
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`auth-service listening on port ${env.port}`);
});
