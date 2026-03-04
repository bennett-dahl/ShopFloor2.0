/**
 * Seed script: inserts ~15 customers, vehicles, parts, services, and work orders.
 *
 * Uses (in order):
 *   1. SEED_MONGODB_URI (use this to target Atlas: SEED_MONGODB_URI="mongodb+srv://..." npm run seed)
 *   2. MONGODB_URI from .env.local
 *
 * Run: npm run seed           — add seed data (fails if part/service codes already exist)
 * Run: npm run seed -- --clear — clear workorders, vehicles, customers, parts, services then insert fresh seed data
 */
import { config } from "dotenv";
import path from "path";

// Load .env.local from project root first
config({ path: path.resolve(process.cwd(), ".env.local") });
// Allow override from .env (e.g. SEED_MONGODB_URI)
config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import connectDB from "../lib/db";
import Customer from "../models/Customer";
import Vehicle from "../models/Vehicle";
import Part from "../models/Part";
import Service from "../models/Service";
import WorkOrder from "../models/WorkOrder";

/** Redact password in URI for safe logging */
function redactUri(uri: string): string {
  try {
    const u = new URL(uri);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return uri.replace(/:[^:@]+@/, ":***@");
  }
}

/**
 * If the URI has no database name (e.g. ...mongodb.net/?options), MongoDB driver defaults to "test".
 * Normalize so we explicitly use "test" and the seed writes to the same DB as the app.
 */
function normalizeUri(uri: string): string {
  try {
    const u = new URL(uri);
    const path = u.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    if (!path || path === "?") {
      u.pathname = "/test";
      return u.toString();
    }
    return uri;
  } catch {
    return uri;
  }
}

const CUSTOMERS = [
  { firstName: "James", lastName: "Wilson", email: "james.wilson@email.com", phone: "555-101-0001", city: "Portland", state: "OR", zipCode: "97201" },
  { firstName: "Maria", lastName: "Garcia", email: "maria.garcia@email.com", phone: "555-102-0002", city: "Seattle", state: "WA", zipCode: "98101" },
  { firstName: "Robert", lastName: "Chen", email: "robert.chen@email.com", phone: "555-103-0003", city: "San Francisco", state: "CA", zipCode: "94102" },
  { firstName: "Jennifer", lastName: "Martinez", email: "jennifer.martinez@email.com", phone: "555-104-0004", city: "Denver", state: "CO", zipCode: "80202" },
  { firstName: "Michael", lastName: "Brown", email: "michael.brown@email.com", phone: "555-105-0005", city: "Phoenix", state: "AZ", zipCode: "85001" },
  { firstName: "Linda", lastName: "Davis", email: "linda.davis@email.com", phone: "555-106-0006", city: "Austin", state: "TX", zipCode: "78701" },
  { firstName: "David", lastName: "Anderson", email: "david.anderson@email.com", phone: "555-107-0007", city: "Chicago", state: "IL", zipCode: "60601" },
  { firstName: "Susan", lastName: "Taylor", email: "susan.taylor@email.com", phone: "555-108-0008", city: "Detroit", state: "MI", zipCode: "48201" },
  { firstName: "Joseph", lastName: "Thomas", email: "joseph.thomas@email.com", phone: "555-109-0009", city: "Atlanta", state: "GA", zipCode: "30301" },
  { firstName: "Nancy", lastName: "Jackson", email: "nancy.jackson@email.com", phone: "555-110-0010", city: "Miami", state: "FL", zipCode: "33101" },
  { firstName: "Charles", lastName: "White", email: "charles.white@email.com", phone: "555-111-0011", city: "Boston", state: "MA", zipCode: "02101" },
  { firstName: "Patricia", lastName: "Harris", email: "patricia.harris@email.com", phone: "555-112-0012", city: "Philadelphia", state: "PA", zipCode: "19101" },
  { firstName: "Christopher", lastName: "Clark", email: "christopher.clark@email.com", phone: "555-113-0013", city: "Nashville", state: "TN", zipCode: "37201" },
  { firstName: "Barbara", lastName: "Lewis", email: "barbara.lewis@email.com", phone: "555-114-0014", city: "Minneapolis", state: "MN", zipCode: "55401" },
  { firstName: "Daniel", lastName: "Walker", email: "daniel.walker@email.com", phone: "555-115-0015", city: "Salt Lake City", state: "UT", zipCode: "84101" },
];

