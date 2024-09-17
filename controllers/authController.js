import User from "../models/User.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Register new user with OTP verification
export const registerUser = async (req, res) => {
  const { email, password, firstName, lastName, phoneNumber, dateOfBirth } =
    req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999); // 6-digit OTP

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      otp,
      isVerified: false,
    });

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Email Verification - Your OTP Code",
      text: `Your OTP code is ${otp}. Please use this code to verify your email.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: "Failed to send OTP" });
      }
      console.log("Email sent: " + info.response);
    });

    res
      .status(201)
      .json({ message: "OTP sent to your email", userId: user._id });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid user" });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Email verified", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
