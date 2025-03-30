const mongoose = require("mongoose");

const databaseURI = process.env.MONGODB_URI + process.env.DB_NAME;

mongoose
    .connect(databaseURI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

module.exports = mongoose;