const MAKES_MODELS: [string, string][] = [
  ["Toyota", "Camry"], ["Honda", "Accord"], ["Ford", "F-150"], ["Chevrolet", "Silverado"],
  ["Tesla", "Model 3"], ["BMW", "330i"], ["Mercedes-Benz", "C300"], ["Nissan", "Altima"],
  ["Hyundai", "Sonata"], ["Subaru", "Outback"], ["Jeep", "Wrangler"], ["Ram", "1500"],
  ["Mazda", "CX-5"], ["Volkswagen", "Jetta"], ["Kia", "Sorento"],
];

const PARTS = [
  { partNumber: "OIL-5W30-1QT", name: "Motor Oil 5W-30 Synthetic 1qt", category: "engine" as const, cost: 8.99, sellingPrice: 12.99 },
  { partNumber: "FLT-OEM-001", name: "Oil Filter OEM", category: "engine" as const, cost: 6.50, sellingPrice: 11.00 },
  { partNumber: "BRK-PAD-F", name: "Brake Pads Front Set", category: "brakes" as const, cost: 45.00, sellingPrice: 79.99 },
  { partNumber: "BRK-ROT-F", name: "Brake Rotor Front", category: "brakes" as const, cost: 52.00, sellingPrice: 89.00 },
  { partNumber: "AIR-FLT-CAB", name: "Cabin Air Filter", category: "other" as const, cost: 12.00, sellingPrice: 24.99 },
  { partNumber: "AIR-FLT-ENG", name: "Engine Air Filter", category: "engine" as const, cost: 18.00, sellingPrice: 32.00 },
  { partNumber: "SPK-PLT-4PK", name: "Spark Plugs Set of 4", category: "engine" as const, cost: 28.00, sellingPrice: 44.99 },
  { partNumber: "WIP-BLADE-22", name: "Windshield Wiper Blade 22\"", category: "electrical" as const, cost: 9.00, sellingPrice: 16.99 },
  { partNumber: "BAT-12V-50", name: "12V Battery 50Ah", category: "electrical" as const, cost: 95.00, sellingPrice: 149.99 },
  { partNumber: "TIE-ROD-END", name: "Tie Rod End", category: "suspension" as const, cost: 35.00, sellingPrice: 58.00 },
  { partNumber: "STRUT-MNT", name: "Strut Mount", category: "suspension" as const, cost: 42.00, sellingPrice: 69.00 },
  { partNumber: "EXH-GASKET", name: "Exhaust Manifold Gasket", category: "exhaust" as const, cost: 22.00, sellingPrice: 38.00 },
  { partNumber: "TRANS-FLUID", name: "ATF Fluid 1qt", category: "transmission" as const, cost: 14.00, sellingPrice: 22.99 },
  { partNumber: "COOLANT-GAL", name: "Antifreeze 1 Gallon", category: "engine" as const, cost: 18.00, sellingPrice: 28.00 },
  { partNumber: "BELT-SERP", name: "Serpentine Belt", category: "engine" as const, cost: 32.00, sellingPrice: 49.99 },
];

