/**
 * Application store — file-based (legacy) or Supabase (when USE_SUPABASE_AUTH=true).
 */
import fs from "fs";
import path from "path";
import { USE_SUPABASE_AUTH } from "./supabase-auth";
import { createSupabaseServer } from "./supabase-server";

export type ApplicationStatus = "pending" | "contacted" | "approved" | "rejected";

export interface MerchantApplication {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  wineCount: number;
  website?: string;
  message?: string;
  status: ApplicationStatus;
  submittedAt: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "applications.json");

function readStore(): MerchantApplication[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as MerchantApplication[];
  } catch {
    return [];
  }
}

function writeStore(apps: MerchantApplication[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2), "utf-8");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToApplication(row: any): MerchantApplication {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone ?? "",
    wineCount: row.wine_count ?? 0,
    website: row.website ?? undefined,
    message: row.message ?? undefined,
    status: row.status as ApplicationStatus,
    submittedAt: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getAllApplications(): Promise<MerchantApplication[]> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data, error } = await sb
        .from("merchant_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[application-store] getAllApplications error:", error.message);
        return [];
      }
      return (data ?? []).map(rowToApplication);
    }
  }
  return readStore();
}

export async function createApplication(input: {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  wine_count?: number;
  website?: string;
  message?: string;
}): Promise<MerchantApplication> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data, error } = await sb
        .from("merchant_applications")
        .insert({
          company_name: input.company_name,
          contact_name: input.contact_name,
          email: input.email,
          phone: input.phone ?? "",
          wine_count: input.wine_count ?? 0,
          website: input.website ?? null,
          message: input.message ?? null,
        })
        .select()
        .single();
      if (error || !data) {
        console.error("[application-store] createApplication error:", error?.message);
        throw new Error("Failed to create application");
      }
      return rowToApplication(data);
    }
  }

  // Legacy path
  const apps = readStore();
  const app: MerchantApplication = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    companyName: input.company_name,
    contactName: input.contact_name,
    email: input.email,
    phone: input.phone ?? "",
    wineCount: input.wine_count ?? 0,
    website: input.website,
    message: input.message,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  apps.push(app);
  writeStore(apps);
  return app;
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<MerchantApplication | null> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data, error } = await sb
        .from("merchant_applications")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error || !data) {
        console.error("[application-store] updateApplicationStatus error:", error?.message);
        return null;
      }
      return rowToApplication(data);
    }
  }

  // Legacy path
  const apps = readStore();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  apps[idx].status = status;
  writeStore(apps);
  return apps[idx];
}
