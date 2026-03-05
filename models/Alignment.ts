import mongoose, { Schema, Model } from "mongoose";
import { alignmentSnapshotSchema, type IAlignmentSnapshot } from "./AlignmentSnapshot";

export interface IAlignmentStep {
  label?: string;
  snapshot: IAlignmentSnapshot;
}

export interface IAlignment {
  _id: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  workOrder?: mongoose.Types.ObjectId;
  template?: mongoose.Types.ObjectId;
  alignmentType: string;
  rideHeightReference?: string;
  before: IAlignmentSnapshot;
  after: IAlignmentSnapshot;
  intermediateSteps: IAlignmentStep[];
  customerNotes?: string;
  technicianNotes?: string;
  accuracyRating?: number;
  customerRating?: number;
  rideHeightUnit?: "mm" | "in";
  trackWidthUnit?: "mm" | "in";
  completedBy?: mongoose.Types.ObjectId;
  alignmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const alignmentStepSchema = new Schema<IAlignmentStep>(
  {
    label: String,
    snapshot: { type: alignmentSnapshotSchema, required: true },
  },
  { _id: true }
);

const alignmentSchema = new Schema<IAlignment>(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    workOrder: { type: Schema.Types.ObjectId, ref: "WorkOrder" },
    template: { type: Schema.Types.ObjectId, ref: "AlignmentTemplate" },
    alignmentType: { type: String, required: true },
    rideHeightReference: String,
    before: { type: alignmentSnapshotSchema, required: true },
    after: { type: alignmentSnapshotSchema, required: true },
    intermediateSteps: {
      type: [alignmentStepSchema],
      default: [],
    },
    customerNotes: String,
    technicianNotes: String,
    accuracyRating: { type: Number, min: 1, max: 5 },
    customerRating: { type: Number, min: 1, max: 5 },
    rideHeightUnit: { type: String, enum: ["mm", "in"], default: "mm" },
    trackWidthUnit: { type: String, enum: ["mm", "in"], default: "mm" },
    completedBy: { type: Schema.Types.ObjectId, ref: "User" },
    alignmentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Alignment: Model<IAlignment> =
  mongoose.models.Alignment ??
  mongoose.model<IAlignment>("Alignment", alignmentSchema);
export default Alignment;
