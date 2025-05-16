const mongoose = require("mongoose");

// Track connection state to prevent duplicate connections
let isConnected = false;

const connectDB = async () => {
  // If already connected, don't connect again
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Register models that need initialization
    console.log("Registering Note model with files as array of file schema objects");
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

