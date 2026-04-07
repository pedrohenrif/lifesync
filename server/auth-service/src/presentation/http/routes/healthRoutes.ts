import { Router } from "express";
import { PlaceholderHealthUseCase } from "../../../application/use-cases/PlaceholderHealthUseCase.js";

export const healthRouter = Router();

const healthUseCase = new PlaceholderHealthUseCase();

healthRouter.get("/", (_req, res) => {
  const result = healthUseCase.execute();
  if (!result.ok) {
    res.status(503).json({ error: result.error });
    return;
  }
  res.json({ service: "auth-service", ...result.value });
});
