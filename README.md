# 🚀 Job Autopilot — LLM Council

Automated job application system powered by 6 LLM models. Scrapes company career pages, tailors your resume for each position, and logs everything.

## Architecture

```
Career Pages → 6 LLM Agents (parallel) → Resume Tailoring → CSV Logging → Manager Dashboard
```

### The 6 Models
| Model | Specialty |
|-------|-----------|
| GPT-OSS 120B | Resume structure & professional tone |
| Qwen3 Coder | Technical skills alignment |
| Nemotron Nano 30B | Quick JD parsing |
| DeepSeek V4 Flash | Deep JD analysis |
| Nemotron Super 120B | Resume synthesis (picks best) |
| Laguna XS.2 | ATS optimization |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Place your resume PDF in the /resume folder
cp your-resume.pdf resume/

# 3. Configure your settings
# Edit .env for positions, location, API key
# Edit config/profile.js for personal info

# 4. Test run (immediate)
npm run dev

# 5. Start scheduler (runs daily at 10 AM) + dashboard
npm start
```

## Dashboard

The manager dashboard runs at `http://localhost:4000` and shows:
- Today's application count and success rate
- Application history with company, position, model used
- Daily chart over the last 14 days
- Model performance comparison
- CSV log file browser
- Manual "Run Now" trigger button

## Configuration

### Target Positions (`.env`)
```
JOB_TITLES=Data Engineer Intern,Data Engineer,Jr. Data Engineer,SDET,Salesforce Developer Intern
JOB_LOCATION=Remote
```

### Company Career Pages (`config/job-sources.js`)
Pre-configured with 18 companies. Add more by editing the `companies` array.

### Personal Info (`config/profile.js`)
Fill in your details once — used for all applications.

## Output

- **Tailored Resumes**: `output/resumes/` — One PDF per application
- **CSV Logs**: `output/logs/` — `{modelname}_{date}_{position}.csv`
- **Run Logs**: `output/runs/` — Full pipeline execution data

## Phase 2 (Coming Soon)

- Playwright-based auto form filling
- Auto-submit on supported ATS platforms (Workday, Greenhouse, Lever)
