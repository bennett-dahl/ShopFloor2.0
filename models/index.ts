export { default as User } from "./User";
export type { IUser } from "./User";
export { default as Customer } from "./Customer";
export type { ICustomer, IAddress } from "./Customer";
export { default as Vehicle } from "./Vehicle";
export type { IVehicle } from "./Vehicle";
export { default as Part } from "./Part";
export type { IPart, ISupplier } from "./Part";
export { default as Service } from "./Service";
export type { IService } from "./Service";
export { default as WorkOrder } from "./WorkOrder";
export type {
  IWorkOrder,
  IPartUsed,
  IServiceUsed,
  IOtherWork,
} from "./WorkOrder";
