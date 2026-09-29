import express from "express";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (_req, res) => {
    res.json({message: "Working API"})
});

app.listen(port, () => {
    console.log(`Server in http://localhost:${port}`)
});

