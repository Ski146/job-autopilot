// ─── Tailored Resume PDF Generator ─────────────────────
// Generates a one-page PDF from the tailored resume text
// Preserves the original resume's structure and format

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generate a tailored resume PDF
 * @param {string} tailoredText - The tailored resume text from the LLM
 * @param {Object} metadata - Job metadata {company, position, agentId, date}
 * @returns {string} - Path to the generated PDF
 */
function generateResumePDF(tailoredText, metadata) {
    const outputDir = path.join(__dirname, "../../output/resumes");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const safeCompany = (metadata.company || "unknown").replace(/[^a-zA-Z0-9]/g, "_");
    const safePosition = (metadata.position || "unknown").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${safeCompany}_${safePosition}_${metadata.date || "undated"}.pdf`;
    const outputPath = path.join(outputDir, filename);

    const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        info: {
            Title: `Resume - ${metadata.position} at ${metadata.company}`,
            Author: "Job Autopilot",
            Subject: "Tailored Resume"
        }
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Parse the tailored text into sections and render
    const lines = tailoredText.split("\n");
    let isFirstLine = true;

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            doc.moveDown(0.3);
            continue;
        }

        // Detect section headers (ALL CAPS or lines ending with :)
        const isHeader = /^[A-Z\s&\/\-]{3,}$/.test(trimmed) || 
                         (trimmed.endsWith(":") && trimmed.length < 40) ||
                         /^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|AWARDS)/.test(trimmed);

        if (isFirstLine) {
            // Name — large, bold, centered
            doc.fontSize(16).font("Helvetica-Bold")
               .text(trimmed, { align: "center" });
            doc.moveDown(0.2);
            isFirstLine = false;
        } else if (isHeader) {
            // Section header — bold, with underline
            doc.moveDown(0.4);
            doc.fontSize(11).font("Helvetica-Bold")
               .text(trimmed.replace(/:$/, ""), { underline: true });
            doc.moveDown(0.2);
        } else if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("–")) {
            // Bullet point
            const bulletText = trimmed.replace(/^[•\-–]\s*/, "");
            doc.fontSize(9.5).font("Helvetica")
               .text(`  •  ${bulletText}`, { indent: 10 });
        } else if (trimmed.includes("|") || trimmed.includes("·") || trimmed.includes("  ")) {
            // Contact info or sub-header line
            doc.fontSize(9).font("Helvetica")
               .text(trimmed, { align: "center" });
        } else {
            // Normal text
            doc.fontSize(9.5).font("Helvetica")
               .text(trimmed);
        }

        // Safety: don't exceed one page
        if (doc.y > 700) {
            break;
        }
    }

    doc.end();

    return new Promise((resolve, reject) => {
        writeStream.on("finish", () => resolve(outputPath));
        writeStream.on("error", reject);
    });
}

module.exports = { generateResumePDF };
