import mongoose, { Schema, Model } from "mongoose";

const WORK_TYPES = [
  "maintenance",
  "repair",
  "modification",
  "inspection",
  "diagnostic",
  "other",
] as const;

const WORK_ORDER_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export interface IPartUsed {
  part: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
}

export interface IServiceUsed {
  service: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
}

export interface IOtherWork {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface IWorkOrder {
  _id: mongoose.Types.ObjectId;
  workOrderNumber: string;
  vehicle: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  workType: (typeof WORK_TYPES)[number];
  description: string;
  workPerformed: string[];
  partsUsed: IPartUsed[];
  servicesUsed: IServiceUsed[];
  otherWork: IOtherWork[];
  laborHours: number;
  laborRate: number;
  totalCost: number;
  mileageAtService: number;
  workOrderDate: Date;
  completedBy?: mongoose.Types.ObjectId;
  status: (typeof WORK_ORDER_STATUSES)[number];
  notes?: string;
  nextServiceDue?: Date;
  warrantyExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workOrderSchema = new Schema<IWorkOrder>(
  {
    workOrderNumber: {
      type: String,
      unique: true,
      sparse: true, // allow multiple nulls for backfill
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    workType: {
      type: String,
      required: true,
      enum: WORK_TYPES,
    },
    description: { type: String, required: true },
    workPerformed: [String],
    partsUsed: [
      {
        part: { type: Schema.Types.ObjectId, ref: "Part" },
        quantity: Number,
        unitPrice: Number,
      },
    ],
    servicesUsed: [
      {
        service: { type: Schema.Types.ObjectId, ref: "Service" },
        quantity: Number,
        unitPrice: Number,
      },
    ],
    otherWork: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
    laborHours: { type: Number, default: 0 },
    laborRate: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    mileageAtService: { type: Number, required: true },
    workOrderDate: { type: Date, default: Date.now },
    completedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: WORK_ORDER_STATUSES,
      default: "scheduled",
    },
    notes: String,
    nextServiceDue: Date,
    warrantyExpiry: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

/** Get next work order number (WO-0001, WO-0002, ...). Used by API and pre-save backfill. */
export async function getNextWorkOrderNumber(
  model: Model<IWorkOrder>
): Promise<string> {
  const last = await model
    .findOne({ workOrderNumber: { $regex: /^WO-\d+$/ } })
    .sort({ workOrderNumber: -1 })
    .select("workOrderNumber")
    .lean();
  const num =
    last?.workOrderNumber &&
    /^WO-\d+$/.test(last.workOrderNumber)
      ? parseInt(last.workOrderNumber.replace(/^WO-/, ""), 10) + 1
      : 1;
  return `WO-${String(num).padStart(4, "0")}`;
}

workOrderSchema.pre("save", async function (this: IWorkOrder & { constructor: Model<IWorkOrder> }) {
  if (!this.workOrderNumber) {
    this.workOrderNumber = await getNextWorkOrderNumber(this.constructor);
  }
  this.updatedAt = new Date();
  let totalCost = 0;
  if (this.laborHours != null && this.laborRate != null) {
    totalCost += this.laborHours * this.laborRate;
  }
  if (this.partsUsed?.length) {
    this.partsUsed.forEach((p) => {
      if (p.quantity != null && p.unitPrice != null) {
        totalCost += p.quantity * p.unitPrice;
      }
    });
  }
  if (this.servicesUsed?.length) {
    this.servicesUsed.forEach((s) => {
      if (s.quantity != null && s.unitPrice != null) {
        totalCost += s.quantity * s.unitPrice;
      }
    });
  }
  if (this.otherWork?.length) {
    this.otherWork.forEach((w) => {
      if (w.quantity != null && w.unitPrice != null) {
        totalCost += w.quantity * w.unitPrice;
      }
    });
  }
  this.totalCost = totalCost;
});

const WorkOrder: Model<IWorkOrder> =
  mongoose.models.WorkOrder ??
  mongoose.model<IWorkOrder>("WorkOrder", workOrderSchema);
export default WorkOrder;
