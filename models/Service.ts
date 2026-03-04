import mongoose, { Schema, Model } from "mongoose";

const SERVICE_CATEGORIES = [
  "maintenance",
  "repair",
  "modification",
  "inspection",
  "diagnostic",
  "alignment",
  "exhaust",
  "engine",
  "transmission",
  "brakes",
  "suspension",
  "electrical",
  "other",
] as const;

export interface IService {
  _id: mongoose.Types.ObjectId;
  serviceCode: string;
  name: string;
  description: string;
  category: (typeof SERVICE_CATEGORIES)[number];
  standardHours: number;
  laborRate: number;
  totalCost: number;
  vehicleTypes?: string[];
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  toolsRequired?: string[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    serviceCode: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: SERVICE_CATEGORIES,
    },
    standardHours: { type: Number, required: true, min: 0 },
    laborRate: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, default: 0 },
    vehicleTypes: [String],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
    },
    toolsRequired: [String],
    notes: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

serviceSchema.pre("save", function (this: IService) {
  this.updatedAt = new Date();
  this.totalCost = this.standardHours * this.laborRate;
});

const Service: Model<IService> =
  mongoose.models.Service ??
  mongoose.model<IService>("Service", serviceSchema);
export default Service;
