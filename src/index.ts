import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import os from "os";
import cluster from "cluster";

import { connectToDb } from "@/config/db.config";
import { errorHandler, notFound } from "@/middlewares/error";
import router from "@/routes";
import path from "path";
import seedMenus from "./seeds/menuSeeder";
// import seedMenus from "./seeds/menuSeeder";

const app = express();
// defining cors format
const corsConfig = {
  origin: true,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
};
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.set("view engine","ejs")
// parse the data
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));


// public the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// get
app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Working",
  });
});

// health
app.get("/health", async (req, res) => {
  res.status(200).json("Okay");
});

// defining the routes
app.use("/api/v1/", router);

// error handlers
app.use(notFound);
app.use(errorHandler);

// multi-processing
const PORT = process.env.PORT;
const numCPUs = os.cpus().length;

// if (cluster.isPrimary) {
//   // Fork workers.
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`);
//     cluster.fork();
//   });
// } else {
connectToDb()
  .then(() => {
    console.log("Connected to mongodb");
    // updateUsers()
    // seedMenus()
    app.listen(PORT, () => console.log(`Listening to ${PORT}`));
  })
  .catch((err: Error) => console.log(err.message));
// }
// 11 nov
