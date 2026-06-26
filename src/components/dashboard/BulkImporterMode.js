"use client";

import { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";

export default function BulkImporterMode({ onClose }) {
  const { addToast, currentUser } = useDashboard();
  const [csvData, setCsvData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simplified CSV Parser
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    addToast(`Parsing ${file.name}...`, "⏳");
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n").filter(line => line.trim() !== "");
      if (lines.length < 2) {
        addToast("CSV must contain headers and at least one row.", "❌");
        return;
      }
      
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''));
      setColumns(headers);

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ''));
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || "";
        });
        // We ensure every row has a unique frontend ID
        rowData._id = `row-${i}-${Date.now()}`;
        rows.push(rowData);
      }
      setCsvData(rows);
      addToast(`Successfully parsed ${rows.length} records.`, "✅");
    };
    reader.readAsText(file);
  };

  const handleCellChange = (rowId, column, value) => {
    setCsvData(prev => prev.map(row => 
      row._id === rowId ? { ...row, [column]: value } : row
    ));
  };

  const handleSubmit = async () => {
    if (csvData.length === 0) return;
    setIsProcessing(true);
    addToast("Mapping your columns to ScoutIt schema...", "🧠");

    try {
      // Step 1: Get AI blueprint mapping for the CSV headers
      const blueprintRes = await fetch('/api/ai/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: columns,
          sampleData: csvData.slice(0, 3).map(r => {
            const clean = { ...r };
            delete clean._id;
            return clean;
          })
        })
      });

      if (!blueprintRes.ok) throw new Error('Blueprint mapping failed');
      const mapping = await blueprintRes.json();

      addToast("Schema mapped. Sending to Supabase...", "🚀");

      // Step 2: Transform rows using the mapping
      const properties = csvData.map(row => {
        const mapped = { details: {} };
        columns.forEach(col => {
          const target = mapping[col] || 'details';
          const val = row[col];
          if (!val) return;
          if (target === 'details') {
            mapped.details[col] = val;
          } else {
            mapped[target] = val;
          }
        });

        return {
          owner_id: currentUser?.id || 'bulk-import',
          title: mapped.title || 'Untitled Property',
          location: mapped.location || '',
          type: mapped.type || 'commercial',
          space_category: mapped.type || 'commercial',
          price: mapped.price || null,
          description: mapped.description || '',
          media_link: mapped.media_link || '',
          pipeline_status: 'pending',
          details: mapped.details || {}
        };
      });

      // Step 3: Bulk insert into Supabase
      const insertRes = await fetch('/api/dashboard/bulk-insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties })
      });

      const result = await insertRes.json();
      if (!insertRes.ok) throw new Error(result.error || 'Insert failed');

      addToast(`${result.count} properties queued for Admin Approval!`, "✅");
      onClose();
    } catch (err) {
      console.error('[BulkImporter]', err);
      addToast(`Import failed: ${err.message}`, "❌");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* HEADER */}
      <div className="p-4 border-b border-surface-variant bg-surface flex justify-between items-center shrink-0">
        <button 
          onClick={onClose} 
          className="text-text-secondary hover:text-gold-accent text-xs font-label-caps tracking-widest uppercase transition-colors"
        >
          ← Exit Importer
        </button>
        <span className="font-label-caps text-xs tracking-widest text-gold-accent uppercase">
          Bulk Portfolio Importer
        </span>
      </div>

      <div className="flex-1 flex flex-col p-6 lg:p-12 overflow-hidden gap-6">
        {/* TOP: Upload Zone */}
        <div className="shrink-0 bg-[#121110] border-2 border-dashed border-surface-variant rounded-lg p-8 flex flex-col items-center justify-center relative hover:border-gold-accent transition-colors">
          <h2 className="font-display-md text-2xl text-on-surface mb-2">Upload CSV Portfolio</h2>
          <p className="text-sm text-text-secondary mb-6 text-center max-w-xl leading-relaxed">
            Ensure your CSV contains columns matching our schema (e.g., <strong>Title, Location, Category, Price, Condition, Layout, Size (sqm)</strong>). 
            <br /><em>Note: For Residential spaces, use "Bedrooms" and "Furnishing" instead of Condition and Layout.</em>
          </p>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            id="csv-upload" 
            onChange={handleFileUpload} 
          />
          <label 
            htmlFor="csv-upload" 
            className="cursor-pointer bg-surface-alt border border-gold-accent text-gold-accent font-working-title px-6 py-3 rounded hover:bg-gold-accent/10 transition-colors"
          >
            Browse CSV File
          </label>
        </div>

        {/* MIDDLE: Data Grid */}
        <div className="flex-1 bg-surface border border-surface-variant rounded-lg flex flex-col overflow-hidden relative">
          <div className="p-4 border-b border-surface-variant bg-[#0a0a0a] flex justify-between items-center shrink-0">
            <h3 className="font-working-title text-gold-accent text-sm">Data Grid Preview</h3>
            <span className="text-xs text-text-secondary">{csvData.length} rows loaded</span>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            {csvData.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-surface-alt border-b border-surface-variant sticky top-0 z-10">
                    <th className="p-3 text-[10px] font-label-caps text-text-secondary uppercase tracking-widest w-12 text-center">#</th>
                    {columns.map(col => (
                      <th key={col} className="p-3 text-[10px] font-label-caps text-text-secondary uppercase tracking-widest border-l border-surface-variant/50">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.map((row, idx) => (
                    <tr key={row._id} className="border-b border-surface-variant/50 hover:bg-surface-alt/50 transition-colors">
                      <td className="p-3 text-xs text-text-muted text-center bg-surface-alt/30">{idx + 1}</td>
                      {columns.map(col => (
                        <td key={col} className="p-0 border-l border-surface-variant/50">
                          <input 
                            className="w-full h-full bg-transparent p-3 text-xs text-on-surface focus:outline-none focus:bg-gold-accent/5 focus:ring-1 focus:ring-inset focus:ring-gold-accent"
                            value={row[col]}
                            onChange={(e) => handleCellChange(row._id, col, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-text-muted">
                <span className="text-3xl mb-2">🗃️</span>
                <p className="text-sm">Grid is empty. Upload a CSV to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM: Action */}
        <div className="shrink-0 flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={csvData.length === 0 || isProcessing}
            className="bg-gold-accent text-background font-working-title font-bold px-8 py-4 rounded hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            {isProcessing ? "Processing..." : "Process & Import Portfolio"}
          </button>
        </div>
      </div>
    </div>
  );
}
