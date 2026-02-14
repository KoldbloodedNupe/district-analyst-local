import { GoogleGenAI, Type } from "@google/genai";
import { TriageResults, DALane, Sector, GroundingSource, OperationalParameters, Opportunity, MissionBriefing, DiagnosticResult } from "./types.ts";

const SOURCE_MAP: Record<string, string> = {
  'Gov': 'site:sam.gov "Solicitation" OR "Sources Sought" AND ("Data" OR "Strategy" OR "Analysis")',
  'PE': 'site:prnewswire.com OR site:businesswire.com "acquired by" OR "investment from" AND "technology" -date:2024',
  'Corp': 'site:greenhouse.io OR site:lever.co OR site:linkedin.com/jobs ("Interim" OR "Director of Data" OR "VP Finance") - "Intern"',
  'Startup': 'site:techcrunch.com OR site:crunchbase.com "Series B" OR "Series C" AND "Funding"',
  'default': '"RFP" OR "Request for Proposal" OR "Interim Head of" AND ("Data" OR "Finance")'
};

const fallbackResults: TriageResults = {
  summary: {
    totalLeads: 0,
    highPriorityLeads: 0,
    estimatedPipelineValue: "$0"
  },
  leads: [],
  sources: []
};

// Function to analyze project data and identify opportunities
export const analyzeProjectData = async (params: OperationalParameters): Promise<TriageResults> => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    
    let targetQuery = SOURCE_MAP[params.sector as string] || SOURCE_MAP['default'];

    if (params.rfpMode) {
      targetQuery = `("Request for Proposal" OR "RFP" OR "Solicitation" OR "Tender") AND (${targetQuery})`;
    }

    const prompt = `
    Act as a Senior Partner at District Analyst. Perform a Strategic Market Analysis.
    Tone: Professional, Direct, and Insight-Led (No fluff, but warm).
    Focus on Business Value (Revenue, Risk, Efficiency) instead of tactical jargon.
    
    TARGET PARAMETERS:
    - Focus Sector: ${params.sector}
    - Service Area: ${params.lane}
    - Valuation Tier: ${params.budgetTier}
    - Additional Context: ${params.customIntel || "None"}
    - RFP MODE: ${params.rfpMode ? "ACTIVE (Prioritize Official Solicitations, RFPs, and Open Contracts)" : "INACTIVE (Broad Market Intelligence)"}
    
    SEARCH PROTOCOL & ANCHORING:
    1. PRIORITIZE OFFICIAL SOURCES: Ground search in sam.gov, prnewswire.com, official company filings, and LinkedIn.
    2. FILTER: Only accept results posted within the LAST 30 DAYS.
    3. VALIDATE: Ensure the lead represents an ACTUAL budget holder or active project.
    4. PERSONA GUARDRAIL: If a specific Point of Contact name cannot be identified with high certainty, return "Procurement Office" or "Hiring Manager" as the pocName and set confidence accordingly.
    
    OUTPUT SCHEMA REQUIREMENTS:
    - Return exactly 80% of projectValue as logic, but projectValue itself should be a string (e.g. "$100,000").
    - Confidence must be an integer 1-100.
    - dateFound should be ISO string or YYYY-MM-DD.
    - sourceUrl must be the direct source of the intelligence.

    Return a JSON object matching this exact schema:
    {
      "summary": {
        "totalLeads": number,
        "highPriorityLeads": number,
        "estimatedPipelineValue": "string (e.g. $500k+)"
      },
      "leads": [
        {
          "leadId": "unique_string",
          "targetName": "Company or Agency Name",
          "companyUrl": "URL",
          "companyLocation": "City, State",
          "companyAddress": "Full Address or 'HQ Only'",
          "companySize": "e.g. 50-200 Employees",
          "revenueRange": "Est. Revenue (e.g. $10M - $50M)",
          "sectorSource": "${params.sector}",
          "stageTrigger": "What triggered this?",
          "deadline": "YYYY-MM-DD or 'Immediate'",
          "techStack": "Relevant technologies",
          "lane": "${params.lane}",
          "fitScore": number (1-10),
          "projectValue": "string (e.g. $75,000)",
          "sourceUrl": "string",
          "confidence": number,
          "dateFound": "string",
          "pocName": "Decision maker name",
          "pocTitle": "Title",
          "pocEmail": "Predicted email address",
          "pocLinkedIn": "LinkedIn URL or 'NA'",
          "diagnosticLogic": "Brief professional assessment.",
          "hook": "Personalized professional observation.",
          "accessPoint": "Primary contact point",
          "owner": "Account Lead",
          "isCriticalBridgeSprint": boolean,
          "isPEPrioritized": boolean,
          "missionBriefing": {
            "emailDraft": "Executive-Short outreach.",
            "discoveryQuestion": "High-impact question.",
            "internalNote": "Professional context."
          }
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                totalLeads: { type: Type.INTEGER },
                highPriorityLeads: { type: Type.INTEGER },
                estimatedPipelineValue: { type: Type.STRING }
              },
              required: ["totalLeads", "highPriorityLeads", "estimatedPipelineValue"]
            },
            leads: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  leadId: { type: Type.STRING },
                  targetName: { type: Type.STRING },
                  companyUrl: { type: Type.STRING },
                  companyLocation: { type: Type.STRING },
                  companyAddress: { type: Type.STRING },
                  companySize: { type: Type.STRING },
                  revenueRange: { type: Type.STRING },
                  sectorSource: { type: Type.STRING },
                  stageTrigger: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  techStack: { type: Type.STRING },
                  lane: { type: Type.STRING },
                  fitScore: { type: Type.NUMBER },
                  projectValue: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  dateFound: { type: Type.STRING },
                  pocName: { type: Type.STRING },
                  pocTitle: { type: Type.STRING },
                  pocEmail: { type: Type.STRING },
                  pocLinkedIn: { type: Type.STRING },
                  diagnosticLogic: { type: Type.STRING },
                  hook: { type: Type.STRING },
                  accessPoint: { type: Type.STRING },
                  owner: { type: Type.STRING },
                  isCriticalBridgeSprint: { type: Type.BOOLEAN },
                  isPEPrioritized: { type: Type.BOOLEAN },
                  missionBriefing: {
                    type: Type.OBJECT,
                    properties: {
                      emailDraft: { type: Type.STRING },
                      discoveryQuestion: { type: Type.STRING },
                      internalNote: { type: Type.STRING }
                    },
                    required: ["emailDraft", "discoveryQuestion", "internalNote"]
                  }
                },
                required: ["leadId", "targetName", "companyUrl", "sectorSource", "stageTrigger", "deadline", "techStack", "lane", "fitScore", "projectValue", "pocName", "pocTitle", "diagnosticLogic", "hook", "accessPoint", "owner", "isCriticalBridgeSprint", "isPEPrioritized", "missionBriefing", "sourceUrl", "confidence", "dateFound"]
              }
            }
          },
          required: ["summary", "leads"]
        }
      }
    });

    if (!response.text) {
      return fallbackResults;
    }

    try {
      const resultData = JSON.parse(response.text.trim());
      
      const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map(chunk => ({
          title: chunk.web?.title,
          uri: chunk.web?.uri
        }))
        .filter(source => source.uri) || [];

      return {
        ...resultData,
        sources
      };
    } catch (parseError) {
      console.error("DEX Schema Corruption:", parseError);
      return fallbackResults;
    }
  } catch (error: any) {
    console.error("DEX Signal Loss:", error);
    throw error;
  }
};

export const generateMissionBriefing = async (lead: Opportunity): Promise<MissionBriefing> => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    
    const researchQuery = `"${lead.targetName}" strategic goals OR "${lead.pocName}" interview OR "${lead.targetName}" operational challenges`;

    const prompt = `
      Act as a Senior Partner at District Analyst. Execute a Strategic Account Analysis on Target: ${lead.targetName}.
      Tone: Professional, Direct, and Insight-Led (No fluff, but warm).
      Focus on Business Value (Revenue, Risk, Efficiency).
      
      TARGET PROFILE:
      - Name: ${lead.pocName}
      - Role: ${lead.pocTitle}
      - Organization Stage: ${lead.stageTrigger}
      - Tech Stack: ${lead.techStack}
      
      ANALYSIS OBJECTIVES:
      1. OUTREACH STRATEGY: Create an 'Executive-Short' outreach email (polite but concise). It must sound like a peer-to-peer note.
      2. DISCOVERY QUESTION: Formulate a high-impact question regarding their operational data roadmap.
      3. INTERNAL NOTE: Provide professional context on why this organization is a priority.
      
      SEARCH TASK: Ground your response with Google Search using this query: ${researchQuery}

      OUTPUT format (JSON):
      {
        "emailDraft": "string",
        "discoveryQuestion": "string",
        "internalNote": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emailDraft: { type: Type.STRING },
            discoveryQuestion: { type: Type.STRING },
            internalNote: { type: Type.STRING }
          },
          required: ["emailDraft", "discoveryQuestion", "internalNote"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No intelligence synthesis received.");
    }

    return JSON.parse(response.text.trim()) as MissionBriefing;
  } catch (error) {
    console.error("Strategic Briefing Error:", error);
    throw error;
  }
};

