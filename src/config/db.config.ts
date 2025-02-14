import mongoose from "mongoose";
import { MONGO_DB_URI } from ".";
import { createDefaultAdmin } from "@/utils/createDefaultAdmin";

const connectToDb = async () => {
  try {
    const mongouri=process.env.npm_lifecycle_event === "dev" ? process.env.DEV_MONGO_DB_URI : process.env.MONGO_DB_URI
    const connect = await mongoose.connect(mongouri as string);
     await createDefaultAdmin()
    return connect;
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export { connectToDb };
