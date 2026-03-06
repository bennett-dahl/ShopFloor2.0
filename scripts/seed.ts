/**
 * Unified seed script: seeds roles, customers, vehicles, parts, services,
 * work orders, alignments, alignment templates, and settings.
 *
 * MongoDB URI (in order of preference):
 *   1. SEED_MONGODB_URI env var
 *   2. MONGODB_URI from .env.local
 *
 * Usage:
 *   npm run seed           — seed all data (upserts roles, fails if part/service codes exist)
 *   npm run seed:clear     — clear existing data then seed fresh
 *   npm run seed:fresh     — clear data, skip legacy user migration
 *
 * Direct invocation (bypasses npm arg issues on Windows):
 *   npx tsx scripts/seed.ts --clear --no-migrate --debug
 *
 * Environment variables (alternative to CLI args):
 *   SEED_CLEAR=1       — equivalent to --clear
 *   SEED_NO_MIGRATE=1  — equivalent to --no-migrate
 *   SEED_DEBUG=1       — equivalent to --debug
 */
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import connectDB from "../lib/db";
import Role from "../models/Role";
import Customer from "../models/Customer";
import Vehicle from "../models/Vehicle";
import Part from "../models/Part";
import Service from "../models/Service";
import WorkOrder from "../models/WorkOrder";
import AlignmentTemplate from "../models/AlignmentTemplate";
import Alignment from "../models/Alignment";
import Setting from "../models/Setting";
import { RESOURCES, type Resource } from "../lib/permissions";

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
    const dbPath = u.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    if (!dbPath || dbPath === "?") {
      u.pathname = "/test";
      return u.toString();
    }
    return uri;
  } catch {
    return uri;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_NAMES = {
  ADMIN: "Admin",
  TECH: "Tech",
  BASIC: "Basic",
  DEFAULT: "Default",
};

function allPermissions() {
  return RESOURCES.map((resource) => ({
    resource: resource as string,
    read: true,
    create: true,
    update: true,
    delete: true,
  }));
}

function techPermissions() {
  const resources: Resource[] = [
    "customers",
    "vehicles",
    "workorders",
    "parts",
    "services",
    "alignments",
    "alignmentTemplates",
    "settings",
  ];
  return RESOURCES.map((resource) => ({
    resource: resource as string,
    read: resources.includes(resource),
    create: resources.includes(resource),
    update: resources.includes(resource),
    delete: resources.includes(resource),
  }));
}

function basicPermissions() {
  const readOnly: Resource[] = [
    "customers",
    "vehicles",
    "workorders",
    "parts",
    "services",
    "alignments",
    "alignmentTemplates",
    "settings",
  ];
  return RESOURCES.map((resource) => ({
    resource: resource as string,
    read: readOnly.includes(resource),
    create: false,
    update: false,
    delete: false,
  }));
}

function noPermissions() {
  return RESOURCES.map((resource) => ({
    resource: resource as string,
    read: false,
    create: false,
    update: false,
    delete: false,
  }));
}

async function seedRoles() {
  console.log("Seeding roles...");
  const admin = await Role.findOneAndUpdate(
    { name: ROLE_NAMES.ADMIN },
    { $set: { permissions: allPermissions() } },
    { new: true, upsert: true }
  );
  const tech = await Role.findOneAndUpdate(
    { name: ROLE_NAMES.TECH },
    { $set: { permissions: techPermissions() } },
    { new: true, upsert: true }
  );
  const basic = await Role.findOneAndUpdate(
    { name: ROLE_NAMES.BASIC },
    { $set: { permissions: basicPermissions() } },
    { new: true, upsert: true }
  );
  const defaultRole = await Role.findOneAndUpdate(
    { name: ROLE_NAMES.DEFAULT },
    { $set: { permissions: noPermissions() } },
    { new: true, upsert: true }
  );
  console.log(`  Roles: ${admin.name}, ${tech.name}, ${basic.name}, ${defaultRole.name}`);
  return { admin, tech, basic, default: defaultRole };
}

const LEGACY_ROLE_TO_NAME: Record<string, string> = {
  admin: ROLE_NAMES.ADMIN,
  technician: ROLE_NAMES.TECH,
  manager: ROLE_NAMES.TECH,
};

async function migrateUsers(roleIds: {
  admin: mongoose.Types.ObjectId;
  tech: mongoose.Types.ObjectId;
  basic: mongoose.Types.ObjectId;
}) {
  console.log("Migrating legacy users (string role -> ObjectId)...");
  const coll = mongoose.connection.collection("users");
  const users = await coll.find({}).toArray();
  let updated = 0;
  for (const u of users) {
    const r = u.role;
    if (typeof r === "string") {
      const roleName = LEGACY_ROLE_TO_NAME[r.toLowerCase()] ?? ROLE_NAMES.TECH;
      const roleId =
        roleName === ROLE_NAMES.ADMIN
          ? roleIds.admin
          : roleName === ROLE_NAMES.BASIC
            ? roleIds.basic
            : roleIds.tech;
      await coll.updateOne({ _id: u._id }, { $set: { role: roleId } });
      updated++;
    }
  }
  console.log(`  Migrated ${updated} users.`);
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
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

const ALIGNMENT_TYPES = [
  { name: "Street", description: "Standard street driving alignment" },
  { name: "Performance", description: "Aggressive alignment for spirited driving" },
  { name: "Track Day", description: "Race-oriented alignment settings" },
  { name: "Comfort", description: "Comfort-focused alignment with reduced tire wear" },
  { name: "Tow/Haul", description: "Alignment for towing or hauling loads" },
];

const RIDE_HEIGHT_REFERENCES = [
  { name: "Fender Gap", description: "Measured from fender lip to wheel center" },
  { name: "Factory Spec", description: "OEM factory ride height specification" },
  { name: "Pinch Weld", description: "Measured from pinch weld to ground" },
  { name: "Hub Center", description: "Measured from hub center to fender" },
];

const ALIGNMENT_TEMPLATES = [
  {
    make: "Toyota",
    model: "Camry",
    year: "2020-2024",
    alignmentType: "Street",
    target: {
      fl: { camber: -0.5, toe: 0.05 },
      fr: { camber: -0.5, toe: 0.05 },
      rl: { camber: -1.0, toe: 0.10 },
      rr: { camber: -1.0, toe: 0.10 },
    },
    notes: "Standard daily driver alignment. Slight negative camber for handling.",
  },
  {
    make: "Honda",
    model: "Accord",
    year: "2018-2024",
    alignmentType: "Street",
    target: {
      fl: { camber: -0.6, toe: 0.04 },
      fr: { camber: -0.6, toe: 0.04 },
      rl: { camber: -1.2, toe: 0.08 },
      rr: { camber: -1.2, toe: 0.08 },
    },
    notes: "Honda factory recommendations with slight improvement for tire wear.",
  },
  {
    make: "BMW",
    model: "330i",
    year: "2019-2024",
    alignmentType: "Performance",
    target: {
      fl: { camber: -1.5, toe: 0.02 },
      fr: { camber: -1.5, toe: 0.02 },
      rl: { camber: -1.8, toe: 0.05 },
      rr: { camber: -1.8, toe: 0.05 },
    },
    notes: "Sporty alignment for spirited driving. More aggressive camber.",
  },
  {
    make: "Ford",
    model: "F-150",
    year: "2021-2024",
    alignmentType: "Tow/Haul",
    target: {
      fl: { camber: -0.3, toe: 0.08 },
      fr: { camber: -0.3, toe: 0.08 },
      rl: { camber: -0.5, toe: 0.10 },
      rr: { camber: -0.5, toe: 0.10 },
    },
    notes: "Towing-optimized alignment. Accounts for rear sag under load.",
  },
  {
    make: "Subaru",
    model: "Outback",
    year: "2020-2024",
    alignmentType: "Street",
    target: {
      fl: { camber: -0.7, toe: 0.06 },
      fr: { camber: -0.7, toe: 0.06 },
      rl: { camber: -1.0, toe: 0.08 },
      rr: { camber: -1.0, toe: 0.08 },
    },
    notes: "AWD-optimized alignment. Balanced front/rear for all conditions.",
  },
  {
    make: "Tesla",
    model: "Model 3",
    year: "2020-2024",
    alignmentType: "Performance",
    target: {
      fl: { camber: -1.2, toe: 0.02 },
      fr: { camber: -1.2, toe: 0.02 },
      rl: { camber: -1.5, toe: 0.04 },
      rr: { camber: -1.5, toe: 0.04 },
    },
    notes: "Performance-oriented alignment for instant torque handling.",
  },
  {
    make: "Mazda",
    model: "CX-5",
    year: "2019-2024",
    alignmentType: "Comfort",
    target: {
      fl: { camber: -0.4, toe: 0.06 },
      fr: { camber: -0.4, toe: 0.06 },
      rl: { camber: -0.8, toe: 0.08 },
      rr: { camber: -0.8, toe: 0.08 },
    },
    notes: "Comfort-focused. Minimizes tire wear while maintaining handling.",
  },
  {
    make: "Chevrolet",
    model: "Silverado",
    year: "2019-2024",
    alignmentType: "Tow/Haul",
    target: {
      fl: { camber: -0.2, toe: 0.10 },
      fr: { camber: -0.2, toe: 0.10 },
      rl: { camber: -0.4, toe: 0.12 },
      rr: { camber: -0.4, toe: 0.12 },
    },
    notes: "Heavy-duty towing alignment. Compensates for trailer tongue weight.",
  },
  {
    make: "Porsche",
    model: "911",
    year: "2019-2024",
    alignmentType: "Track Day",
    target: {
      fl: { camber: -2.5, toe: 0.00 },
      fr: { camber: -2.5, toe: 0.00 },
      rl: { camber: -2.2, toe: 0.02 },
      rr: { camber: -2.2, toe: 0.02 },
    },
    notes: "Aggressive track alignment. Maximizes grip at the expense of tire wear.",
  },
  {
    make: "Jeep",
    model: "Wrangler",
    year: "2018-2024",
    alignmentType: "Street",
    target: {
      fl: { camber: 0.0, toe: 0.08 },
      fr: { camber: 0.0, toe: 0.08 },
      rl: { camber: 0.0, toe: 0.10 },
      rr: { camber: 0.0, toe: 0.10 },
    },
    notes: "Off-road capable. Neutral camber for varied terrain handling.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  const uri = process.env.SEED_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "No MongoDB URI. Set MONGODB_URI in .env.local or run:\n  SEED_MONGODB_URI=\"mongodb+srv://user:pass@cluster.mongodb.net/dbname\" npm run seed"
    );
    process.exit(1);
  }

  const normalizedUri = normalizeUri(uri);
  process.env.MONGODB_URI = normalizedUri;
  console.log("Target:", redactUri(normalizedUri));
  await connectDB();
  const dbName = mongoose.connection.db?.databaseName ?? "unknown";
  console.log("Connected to database:", dbName, "\n");

  // Parse arguments - check CLI args and environment variables for cross-platform support
  const args = process.argv.slice(2);
  const argsStr = args.join(" ");
  const clearFirst =
    args.includes("--clear") ||
    argsStr.includes("--clear") ||
    process.env.SEED_CLEAR === "1" ||
    process.env.SEED_CLEAR === "true";
  const doMigrate = !(
    args.includes("--no-migrate") ||
    argsStr.includes("--no-migrate") ||
    process.env.SEED_NO_MIGRATE === "1" ||
    process.env.SEED_NO_MIGRATE === "true"
  );

  // Debug: show parsed args if --debug flag or env var is present
  if (args.includes("--debug") || argsStr.includes("--debug") || process.env.SEED_DEBUG === "1") {
    console.log("DEBUG process.argv:", process.argv);
    console.log("DEBUG args:", args);
    console.log("DEBUG env SEED_CLEAR:", process.env.SEED_CLEAR);
    console.log("DEBUG env SEED_NO_MIGRATE:", process.env.SEED_NO_MIGRATE);
    console.log("DEBUG clearFirst:", clearFirst, "doMigrate:", doMigrate);
  }

  if (clearFirst) {
    console.log("--clear: removing existing documents...");
    const [wo, v, c, p, s, al, at, st] = await Promise.all([
      WorkOrder.deleteMany({}),
      Vehicle.deleteMany({}),
      Customer.deleteMany({}),
      Part.deleteMany({}),
      Service.deleteMany({}),
      Alignment.deleteMany({}),
      AlignmentTemplate.deleteMany({}),
      Setting.deleteMany({ category: { $in: ["alignmentType", "rideHeightReference"] } }),
    ]);
    console.log(`  Deleted: ${wo.deletedCount} workorders, ${v.deletedCount} vehicles, ${c.deletedCount} customers, ${p.deletedCount} parts, ${s.deletedCount} services.`);
    console.log(`  Deleted: ${al.deletedCount} alignments, ${at.deletedCount} alignment templates, ${st.deletedCount} settings.\n`);
  }

  try {
    // 1. Roles (always first - users depend on roles)
    const { admin, tech, basic } = await seedRoles();

    // 2. Migrate legacy users (optional)
    if (doMigrate) {
      await migrateUsers({ admin: admin._id, tech: tech._id, basic: basic._id });
    } else {
      console.log("Skipped user migration (--no-migrate)");
    }

    // 3. Customers
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

    // 4. Vehicles
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

    // 5. Parts
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

    // 6. Services
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

    // 7. Work Orders
    console.log("Seeding work orders...");
    const statuses = ["scheduled", "in_progress", "completed", "completed", "completed"] as const;
    const workTypes = ["maintenance", "repair", "inspection", "diagnostic", "maintenance"] as const;
    const laborRates = [85, 95, 120, 95, 75];
    for (let i = 0; i < 15; i++) {
      const vehicle = insertedVehicles[i];
      const daysAgo = 90 - i * 5;
      const workOrderDate = new Date();
      workOrderDate.setDate(workOrderDate.getDate() - daysAgo);
      const partsUsed =
        i % 3 !== 0
          ? [
              {
                part: insertedParts[i % insertedParts.length]._id,
                quantity: 1,
                unitPrice: (insertedParts[i % insertedParts.length] as { sellingPrice: number }).sellingPrice,
              },
              ...(i % 2 === 0
                ? [
                    {
                      part: insertedParts[(i + 3) % insertedParts.length]._id,
                      quantity: 2,
                      unitPrice: (insertedParts[(i + 3) % insertedParts.length] as { sellingPrice: number }).sellingPrice,
                    },
                  ]
                : []),
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
        workOrderNumber: `WO-${String(i + 1).padStart(4, "0")}`,
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

    // 8. Alignment Types (Settings)
    console.log("Seeding alignment types...");
    for (let i = 0; i < ALIGNMENT_TYPES.length; i++) {
      await Setting.findOneAndUpdate(
        { category: "alignmentType", name: ALIGNMENT_TYPES[i].name },
        {
          $set: {
            category: "alignmentType",
            name: ALIGNMENT_TYPES[i].name,
            description: ALIGNMENT_TYPES[i].description,
            sortOrder: i,
          },
        },
        { upsert: true }
      );
    }
    console.log(`  Inserted/updated ${ALIGNMENT_TYPES.length} alignment types.`);

    // 9. Ride Height References (Settings)
    console.log("Seeding ride height references...");
    for (let i = 0; i < RIDE_HEIGHT_REFERENCES.length; i++) {
      await Setting.findOneAndUpdate(
        { category: "rideHeightReference", name: RIDE_HEIGHT_REFERENCES[i].name },
        {
          $set: {
            category: "rideHeightReference",
            name: RIDE_HEIGHT_REFERENCES[i].name,
            description: RIDE_HEIGHT_REFERENCES[i].description,
            sortOrder: i,
          },
        },
        { upsert: true }
      );
    }
    console.log(`  Inserted/updated ${RIDE_HEIGHT_REFERENCES.length} ride height references.`);

    // 10. Alignment Templates
    console.log("Seeding alignment templates...");
    const insertedTemplates: mongoose.Document[] = [];
    for (const t of ALIGNMENT_TEMPLATES) {
      const doc = await AlignmentTemplate.create({
        make: t.make,
        model: t.model,
        year: t.year,
        alignmentType: t.alignmentType,
        rideHeightReference: "Factory Spec",
        target: t.target,
        rideHeightUnit: "mm",
        trackWidthUnit: "mm",
        notes: t.notes,
      });
      insertedTemplates.push(doc);
    }
    console.log(`  Inserted ${insertedTemplates.length} alignment templates.`);

    // 11. Alignments
    console.log("Seeding alignments...");
    const alignmentCount = 8;
    for (let i = 0; i < alignmentCount; i++) {
      const vehicle = insertedVehicles[i % insertedVehicles.length];
      const template = insertedTemplates[i % insertedTemplates.length] as {
        _id: mongoose.Types.ObjectId;
        target: Record<string, unknown>;
        alignmentType: string;
      };

      const before = {
        fl: {
          camber: (template.target.fl as { camber: number })?.camber + (Math.random() * 1.5 - 0.5),
          toe: (template.target.fl as { toe: number })?.toe + (Math.random() * 0.15 - 0.05),
          rideHeight: 340 + Math.round(Math.random() * 10),
          weightPercent: 24 + Math.random() * 2,
          weightLbs: 900 + Math.round(Math.random() * 50),
        },
        fr: {
          camber: (template.target.fr as { camber: number })?.camber + (Math.random() * 1.5 - 0.5),
          toe: (template.target.fr as { toe: number })?.toe + (Math.random() * 0.15 - 0.05),
          rideHeight: 340 + Math.round(Math.random() * 10),
          weightPercent: 24 + Math.random() * 2,
          weightLbs: 900 + Math.round(Math.random() * 50),
        },
        rl: {
          camber: (template.target.rl as { camber: number })?.camber + (Math.random() * 1.2 - 0.4),
          toe: (template.target.rl as { toe: number })?.toe + (Math.random() * 0.12 - 0.04),
          rideHeight: 350 + Math.round(Math.random() * 10),
          weightPercent: 26 + Math.random() * 2,
          weightLbs: 950 + Math.round(Math.random() * 50),
        },
        rr: {
          camber: (template.target.rr as { camber: number })?.camber + (Math.random() * 1.2 - 0.4),
          toe: (template.target.rr as { toe: number })?.toe + (Math.random() * 0.12 - 0.04),
          rideHeight: 350 + Math.round(Math.random() * 10),
          weightPercent: 26 + Math.random() * 2,
          weightLbs: 950 + Math.round(Math.random() * 50),
        },
        frontAxlePercent: 48 + Math.random() * 4,
        rearAxlePercent: 48 + Math.random() * 4,
        leftSidePercent: 49 + Math.random() * 2,
        rightSidePercent: 49 + Math.random() * 2,
        crossFLRRPercent: 49 + Math.random() * 2,
        crossFRRLPercent: 49 + Math.random() * 2,
        totalWeightLbs: 3500 + Math.round(Math.random() * 500),
        trackWidthFront: 1550 + Math.round(Math.random() * 20),
        trackWidthRear: 1560 + Math.round(Math.random() * 20),
      };

      const after = {
        fl: {
          camber: (template.target.fl as { camber: number })?.camber + (Math.random() * 0.1 - 0.05),
          toe: (template.target.fl as { toe: number })?.toe + (Math.random() * 0.02 - 0.01),
          rideHeight: before.fl.rideHeight,
          weightPercent: before.fl.weightPercent,
          weightLbs: before.fl.weightLbs,
        },
        fr: {
          camber: (template.target.fr as { camber: number })?.camber + (Math.random() * 0.1 - 0.05),
          toe: (template.target.fr as { toe: number })?.toe + (Math.random() * 0.02 - 0.01),
          rideHeight: before.fr.rideHeight,
          weightPercent: before.fr.weightPercent,
          weightLbs: before.fr.weightLbs,
        },
        rl: {
          camber: (template.target.rl as { camber: number })?.camber + (Math.random() * 0.1 - 0.05),
          toe: (template.target.rl as { toe: number })?.toe + (Math.random() * 0.02 - 0.01),
          rideHeight: before.rl.rideHeight,
          weightPercent: before.rl.weightPercent,
          weightLbs: before.rl.weightLbs,
        },
        rr: {
          camber: (template.target.rr as { camber: number })?.camber + (Math.random() * 0.1 - 0.05),
          toe: (template.target.rr as { toe: number })?.toe + (Math.random() * 0.02 - 0.01),
          rideHeight: before.rr.rideHeight,
          weightPercent: before.rr.weightPercent,
          weightLbs: before.rr.weightLbs,
        },
        frontAxlePercent: before.frontAxlePercent,
        rearAxlePercent: before.rearAxlePercent,
        leftSidePercent: before.leftSidePercent,
        rightSidePercent: before.rightSidePercent,
        crossFLRRPercent: before.crossFLRRPercent,
        crossFRRLPercent: before.crossFRRLPercent,
        totalWeightLbs: before.totalWeightLbs,
        trackWidthFront: before.trackWidthFront,
        trackWidthRear: before.trackWidthRear,
      };

      let workOrderId: mongoose.Types.ObjectId | undefined;
      const alignmentWorkOrder = await WorkOrder.findOne({
        vehicle: vehicle._id,
        description: { $regex: /alignment/i },
      }).lean();
      if (alignmentWorkOrder) {
        workOrderId = alignmentWorkOrder._id;
      }

      const daysAgo = 60 - i * 7;
      const alignmentDate = new Date();
      alignmentDate.setDate(alignmentDate.getDate() - daysAgo);

      await Alignment.create({
        vehicle: vehicle._id,
        workOrder: workOrderId,
        template: template._id,
        alignmentType: template.alignmentType,
        rideHeightReference: "Factory Spec",
        before,
        after,
        intermediateSteps:
          i % 3 === 0
            ? [
                {
                  label: "After front camber adjustment",
                  snapshot: {
                    ...before,
                    fl: { ...before.fl, camber: after.fl.camber },
                    fr: { ...before.fr, camber: after.fr.camber },
                  },
                },
              ]
            : [],
        customerNotes: i % 2 === 0 ? "Customer requested alignment check after hitting pothole" : undefined,
        technicianNotes: `Alignment completed. ${i % 2 === 0 ? "Noticed slight wear on front tires." : "All components in good condition."}`,
        accuracyRating: 4 + Math.round(Math.random()),
        rideHeightUnit: "mm",
        trackWidthUnit: "mm",
        alignmentDate,
      });
    }
    console.log(`  Inserted ${alignmentCount} alignments.`);

    console.log("\nSeed completed successfully.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