const SERVICES = [
  { serviceCode: "OCHG", name: "Oil Change", description: "Full synthetic oil change with filter", category: "maintenance" as const, standardHours: 0.5, laborRate: 95 },
  { serviceCode: "BRKF", name: "Brake Pad Replacement Front", description: "Replace front brake pads", category: "brakes" as const, standardHours: 1.5, laborRate: 95 },
  { serviceCode: "BRKR", name: "Brake Rotor Replacement", description: "Replace brake rotors (per axle)", category: "brakes" as const, standardHours: 2, laborRate: 95 },
  { serviceCode: "TIRE-R", name: "Tire Rotation", description: "Rotate all four tires", category: "maintenance" as const, standardHours: 0.5, laborRate: 45 },
  { serviceCode: "ALIGN", name: "Four-Wheel Alignment", description: "Full four-wheel alignment check and adjust", category: "alignment" as const, standardHours: 1, laborRate: 120 },
  { serviceCode: "BATT", name: "Battery Test & Replace", description: "Test battery and replace if needed", category: "electrical" as const, standardHours: 0.5, laborRate: 65 },
  { serviceCode: "SPKPL", name: "Spark Plug Replacement", description: "Replace spark plugs (4-6 cyl)", category: "engine" as const, standardHours: 1, laborRate: 95 },
  { serviceCode: "AIRFLT", name: "Air Filter Replacement", description: "Engine and cabin air filter replacement", category: "maintenance" as const, standardHours: 0.25, laborRate: 45 },
  { serviceCode: "INSP", name: "Multi-Point Inspection", description: "Full vehicle inspection", category: "inspection" as const, standardHours: 0.5, laborRate: 49 },
  { serviceCode: "DIAG", name: "Diagnostic Scan", description: "OBD-II diagnostic scan and report", category: "diagnostic" as const, standardHours: 0.5, laborRate: 85 },
  { serviceCode: "COOL", name: "Coolant Flush", description: "Drain and refill cooling system", category: "engine" as const, standardHours: 1, laborRate: 95 },
  { serviceCode: "TRANS", name: "Transmission Fluid Service", description: "Drain and fill transmission fluid", category: "transmission" as const, standardHours: 1, laborRate: 95 },
  { serviceCode: "EXH", name: "Exhaust Repair", description: "Exhaust system repair (per hour)", category: "exhaust" as const, standardHours: 1, laborRate: 95 },
  { serviceCode: "SUSP", name: "Suspension Inspection", description: "Suspension check and estimate", category: "suspension" as const, standardHours: 0.5, laborRate: 75 },
  { serviceCode: "WIPER", name: "Wiper Blade Replacement", description: "Replace front wiper blades", category: "other" as const, standardHours: 0.25, laborRate: 25 },
];

const WORK_ORDER_DESCRIPTIONS = [
  "Oil change and tire rotation",
  "Brake pad replacement and inspection",
  "Annual safety inspection",
  "Coolant flush and belt replacement",
  "Transmission fluid service",
  "Spark plug replacement and tune-up",
  "Battery test and replacement",
  "Four-wheel alignment",
  "Air filter replacement",
  "Exhaust system inspection and repair",
  "Suspension check and strut replacement",
  "Diagnostic scan and engine light",
  "Pre-purchase inspection",
  "Windshield wiper and fluid service",
  "Multi-point inspection and oil change",
];

