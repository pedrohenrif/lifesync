import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { GoogleAccessTokenProvider } from "./application/services/GoogleAccessTokenProvider.js";
import { StartGoogleAuthUseCase } from "./application/use-cases/StartGoogleAuthUseCase.js";
import { CompleteGoogleAuthUseCase } from "./application/use-cases/CompleteGoogleAuthUseCase.js";
import { GetConnectionStatusUseCase } from "./application/use-cases/GetConnectionStatusUseCase.js";
import { DisconnectGoogleUseCase } from "./application/use-cases/DisconnectGoogleUseCase.js";
import { ListEventsUseCase } from "./application/use-cases/ListEventsUseCase.js";
import { CreateEventUseCase } from "./application/use-cases/CreateEventUseCase.js";
import { UpdateEventUseCase } from "./application/use-cases/UpdateEventUseCase.js";
import { DeleteEventUseCase } from "./application/use-cases/DeleteEventUseCase.js";
import { env } from "./infrastructure/config/env.js";
import { JwtOAuthStateSigner } from "./infrastructure/auth/JwtOAuthStateSigner.js";
import { AesGcmTokenCipher } from "./infrastructure/crypto/AesGcmTokenCipher.js";
import { GoogleOAuthHttpClient } from "./infrastructure/google/GoogleOAuthHttpClient.js";
import { GoogleCalendarHttpClient } from "./infrastructure/google/GoogleCalendarHttpClient.js";
import { connectMongo } from "./infrastructure/persistence/mongoose/connectMongo.js";
import { MongoGoogleConnectionRepository } from "./infrastructure/persistence/MongoGoogleConnectionRepository.js";
import { createApp } from "./presentation/http/createApp.js";

await connectMongo(env.calendarMongoUri);

const oauthClient = new GoogleOAuthHttpClient({
  clientId: env.googleClientId,
  clientSecret: env.googleClientSecret,
  redirectUri: env.googleRedirectUri,
});

/**
 * Sem credenciais OAuth nenhuma conexão pode ser criada, então uma chave efêmera
 * mantém o serviço de pé em ambiente local sem exigir configuração. Com OAuth
 * ativo a chave é obrigatória: perdê-la invalidaria os refresh tokens salvos.
 */
function resolveEncryptionKey(): string {
  if (env.tokenEncryptionKey.trim().length > 0) return env.tokenEncryptionKey;
  if (oauthClient.isConfigured()) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is required when Google OAuth is configured. Generate one with: openssl rand -base64 32",
    );
  }
  console.warn(
    "TOKEN_ENCRYPTION_KEY ausente — usando chave efêmera (integração Google desabilitada)",
  );
  return randomBytes(32).toString("base64");
}

const cipher = new AesGcmTokenCipher(resolveEncryptionKey());
const stateSigner = new JwtOAuthStateSigner(env.jwtSecret);
const connections = new MongoGoogleConnectionRepository();
const calendarClient = new GoogleCalendarHttpClient(env.calendarTimeZone);
const tokenProvider = new GoogleAccessTokenProvider(connections, oauthClient, cipher);

const app = createApp({
  startGoogleAuthUseCase: new StartGoogleAuthUseCase(oauthClient, stateSigner),
  completeGoogleAuthUseCase: new CompleteGoogleAuthUseCase(
    connections,
    oauthClient,
    stateSigner,
    cipher,
    tokenProvider,
  ),
  getConnectionStatusUseCase: new GetConnectionStatusUseCase(connections, oauthClient),
  disconnectGoogleUseCase: new DisconnectGoogleUseCase(connections, tokenProvider),
  listEventsUseCase: new ListEventsUseCase(tokenProvider, calendarClient),
  createEventUseCase: new CreateEventUseCase(tokenProvider, calendarClient),
  updateEventUseCase: new UpdateEventUseCase(tokenProvider, calendarClient),
  deleteEventUseCase: new DeleteEventUseCase(tokenProvider, calendarClient),
  jwtSecret: env.jwtSecret,
  appUrl: env.appUrl,
});

const server = createServer(app);

server.listen(env.port, () => {
  const status = oauthClient.isConfigured()
    ? "Google OAuth configurado"
    : "GOOGLE_CLIENT_ID/SECRET ausentes — integração desabilitada";
  console.log(`calendar-service listening on port ${env.port} (${status})`);
});
