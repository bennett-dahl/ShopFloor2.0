/**
 * Seed RBAC roles (Admin, Tech, Basic) and optionally migrate existing users
 * from string role (admin/technician/manager) to Role ObjectId ref.
 *
 * Uses (in order): SEED_MONGODB_URI, MONGODB_URI from .env.local / .env
 *
 * Run: npx tsx scripts/seed-roles.ts           — ensure roles exist, migrate users
 * Run: npx tsx scripts/seed-roles.ts --no-migrate — roles only, no user migration
 */
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import connectDB from "../lib/db";
import Role from "../models/Role";
import { RESOURCES, type Resource } from "../lib/permissions";

const ADMIN_NAME = "Admin";
const TECH_NAME = "Tech";
const BASIC_NAME = "Basic";
const DEFAULT_NAME = "Default";

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

async function ensureRoles() {
  const admin = await Role.findOneAndUpdate(
    { name: ADMIN_NAME },
    { $set: { permissions: allPermissions() } },
    { new: true, upsert: true }
  );
  const tech = await Role.findOneAndUpdate(
    { name: TECH_NAME },
    { $set: { permissions: techPermissions() } },
    { new: true, upsert: true }
  );
  const basic = await Role.findOneAndUpdate(
    { name: BASIC_NAME },
    { $set: { permissions: basicPermissions() } },
    { new: true, upsert: true }
  );
  const defaultRole = await Role.findOneAndUpdate(
    { name: DEFAULT_NAME },
    { $set: { permissions: noPermissions() } },
    { new: true, upsert: true }
  );
  return { admin, tech, basic, default: defaultRole };
}

const LEGACY_ROLE_TO_NAME: Record<string, string> = {
  admin: ADMIN_NAME,
  technician: TECH_NAME,
  manager: TECH_NAME,
};

async function migrateUsers(roleIds: { admin: mongoose.Types.ObjectId; tech: mongoose.Types.ObjectId; basic: mongoose.Types.ObjectId }) {
  const coll = mongoose.connection.collection("users");
  const users = await coll.find({}).toArray();
  let updated = 0;
  for (const u of users) {
    const r = u.role;
    if (typeof r === "string") {
      const roleName = LEGACY_ROLE_TO_NAME[r.toLowerCase()] ?? TECH_NAME;
      const roleId = roleName === ADMIN_NAME ? roleIds.admin : roleName === BASIC_NAME ? roleIds.basic : roleIds.tech;
      await coll.updateOne({ _id: u._id }, { $set: { role: roleId } });
      updated++;
    }
  }
  return updated;
}

async function main() {
  const doMigrate = !process.argv.includes("--no-migrate");
  const uri = process.env.SEED_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI or SEED_MONGODB_URI");
    process.exit(1);
  }
  await mongoose.connect(uri);
  await connectDB();
  console.log("Seeding roles...");
  const { admin, tech, basic, default: defaultRole } = await ensureRoles();
  console.log("Roles:", admin.name, tech.name, basic.name, defaultRole.name);
  if (doMigrate) {
    const updated = await migrateUsers({
      admin: admin._id,
      tech: tech._id,
      basic: basic._id,
    });
    console.log("Migrated users:", updated);
  } else {
    console.log("Skipped user migration (--no-migrate)");
  }
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
