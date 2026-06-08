import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  HEDGE_FUND_PERSONA, 
  RESEARCH_CHECKLIST_PERSONA, 
  HEDGE_FUND_PROMPTS, 
  RESEARCH_CHECKLIST_PROMPTS, 
  WORKFLOW_SECTIONS 
} from "@/lib/prompts";
import { CompanyData } from "@/lib/types";
import { buildDataSummary, buildNewsContext } from "@/lib/formatters";

export const runtime = "edge";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    let geminiKey = authHeader?.split("Bearer ")[1];

    if (!geminiKey || geminiKey === "null" || geminiKey === "undefined" || geminiKey.trim() === "") {
      geminiKey = process.env.GEMINI_API_KEY;
    }

    if (!geminiKey) {
      return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 401 });
    }

    const { ticker } = await params;
    const body = await request.json();
    const workflow = body.workflow || "hedge_fund";
    const data: CompanyData = body.data;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, payload: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
        };

        try {
          const genAI = new GoogleGenerativeAI(geminiKey);
          const modelName = "gemini-2.5-flash"; // or from settings
          
          const persona = workflow === "research_checklist" ? RESEARCH_CHECKLIST_PERSONA : HEDGE_FUND_PERSONA;
          const prompts = workflow === "research_checklist" ? RESEARCH_CHECKLIST_PROMPTS : HEDGE_FUND_PROMPTS;
          
          const model = genAI.getGenerativeModel({ 
            model: modelName, 
            systemInstruction: persona 
          });

          const dataSummary = buildDataSummary(data);
          const info = data.info || {};
          const companyName = info.longName || data.ticker;
          const peers = (data.peers || []).slice(0, 5).join(", ");
          const newsContext = buildNewsContext(data);

          // 1. Generate Research Guide
          sendEvent("status", { message: "Generating research guide..." });
          try {
            const guideModel = genAI.getGenerativeModel({ 
              model: modelName,
              systemInstruction: persona,
              generationConfig: { responseMimeType: "application/json" }
            });
            const guidePrompt = prompts.research_guide.replace("{data_summary}", dataSummary);
            const guideResult = await guideModel.generateContent(guidePrompt);
            const guideJson = JSON.parse(guideResult.response.text() || "{}");
            sendEvent("research_guide", guideJson);
          } catch (e: any) {
            console.error("Research guide error:", e);
            sendEvent("research_guide", { error: "Failed to generate guide" });
          }

          // 2. Stream Sections
          const sections = WORKFLOW_SECTIONS[workflow] || WORKFLOW_SECTIONS.hedge_fund;

          for (const section of sections) {
            sendEvent("section_start", { section: section.id });
            
            const promptTemplate = prompts[section.id];
            if (!promptTemplate) {
              sendEvent("section_chunk", { text: `[Missing prompt for ${section.id}]` });
              sendEvent("section_end", { section: section.id });
              continue;
            }

            const prompt = promptTemplate
              .replace("{company_name}", companyName)
              .replace("{ticker}", ticker)
              .replace("{data_summary}", dataSummary)
              .replace("{peers}", peers)
              .replace("{news_context}", newsContext);

            try {
              const resultStream = await model.generateContentStream(prompt);
              for await (const chunk of resultStream.stream) {
                const text = chunk.text();
                if (text) {
                  sendEvent("section_chunk", { text });
                }
              }
            } catch (e: any) {
              console.error(`Section ${section.id} error:`, e);
              sendEvent("section_chunk", { text: `\\n[Error: ${e.message}]\\n` });
            }
            
            sendEvent("section_end", { section: section.id });
          }

          sendEvent("done", { status: "complete" });
        } catch (err: any) {
          sendEvent("error", { message: err.message });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
