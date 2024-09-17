// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Define the user schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  dateOfBirth: {
    type: Date,
    required: false,
  },
  otp: { type: String, required: false },
  isVerified: { type: Boolean, default: false },
});

// Pre-save hook to hash the password before saving to the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare hashed password with user input password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model
const User = mongoose.model("User", userSchema);
export default User;
