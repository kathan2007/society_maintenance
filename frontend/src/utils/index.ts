import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/** Format amount in Indian Rupees */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
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

/** Generate a PDF maintenance receipt */
export function generateReceiptPdf(data: ReceiptData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.societyName, 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text("Maintenance Payment Receipt", 105, 30, { align: "center" });

  // Receipt body
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  autoTable(doc, {
    startY: 50,
    head: [["Field", "Details"]],
    body: [
      ["Flat No.", data.flatNo],
      ["Resident Name", data.residentName],
      ["Month", formatMonth(data.month)],
      ["Maintenance Amount", formatCurrency(data.amount)],
      ["Penalty", formatCurrency(data.penalty)],
      ["Total Paid", formatCurrency(data.totalAmount)],
      ["Transaction ID", data.transactionId],
      ["Paid On", formatDate(data.paidAt)],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [212, 175, 55],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { cellWidth: 110 },
    },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    "This is a computer-generated receipt. No signature required.",
    105,
    pageHeight - 15,
    { align: "center" }
  );

  doc.save(`receipt-${data.flatNo}-${data.month}.pdf`);
}