export const generateDiagnostic = async (lead: Opportunity): Promise<DiagnosticResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    
    const prompt = `
      Act as a Lead Strategy Consultant at District Analyst. 
      Perform a Strategic Diagnostic on ${lead.targetName}.
      
      TARGET CONTEXT:
      - Current Stage: ${lead.stageTrigger}
      - Sector: ${lead.sectorSource}
      - Service Area: ${lead.lane}
      - Alignment Logic: ${lead.diagnosticLogic}
      
      TASK:
      1. FORMULATE HYPOTHESIS: Why is this specific organizational friction happening?
      2. IDENTIFY 3 CRITICAL RISKS: Define the pain point, business impact, and District Analyst Solution framework for each.
      3. DEFINE WINNING METRIC: What is the primary performance indicator to target?
      
      OUTPUT format (JSON):
      {
        "hypothesis": "string",
        "risks": [
          { "painPoint": "string", "impact": "string", "daSolution": "string" }
        ],
        "winningMetric": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hypothesis: { type: Type.STRING },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  painPoint: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  daSolution: { type: Type.STRING }
                },
                required: ["painPoint", "impact", "daSolution"]
              }
            },
            winningMetric: { type: Type.STRING }
          },
          required: ["hypothesis", "risks", "winningMetric"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Diagnostic synthesis failed.");
    }

    return JSON.parse(response.text.trim()) as DiagnosticResult;
  } catch (error) {
    console.error("Diagnostic Assessment Error:", error);
    throw error;
  }
};