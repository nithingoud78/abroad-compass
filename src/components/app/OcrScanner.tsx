// Client-side OCR — no upload, no storage. Extracts text locally with
// tesseract.js, parses common fields per document type, then hands the
// values to the parent for a review-before-save step. The original file
// is discarded as soon as text is extracted.
import { useState, useRef } from "react";
import { Loader2, ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export type OcrDocKind = "ielts" | "toefl" | "pte" | "aps" | "transcript" | "certificate";

export type OcrFields = Record<string, string>;

const FIELDS: Record<OcrDocKind, string[]> = {
  ielts: [
    "overall_band",
    "listening",
    "reading",
    "writing",
    "speaking",
    "test_date",
    "candidate_number",
  ],
  toefl: ["total_score", "reading", "listening", "speaking", "writing", "test_date"],
  pte: ["overall_score", "listening", "reading", "speaking", "writing", "test_date"],
  aps: ["certificate_number", "issue_date", "cgpa"],
  transcript: ["institution", "cgpa", "semester", "issue_date"],
  certificate: ["title", "issuer", "issue_date"],
};

/** Very light regex parsers — safe fallbacks that never throw. */
function parseFields(kind: OcrDocKind, text: string): OcrFields {
  const t = text.replace(/\s+/g, " ");
  const out: OcrFields = {};
  const num = (re: RegExp) => t.match(re)?.[1]?.trim() ?? "";
  const date = () =>
    num(
      /(\d{1,2}[\s/.-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[\s/.-]\d{2,4})/i,
    );

  if (kind === "ielts") {
    out.overall_band = num(/Overall(?:\s*Band(?:\s*Score)?)?[:\s]+(\d(?:\.\d)?)/i);
    out.listening = num(/Listening[:\s]+(\d(?:\.\d)?)/i);
    out.reading = num(/Reading[:\s]+(\d(?:\.\d)?)/i);
    out.writing = num(/Writing[:\s]+(\d(?:\.\d)?)/i);
    out.speaking = num(/Speaking[:\s]+(\d(?:\.\d)?)/i);
    out.test_date = date();
    out.candidate_number = num(/Candidate\s*(?:No|Number)[:.\s]+([A-Z0-9]+)/i);
  } else if (kind === "toefl") {
    out.total_score = num(/Total\s*Score[:\s]+(\d{2,3})/i);
    out.reading = num(/Reading[:\s]+(\d{1,2})/i);
    out.listening = num(/Listening[:\s]+(\d{1,2})/i);
    out.speaking = num(/Speaking[:\s]+(\d{1,2})/i);
    out.writing = num(/Writing[:\s]+(\d{1,2})/i);
    out.test_date = date();
  } else if (kind === "pte") {
    out.overall_score = num(/Overall\s*Score[:\s]+(\d{2,3})/i);
    out.listening = num(/Listening[:\s]+(\d{2,3})/i);
    out.reading = num(/Reading[:\s]+(\d{2,3})/i);
    out.speaking = num(/Speaking[:\s]+(\d{2,3})/i);
    out.writing = num(/Writing[:\s]+(\d{2,3})/i);
    out.test_date = date();
  } else if (kind === "aps") {
    out.certificate_number = num(
      /(?:Cert(?:ificate)?\s*(?:No|Number)|APS[- ]?No)[:.\s]+([A-Z0-9-/]+)/i,
    );
    out.issue_date = date();
    out.cgpa = num(/CGPA[:\s]+(\d(?:\.\d+)?)/i);
  } else if (kind === "transcript") {
    out.institution =
      num(/(?:University|College|Institute)\s+of\s+([A-Z][A-Za-z ]+)/) ||
      num(/([A-Z][A-Za-z]+ University)/);
    out.cgpa = num(/(?:CGPA|GPA)[:\s]+(\d(?:\.\d+)?)/i);
    out.semester = num(/Semester[:\s]+(\d+)/i);
    out.issue_date = date();
  } else if (kind === "certificate") {
    out.title = num(/(?:Certificate\s+of\s+)([A-Za-z ]{3,40})/i);
    out.issuer = num(/(?:Issued\s+by|Awarded\s+by)[:\s]+([A-Za-z0-9 &,.'-]{3,60})/i);
    out.issue_date = date();
  }
  return out;
}

export function OcrScanner({
  kind,
  onExtracted,
  triggerLabel = "Scan with OCR",
}: {
  kind: OcrDocKind;
  onExtracted: (fields: OcrFields) => void;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fields, setFields] = useState<OcrFields | null>(null);
  const [rawText, setRawText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10 MB).");
      return;
    }
    setBusy(true);
    setProgress(0);
    setFields(null);
    try {
      // Dynamic import keeps the 2MB tesseract bundle out of the main chunk.
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setRawText(data.text);
      setFields(parseFields(kind, data.text));
      toast.success("Extracted — review before saving.");
    } catch (e) {
      toast.error(`OCR failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      // Discard the file reference; nothing is uploaded or persisted.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updateField(key: string, value: string) {
    setFields((f) => ({ ...(f ?? {}), [key]: value }));
  }

  function save() {
    if (!fields) return;
    onExtracted(fields);
    setOpen(false);
    setFields(null);
    setRawText("");
  }

  const expected = FIELDS[kind];

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ScanLine className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Scan {kind.toUpperCase()} document</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Text is extracted <strong>on your device</strong>. The file never leaves your browser
            and is discarded as soon as scanning finishes. Only the fields you approve are saved.
          </p>

          {!fields && (
            <div className="space-y-3">
              <Label htmlFor="ocr-file">Choose an image or PDF page</Label>
              <Input
                id="ocr-file"
                ref={inputRef}
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {busy ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Recognizing… {progress}%
                  </div>
                  <Progress value={progress} />
                </div>
              ) : null}
            </div>
          )}

          {fields && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Review extracted values</p>
              <div className="grid gap-2">
                {expected.map((k) => (
                  <div key={k} className="grid grid-cols-3 items-center gap-2">
                    <Label
                      htmlFor={`ocr-${k}`}
                      className="text-xs capitalize text-muted-foreground"
                    >
                      {k.replace(/_/g, " ")}
                    </Label>
                    <Input
                      id={`ocr-${k}`}
                      className="col-span-2"
                      value={fields[k] ?? ""}
                      onChange={(e) => updateField(k, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              {rawText ? (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Raw extracted text</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded border bg-muted/30 p-2">
                    {rawText}
                  </pre>
                </details>
              ) : null}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setFields(null);
                setRawText("");
                setOpen(false);
              }}
              disabled={busy}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            {fields ? <Button onClick={save}>Use these values</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
