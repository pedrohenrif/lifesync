import { createGateway } from "./createGateway.js";
import { env } from "./config/env.js";

const app = createGateway();

app.listen(env.port, () => {
  console.log(`🚀 API Gateway running on http://localhost:${env.port}`);
  console.log(`   Auth     -> ${env.authUrl}`);
  console.log(`   Goals    -> ${env.goalsUrl}`);
  console.log(`   Habits   -> ${env.habitsUrl}`);
  console.log(`   Finance  -> ${env.financeUrl}`);
  console.log(`   Journal  -> ${env.journalUrl}`);
  console.log(`   Vault    -> ${env.vaultUrl}`);
});
