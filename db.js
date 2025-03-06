const mongoose = require("mongoose");

const databaseURI = "mongodb://127.0.0.1:27017/orgs2pick";

mongoose
    .connect(databaseURI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

module.exports = mongoose;
