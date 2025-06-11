import mongoose from "mongoose";
import { string } from "zod";
let MONGO: string = "mongodb+srv://paudelsunil16:paudelsunil16@cluster0.dlua3bq.mongodb.net/"
mongoose.set('strictQuery', false);
const connect = async () => {
  try {
    await mongoose.connect(MONGO);
  } catch (error) {
    throw new Error("Connection failed!");
  }
};

export default connect;