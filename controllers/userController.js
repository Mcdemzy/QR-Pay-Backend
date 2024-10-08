// controllers/userController.js
import User from "../models/User.js";

// Update user profile
export const updateUserProfile = async (req, res) => {
  const { firstName, lastName, phoneNumber, dateOfBirth } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;

    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch authenticated user's data
export const getUserData = async (req, res) => {
  try {
    // `req.user` is available because of the `protect` middleware
    const user = await User.findById(req.user._id).select("-password"); // Exclude the password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};
