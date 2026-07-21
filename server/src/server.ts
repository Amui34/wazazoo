import "dotenv/config";
import { createApp } from "./app.js";

for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
  const value = process.env[key];
  if (!value || value.length < 32) {
    throw new Error(
      `${key} est manquant ou trop court (32 caractères minimum). Vérifie server/.env avant de démarrer.`
    );
  }
}

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = createApp();

app.listen(port, () => {
  console.log(`giglink API listening on http://localhost:${port}`);
});
