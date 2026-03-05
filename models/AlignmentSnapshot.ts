import mongoose, { Schema } from "mongoose";

/** Per-corner values (camber °, toe mm, rideHeight, weight % and lbs) */
export interface IAlignmentCorner {
  camber?: number;
  toe?: number;
  rideHeight?: number;
  weightPercent?: number;
  weightLbs?: number;
}

export interface IAlignmentSnapshot {
  fl?: IAlignmentCorner;
  fr?: IAlignmentCorner;
  rl?: IAlignmentCorner;
  rr?: IAlignmentCorner;
  frontAxlePercent?: number;
  rearAxlePercent?: number;
  leftSidePercent?: number;
  rightSidePercent?: number;
  crossFLRRPercent?: number;
  crossFRRLPercent?: number;
  totalWeightLbs?: number;
  trackWidthFront?: number;
  trackWidthRear?: number;
}

const cornerSchema = new Schema<IAlignmentCorner>(
  {
    camber: Number,
    toe: Number,
    rideHeight: Number,
    weightPercent: Number,
    weightLbs: Number,
  },
  { _id: false }
);

export const alignmentSnapshotSchema = new Schema<IAlignmentSnapshot>(
  {
    fl: { type: cornerSchema, default: () => ({}) },
    fr: { type: cornerSchema, default: () => ({}) },
    rl: { type: cornerSchema, default: () => ({}) },
    rr: { type: cornerSchema, default: () => ({}) },
    frontAxlePercent: Number,
    rearAxlePercent: Number,
    leftSidePercent: Number,
    rightSidePercent: Number,
    crossFLRRPercent: Number,
    crossFRRLPercent: Number,
    totalWeightLbs: Number,
    trackWidthFront: Number,
    trackWidthRear: Number,
  },
  { _id: false }
);
