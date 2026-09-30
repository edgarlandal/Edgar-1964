import app from "./app.js";

const port = Number(process.env.PORT ?? 3001);
const url = process.env.URL_API;

app.listen(port, () => {
  console.log(`Server in ${url}:${port}`);
});
