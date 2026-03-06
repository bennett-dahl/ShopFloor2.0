import mongoose, { Schema, Model } from "mongoose";

export interface ISetting {
  _id: mongoose.Types.ObjectId;
  category: string;
  name: string;
  description?: string;
  sortOrder?: number;
  value?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    category: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    sortOrder: Number,
    value: String,
  },
  { timestamps: true }
);

const Setting: Model<ISetting> =
  mongoose.models.Setting ?? mongoose.model<ISetting>("Setting", settingSchema);
export default Setting;
