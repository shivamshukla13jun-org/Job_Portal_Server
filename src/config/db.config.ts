import mongoose from "mongoose";
import { MONGO_DB_URI } from ".";
const getHostNameFromURI = (uri:any) => {
  try {
    const hostName = new URL(uri).hostname;
    return hostName;
  } catch (error) {
    console.error("Invalid MongoDB URI", error);
  }
};

const hostName = getHostNameFromURI(MONGO_DB_URI);
console.log("MongoDB Host Name:", hostName);
const connectToDb = async () => {
  try {
    const connect = await mongoose.connect(MONGO_DB_URI as string);
  
    return connect;
  } catch (error) {
    console.log(error);
    // process.exit(1);
  }
};

export { connectToDb };
