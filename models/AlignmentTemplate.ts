import mongoose, { Schema, Model } from "mongoose";
import { alignmentSnapshotSchema, type IAlignmentSnapshot } from "./AlignmentSnapshot";

export interface IAlignmentTemplate {
  _id: mongoose.Types.ObjectId;
  make: string;
  model: string;
  year: string;
  alignmentType: string;
  rideHeightReference?: string;
  target: IAlignmentSnapshot;
  rideHeightUnit?: "mm" | "in";
  trackWidthUnit?: "mm" | "in";
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const alignmentTemplateSchema = new Schema<IAlignmentTemplate>(
  {
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: String, default: "" },
    alignmentType: { type: String, required: true },
    rideHeightReference: String,
    target: { type: alignmentSnapshotSchema, default: () => ({}) },
    rideHeightUnit: { type: String, enum: ["mm", "in"], default: "mm" },
    trackWidthUnit: { type: String, enum: ["mm", "in"], default: "mm" },
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const AlignmentTemplate: Model<IAlignmentTemplate> =
  mongoose.models.AlignmentTemplate ??
  mongoose.model<IAlignmentTemplate>("AlignmentTemplate", alignmentTemplateSchema);
export default AlignmentTemplate;
