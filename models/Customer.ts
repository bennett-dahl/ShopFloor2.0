import mongoose, { Schema, Model } from "mongoose";

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface ICustomer {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: IAddress;
  dateOfBirth?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    dateOfBirth: Date,
    notes: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

customerSchema.pre("save", function (this: ICustomer) {
  this.updatedAt = new Date();
});

const Customer: Model<ICustomer> =
  mongoose.models.Customer ??
  mongoose.model<ICustomer>("Customer", customerSchema);
export default Customer;
