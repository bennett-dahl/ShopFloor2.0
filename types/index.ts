import type { IUser } from "@/models/User";
import type { ICustomer } from "@/models/Customer";
import type { IVehicle } from "@/models/Vehicle";
import type { IPart } from "@/models/Part";
import type { IService } from "@/models/Service";
import type { IWorkOrder } from "@/models/WorkOrder";

export type { IUser, ICustomer, IVehicle, IPart, IService, IWorkOrder };

export type WorkOrderStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type WorkType =
  | "maintenance"
  | "repair"
  | "modification"
  | "inspection"
  | "diagnostic"
  | "other";
