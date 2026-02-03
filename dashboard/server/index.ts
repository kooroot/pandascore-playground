import { Hono } from "hono";
import { cors } from "hono/cors";

const TOKEN = process.env.PANDASCORE_TOKEN;
if (!TOKEN) {
  console.error("PANDASCORE_TOKEN is not set in .env");
  process.exit(1);
}

const app = new Hono();

app.use("/api/*", cors());

app.all("/api/*", async (c) => {
  const path = c.req.path.replace(/^\/api/, "");
  const url = new URL(`https://api.pandascore.co${path}`);

  const params = new URL(c.req.url).searchParams;
  params.forEach((v, k) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
  });

  const data = await res.json();
  return c.json(data, res.status as 200);
});

export default {
  port: 3001,
  fetch: app.fetch,
};
