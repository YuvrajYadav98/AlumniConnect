require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const existing = await User.findOne({
      email: "admin@gmail.com",
    });

    if (existing) {
      existing.role = "admin";
      existing.isApproved = true;
      existing.isVerified = true;
      existing.verificationStatus = "approved";
      existing.password = "Admin@123";

      await existing.save();

      console.log("Existing user converted to admin.");
    } else {
      await User.create({
        name: "Admin",
        email: "admin@gmail.com",
        password: "Admin@123",
        role: "admin",
        isApproved: true,
        isVerified: true,
        verificationStatus: "approved",
      });

      console.log("Admin created successfully.");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

createAdmin();
