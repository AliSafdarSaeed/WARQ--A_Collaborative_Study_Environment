const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const projectRoutes = require("./routes/projectRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/projects", projectRoutes);

mongoose.connect(process.env.MONGO_URI, () => {
  console.log("✅ Connected to MongoDB");
  app.listen(process.env.PORT || 5000, () =>
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
  );
});
