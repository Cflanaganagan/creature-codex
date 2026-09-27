import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCreatures } from "@/hooks/useCreatures";
import { creatureSchema, type Creature } from "@/data/creatures";
import { Download, Upload, FileJson, CheckCircle, AlertCircle, Trash2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ImportMode = "replace" | "merge";
type ParseResult =
  | { ok: true; creatures: Creature[] }
  | { ok: false; errors: string[] };

function parseInput(raw: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(raw.trim());
  } catch {
    return { ok: false, errors: ["Invalid JSON. Make sure the text is valid JSON."] };
  }

  let arr: unknown;
  if (Array.isArray(json)) {
    arr = json;
  } else if (json && typeof json === "object" && "creatures" in json && Array.isArray((json as { creatures: unknown }).creatures)) {
    arr = (json as { creatures: unknown }).creatures;
  } else {
    return { ok: false, errors: ['Expected a JSON array of creatures, or an object with a "creatures" array.'] };
  }

  const items = arr as unknown[];
  if (items.length === 0) {
    return { ok: false, errors: ["The array is empty — nothing to import."] };
  }

  const validated: Creature[] = [];
  const errors: string[] = [];

  items.forEach((item, idx) => {
    const result = creatureSchema.safeParse(item);
    if (result.success) {
      validated.push(result.data);
    } else {
      const issues = result.error.errors.map((e) => `  • ${e.path.join(".")}: ${e.message}`).join("\n");
      const label = (item as { name?: string }).name ? `"${(item as { name: string }).name}"` : `item #${idx + 1}`;
      errors.push(`${label}:\n${issues}`);
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, creatures: validated };
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Import() {
  const [, setLocation] = useLocation();
  const { creatures: existing, importCreatures, resetToDefaults, isCustom } = useCreatures();

  const [text, setText] = useState("");
  const [mode, setMode] = useState<ImportMode>("replace");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imported, setImported] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [justExported, setJustExported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((value: string) => {
    if (!value.trim()) {
      setParseResult(null);
      return;
    }
    setParseResult(parseInput(value));
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);
    validate(value);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".json")) {
      setParseResult({ ok: false, errors: ["Please upload a .json file."] });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      validate(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (!parseResult?.ok) return;
    importCreatures(parseResult.creatures, mode);
    setImported(true);
  };

  const handleReset = () => {
    resetToDefaults();
    setText("");
    setParseResult(null);
    setImported(false);
  };

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(existing, `every-creature-${date}.json`);
    setJustExported(true);
    setTimeout(() => setJustExported(false), 2500);
  };

  if (imported && parseResult?.ok) {
    const count = mode === "replace"
      ? parseResult.creatures.length
      : existing.length + parseResult.creatures.filter(c => !existing.find(e => e.id === c.id)).length;
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-serif font-bold mb-4">Personal Collection Updated</h1>
            <p className="text-xl text-muted-foreground mb-8">
              {count} creature{count !== 1 ? "s" : ""} {mode === "replace" ? "loaded into" : "added to"} the encyclopedia.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => setLocation("/")} className="rounded-full px-8" data-testid="button-view-collection">
                View Collection
              </Button>
              <Button variant="outline" onClick={() => { setImported(false); setText(""); setParseResult(null); }} className="rounded-full px-8">
                Import More
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-bold mb-3">Data Management</h1>
          <p className="text-lg text-muted-foreground">
            Export the collection as a backup, or import personal additions on this device. The shared archive is preserved.
          </p>
        </div>

        {/* ── EXPORT SECTION ── */}
        <div className="rounded-2xl border bg-card text-card-foreground overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-card-border flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold mb-0.5">Export Collection</h2>
              <p className="text-sm text-muted-foreground">
                Download the current {existing.length} creature{existing.length !== 1 ? "s" : ""} as a JSON file.
              </p>
            </div>
            <Badge variant="secondary" className="font-mono shrink-0">{existing.length} entries</Badge>
          </div>
          <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 text-sm text-muted-foreground space-y-1">
              <p>Saved as <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">every-creature-{new Date().toISOString().slice(0, 10)}.json</code></p>
              <p>Format: bare JSON array — drop it straight back into the importer.</p>
            </div>
            <Button
              onClick={handleExport}
              variant={justExported ? "secondary" : "default"}
              className="rounded-full gap-2 shrink-0 transition-all"
              data-testid="button-export"
            >
              {justExported ? (
                <><CheckCircle className="w-4 h-4 text-green-500" /> Downloaded</>
              ) : (
                <><Download className="w-4 h-4" /> Download JSON</>
              )}
            </Button>
          </div>
        </div>

        <div className="relative flex items-center gap-4 mb-8">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Import</span>
          <Separator className="flex-1" />
        </div>

        {/* ── IMPORT SECTION ── */}

        {/* Status bar */}
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-muted/40 border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current database:</span>
            <Badge variant="secondary" className="font-mono">{existing.length} creature{existing.length !== 1 ? "s" : ""}</Badge>
          </div>
          {isCustom && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-muted-foreground hover:text-destructive gap-1.5 text-xs"
              onClick={handleReset}
              data-testid="button-reset"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to sample data
            </Button>
          )}
        </div>

        {/* Mode selector */}
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Import mode</p>
          <div className="flex gap-3">
            <button
              onClick={() => setMode("replace")}
              data-testid="mode-replace"
              className={`flex-1 p-4 rounded-xl border text-left transition-all ${mode === "replace" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-muted-foreground/40"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Trash2 className="w-4 h-4" />
                <span className="font-semibold">Replace all</span>
              </div>
              <p className="text-sm text-muted-foreground">Replaces the entire collection with imported data.</p>
            </button>
            <button
              onClick={() => setMode("merge")}
              data-testid="mode-merge"
              className={`flex-1 p-4 rounded-xl border text-left transition-all ${mode === "merge" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-muted-foreground/40"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4" />
                <span className="font-semibold">Merge</span>
              </div>
              <p className="text-sm text-muted-foreground">Adds new creatures; keeps existing ones (matched by id).</p>
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          data-testid="dropzone-file"
          className={`mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40 hover:bg-muted/20"}`}
        >
          <FileJson className="w-8 h-8 text-muted-foreground" />
          <p className="font-medium">Drop a .json file here, or click to browse</p>
          <p className="text-sm text-muted-foreground">Supports arrays and <code className="bg-muted px-1 rounded text-xs">{"{ creatures: [...] }"}</code> objects</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Paste area */}
        <div className="mb-2">
          <p className="text-sm text-muted-foreground mb-2">Or paste JSON directly:</p>
          <Textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder='[{"id":"t-rex","name":"Tyrannosaurus Rex", ...}]'
            className="font-mono text-sm min-h-48 resize-y rounded-xl border-border focus-visible:ring-primary"
            data-testid="textarea-json"
          />
        </div>

        {/* Validation feedback */}
        <AnimatePresence mode="wait">
          {parseResult && (
            <motion.div
              key={parseResult.ok ? "ok" : "err"}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6"
            >
              {parseResult.ok ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span className="font-medium">
                    {parseResult.creatures.length} valid creature{parseResult.creatures.length !== 1 ? "s" : ""} ready to import
                    {mode === "merge" && ` (${parseResult.creatures.filter(c => !existing.find(e => e.id === c.id)).length} new)`}
                  </span>
                </div>
              ) : (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left text-destructive"
                    onClick={() => setShowErrors(!showErrors)}
                    data-testid="button-toggle-errors"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="font-medium flex-1">
                      {parseResult.errors.length} validation error{parseResult.errors.length !== 1 ? "s" : ""}
                    </span>
                    {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <AnimatePresence>
                    {showErrors && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
                          {parseResult.errors.map((err, i) => (
                            <pre key={i} className="text-xs text-destructive/80 whitespace-pre-wrap font-mono bg-destructive/5 rounded p-2">
                              {err}
                            </pre>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schema reference */}
        <details className="mb-8 group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors select-none list-none flex items-center gap-1">
            <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
            View required JSON schema
          </summary>
          <pre className="mt-3 p-4 rounded-xl bg-muted/60 text-xs font-mono overflow-x-auto text-muted-foreground leading-relaxed border">{`{
  "id": "string",          // unique slug, e.g. "t-rex"
  "name": "string",        // common name
  "genus": "string",       // scientific genus
  "category": "string",    // one of the 14 categories
  "era": "string",         // e.g. "Late Cretaceous"
  "mya": "string",         // e.g. "68-66 MYA"
  "diet": "string",        // e.g. "Carnivore"
  "size": "string",        // e.g. "12m long"
  "habitat": "string",
  "description": "string",
  "funFacts": ["string"],
  "family": [{ "name": "string", "living": true }],
  "mysteryLevel": 0        // 0 | 1 | 2 | 3
}`}</pre>
        </details>

        {/* Submit */}
        <Button
          onClick={handleImport}
          disabled={!parseResult?.ok}
          className="w-full rounded-full py-6 text-base font-semibold"
          data-testid="button-import"
        >
          {mode === "replace" ? "Replace Collection" : "Merge into Collection"}
        </Button>
      </div>
    </Layout>
  );
}
