"use client";

import { useState } from "react";
import type { IAlignmentSnapshot } from "@/models/AlignmentSnapshot";

const inputClass =
  "mt-1 block w-full min-w-0 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400";

type Props = {
  label?: string;
  value: IAlignmentSnapshot;
  onChange: (v: IAlignmentSnapshot) => void;
  rideHeightUnit?: "mm" | "in";
  trackWidthUnit?: "mm" | "in";
};

function CornerFields({
  prefix,
  corner,
  onChange,
  rideHeightUnit,
  totalWeightLbs,
  weightMode,
  onWeightModeChange,
}: {
  prefix: "fl" | "fr" | "rl" | "rr";
  corner: IAlignmentSnapshot["fl"];
  onChange: (c: IAlignmentSnapshot["fl"]) => void;
  rideHeightUnit?: "mm" | "in";
  totalWeightLbs?: number;
  weightMode: "%" | "lbs";
  onWeightModeChange: (mode: "%" | "lbs") => void;
}) {
  const c = corner ?? {};
  const rideUnit = rideHeightUnit ?? "mm";
  const weightValue = weightMode === "%" ? (c.weightPercent ?? "") : (c.weightLbs ?? "");
  const setWeight = (val: number | undefined) =>
    weightMode === "%"
      ? onChange({ ...c, weightPercent: val })
      : onChange({ ...c, weightLbs: val });

  return (
    <div className="rounded border border-zinc-200 p-3 dark:border-zinc-700">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {prefix === "fl" && "Front Left"}
        {prefix === "fr" && "Front Right"}
        {prefix === "rl" && "Rear Left"}
        {prefix === "rr" && "Rear Right"}
      </p>
      <div className="grid grid-cols-2 gap-x-2 gap-y-3 md:grid-cols-5 md:gap-x-3">
        <div className="min-w-0 md:col-span-1">
          <label className="block whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400">Camber (°)</label>
          <input
            type="number"
            step="0.01"
            value={c.camber ?? ""}
            onChange={(e) => onChange({ ...c, camber: e.target.value ? Number(e.target.value) : undefined })}
            className={inputClass}
          />
        </div>
        <div className="min-w-0 md:col-span-1">
          <label className="block whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400">Toe (mm)</label>
          <input
            type="number"
            step="0.1"
            value={c.toe ?? ""}
            onChange={(e) => onChange({ ...c, toe: e.target.value ? Number(e.target.value) : undefined })}
            className={inputClass}
          />
        </div>
        <div className="min-w-0 md:col-span-1">
          <label className="block whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400">Ride H. ({rideUnit})</label>
          <input
            type="number"
            step="0.1"
            value={c.rideHeight ?? ""}
            onChange={(e) => onChange({ ...c, rideHeight: e.target.value ? Number(e.target.value) : undefined })}
            className={inputClass}
          />
        </div>
        <div className="min-w-0 md:col-span-2">
          <div className="flex items-center justify-between gap-1">
            <label className="block text-xs text-zinc-600 dark:text-zinc-400">Weight</label>
            <span className="flex rounded border border-zinc-300 dark:border-zinc-600">
              <button
                type="button"
                onClick={() => onWeightModeChange("%")}
                className={`rounded-l border-r border-zinc-300 px-2 py-0.5 text-xs dark:border-zinc-600 ${
                  weightMode === "%"
                    ? "bg-indigo-100 font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => onWeightModeChange("lbs")}
                className={`rounded-r px-2 py-0.5 text-xs ${
                  weightMode === "lbs"
                    ? "bg-indigo-100 font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
                }`}
              >
                lbs
              </button>
            </span>
          </div>
          <input
            type="number"
            step="0.1"
            value={weightValue}
            onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
            placeholder={weightMode === "%" ? "0–100" : totalWeightLbs ? `of ${totalWeightLbs}` : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default function AlignmentSnapshotForm({
  label,
  value,
  onChange,
  rideHeightUnit = "mm",
  trackWidthUnit = "mm",
}: Props) {
  const [weightMode, setWeightMode] = useState<"%" | "lbs">("%");
  const v = value ?? {};
  const update = (key: keyof IAlignmentSnapshot, val: unknown) => {
    onChange({ ...v, [key]: val });
  };

  return (
    <div className="space-y-4">
      {label && (
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {label}
        </h3>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <CornerFields
          prefix="fl"
          corner={v.fl}
          onChange={(c) => update("fl", c)}
          rideHeightUnit={rideHeightUnit}
          totalWeightLbs={v.totalWeightLbs}
          weightMode={weightMode}
          onWeightModeChange={setWeightMode}
        />
        <CornerFields
          prefix="fr"
          corner={v.fr}
          onChange={(c) => update("fr", c)}
          rideHeightUnit={rideHeightUnit}
          totalWeightLbs={v.totalWeightLbs}
          weightMode={weightMode}
          onWeightModeChange={setWeightMode}
        />
        <CornerFields
          prefix="rl"
          corner={v.rl}
          onChange={(c) => update("rl", c)}
          rideHeightUnit={rideHeightUnit}
          totalWeightLbs={v.totalWeightLbs}
          weightMode={weightMode}
          onWeightModeChange={setWeightMode}
        />
        <CornerFields
          prefix="rr"
          corner={v.rr}
          onChange={(c) => update("rr", c)}
          rideHeightUnit={rideHeightUnit}
          totalWeightLbs={v.totalWeightLbs}
          weightMode={weightMode}
          onWeightModeChange={setWeightMode}
        />
      </div>
      <div className="grid gap-4 rounded border border-zinc-200 p-3 dark:border-zinc-700 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Front axle %</label>
          <input
            type="number"
            step="0.1"
            value={v.frontAxlePercent ?? ""}
            onChange={(e) => update("frontAxlePercent", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Rear axle %</label>
          <input
            type="number"
            step="0.1"
            value={v.rearAxlePercent ?? ""}
            onChange={(e) => update("rearAxlePercent", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Left side %</label>
          <input
            type="number"
            step="0.1"
            value={v.leftSidePercent ?? ""}
            onChange={(e) => update("leftSidePercent", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Right side %</label>
          <input
            type="number"
            step="0.1"
            value={v.rightSidePercent ?? ""}
            onChange={(e) => update("rightSidePercent", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Cross FL-RR %</label>
          <input
            type="number"
            step="0.1"
            value={v.crossFLRRPercent ?? ""}
            onChange={(e) => update("crossFLRRPercent", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Cross FR-RL %</label>
          <input
            type="number"
            step="0.1"
            value={v.crossFRRLPercent ?? ""}
            onChange={(e) => update("crossFRRLPercent", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Total weight (lbs)</label>
          <input
            type="number"
            step="0.1"
            value={v.totalWeightLbs ?? ""}
            onChange={(e) => update("totalWeightLbs", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Track front ({trackWidthUnit})</label>
          <input
            type="number"
            step="0.1"
            value={v.trackWidthFront ?? ""}
            onChange={(e) => update("trackWidthFront", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Track rear ({trackWidthUnit})</label>
          <input
            type="number"
            step="0.1"
            value={v.trackWidthRear ?? ""}
            onChange={(e) => update("trackWidthRear", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
