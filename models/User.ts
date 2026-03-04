import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  role: "admin" | "technician" | "manager";
  isActive: boolean;
  createdAt: Date;
  lastLogin: Date;
}

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    picture: { type: String },
    role: {
      type: String,
      enum: ["admin", "technician", "manager"],
      default: "technician",
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
export default User;
