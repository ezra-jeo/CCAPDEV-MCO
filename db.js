const mongoose = require("mongoose");

const databaseURI = "mongodb://localhost:27017/orgs2pick";

mongoose
    .connect(databaseURI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

module.exports = mongoose;