async function seed() {
  // Prefer SEED_MONGODB_URI so you can target Atlas without changing .env.local
  const uri =
    process.env.SEED_MONGODB_URI ||
    process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "No MongoDB URI. Set MONGODB_URI in .env.local or run:\n  SEED_MONGODB_URI=\"mongodb+srv://user:pass@cluster.mongodb.net/dbname\" npm run seed"
    );
    process.exit(1);
  }

  // Use same database as app: if URI has no db name, driver defaults to "test" — set it explicitly.
  // Must set before connectDB() so lib/db reads it at connect time.
  const normalizedUri = normalizeUri(uri);
  process.env.MONGODB_URI = normalizedUri;
  console.log("Target:", redactUri(normalizedUri));
  await connectDB();
  const dbName = mongoose.connection.db?.databaseName ?? "unknown";
  console.log("Connected to database:", dbName, "\n");

  const clearFirst = process.argv.includes("--clear");
  if (clearFirst) {
    console.log("--clear: removing existing documents (workorders, vehicles, customers, parts, services)...");
    const [wo, v, c, p, s] = await Promise.all([
      WorkOrder.deleteMany({}),
      Vehicle.deleteMany({}),
      Customer.deleteMany({}),
      Part.deleteMany({}),
      Service.deleteMany({}),
    ]);
    console.log(`  Deleted: ${wo.deletedCount} workorders, ${v.deletedCount} vehicles, ${c.deletedCount} customers, ${p.deletedCount} parts, ${s.deletedCount} services.\n`);
  }

  try {
    // Customers
    console.log("Seeding customers...");
    const insertedCustomers = await Customer.insertMany(
      CUSTOMERS.map((c) => ({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        address: { city: c.city, state: c.state, zipCode: c.zipCode },
      }))
    );
    console.log(`  Inserted ${insertedCustomers.length} customers.`);

    // Vehicles (assign to customers in order, wrap around)
    console.log("Seeding vehicles...");
    const vehicleDocs = MAKES_MODELS.map(([make, model], i) => ({
      customer: insertedCustomers[i % insertedCustomers.length]._id,
      make,
      model,
      year: 2020 + (i % 5),
      vin: `SEED${String(i + 1).padStart(4, "0")}${Date.now().toString(36).toUpperCase()}`.slice(0, 17),
      licensePlate: `SEED-${i + 1}`,
      color: ["Black", "White", "Silver", "Gray", "Red", "Blue"][i % 6],
      mileage: 15000 + i * 3000,
    }));
    const insertedVehicles = await Vehicle.insertMany(vehicleDocs);
    console.log(`  Inserted ${insertedVehicles.length} vehicles.`);

    // Parts
    console.log("Seeding parts...");
    const partDocs = PARTS.map((p) => ({
      partNumber: p.partNumber,
      name: p.name,
      category: p.category,
      cost: p.cost,
      sellingPrice: p.sellingPrice,
      stockQuantity: 25 + Math.floor(Math.random() * 50),
      minimumStock: 10,
    }));
    const insertedParts = await Part.insertMany(partDocs);
    console.log(`  Inserted ${insertedParts.length} parts.`);

    // Services (totalCost is set by pre-save hook, so we use save())
    console.log("Seeding services...");
    const insertedServices: { _id: mongoose.Types.ObjectId }[] = [];
    for (const s of SERVICES) {
      const doc = new Service({
        serviceCode: s.serviceCode,
        name: s.name,
        description: s.description,
        category: s.category,
        standardHours: s.standardHours,
        laborRate: s.laborRate,
      });
      await doc.save();
      insertedServices.push(doc);
    }
    console.log(`  Inserted ${insertedServices.length} services.`);

    // Work orders (use save so totalCost is computed by pre-save hook)
    console.log("Seeding work orders...");
    const statuses = ["scheduled", "in_progress", "completed", "completed", "completed"] as const;
    const workTypes = ["maintenance", "repair", "inspection", "diagnostic", "maintenance"] as const;
    const laborRates = [85, 95, 120, 95, 75];
    for (let i = 0; i < 15; i++) {
      const vehicle = insertedVehicles[i];
      const daysAgo = 90 - i * 5;
      const workOrderDate = new Date();
      workOrderDate.setDate(workOrderDate.getDate() - daysAgo);
      const partsUsed = i % 3 !== 0
        ? [
            { part: insertedParts[i % insertedParts.length]._id, quantity: 1, unitPrice: (insertedParts[i % insertedParts.length] as { sellingPrice: number }).sellingPrice },
            ...(i % 2 === 0 ? [{ part: insertedParts[(i + 3) % insertedParts.length]._id, quantity: 2, unitPrice: (insertedParts[(i + 3) % insertedParts.length] as { sellingPrice: number }).sellingPrice }] : []),
          ]
        : [];
      const svc0 = insertedServices[i % insertedServices.length]._id;
      const svc1 = insertedServices[(i + 2) % insertedServices.length]._id;
      const price0 = SERVICES[i % SERVICES.length].standardHours * SERVICES[i % SERVICES.length].laborRate;
      const price1 = SERVICES[(i + 2) % SERVICES.length].standardHours * SERVICES[(i + 2) % SERVICES.length].laborRate;
      const servicesUsed = [
        { service: svc0, quantity: 1, unitPrice: price0 },
        ...(i % 4 === 0 ? [{ service: svc1, quantity: 1, unitPrice: price1 }] : []),
      ];
      const laborHours = 0.5 + (i % 3) * 0.5;
      const laborRate = laborRates[i % laborRates.length];
      const wo = new WorkOrder({
        vehicle: vehicle._id,
        customer: vehicle.customer,
        workType: workTypes[i % workTypes.length],
        description: WORK_ORDER_DESCRIPTIONS[i],
        mileageAtService: vehicle.mileage + i * 500,
        workOrderDate,
        status: statuses[i % statuses.length],
        laborHours,
        laborRate,
        partsUsed,
        servicesUsed,
        otherWork: [],
      });
      await wo.save();
    }
    console.log(`  Inserted 15 work orders.`);

    console.log("\nSeed completed successfully.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
