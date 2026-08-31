import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AttemptReview } from "@/lib/types";

/**
 * Generate a PDF document from an attempt review
 * @param attempt The attempt review data
 * @returns void (triggers browser download)
 */
export function generateAttemptPDF(attempt: AttemptReview): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Exam Attempt Review", margin, 20);

  // Exam Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(attempt.examTitle, margin, 30);

  // Score Badge
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const scoreColor = attempt.percentage >= 75 ? "#10b981" : attempt.percentage >= 50 ? "#f59e0b" : "#ef4444";
  doc.setTextColor(scoreColor);
  doc.text(`Score: ${attempt.percentage}%`, margin, 38);
  doc.setTextColor("#000000");

  // Date and Time Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const date = new Date(attempt.createdAt).toLocaleString();
  const duration = formatDuration(attempt.timeSpentSec);
  doc.text(`Date: ${date}`, margin, 46);
  doc.text(`Time Spent: ${duration}`, margin, 52);

  // Statistics Table
  autoTable(doc, {
    startY: 58,
    head: [["Metric", "Value"]],
    body: [
      ["Total Questions", attempt.total.toString()],
      ["Correct Answers", attempt.correct.toString()],
      ["Wrong Answers", attempt.wrong.toString()],
      ["Skipped", attempt.unanswered.toString()],
      ["Score", `${attempt.percentage}%`],
    ],
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: margin, right: margin },
  });

  // Questions Section
  let yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Answer Breakdown", margin, yPosition);
  yPosition += 8;

  // Add each question
  attempt.questions.forEach((question, index) => {
    // Check if we need a new page
    if (yPosition > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Question Number and Status
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const status =
      question.selectedIndex === null ? "Skipped" : question.isCorrect ? "Correct" : "Wrong";
    const statusColor =
      question.selectedIndex === null ? "#f59e0b" : question.isCorrect ? "#10b981" : "#ef4444";

    doc.setTextColor("#000000");
    doc.text(`Question ${index + 1}`, margin, yPosition);

    doc.setTextColor(statusColor);
    doc.setFont("helvetica", "bold");
    doc.text(status, pageWidth - margin - 20, yPosition);
    doc.setTextColor("#000000");

    yPosition += 6;

    // Question Prompt
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const promptLines = doc.splitTextToSize(question.prompt, pageWidth - margin * 2);
    doc.text(promptLines, margin, yPosition);
    yPosition += promptLines.length * 5;

    // Options
    question.options.forEach((option, optionIndex) => {
      const isCorrect = optionIndex === question.correctIndex;
      const isSelected = optionIndex === question.selectedIndex;

      if (yPosition > doc.internal.pageSize.getHeight() - 15) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", isCorrect || isSelected ? "bold" : "normal");

      let optionText = `   ${String.fromCharCode(65 + optionIndex)}. ${option}`;

      if (isCorrect && isSelected) {
        doc.setTextColor("#10b981");
        optionText += " ✓ (Your Answer - Correct)";
      } else if (isCorrect) {
        doc.setTextColor("#10b981");
        optionText += " ✓ (Correct Answer)";
      } else if (isSelected) {
        doc.setTextColor("#ef4444");
        optionText += " ✗ (Your Answer)";
      } else {
        doc.setTextColor("#000000");
      }

      const optionLines = doc.splitTextToSize(optionText, pageWidth - margin * 2);
      doc.text(optionLines, margin, yPosition);
      yPosition += optionLines.length * 5;
      doc.setTextColor("#000000");
    });

    // Explanation (if available)
    if (question.explanation) {
      yPosition += 2;
      if (yPosition > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor("#6b7280");
      const explanationLines = doc.splitTextToSize(
        `Explanation: ${question.explanation}`,
        pageWidth - margin * 2,
      );
      doc.text(explanationLines, margin, yPosition);
      yPosition += explanationLines.length * 4.5;
      doc.setTextColor("#000000");
    }

    yPosition += 8; // Space between questions
  });

  // Footer on last page
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#9ca3af");
    doc.text(
      `Page ${i} of ${pageCount} | Generated by Examora`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );
  }

  // Generate filename and download
  const sanitizedTitle = attempt.examTitle.replace(/[^a-z0-9]/gi, "_").substring(0, 50);
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${sanitizedTitle}_Attempt_${timestamp}.pdf`;

  doc.save(filename);
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
