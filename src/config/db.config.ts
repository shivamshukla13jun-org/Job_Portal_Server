import mongoose from "mongoose";
import { MONGO_DB_URI } from ".";
import { createDefaultAdmin } from "@/utils/createDefaultAdmin";

const connectToDb = async () => {
  try {
    const connect = await mongoose.connect(MONGO_DB_URI as string);
     await createDefaultAdmin()
    return connect;
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export { connectToDb };
