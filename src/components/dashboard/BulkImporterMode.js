"use client";

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { Download, Table } from "lucide-react";
import { useDashboard } from "../../context/DashboardContext";
import { sanitizeError } from "@/lib/sanitizeError";
import { mapPropertyCsvRows, MAX_PROPERTY_CSV_ROWS, MAX_PROPERTY_CSV_COLUMNS, MAX_PROPERTY_CSV_BYTES } from "@/lib/propertyCsvImport";

export const SIX_VERTICAL_CSV_TEMPLATE_HEADERS = [
  "Title",
  "Location",
  "Category",
  "Price",
  "Floor_Sqm",
  "Beds",
  "Baths",
  "Total_GLA",
  "PEZA",
  "Seating_Capacity",
  "Hood_Exhaust",
  "Liquor_License",
  "Room_Count",
  "Star_Rating",
  "Nightly_Rate",
  "Max_Guests",
  "Seated_Capacity",
  "Standing_Capacity",
  "Description",
];

export const SIX_VERTICAL_CSV_TEMPLATE_ROWS = [
  {
    Title: "BGC Grade-A Office Floor",
    Location: "Bonifacio Global City, Taguig",
    Category: "commercial",
    Price: "1450",
    Floor_Sqm: "1200",
    Total_GLA: "28500",
    PEZA: "Accredited",
    Description: "Full-floor corporate headquarters plate with 100% backup power.",
  },
  {
    Title: "Rockwell Sky Residence",
    Location: "Rockwell Center, Makati",
    Category: "residential",
    Price: "42000000",
    Floor_Sqm: "185",
    Beds: "3",
    Baths: "3",
    Description: "Corner 3-bedroom residence with panoramic skyline views.",
  },
  {
    Title: "Poblacion Bistro Flagship",
    Location: "Poblacion, Makati",
    Category: "restaurants",
    Price: "260000",
    Floor_Sqm: "240",
    Seating_Capacity: "88",
    Hood_Exhaust: "Yes",
    Liquor_License: "Eligible",
    Description: "Turnkey F&B space with dedicated grease trap and street frontage.",
  },
  {
    Title: "Mactan Bay Resort Hotel",
    Location: "Lapu-Lapu City, Cebu",
    Category: "hospitality",
    Price: "650000000",
    Floor_Sqm: "8400",
    Room_Count: "120",
    Star_Rating: "5",
    Description: "Beachfront hospitality asset with ballroom and dining outlets.",
  },
  {
    Title: "Siargao Cloud Loft Villa",
    Location: "General Luna, Siargao",
    Category: "str",
    Price: "12500",
    Floor_Sqm: "140",
    Beds: "2",
    Baths: "2",
    Nightly_Rate: "12500",
    Max_Guests: "6",
    Description: "Boutique short-term rental villa near Cloud 9 surf break.",
  },
  {
    Title: "Intramuros Heritage Atrium",
    Location: "Intramuros, Manila",
    Category: "venues",
    Price: "180000",
    Floor_Sqm: "620",
    Seated_Capacity: "320",
    Standing_Capacity: "550",
    Description: "Column-free event hall for corporate summits and weddings.",
  },
];

export function buildSixVerticalCsvTemplate() {
  const rows = SIX_VERTICAL_CSV_TEMPLATE_ROWS.map((row) =>
    SIX_VERTICAL_CSV_TEMPLATE_HEADERS.map((header) => row[header] ?? "")
  );
  return Papa.unparse({ fields: SIX_VERTICAL_CSV_TEMPLATE_HEADERS, data: rows });
}

