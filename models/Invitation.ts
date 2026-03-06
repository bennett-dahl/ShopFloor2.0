import mongoose, { Schema, Model } from "mongoose";

export interface IInvitation {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: mongoose.Types.ObjectId;
  createdAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const Invitation: Model<IInvitation> =
  mongoose.models.Invitation ?? mongoose.model<IInvitation>("Invitation", invitationSchema);
export default Invitation;
