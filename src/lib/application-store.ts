import fs from "fs";
import path from "path";

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

export function getAllApplications(): MerchantApplication[] {
  return readStore();
}

export function createApplication(input: {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  wine_count?: number;
  website?: string;
  message?: string;
}): MerchantApplication {
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

export function updateApplicationStatus(id: string, status: ApplicationStatus): MerchantApplication | null {
  const apps = readStore();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  apps[idx].status = status;
  writeStore(apps);
  return apps[idx];
}
