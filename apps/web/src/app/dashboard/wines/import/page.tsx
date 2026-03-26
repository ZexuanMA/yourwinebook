"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useDashboardLang } from "@/lib/dashboard-lang-context";

interface ParsedRow {
  name: string;
  type: string;
  region_zh: string;
  region_en: string;
  price: string;
  grape_variety?: string;
  vintage?: string;
  description_zh?: string;
  description_en?: string;
  buy_url?: string;
}

interface ImportError {
  row: number;
  name: string;
  error: string;
}

const REQUIRED_COLS = ["name", "type", "region_zh", "region_en", "price"];
const VALID_TYPES = ["red", "white", "sparkling", "rosé", "dessert"];

const CSV_TEMPLATE = `name,type,region_zh,region_en,price,grape_variety,vintage,description_zh,description_en,buy_url
Château Margaux 2018,red,法國 · 波爾多 · 瑪歌,France · Bordeaux · Margaux,2880,Cabernet Sauvignon,2018,波爾多頂級名莊，口感豐富優雅,Top Bordeaux estate with rich and elegant palate,https://example.com
Cloudy Bay Sauvignon Blanc 2023,white,紐西蘭 · 馬爾堡羅,New Zealand · Marlborough,158,Sauvignon Blanc,2023,清爽白酒，帶青草和柑橘香氣,Crisp white with grass and citrus notes,`;

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export default function ImportWinesPage() {
  const { t } = useDashboardLang();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: ImportError[] } | null>(null);
  const [parseError, setParseError] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setResults(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);

      // Validate headers
      const missing = REQUIRED_COLS.filter((c) => !h.includes(c));
      if (missing.length > 0) {
        setParseError(`Missing required columns: ${missing.join(", ")}`);
        setRows([]);
        return;
      }

      if (r.length === 0) {
        setParseError("CSV file has no data rows");
        setRows([]);
        return;
      }

      if (r.length > 500) {
        setParseError("CSV file exceeds 500 row limit");
        setRows([]);
        return;
      }

      setHeaders(h);
      const parsed: ParsedRow[] = r.map((row) => {
        const obj: Record<string, string> = {};
        h.forEach((key, i) => { obj[key] = row[i] || ""; });
        return {
          name: obj.name || "",
          type: obj.type || "",
          region_zh: obj.region_zh || "",
          region_en: obj.region_en || "",
          price: obj.price || "",
          grape_variety: obj.grape_variety,
          vintage: obj.vintage,
          description_zh: obj.description_zh,
          description_en: obj.description_en,
          buy_url: obj.buy_url,
        };
      });
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    const errors: ImportError[] = [];
    let success = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setProgress(i + 1);

      // Client-side validation
      if (!row.name.trim()) {
        errors.push({ row: i + 2, name: row.name || "(empty)", error: "Name is required" });
        continue;
      }
      if (!VALID_TYPES.includes(row.type)) {
        errors.push({ row: i + 2, name: row.name, error: `Invalid type "${row.type}". Must be: ${VALID_TYPES.join(", ")}` });
        continue;
      }
      const price = parseFloat(row.price);
      if (isNaN(price) || price <= 0) {
        errors.push({ row: i + 2, name: row.name, error: `Invalid price "${row.price}"` });
        continue;
      }

      try {
        const res = await fetch("/api/merchant/wines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name.trim(),
            type: row.type,
            region_zh: row.region_zh.trim(),
            region_en: row.region_en.trim(),
            price,
            grape_variety: row.grape_variety?.trim() || undefined,
            vintage: row.vintage ? parseInt(row.vintage) : undefined,
            description_zh: row.description_zh?.trim() || undefined,
            description_en: row.description_en?.trim() || undefined,
            buy_url: row.buy_url?.trim() || undefined,
          }),
        });

        if (res.ok) {
          success++;
        } else {
          const data = await res.json().catch(() => ({}));
          errors.push({ row: i + 2, name: row.name, error: data.error || `HTTP ${res.status}` });
        }
      } catch {
        errors.push({ row: i + 2, name: row.name, error: "Network error" });
      }
    }

    setResults({ success, failed: errors.length, errors });
    setImporting(false);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wine-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setRows([]);
    setHeaders([]);
    setFileName("");
    setResults(null);
    setParseError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const previewRows = rows.slice(0, 10);
  const previewCols = ["name", "type", "region_zh", "price", "vintage"];

  return (
    <div className="max-w-4xl">
      {/* Back nav */}
      <Link
        href="/dashboard/wines"
        className="inline-flex items-center gap-1.5 text-sm text-text-sub hover:text-text transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {t("import.back")}
      </Link>

      <h1 className="text-2xl font-semibold text-text mb-1">{t("import.title")}</h1>
      <p className="text-sm text-text-sub mb-8">{t("import.subtitle")}</p>

      {/* Results screen */}
      {results && (
        <div className="space-y-6">
          <div className="bg-white border border-wine-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-text mb-4">{t("import.result")}</h2>
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-3xl font-bold text-green-600">{results.success}</p>
                <p className="text-sm text-text-sub">{t("import.success")}</p>
              </div>
              {results.failed > 0 && (
                <div>
                  <p className="text-3xl font-bold text-red-500">{results.failed}</p>
                  <p className="text-sm text-text-sub">{t("import.failed")}</p>
                </div>
              )}
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="bg-white border border-red-200 rounded-2xl p-6">
              <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                {t("import.errors")}
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium text-text">{t("import.row")} {err.row}</span>
                      <span className="text-text-sub"> — {err.name}</span>
                      <p className="text-red-600 text-xs mt-0.5">{err.error}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2.5 border border-wine-border rounded-xl text-sm font-medium hover:bg-bg transition-colors cursor-pointer"
            >
              {t("import.importMore")}
            </button>
            <Link
              href="/dashboard/wines"
              className="px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors"
            >
              {t("import.done")}
            </Link>
          </div>
        </div>
      )}

      {/* Upload + preview */}
      {!results && (
        <div className="space-y-6">
          {/* Upload area */}
          <div className="bg-white border border-wine-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-wine" />
                {t("import.upload")}
              </h2>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 text-sm text-wine hover:text-wine-dark transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {t("import.template")}
              </button>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-wine-border rounded-xl p-8 text-center hover:border-gold hover:bg-bg/50 transition-all cursor-pointer"
            >
              <Upload className="w-8 h-8 text-text-sub/40 mx-auto mb-3" />
              {fileName ? (
                <p className="text-sm font-medium text-text">{fileName}</p>
              ) : (
                <p className="text-sm text-text-sub">{t("import.uploadHint")}</p>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
            <p className="text-xs text-text-sub mt-3">{t("import.requiredCols")}</p>
          </div>

          {parseError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{parseError}</p>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-wine-border flex items-center justify-between">
                <h3 className="font-semibold text-text text-sm">
                  {t("import.preview")} — {t("import.total")} {rows.length} {t("import.rows")}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-sub uppercase">#</th>
                      {previewCols.filter((c) => headers.includes(c)).map((col) => (
                        <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-sub uppercase">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F0EA]">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-bg transition-colors">
                        <td className="px-4 py-3 text-text-sub">{i + 1}</td>
                        {previewCols.filter((c) => headers.includes(c)).map((col) => (
                          <td key={col} className="px-4 py-3 text-text max-w-[200px] truncate">
                            {(row as unknown as Record<string, string | undefined>)[col] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <div className="px-6 py-3 bg-bg text-xs text-text-sub text-center">
                  ... {rows.length - 10} more rows
                </div>
              )}
            </div>
          )}

          {/* Import button + progress */}
          {rows.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-sub">
                {importing && (
                  <span>{progress} / {rows.length}</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  disabled={importing}
                  className="px-5 py-2.5 border border-wine-border rounded-xl text-sm font-medium hover:bg-bg transition-colors text-text-sub cursor-pointer disabled:opacity-50"
                >
                  {t("newWine.cancel")}
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 cursor-pointer shadow-sm"
                >
                  {importing ? `${t("import.importing")} (${progress}/${rows.length})` : t("import.startImport")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
