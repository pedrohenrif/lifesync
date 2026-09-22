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
import { SubscribePushUseCase } from "./application/use-cases/SubscribePushUseCase.js";
import { RequestPasswordResetUseCase } from "./application/use-cases/RequestPasswordResetUseCase.js";
import { ResetPasswordUseCase } from "./application/use-cases/ResetPasswordUseCase.js";
import { env, vapidIsConfigured } from "./infrastructure/config/env.js";
import { startEveningHabitPushCron } from "./infrastructure/jobs/eveningHabitPushCron.js";
import { configureWebPush } from "./infrastructure/push/webPushSender.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoUserRepository } from "./infrastructure/persistence/MongoUserRepository.js";
import { MongoPasswordResetRepository } from "./infrastructure/persistence/MongoPasswordResetRepository.js";
import { BcryptPasswordService } from "./infrastructure/security/BcryptPasswordService.js";
import { HmacResetCodeDigest } from "./infrastructure/security/HmacResetCodeDigest.js";
import { JwtTokenService } from "./infrastructure/security/JwtTokenService.js";
import { NodemailerSmtpEmailSender } from "./infrastructure/email/NodemailerSmtpEmailSender.js";
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
const subscribePushUseCase = new SubscribePushUseCase(userRepository);
const passwordResetRepository = new MongoPasswordResetRepository();
const resetCodeDigest = new HmacResetCodeDigest(env.jwtSecret);
const emailSender = new NodemailerSmtpEmailSender({
  host: env.smtpHost,
  port: env.smtpPort,
  user: env.smtpUser,
  pass: env.smtpPass,
  from: env.smtpFrom.length > 0 ? env.smtpFrom : env.smtpUser,
});
const requestPasswordResetUseCase = new RequestPasswordResetUseCase(
  userRepository,
  passwordResetRepository,
  resetCodeDigest,
  emailSender,
);
const resetPasswordUseCase = new ResetPasswordUseCase(
  userRepository,
  passwordResetRepository,
  resetCodeDigest,
  passwordHasher,
);

if (vapidIsConfigured) {
  configureWebPush(env.vapidPublicKey, env.vapidPrivateKey, env.vapidSubject);
}

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
  subscribePushUseCase,
  requestPasswordResetUseCase,
  resetPasswordUseCase,
  jwtSecret: env.jwtSecret,
  internalGamificationKey: env.internalGamificationKey,
  vapidConfigured: vapidIsConfigured,
});
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`auth-service listening on port ${env.port}`);
  startEveningHabitPushCron({
    enabled: env.enablePushReminderCron,
    userRepository,
    habitsServiceUrl: env.habitsServiceUrl,
    internalKey: env.internalGamificationKey,
    vapidConfigured: vapidIsConfigured,
  });
});
