import mongoose from "mongoose";

const connectDb = async () => {
  const url = process.env.MONGO_URI;
  if (!url) {
    throw new Error("MONGO_URI not defined in env");
  }

  try {
    mongoose.connect(url, {
      dbName: "HeyChatAppDb",
    });
    console.log("connected to MongoDB");
  } catch (error) {
    console.error("Mongo connection failed", error);
    process.exit(1);
  }
};

export default connectDb;
