// Client-side PDF export for analytics reports. Kept minimal (text-only)
// to avoid pulling html2canvas / server rendering.
import jsPDF from "jspdf";
import { format } from "date-fns";

export type ReportSection = {
  heading: string;
  lines: string[];
};

export function downloadPdfReport(title: string, sections: ReportSection[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let y = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, marginX, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${format(new Date(), "PPP")} — Abroad Compass`, marginX, y);
  y += 24;
  doc.setTextColor(0);

  for (const s of sections) {
    if (y > 760) {
      doc.addPage();
      y = 64;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(s.heading, marginX, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    for (const line of s.lines) {
      if (y > 780) {
        doc.addPage();
        y = 64;
      }
      const wrapped = doc.splitTextToSize(line, 500);
      doc.text(wrapped, marginX, y);
      y += wrapped.length * 14;
    }
    y += 10;
  }

  const filename = `${title.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
}
