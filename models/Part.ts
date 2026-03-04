import mongoose, { Schema, Model } from "mongoose";

export interface ISupplier {
  name?: string;
  contact?: string;
  phone?: string;
  email?: string;
}

const PART_CATEGORIES = [
  "engine",
  "transmission",
  "suspension",
  "brakes",
  "exhaust",
  "interior",
  "exterior",
  "electrical",
  "other",
] as const;

export interface IPart {
  _id: mongoose.Types.ObjectId;
  partNumber: string;
  name: string;
  description?: string;
  category: (typeof PART_CATEGORIES)[number];
  brand?: string;
  vehicleCompatibility?: string[];
  cost: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStock: number;
  supplier?: ISupplier;
  location?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const partSchema = new Schema<IPart>(
  {
    partNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    category: {
      type: String,
      required: true,
      enum: PART_CATEGORIES,
    },
    brand: String,
    vehicleCompatibility: [String],
    cost: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    stockQuantity: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 0 },
    supplier: {
      name: String,
      contact: String,
      phone: String,
      email: String,
    },
    location: String,
    notes: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

partSchema.pre("save", function (this: IPart) {
  this.updatedAt = new Date();
});

const Part: Model<IPart> =
  mongoose.models.Part ?? mongoose.model<IPart>("Part", partSchema);
export default Part;
