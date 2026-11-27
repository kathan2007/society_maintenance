import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/** Format amount in Indian Rupees with clean currency symbol and spacing */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount || 0);
  return `₹ ${formatted}`;
}

/** Format date to dd/mm/yyyy */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Format month string YYYY-MM to "Month YYYY" */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export interface ReceiptData {
  societyName: string;
  flatNo: string;
  residentName: string;
  month: string;
  amount: number;
  penalty: number;
  totalAmount: number;
  transactionId: string;
  paidAt: string;
}

/** Generate a PDF maintenance receipt matching exact layout (Image 2) */
export function generateReceiptPdf(data: ReceiptData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Blue Header Block (matching image 2: #2563eb)
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SHREE HARI GIFT CITY PORTAL", 20, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("SHRI HARI GIFT CITY, NAVA NARODA, AHMEDABAD", 20, 28);
  doc.text("Official Maintenance Receipt • Secure Logic", 20, 34);

  // Section Title
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TRANSACTION SUMMARY", 20, 56);

  // AutoTable with black header and clean rows
  autoTable(doc, {
    startY: 64,
    head: [["Field", "Information Details"]],
    body: [
      ["Resident Name", data.residentName || "Resident"],
      ["Flat / Unit Number", data.flatNo || "—"],
      ["Resident Type", "RESIDENT"],
      ["Billing Month", formatMonth(data.month)],
      ["Base Amount", `INR ${(data.amount || 0).toLocaleString("en-IN")}/-`],
      ["Late Penalty Applied", `INR ${(data.penalty || 0).toLocaleString("en-IN")}/-`],
      ["Total Amount Paid", `INR ${(data.totalAmount || data.amount || 0).toLocaleString("en-IN")}/-`],
      ["Payment Date", data.paidAt ? formatDate(data.paidAt) : formatDate(new Date().toISOString())],
      ["Transaction Status", "SUCCESS / PAID"],
      ["Transaction ID", data.transactionId || `TXN${Math.random().toString(36).substring(7).toUpperCase()}`],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      cellPadding: 4,
      textColor: [0, 0, 0],
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: "normal", cellWidth: 65 },
      1: { cellWidth: 105 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 16;

  // Digital Signature section matching image 2
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Digitally Verified Signature", 20, finalY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("This is a computer-generated receipt and does not require a physical stamp.", 20, finalY + 8);
  doc.text(`Generated on: ${new Date().toLocaleString("en-GB")}`, 20, finalY + 14);

  doc.save(`Receipt_${data.month}_${data.flatNo}.pdf`);
}
