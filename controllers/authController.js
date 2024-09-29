// controllers/authController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcrypt";
import QRCode from "qrcode"; // QR Code generation library

// Function to generate a unique 11-digit account number
const generateAccountNumber = async () => {
  let accountNumber;
  let existingUser;

  // Ensure that the account number is unique
  do {
    accountNumber = Math.floor(
      1000000000 + Math.random() * 9000000000
    ).toString();
    existingUser = await User.findOne({ accountNumber });
  } while (existingUser);

  return accountNumber;
};

// Function to generate a QR code with user details
const generateQRCode = async (userDetails) => {
  try {
    const qrCodeData = JSON.stringify(userDetails);
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);
    return qrCodeImage;
  } catch (err) {
    console.error("Error generating QR code:", err);
    throw new Error("QR code generation failed");
  }
};

// Function to send OTP email
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // Use your email service
    auth: {
      user: process.env.EMAIL_USER, // Your email credentials
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

// Register new user
export const registerUser = async (req, res) => {
  const {
    email,
    password,
    pin,
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
  } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate a unique account number
    const accountNumber = await generateAccountNumber();

    // Create a new user
    const user = await User.create({
      email,
      password,
      pin,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      accountNumber, // Save the generated account number
    });

    // Generate QR code with user's account details
    const qrCode = await generateQRCode({
      accountNumber: user.accountNumber,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    });

    // Save the QR code in the user's profile
    user.qrCode = qrCode;

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store OTP with expiration time in user model or separate collection (depends on your design)
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiration
    await user.save();

    // Send OTP to user's email
    await sendOtpEmail(user.email, otp);

    res.status(201).json({ token, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Error creating user:", error);
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

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  console.log("Received Email:", email);
  console.log("Received OTP:", otp);

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // If user doesn't exist
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP matches, so clear the OTP field
    user.otp = undefined;
    await user.save();

    // Optionally, issue a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "OTP verified", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not registered" });
    }

    // Generate a token that expires in 15 minutes
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Create the reset URL
    const resetUrl = `https://qr-pay-backend.vercel.app/reset-password/${token}`;

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password",
      text: `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 15 minutes.`,
    };

    // Configure email transport
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        return res.status(200).json({ message: "Reset link sent to email" });
      }
    });
  } catch (err) {
    console.error("Error in forgot password:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password in the database
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error resetting password:", err);
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};

// Fetch user profile
export const getUserProfile = async (req, res) => {
  const userId = req.user.id; // Assuming the user ID is available in the request

  try {
    // Fetch user data from the database
    const user = await User.findById(userId).select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
