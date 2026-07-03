import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { leadFromRow, type Lead } from "@/lib/mockData";
import { leadsStore, useLeads } from "@/lib/leadsStore";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Leads · Insurance AI" },
      { name: "description", content: "Bulk upload insurance leads from Excel or CSV for AI scoring." },
    ],
  }),
  component: UploadPage,
});

// Configure the backend endpoint via env; defaults to the local FastAPI server.
const UPLOAD_ENDPOINT =
  (import.meta as any).env?.VITE_LEADS_UPLOAD_URL ?? "http://127.0.0.1:8001/upload-leads";

type UploadResult = {
  leads: Lead[];
  rowsUploaded?: number;
  message?: string;
  source: "api" | "local";
};

function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [preview, setPreview] = useState<Lead[]>([]);
  const [useApi, setUseApi] = useState<boolean>(true);
  const leads = useLeads();
  const uploadedCount = leads.filter((l) => l.leadSource === "Excel Upload" || l.leadSource === "CRM Sync").length;

  // Normalise whatever the API returns into Lead[]
  function normalizeApiLeads(payload: any): Lead[] {
    const rows: any[] = Array.isArray(payload)
      ? payload
      : payload?.records ?? payload?.leads ?? payload?.data ?? payload?.results ?? [];
    if (!Array.isArray(rows)) return [];
    return rows.map((r, i) => {
      // If API already returns a fully-scored Lead, trust it; otherwise score locally
      if (r && typeof r.leadScore === "number" && r.priority && r.suggestedPremium != null) {
        return r as Lead;
      }
      return leadFromRow(r ?? {}, i);
    });
  }

  async function uploadViaApi(file: File): Promise<UploadResult> {
    const form = new FormData();
    form.append("file", file, file.name);
    const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: form });
    const ct = res.headers.get("content-type") ?? "";
    const payload = ct.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
      const detail = typeof payload === "string" ? payload : payload?.detail ?? payload?.message ?? "";
      throw new Error(`Upload failed (${res.status}) ${String(detail).slice(0, 200)}`);
    }

    if (payload && typeof payload === "object" && payload.success === false) {
      throw new Error(payload.message ?? "API rejected the upload.");
    }

    return {
      leads: normalizeApiLeads(payload),
      rowsUploaded: payload?.rows_uploaded,
      message: payload?.message,
      source: "api",
    };
  }

  async function parseLocally(file: File): Promise<UploadResult> {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (!rows.length) throw new Error("No rows found in the file.");
    return { leads: rows.map((r, i) => leadFromRow(r, i)), source: "local" };
  }

  async function handleFile(file: File) {
    setStatus("processing");
    setMessage(useApi ? `Uploading ${file.name} to ${UPLOAD_ENDPOINT}…` : `Reading ${file.name}…`);
    try {
      const result = useApi ? await uploadViaApi(file) : await parseLocally(file);
      const newLeads = result.leads;
      if (!newLeads.length) throw new Error("No leads returned.");
      leadsStore.add(newLeads);
      setPreview(newLeads.slice(0, 5));
      setStatus("success");
      setMessage(
        result.source === "api"
          ? `Uploaded ${result.rowsUploaded ?? newLeads.length} leads to Google Sheets from ${file.name}.`
          : `Parsed ${newLeads.length} leads locally from ${file.name}. Google Sheets was not updated.`,
      );
    } catch (e: any) {
      setStatus("error");
      setMessage(
        useApi
          ? `Google Sheets upload failed. ${e?.message ?? "Failed to reach the backend API."}`
          : e?.message ?? "Failed to process file.",
      );
    }
  }

  function downloadTemplate() {
    const sample = [
      { customerName: "Rohan Sharma", age: 34, gender: "Male", city: "Mumbai", insuranceType: "Motor Insurance", vehicleType: "SUV", vehicleValue: 1800000, annualIncome: 1500000, existingCustomer: "Yes", previousClaims: 1 },
      { customerName: "Priya Iyer", age: 29, gender: "Female", city: "Bangalore", insuranceType: "Motor Insurance", vehicleType: "Sedan", vehicleValue: 900000, annualIncome: 1200000, existingCustomer: "No", previousClaims: 0 },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "leads-template.xlsx");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Leads</h1>
        <p className="text-sm text-muted-foreground">
          Bulk import leads from Excel (.xlsx) or CSV. The AI engine will score, risk-rate, and price each lead automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between rounded-md border bg-muted/30 p-3">
            <div>
              <Label htmlFor="use-api" className="font-medium">Send to backend API</Label>
              <p className="text-xs text-muted-foreground font-mono">POST {UPLOAD_ENDPOINT}</p>
            </div>
            <Switch id="use-api" checked={useApi} onCheckedChange={setUseApi} />
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-10 text-center transition hover:border-primary hover:bg-primary/5"
          >
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop your Excel or CSV file here</p>
              <p className="text-sm text-muted-foreground">or click to browse · supports .xlsx, .xls, .csv</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />Download template
            </Button>
            {uploadedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  leadsStore.replace(leads.filter((l) => l.leadSource !== "Excel Upload" && l.leadSource !== "CRM Sync"));
                  setPreview([]);
                  setStatus("idle");
                  setMessage("");
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />Clear uploaded ({uploadedCount})
              </Button>
            )}
          </div>

          {status !== "idle" && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-md border p-3 text-sm ${
                status === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : status === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-blue-200 bg-blue-50 text-blue-800"
              }`}
            >
              {status === "success" ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : status === "error" ? <AlertCircle className="h-4 w-4 mt-0.5" /> : <Upload className="h-4 w-4 mt-0.5 animate-pulse" />}
              <span>{message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Expected columns</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <p className="text-muted-foreground mb-3">Column names are matched case-insensitively. Missing fields use sensible defaults.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {["customerName", "age", "gender", "city", "insuranceType", "vehicleType", "vehicleValue", "annualIncome", "existingCustomer", "previousClaims"].map((c) => (
              <Badge key={c} variant="outline" className="justify-start font-mono">{c}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Preview (first 5 scored leads)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {preview.map((l) => (
              <div key={l.leadId} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{l.customerName}</p>
                  <p className="text-xs text-muted-foreground">{l.city} · {l.insuranceType}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Score {l.leadScore}</Badge>
                  <Badge className={l.priority === "High" ? "bg-green-100 text-green-700" : l.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>{l.priority}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
