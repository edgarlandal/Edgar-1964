import express from "express";
import snailpayRoutes from "./route/snailpay.routes.js";
import { handleError } from "./middleware/error.middleware.js";

const app = express();
app.use(express.json({ limit: "100kb" }));
app.get("/", (_req, res) => {
  res.json({ message: "Working API" });
});
app.use("/api/snailpay", snailpayRoutes);
app.use(handleError);
export default app;
