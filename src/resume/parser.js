// ─── Resume PDF Parser ─────────────────────────────────
// Extracts text from a resume PDF and structures it into sections

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

/**
 * Parse a resume PDF file into structured text
 * @param {string} pdfPath - Absolute path to the PDF file
 * @returns {Promise<{raw: string, sections: Object, pages: number}>}
 */
async function parseResume(pdfPath) {
    if (!fs.existsSync(pdfPath)) {
        throw new Error(`Resume PDF not found: ${pdfPath}`);
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);

    const raw = pdfData.text || "";
    const pages = pdfData.numpages || 1;

    // Attempt to extract sections by common resume headers
    const sections = extractSections(raw);

    return { raw, sections, pages };
}

/**
 * Extract resume sections by header detection
 */
function extractSections(text) {
    const sectionHeaders = [
        "summary", "objective", "profile", "about",
        "experience", "work experience", "professional experience", "employment",
        "education", "academic",
        "skills", "technical skills", "core competencies", "technologies",
        "projects", "personal projects",
        "certifications", "certificates",
        "awards", "achievements", "honors",
        "publications",
        "volunteer", "volunteering",
        "languages",
        "interests", "hobbies",
        "references"
    ];

    const lines = text.split("\n");
    const sections = {};
    let currentSection = "header";
    let currentContent = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            currentContent.push("");
            continue;
        }

        // Check if this line is a section header
        const normalized = trimmed.toLowerCase().replace(/[:\-–—|]/g, "").trim();
        const matchedHeader = sectionHeaders.find(h => 
            normalized === h || normalized.startsWith(h + " ")
        );

        if (matchedHeader && trimmed.length < 50) {
            // Save previous section
            if (currentContent.length > 0) {
                sections[currentSection] = currentContent.join("\n").trim();
            }
            currentSection = matchedHeader;
            currentContent = [];
        } else {
            currentContent.push(trimmed);
        }
    }

    // Save last section
    if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join("\n").trim();
    }

    return sections;
}

/**
 * Find resume PDF in the resume/ directory
 * @returns {string|null} - Path to resume PDF or null
 */
function findResume() {
    const resumeDir = path.join(__dirname, "../../resume");
    if (!fs.existsSync(resumeDir)) {
        fs.mkdirSync(resumeDir, { recursive: true });
        return null;
    }

    const files = fs.readdirSync(resumeDir).filter(f => f.toLowerCase().endsWith(".pdf"));
    if (files.length === 0) return null;

    return path.join(resumeDir, files[0]);
}

module.exports = { parseResume, findResume, extractSections };
