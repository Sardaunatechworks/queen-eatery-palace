import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export const exportToCSV = (data: any[], filename: string) => {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => 
    Object.values(row).map(val => `"${val}"`).join(",")
  );
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyyMMdd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${filename}_${format(new Date(), "yyyyMMdd")}.xlsx`);
};

export const exportToPDF = (headers: string[], data: any[][], title: string) => {
  const doc = new jsPDF();
  
  // Custom styles for "Royal" look
  doc.setFontSize(22);
  doc.setTextColor(200, 30, 30); // Royal Red
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, h:mm a")}`, 14, 30);
  
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [200, 30, 30], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { top: 40 }
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`);
};
