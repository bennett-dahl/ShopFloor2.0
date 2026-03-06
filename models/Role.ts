import mongoose, { Schema, Model } from "mongoose";
import type { IPermissionEntry } from "@/lib/permissions";

export interface IRole {
  _id: mongoose.Types.ObjectId;
  name: string;
  permissions: IPermissionEntry[];
}

const permissionEntrySchema = new Schema<IPermissionEntry>(
  {
    resource: { type: String, required: true },
    read: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true },
    permissions: {
      type: [permissionEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Role: Model<IRole> =
  mongoose.models.Role ?? mongoose.model<IRole>("Role", roleSchema);
export default Role;
