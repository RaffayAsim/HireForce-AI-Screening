import { createClient } from "@supabase/supabase-js";
import { verifyAuth } from "./_lib/auth.js";

async function extractTextFromPdf(buf: Uint8Array): Promise<string> {
  try {
    const { extractText } = await import("unpdf");
    const result = await extractText(buf);
    const pages = Array.isArray(result?.text) ? result.text.join("\n") : (result?.text || "");
    if (pages && pages.trim().length > 15) {
      return pages.replace(/\s+/g, " ").trim().slice(0, 4500);
    }
  } catch (err) {
    console.warn("unpdf extraction error:", err);
  }
  return "";
}

export async function evaluateCandidate(data: any) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://fobfgvmwfzoxzzcheusm.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const sb = createClient(supabaseUrl, supabaseKey);

  try {
    let { candidateId, candidateName, candidateEmail, jobId, jobTitle, jobDescription, resumeUrl, resumeText } = data;

  // Always load job details server-side from jobs row by job_id or candidateId (FIX 3)
  if (jobId || candidateId) {
    try {
      let jId = jobId;
      if (!jId && candidateId) {
        const { data: cand } = await sb.from("candidates").select("job_id").eq("id", candidateId).maybeSingle();
        if (cand?.job_id) jId = cand.job_id;
      }
      if (jId) {
        const { data: jobRow } = await sb.from("jobs").select("title, description, requirements").eq("id", jId).maybeSingle();
        if (jobRow?.title) {
          jobTitle = jobRow.title;
        }
        if (jobRow) {
          const combined = `${jobRow.description || ''} ${jobRow.requirements || ''}`.trim();
          if (combined) {
            jobDescription = combined;
          }
        }
      }
    } catch {}
  }

  // Safety fallback: if database lookup failed, use jobTitle from request, NEVER "Target Role", "Evaluated Role" or "Position"
  const reqJobTitle = data.job_title || data.jobTitle;
  if (!jobTitle || jobTitle.toLowerCase() === "target role" || jobTitle.toLowerCase() === "evaluated role" || jobTitle.toLowerCase() === "position" || jobTitle.toLowerCase() === "role" || jobTitle.toLowerCase() === "data analyst") {
    jobTitle = (reqJobTitle && reqJobTitle.toLowerCase() !== "target role" && reqJobTitle.toLowerCase() !== "evaluated role" && reqJobTitle.toLowerCase() !== "position" && reqJobTitle.toLowerCase() !== "role" && reqJobTitle.toLowerCase() !== "data analyst")
      ? reqJobTitle
      : "the role";
  }

  // 1. Return already saved score if candidate was previously screened (reproducible, idempotent)
  if (candidateId) {
    try {
      const { data: existingCand } = await sb
        .from("candidates")
        .select("screening_score, screening_summary")
        .eq("id", candidateId)
        .single();

      if (existingCand && existingCand.screening_score !== null && existingCand.screening_score !== undefined && existingCand.screening_summary) {
        return {
          success: true,
          provider: "persisted-record",
          screening: {
            score: existingCand.screening_score,
            summary: existingCand.screening_summary,
          },
          screened_at: new Date().toISOString()
        };
      }
    } catch {}
  }

    // 2. Check if resumeText is missing or contains raw PDF stream markers
    const isGarbageText = !resumeText || 
      resumeText.trim().length < 40 || 
      resumeText.includes("FlateDecode") || 
      resumeText.includes("ObjStm") || 
      resumeText.includes("HeadlessChrome") || 
      resumeText.includes("PDF container");

    if (isGarbageText && resumeUrl && (resumeUrl.startsWith("http://") || resumeUrl.startsWith("https://"))) {
      try {
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 3500);
        const fetchPdf = await fetch(resumeUrl, { signal: controller.signal });
        clearTimeout(fetchTimeout);
        if (fetchPdf.ok) {
          const arrayBuf = await fetchPdf.arrayBuffer();
          const extracted = await extractTextFromPdf(new Uint8Array(arrayBuf));
          if (extracted && extracted.length > 15) {
            resumeText = extracted;
          }
        }
      } catch (err) {
        console.warn("Could not extract PDF text from URL:", err);
      }
    }

    // 3. Guard: Unreadable, blank, or non-resume PDF check
    const cleanText = (resumeText || "").trim();
    const alphaWords = cleanText.replace(/[^a-zA-Z\s]/g, " ").trim().split(/\s+/).filter(w => w.length > 2);
    const isUnreadable = !cleanText || 
      cleanText.length < 35 || 
      alphaWords.length < 6 ||
      cleanText.toLowerCase() === "sample resume" ||
      cleanText.toLowerCase().includes("blank page") ||
      cleanText.toLowerCase().includes("no text found") ||
      (cleanText.includes("%PDF") && alphaWords.length < 15);

    if (isUnreadable) {
      const unreadableResult = {
        score: 0,
        fit_level: "Unreadable Resume",
        skills_matched: [],
        strengths: ["No readable text or verifiable credentials found in the uploaded document."],
        interview_topics: ["Request candidate to submit a clean, readable PDF or DOC format resume."],
        summary: "Unreadable Resume:\nThe uploaded document is blank, corrupted, or does not contain extractable resume content. No candidate qualifications, technical skills, or work history could be evaluated.\n\nRecommendation: Unreadable resume (0% Match Score). Request an updated readable document.\n\n[Engine: unreadable-document-guard]",
        recommendation: "Review Profile",
        engine: "unreadable-document-guard"
      };

      if (candidateId) {
        try {
          await sb.from("candidates").update({
            screening_score: 0,
            screening_summary: unreadableResult.summary,
          }).eq("id", candidateId);
        } catch {}
      }

      return {
        success: true,
        provider: "unreadable-document-guard",
        screening: unreadableResult,
        screened_at: new Date().toISOString()
      };
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY || "";

    const cleanRole = jobTitle ? jobTitle.replace(/\s+position$/i, "").trim() : "the role";
    const role = cleanRole || "the role";
    const candName = candidateName || "Candidate";
    const resumeLower = cleanText.toLowerCase();
    const jobLower = `${jobTitle || ''} ${jobDescription || ''}`.toLowerCase();

    // Check whether target job is an actual automation engineering role (FIX 2)
    // Only flag if title/desc explicitly requires automation engineering:
    // (n8n, vapi, workflow automation, ai automation, automation engineer)
    const isAutomationRole = 
      jobLower.includes("n8n") || 
      jobLower.includes("vapi") || 
      jobLower.includes("workflow automation") || 
      jobLower.includes("ai automation") ||
      jobLower.includes("automation engineer");

    // Check whether target job is data science / machine learning
    const isDataScienceRole = !isAutomationRole && (
      jobLower.includes("data scientist") || 
      jobLower.includes("machine learning") || 
      jobLower.includes("data science")
    );

    // Categorize candidate detected tools
    const automationTools = [
      "n8n", "vapi", "apify", "claude code", "antigravity", "webhooks", "rag systems", "prompt engineering"
    ].filter(t => resumeLower.includes(t));

    const dataScienceTools = [
      "python", "pandas", "numpy", "pytorch", "tensorflow", "scikit-learn", "sql", "machine learning", "deep learning"
    ].filter(t => resumeLower.includes(t));

    const webDevTools = [
      "react", "next.js", "node.js", "typescript", "javascript", "tailwind", "html", "css", "postgresql", "rest apis"
    ].filter(t => resumeLower.includes(t));

    const allDetected = Array.from(new Set([...automationTools, ...dataScienceTools, ...webDevTools]));

    // Comprehensive skills pool for dynamically matching non-automation jobs (FIX 2)
    const knownSkills = [
      "hubspot", "salesforce", "marketo", "marketing automation", "google analytics", "ga4", "crm", "zapier",
      "segment", "email marketing", "lead generation", "seo", "sem", "campaign management", "excel", "spreadsheets",
      "reporting", "dashboard", "sql", "python", "tableau", "power bi", "looker", "pandas", "numpy",
      "statistics", "data analysis", "data modeling", "etl", "machine learning", "deep learning", "pytorch",
      "tensorflow", "scikit-learn", "react", "next.js", "node.js", "typescript", "javascript", "vue", "angular",
      "html", "css", "tailwind", "rest apis", "graphql", "postgresql", "mysql", "mongodb", "aws", "docker", "git"
    ];

    // Safe keyword matcher respecting word boundaries for short acronyms
    const hasSkill = (text: string, skill: string) => {
      if (skill.length <= 3) {
        const regex = new RegExp(`(^|[^a-z0-9])${skill}([^a-z0-9]|$)`, 'i');
        return regex.test(text);
      }
      return text.includes(skill);
    };

    // Dynamically extract required skills from job's own title, description & requirements
    const jobRequiredSkills = knownSkills.filter(k => hasSkill(jobLower, k));
    const matchedJobSkills = jobRequiredSkills.filter(k => hasSkill(resumeLower, k));
    const missingJobSkills = jobRequiredSkills.filter(k => !hasSkill(resumeLower, k));
    const matchRatio = jobRequiredSkills.length > 0 ? (matchedJobSkills.length / jobRequiredSkills.length) : 0;

    let screeningResult: any = null;
    let usedProvider = "deterministic-engine";

    // Build prompt dynamically: If automation role, use automation rubric. If non-automation role, build strictly from THIS job (FIX 2)
    const prompt = isAutomationRole ? (
      "You are an expert, strict ATS AI evaluator for HireForce. Evaluate this candidate for the position:\n" +
      `Candidate Name: ${candidateName || "Applicant"}\n` +
      `Target Job Title: ${jobTitle || "Role"}\n` +
      (jobDescription ? `Job Requirements:\n"""\n${jobDescription.substring(0, 1200)}\n"""\n` : "") +
      `Candidate Email: ${candidateEmail || "N/A"}\n\n` +
      `Candidate Resume Content:\n"""\n${cleanText.substring(0, 3500)}\n"""\n\n` +
      "STRICT ATS SCORING RUBRIC (0 to 100):\n" +
      "- 0-35%: Completely unqualified / Irrelevant background. (e.g. Marketing Manager, Sales, or HR applying for an AI/Software Engineer role with NO programming, NO automation pipelines, and NO relevant tech stack. CAP STRICTLY UNDER 40%).\n" +
      "- 36-55%: Major skill gaps. Has general professional experience or adjacent tech skills (e.g. pure React frontend developer applying for an AI Automation Engineer role missing n8n/workflow automation). CAP STRICTLY AT 40-55%.\n" +
      "- 56-74%: Partial match. Has adjacent or foundational technical skills (e.g. Data Scientist / ML applying for Automation), but lacks hands-on depth in the required primary automation tools.\n" +
      "- 75-89%: Good match. Possesses relevant technical skills and practical workflow experience matching the role.\n" +
      "- 90-100%: Strong match. Exceptional candidate with direct hands-on delivery, end-to-end systems built, and complete mastery of the core stack.\n\n" +
      "CRITICAL RULES:\n" +
      "1. Be strict and discriminate between candidates. Do NOT give everyone high scores.\n" +
      "2. If the candidate is missing must-have technical competencies for the role (e.g. non-technical marketing or sales for an engineer role), THE SCORE MUST BE CAPPED BELOW 40%.\n" +
      "3. If an engineer lacks the primary must-have tools for this specific role (e.g. a React developer applying for an n8n Automation Engineer role without n8n/automation experience), CAP STRICTLY <= 55%.\n" +
      "4. Cite specific tools, achievements, or gaps directly from their resume.\n\n" +
      "Respond ONLY with valid JSON with this exact schema (no markdown, no extra text):\n" +
      "{\n" +
      '  "score": <integer from 0 to 98 based strictly on the rubric>,\n' +
      '  "fit_level": <"Strong Match" | "Potential Match" | "Needs Review" | "Unqualified">,\n' +
      '  "skills_matched": [<relevant skills found, or empty array if none match role>],\n' +
      '  "summary": <detailed multi-paragraph assessment with sections: "Executive Summary:", "Key Strengths & Qualifications:", "Recommended Interview Focus:", and "Recommendation:">,\n' +
      '  "recommendation": <"Advance to Interview" | "Schedule Screen" | "Review Profile" | "Do Not Advance">\n' +
      "}"
    ) : (
      "You are an expert, strict ATS AI evaluator for HireForce. Evaluate this candidate for the position:\n" +
      `Candidate Name: ${candidateName || "Applicant"}\n` +
      `Target Job Title: ${jobTitle || "Role"}\n` +
      (jobDescription ? `Job Description & Requirements:\n"""\n${jobDescription.substring(0, 1200)}\n"""\n` : "") +
      (jobRequiredSkills.length > 0 ? `Target Key Requirements for this Role: ${jobRequiredSkills.join(", ")}\n` : "") +
      `Candidate Email: ${candidateEmail || "N/A"}\n\n` +
      `Candidate Resume Content:\n"""\n${cleanText.substring(0, 3500)}\n"""\n\n` +
      `STRICT ATS SCORING RUBRIC (0 to 100) FOR ${role.toUpperCase()}:\n` +
      `- 0-35%: Completely unqualified. Resume shows no relevant experience or foundational skills for ${role}. CAP STRICTLY UNDER 40%.\n` +
      `- 36-55%: Major skill gaps. Has generic professional background or missing the primary must-have qualifications specifically required for ${role}. CAP STRICTLY AT 40-55%.\n` +
      `- 56-74%: Partial match. Has related or adjacent background, but lacks direct mastery of core responsibilities or tools required for ${role}.\n` +
      `- 75-89%: Good match. Possesses relevant skills and practical hands-on experience matching ${role}.\n` +
      `- 90-100%: Strong match. Exceptional candidate with direct mastery of all core qualifications and proven domain success for ${role}.\n\n` +
      "CRITICAL RULES:\n" +
      `1. Be strict and discriminate between candidates. Evaluate ONLY against the requirements and competencies of ${role}. Do NOT evaluate for or mention unrelated roles, engineering or automation tools (such as n8n, webhooks, or coding) unless specifically required in the job description.\n` +
      `2. If the candidate is missing most of the primary must-have qualifications for ${role}, THE SCORE MUST BE CAPPED AT 55% OR LOWER.\n` +
      `3. Cite specific tools, achievements, or gaps directly from their resume relevant to ${role}.\n\n` +
      "Respond ONLY with valid JSON with this exact schema (no markdown, no extra text):\n" +
      "{\n" +
      '  "score": <integer from 0 to 98 based strictly on the rubric>,\n' +
      '  "fit_level": <"Strong Match" | "Potential Match" | "Needs Review" | "Unqualified">,\n' +
      '  "skills_matched": [<relevant skills found matching this specific role, or empty array if none>],\n' +
      '  "summary": <detailed multi-paragraph assessment with sections: "Executive Summary:", "Key Strengths & Qualifications:", "Recommended Interview Focus:", and "Recommendation:">,\n' +
      '  "recommendation": <"Advance to Interview" | "Schedule Screen" | "Review Profile" | "Do Not Advance">\n' +
      "}"
    );

    // Try OpenRouter model with hard 5s Promise.race timeout & temperature 0.0 (BUG 8: Fast execution)
    for (const modelId of ["nvidia/nemotron-3.5-lightning:free"]) {
      try {
        const fetchPromise = (async () => {
          const routerResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openRouterKey}`,
              "HTTP-Referer": "https://hireforce.ai",
              "X-Title": "HireForce ATS"
            },
            body: JSON.stringify({
              model: modelId,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.0
            }),
          });
          if (routerResp.ok) {
            return await routerResp.json();
          }
          return null;
        })();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const routerData: any = await Promise.race([fetchPromise, timeoutPromise]);
        if (routerData) {
          const content = routerData.choices?.[0]?.message?.content;
          if (content) {
            const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleaned);
            if (typeof parsed.score === "number" && parsed.summary) {
              screeningResult = parsed;
              usedProvider = `openrouter (${modelId})`;
              break;
            }
          }
        }
      } catch (err: any) {
        // Fall back to deterministic engine immediately
      }
    }

    // Post-process OpenRouter results to enforce must-have cap and engine tag (FIX 2)
    if (screeningResult && typeof screeningResult.score === "number") {
      if (!isAutomationRole && jobRequiredSkills.length > 0) {
        if (matchRatio < 0.5 && screeningResult.score > 55) {
          screeningResult.score = Math.min(52, Math.round(40 + (matchRatio * 20)));
          if (screeningResult.score <= 55 && screeningResult.fit_level === "Strong Match") {
            screeningResult.fit_level = "Potential Match";
            screeningResult.recommendation = "Review Profile";
          }
        }
      }

      if (!screeningResult.summary.includes("[Engine:")) {
        screeningResult.summary = `${screeningResult.summary.trim()}\n\n[Engine: openrouter-ai]`;
      }
    }

    // High-precision deterministic safety net with STRICT role-specific rubric (BUG 7)
    if (!screeningResult || typeof screeningResult.score !== "number") {
      let baseScore: number;
      let fit: string;
      let recommendation: string;
      let strengths: string[];
      let interviewQuestions: string[];

      if (isAutomationRole) {
        if (automationTools.length >= 2) {
          // Direct Automation Fit (e.g. Usman 93, Raffay 94)
          baseScore = Math.min(94, 86 + (automationTools.length * 2));
          fit = "Strong Match";
          recommendation = "Advance to Interview";
          strengths = [
            `Verified expertise deploying ${automationTools.slice(0, 3).join(", ")} into production systems.`,
            `Demonstrated ability to turn manual operations into automated AI-assisted pipelines.`,
            `Direct hands-on delivery matching ${role} core requirements.`
          ];
          interviewQuestions = [
            `Walk through an end-to-end automation pipeline you built using ${automationTools[0]}.`,
            "How do you handle rate limits, retry policies, and error states when external webhooks fail?",
            "What is your approach to structuring prompts and API schemas for reliable execution?"
          ];
        } else if (dataScienceTools.length >= 2) {
          // Data Scientist applying for Automation (e.g. Ali 64)
          baseScore = 64;
          fit = "Potential Match";
          recommendation = "Schedule Screen";
          strengths = [
            `Strong analytical and scripting background in ${dataScienceTools.slice(0, 3).join(", ")}.`,
            "Solid programming fundamentals with ability to learn workflow automation tools.",
            `Missing hands-on exposure to primary automation orchestration platforms (n8n, Vapi).`
          ];
          interviewQuestions = [
            "How would you adapt your Python and data background to building live webhook automation pipelines?",
            "Have you worked with asynchronous API triggers and event-driven architectures?",
            "What workflow orchestration tools have you experimented with?"
          ];
        } else if (webDevTools.length >= 2) {
          // Pure Frontend / Web developer without automation (e.g. Sara 52% CAP STRICTLY <= 55%)
          baseScore = 52;
          fit = "Potential Match";
          recommendation = "Review Profile";
          strengths = [
            `Foundational web engineering skills in ${webDevTools.slice(0, 3).join(", ")}.`,
            "General software engineering proficiency and component architecture.",
            "Missing required must-have core skills: No verified experience in n8n, Vapi, or workflow automation."
          ];
          interviewQuestions = [
            "This role specifically requires n8n and workflow automation. What experience do you have with automated pipelines?",
            "Have you integrated AI APIs with external webhooks or CRM tools?",
            "Describe your familiarity with building asynchronous background workflows."
          ];
        } else if (allDetected.length >= 1) {
          baseScore = 42;
          fit = "Needs Review";
          recommendation = "Review Profile";
          strengths = [
            `Minimal technical overlap: Only detected ${allDetected.join(", ")}.`,
            "Substantial skill gap across required automation engineering toolchain."
          ];
          interviewQuestions = [
            "Assess candidate's ability to transition into automation engineering."
          ];
        } else {
          // Non-technical / Marketing (e.g. Hina 28%)
          baseScore = 28;
          fit = "Unqualified";
          recommendation = "Do Not Advance";
          strengths = [
            "Resume exhibits non-technical background without required engineering or automation skills.",
            `Significant skill gap: Missing required core technologies for ${role}.`
          ];
          interviewQuestions = [
            "Candidate does not meet core technical requirements for this role."
          ];
        }
      } else if (isDataScienceRole) {
        if (dataScienceTools.length >= 2) {
          baseScore = Math.min(94, 86 + (dataScienceTools.length * 2));
          fit = "Strong Match";
          recommendation = "Advance to Interview";
          strengths = [
            `Proven competence in data science and machine learning: ${dataScienceTools.slice(0, 3).join(", ")}.`,
            "Demonstrated analytical and data engineering problem solving."
          ];
          interviewQuestions = [
            "Explain your machine learning model lifecycle and deployment strategy.",
            "How do you validate model performance and prevent overfitting on imbalanced data?"
          ];
        } else {
          baseScore = 48;
          fit = "Needs Review";
          recommendation = "Review Profile";
          strengths = [
            "Limited overlap with core data science and machine learning requirements."
          ];
          interviewQuestions = [
            "Assess foundational statistics and machine learning knowledge."
          ];
        }
      } else {
        // Dynamic evaluation for non-automation roles (e.g. Sales Operations, Marketing Operations, Customer Success)
        if (jobRequiredSkills.length > 0) {
          const matchRatio = matchedJobSkills.length / jobRequiredSkills.length;
          // Apply the 55% cap ONLY when a candidate is missing most must-haves (< 50% match) (FIX 2)
          const isMissingMost = matchRatio < 0.5;

          // Bonus from related technical/analytical background (up to 8 points)
          const relatedExpBonus = Math.min(8, Math.round(allDetected.length * 1.5));

          if (matchRatio >= 0.75) {
            // Excellent match (e.g. 3/4 or 4/4) -> 82 - 94
            baseScore = Math.min(94, Math.round(80 + (matchRatio * 10) + relatedExpBonus));
            fit = "Strong Match";
            recommendation = "Advance to Interview";
            strengths = [
              `Demonstrated proficiency in ${matchedJobSkills.slice(0, 3).join(", ")} matching ${role} core requirements.`,
              `Strong domain alignment covering ${Math.round(matchRatio * 100)}% of required competencies.`
            ];
            interviewQuestions = [
              `Discuss your hands-on experience using ${matchedJobSkills[0]} in your recent work.`,
              `How do you measure success and optimize deliverables in a ${role} role?`
            ];
          } else if (!isMissingMost) {
            // Solid match (50% - 74% match, e.g. 2/4) -> NOT missing most must-haves -> 66 - 78
            baseScore = Math.min(82, Math.round(62 + (matchRatio * 16) + relatedExpBonus));
            fit = "Potential Match";
            recommendation = "Schedule Screen";
            strengths = [
              `Solid alignment in ${matchedJobSkills.join(", ")}.`,
              missingJobSkills.length > 0 ? `Growth areas in secondary requirements: ${missingJobSkills.slice(0, 2).join(", ")}.` : `Practical match for position requirements.`
            ];
            interviewQuestions = [
              `Walk through your workflow using ${matchedJobSkills[0]}.`,
              `How do you handle deliverables involving ${missingJobSkills[0] || 'core operations'}?`
            ];
          } else if (matchedJobSkills.length >= 1) {
            // Missing most must-haves (< 50% match, e.g. 1/4) -> Strictly CAPPED at <= 55%
            baseScore = Math.min(52, Math.round(40 + (matchRatio * 20) + Math.min(5, relatedExpBonus)));
            fit = "Potential Match";
            recommendation = "Review Profile";
            strengths = [
              `Familiarity with ${matchedJobSkills.join(", ")}.`,
              `Missing most must-have core skills: No verified experience in ${missingJobSkills.slice(0, 3).join(", ")}.`
            ];
            interviewQuestions = [
              `How would you adapt your current skillset to master ${missingJobSkills[0]}?`,
              `Describe your experience handling key workflows for ${role}.`
            ];
          } else {
            // 0 matched job skills
            if (allDetected.length >= 1) {
              baseScore = Math.min(42, 32 + Math.min(6, allDetected.length * 2));
              fit = "Needs Review";
              recommendation = "Review Profile";
              strengths = [
                `General technical competencies detected (${allDetected.slice(0, 3).join(", ")}), but lacks required domain skills for ${role}.`,
                missingJobSkills.length > 0 ? `Missing required competencies: ${missingJobSkills.slice(0, 4).join(", ")}.` : `Skill gap with position requirements.`
              ];
              interviewQuestions = [
                `Assess candidate's ability to transition into ${role}.`
              ];
            } else {
              baseScore = 28;
              fit = "Unqualified";
              recommendation = "Do Not Advance";
              strengths = [
                `Resume does not demonstrate required skills for ${role}.`,
                missingJobSkills.length > 0 ? `Missing required competencies: ${missingJobSkills.slice(0, 4).join(", ")}.` : `General skill mismatch with position requirements.`
              ];
              interviewQuestions = [
                "Candidate profile does not match role requirements."
              ];
            }
          }
        } else {
          // No specific known skills detected in job text - fall back to conservative tech overlap
          if (allDetected.length >= 3) {
            baseScore = 52;
            fit = "Potential Match";
            recommendation = "Review Profile";
            strengths = [`General technical competencies detected (${allDetected.slice(0, 3).join(", ")}), but specific requirements for ${role} are unverified.`];
            interviewQuestions = ["Assess domain-specific fit and practical experience matching position responsibilities."];
          } else if (allDetected.length >= 1) {
            baseScore = 38;
            fit = "Needs Review";
            recommendation = "Review Profile";
            strengths = [`Familiarity with ${allDetected.join(", ")}.`];
            interviewQuestions = ["Assess adaptability and depth in role requirements."];
          } else {
            baseScore = 28;
            fit = "Unqualified";
            recommendation = "Do Not Advance";
            strengths = ["Resume lacks required technical background."];
            interviewQuestions = ["Candidate profile does not match role requirements."];
          }
        }
      }

      const roleTarget = role.toLowerCase().startsWith('the ') ? role : `the ${role}`;
      const fullSummary =
        `Executive Summary:\n` +
        `${candName} was evaluated against ${roleTarget} position requirements. ${
          baseScore < 40 
            ? `Evaluation indicates major skill gaps: the candidate background does not demonstrate the required technical or domain competencies for ${role}.`
            : baseScore <= 55
            ? (isAutomationRole 
                ? "Evaluation indicates partial match with missing must-have competencies: candidate possesses general web/engineering foundations, but lacks hands-on experience with the role's core automation toolchain."
                : `Evaluation indicates partial match with missing must-have competencies: candidate lacks hands-on experience in key requirements for ${role}${missingJobSkills.length > 0 ? ` (${missingJobSkills.slice(0, 3).join(", ")})` : ""}.`)
            : `Evaluated credentials indicate practical aptitude aligned with ${roleTarget} specifications.`
        }\n\n` +
        `Key Strengths & Qualifications:\n` +
        strengths.map(s => `• ${s}`).join("\n") + "\n\n" +
        `Recommended Interview Focus:\n` +
        interviewQuestions.map((q, idx) => `${idx + 1}. ${q}`).join("\n") + "\n\n" +
        `Recommendation: ${recommendation} (${baseScore}% Match Score).\n\n[Engine: deterministic-engine]`;

      screeningResult = {
        score: baseScore,
        fit_level: fit,
        skills_matched: allDetected,
        strengths,
        interview_topics: interviewQuestions,
        summary: fullSummary,
        recommendation,
        engine: "deterministic-engine"
      };
    }

    // Direct write to Supabase - NEVER OVERWRITE candidate status
    if (candidateId) {
      try {
        await sb.from("candidates").update({
          screening_score: screeningResult.score,
          screening_summary: screeningResult.summary,
        }).eq("id", candidateId);
      } catch (sbErr) {
        console.warn("Error updating candidate in Supabase:", sbErr);
      }
    }

    return {
      success: true,
      provider: usedProvider,
      screening: screeningResult,
      screened_at: new Date().toISOString()
    };
  } catch (err: any) {
    console.error("Screening evaluation error:", err);
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch {}
    } else if (body && typeof body === "object" && Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString("utf8")); } catch {}
    }
    const data = body || {};

    const result = await evaluateCandidate(data);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Screening endpoint error:", err);
    return res.status(500).json({ success: false, error: err.message || "Screening failed" });
  }
}
