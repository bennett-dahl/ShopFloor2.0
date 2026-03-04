import mongoose, { Schema, Model } from "mongoose";

export interface IVehicle {
  _id: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  engineType?: string;
  transmission?: string;
  mileage: number;
  lastServiceMileage?: number;
  lastServiceDate?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    vin: { type: String, unique: true, sparse: true },
    licensePlate: String,
    color: String,
    engineType: String,
    transmission: String,
    mileage: { type: Number, default: 0 },
    lastServiceMileage: { type: Number, default: 0 },
    lastServiceDate: Date,
    notes: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

vehicleSchema.pre("save", function (this: IVehicle) {
  this.updatedAt = new Date();
});

const Vehicle: Model<IVehicle> =
  mongoose.models.Vehicle ??
  mongoose.model<IVehicle>("Vehicle", vehicleSchema);
export default Vehicle;