export default function BulkImporterMode({ onClose }) {
  const { addToast, bulkAddListings } = useDashboard();
  const [csvData, setCsvData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const submitting = useRef(false);
  const parseGeneration = useRef(0);

  // Robust CSV parsing via Papa.parse — correctly handles quoted fields,
  // commas inside values (e.g. "Makati, Metro Manila"), and newlines in cells.
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const generation = ++parseGeneration.current;
    setCsvData([]);
    setColumns([]);
    if (file.size > MAX_PROPERTY_CSV_BYTES) {
      addToast("The CSV is too large. Choose a smaller file.", "❌");
      return;
    }

    addToast(`Parsing ${file.name}...`, "⏳");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (generation !== parseGeneration.current) return;
        const headers = (results.meta.fields || []).filter(Boolean);
        if (results.errors.length || Object.keys(results.meta.renamedHeaders || {}).length > 0) {
          addToast("Check the CSV for duplicate headers or rows with missing or extra cells.", "❌");
          return;
        }
        const rows = results.data
          .filter((row) => Object.values(row).some((v) => typeof v === "string" && v.trim() !== ""))
          .map((values, id) => ({ id, values }));

        if (headers.length === 0 || rows.length === 0) {
          addToast("CSV must contain headers and at least one row.", "❌");
          return;
        }
        if (rows.length > MAX_PROPERTY_CSV_ROWS || headers.length > MAX_PROPERTY_CSV_COLUMNS) {
          addToast(`Use a CSV with up to ${MAX_PROPERTY_CSV_ROWS} rows and ${MAX_PROPERTY_CSV_COLUMNS} columns.`, "❌");
          return;
        }

        setColumns(headers);
        setCsvData(rows);
        addToast(`Successfully parsed ${rows.length} records.`, "✅");
      },
      error: (err) => {
        if (generation !== parseGeneration.current) return;
        console.error("[BulkImporter] CSV parse error:", err);
        addToast(`Could not parse CSV: ${sanitizeError(err, "the file could not be read.")}`, "❌");
      },
    });
  };

  const handleCellChange = (rowId, column, value) => {
    setCsvData(prev => prev.map(row => 
      row.id === rowId ? { ...row, values: { ...row.values, [column]: value } } : row
    ));
  };

  const handleSubmit = async () => {
    if (!csvData.length || submitting.current) return;
    submitting.current = true;
    setIsProcessing(true);

    try {
      const properties = mapPropertyCsvRows(columns, csvData.map(({ values }) => values));
      if (await bulkAddListings(properties)) onClose?.();
    } finally {
      submitting.current = false;
      setIsProcessing(false);
    }
  };

  // Keyboard accessibility: dismiss bulk importer via Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting.current) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDownloadTemplate = () => {
    const csv = buildSixVerticalCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "scoutit-6-vertical-portfolio-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("Downloaded 6-vertical CSV template.", "✅");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden motion-safe:animate-[fadeIn_0.3s_ease-out]">
      {/* HEADER */}
      <div className="p-4 border-b border-surface-variant bg-surface flex justify-between items-center shrink-0">
        <button 
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="min-h-11 inline-flex items-center text-text-secondary hover:text-gold-accent text-xs font-label-caps tracking-widest uppercase transition"
        >
          ← Exit Importer
        </button>
        <span className="font-label-caps text-xs tracking-widest text-gold-accent uppercase">
          Bulk Portfolio Importer
        </span>
      </div>

      <div className="flex-1 flex flex-col p-6 lg:p-12 overflow-hidden gap-6">
        {/* TOP: Upload Zone */}
        <div className="shrink-0 bg-surface border-2 border-dashed border-surface-variant rounded-lg p-6 lg:p-8 flex flex-col items-center justify-center relative hover:border-gold-accent transition">
          <h2 className="font-display-md text-2xl text-on-surface mb-2">Upload CSV Portfolio</h2>
          <p className="text-sm text-text-secondary mb-3 text-center max-w-2xl leading-relaxed">
            Include <strong>Title</strong> and <strong>Location</strong>. Add <strong>Category</strong> across all 6 verticals:{" "}
            <span className="text-on-surface font-mono text-xs">
              commercial, residential, restaurants, hospitality, str, venues
            </span>
            . Your rows will be saved as drafts for you to review.
          </p>
          <p className="text-xs text-text-secondary mb-5 text-center max-w-3xl leading-relaxed">
            Canonical vertical headers:{" "}
            <span className="text-gold-accent font-mono text-xs">
              Total_GLA, PEZA, Seating_Capacity, Hood_Exhaust, Liquor_License, Room_Count, Star_Rating, Nightly_Rate, Max_Guests, Seated_Capacity, Standing_Capacity
            </span>
          </p>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            id="csv-upload" 
            disabled={isProcessing}
            onChange={handleFileUpload} 
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <label
              htmlFor="csv-upload"
              className="cursor-pointer min-h-11 inline-flex items-center bg-surface-alt border border-gold-accent text-gold-accent font-working-title text-sm px-6 py-3 rounded hover:bg-gold-accent/10 transition"
            >
              Browse CSV File
            </label>
            <button
              type="button"
              data-testid="download-csv-template-btn"
              onClick={handleDownloadTemplate}
              disabled={isProcessing}
              className="min-h-11 inline-flex items-center gap-2 bg-surface-alt border border-surface-variant text-on-surface hover:border-gold-accent hover:text-gold-accent font-working-title text-sm px-5 py-3 rounded transition disabled:opacity-50"
            >
              <Download size={14} aria-hidden="true" />
              <span>Download 6-Vertical CSV Template</span>
            </button>
          </div>
        </div>

        {/* MIDDLE: Data Grid */}
        <div className="flex-1 bg-surface/40 backdrop-blur-xl border border-white/[0.04] shadow-[inset_0_1px_1px_rgba(var(--text-primary-rgb),0.05)] rounded-2xl flex flex-col overflow-hidden relative">
          <div className="p-5 border-b border-white/[0.04] bg-white/[0.02] flex justify-between items-center shrink-0">
            <h3 className="font-working-title text-gold-accent text-sm">Data Grid Preview</h3>
            <span className="text-xs text-text-secondary">{csvData.length} rows loaded</span>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {csvData.length > 0 ? (
              <>
                <div className="hidden lg:block flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="bg-surface/60 backdrop-blur-md border-b border-white/[0.04] sticky top-0 z-10">
                        <th className="p-3 text-[12px] font-label-caps text-gold-accent uppercase tracking-widest w-12 text-center">#</th>
                        {columns.map(col => (
                          <th key={col} className="p-3 text-[12px] font-label-caps text-gold-accent uppercase tracking-widest border-l border-white/[0.04]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((row, idx) => (
                        <tr key={row.id} className="border-b border-surface-variant/50 hover:bg-surface-alt/50 transition">
                          <td className="p-3 text-xs text-text-muted text-center bg-surface-alt/30">{idx + 1}</td>
                          {columns.map(col => (
                            <td key={col} className="p-0 border-l border-surface-variant/50">
                              <input 
                                className="w-full h-full bg-transparent p-3 text-xs text-on-surface focus:outline-none focus:bg-gold-accent/5 focus:ring-1 focus:ring-inset focus:ring-gold-accent"
                                value={row.values[col] || ""}
                                disabled={isProcessing}
                                onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List View (lg:hidden) */}
                <div className="lg:hidden flex-1 overflow-auto flex flex-col gap-4 p-4 custom-scrollbar">
                  {csvData.map((row, idx) => (
                    <div key={row.id} className="bg-surface/40 backdrop-blur-xl border border-white/[0.04] shadow-[inset_0_1px_1px_rgba(var(--text-primary-rgb),0.05)] rounded-2xl p-5 flex flex-col gap-3 relative transition-all duration-300 hover:shadow-[0_8px_32px_rgba(var(--bg-rgb),0.4)]">
                      <div className="absolute top-5 right-5 bg-gold-accent/10 text-gold-accent text-[12px] font-label-caps px-2 py-0.5 rounded uppercase tracking-widest">
                        Row {idx + 1}
                      </div>
                      {columns.map(col => (
                        <div key={col} className="flex flex-col gap-1 pr-16">
                          <label className="text-[12px] font-label-caps text-text-secondary uppercase tracking-widest">
                            {col}
                          </label>
                          <input 
                            className="w-full bg-surface-alt/50 border border-white/[0.04] rounded-lg p-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent/50 focus:bg-surface-alt transition-all duration-300"
                            value={row.values[col] || ""}
                            disabled={isProcessing}
                            onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-text-muted">
                <Table size={32} className="text-gold-accent/50 mb-2" />
                <p className="text-sm">Grid is empty. Upload a CSV to begin.</p>
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM: Action */}
        <div className="shrink-0 flex flex-col sm:flex-row gap-3 justify-end items-stretch sm:items-center">
          {isProcessing && (
            <p
              role="status"
              aria-live="polite"
              className="text-xs text-text-secondary flex items-center gap-2 justify-center sm:justify-end"
            >
              <span
                className="w-3 h-3 rounded-full border-2 border-gold-accent border-t-transparent animate-spin shrink-0"
                aria-hidden="true"
              />
              Saving drafts to your inventory…
            </p>
          )}
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={csvData.length === 0 || isProcessing}
            aria-busy={isProcessing}
            className="bg-gold-accent text-background font-working-title font-bold px-8 py-4 rounded hover:opacity-90 disabled:opacity-50 transition uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]"
          >
            {isProcessing ? "Saving drafts…" : "Save drafts"}
          </button>
        </div>
      </div>
    </div>
  );
}
