import mongoose from "mongoose";
mongoose.set('strictQuery', false);
const MONGODB_URL= "mongodb+srv://paudelsunil16:paudelsunil16@cluster0.dlua3bq.mongodb.net/";
const connect = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
  } catch (error) {
    throw new Error("Connection failed!");
  }
};

export default connect;