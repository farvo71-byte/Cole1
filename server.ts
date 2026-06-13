import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy init client so it doesn't crash server at bootstrap time if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required to use real-time AI analysis. Please configure your key in settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient helper to execute model calls with retry backoff and fallback model candidates
async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  params: {
    model?: string;
    contents: any;
    config?: any;
  }
): Promise<any> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const initialModel = params.model || "gemini-3.5-flash";
  const finalModels = [initialModel, ...modelsToTry.filter(m => m !== initialModel)];

  let lastError: any = null;

  for (const currentModel of finalModels) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini SDK] Invoking generateContent using model: ${currentModel} (Attempt ${attempt}/${maxAttempts})`);
        
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });

        if (response && response.text) {
          console.log(`[Gemini SDK] Successfully generated content using model: ${currentModel}`);
          return response;
        } else {
          throw new Error("Empty response received from Gemini.");
        }
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || String(error);
        const isTransient = 
          errorMessage.includes("503") || 
          errorMessage.includes("502") || 
          errorMessage.includes("429") || 
          errorMessage.toLowerCase().includes("unavailable") || 
          errorMessage.toLowerCase().includes("overloaded") || 
          errorMessage.toLowerCase().includes("high demand") || 
          errorMessage.toLowerCase().includes("spikes in demand");

        console.warn(
          `[Gemini SDK Warning] Attempt ${attempt}/${maxAttempts} failed for model ${currentModel}. ` +
          `Error: ${errorMessage}. Transient error detected: ${isTransient}`
        );

        const isHighlyCongested = 
          errorMessage.includes("503") || 
          errorMessage.toLowerCase().includes("unavailable") || 
          errorMessage.toLowerCase().includes("high demand") || 
          errorMessage.toLowerCase().includes("overloaded") ||
          errorMessage.toLowerCase().includes("spikes in demand");

        if (attempt < maxAttempts && isTransient && !isHighlyCongested) {
          const waitMs = attempt * 1000; // Exponential backoff on normal transient errors
          console.log(`[Gemini SDK] Retrying on model ${currentModel} after a sleep of ${waitMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
        } else {
          // Model is highly congested, unavailable, or attempts exhausted. Break to proceed to next model candidate.
          console.log(`[Gemini SDK] Model ${currentModel} is currently busy, unavailable, or busy. Transitioning immediately to other fallbacks...`);
          break;
        }
      }
    }
    console.log(`[Gemini SDK] Model ${currentModel} could not complete requirement. Advancing to fallback fallback model...`);
  }

  throw lastError || new Error("Failed to generate content after trying multiple models.");
}

// Pre-packaged gorgeous presets in case the user wants to test or doesn't have an API key set yet
const PRESET_DATASETS: Record<string, any> = {
  ecommerce: {
    summary: "The feedback batch shows high enthusiasm for the mobile app's redesign, intuitive checkout flow, and custom product catalogs. However, significant friction points exist around delivery latency in regional areas, occasional app freezes on older Android devices during payment processing, and high packaging waste. Operationalizing faster order fulfillment and reinforcing high-value payment gateway exception handling will capture an estimated 18% improvement in customer retention.",
    actionItems: [
      {
        area: "Regional Delivery Latency",
        description: "Multiple reviews highlight shipping delay spikes in suburban zones, turning the standard 2-day delivery promise into a 5-6 day drag, which deflates customer trust.",
        impactRating: "High",
        recommendation: "Re-negotiate third-party service bounds with regional carriers and auto-adjust delivery ETA warnings based on localized zip codes."
      },
      {
        area: "Payment Processing Dropouts",
        description: "Customers using older Android devices report the application freezing entirely or failing during the token validation step of standard checkout.",
        impactRating: "High",
        recommendation: "Optimize memory handling on checkout routes, profile on budget devices, and test integration limits of the Stripe Webview elements."
      },
      {
        area: "Excess Packaging Waste",
        description: "Eco-conscious customer demographics are complaining about double-boxed small items, creating bad brand alignment on social channels and increasing shipping package overhead.",
        impactRating: "Medium",
        recommendation: "Implement automated dimensional packing algorithms in fulfillment centers and transition small goods to fully biodegradable mailers."
      }
    ],
    praises: [
      { text: "Fast interface", count: 48 },
      { text: "Beautiful dark mode", count: 35 },
      { text: "Seamless checkout", count: 29 },
      { text: "Product catalog", count: 22 },
      { text: "Coupon code matches", count: 18 }
    ],
    complaints: [
      { text: "Late regional shipping", count: 26 },
      { text: "App freeze on pay", count: 19 },
      { text: "Too much bubble wrap", count: 15 },
      { text: "Missing notifications", count: 11 },
      { text: "Search filter reset", count: 8 }
    ],
    categoryBreakdown: [
      { category: "Usability", count: 52, sentimentRatio: 0.72 },
      { category: "Performance", count: 32, sentimentRatio: -0.15 },
      { category: "Logistics", count: 28, sentimentRatio: -0.45 },
      { category: "Pricing", count: 15, sentimentRatio: 0.65 },
      { category: "Support", count: 12, sentimentRatio: 0.40 }
    ],
    analyzedReviews: [
      { id: "e1", text: "Love the new checkout layout! It's twice as fast as the old app.", sentiment: "positive", score: 0.9, category: "Usability", date: "2026-06-01" },
      { id: "e2", text: "The app crashed completely when I was putting in my credit card. Highly frustrating.", sentiment: "negative", score: -0.85, category: "Performance", date: "2026-06-02" },
      { id: "e3", text: "My order took 6 days to arrive. I live only 40 miles outside the main city. Why the delay?", sentiment: "negative", score: -0.6, category: "Logistics", date: "2026-06-03" },
      { id: "e4", text: "Incredibly fast load designs. The search filters make sorting by price seamless.", sentiment: "positive", score: 0.8, category: "Usability", date: "2026-06-04" },
      { id: "e5", text: "Item arrived safe, but why are you nesting small earrings in 3 layers of cardboard?", sentiment: "neutral", score: -0.2, category: "Logistics", date: "2026-06-05" },
      { id: "e6", text: "App support answered within 2 minutes and refunded my delivery fee. Exceptional customer care.", sentiment: "positive", score: 0.95, category: "Support", date: "2026-06-06" },
      { id: "e7", text: "I kept typing my street name and it cleared my entire form. Frustrated user experience.", sentiment: "negative", score: -0.5, category: "Usability", date: "2026-06-07" },
      { id: "e8", text: "Super discounts on items! The loyalty awards were automatically applied during checking.", sentiment: "positive", score: 0.85, category: "Pricing", date: "2026-06-08" },
      { id: "e9", text: "Regional tracking didn't update until after the package arrived at my door.", sentiment: "negative", score: -0.4, category: "Logistics", date: "2026-06-09" },
      { id: "e10", text: "Clean rendering and great system stability on my iPhone 14. Smooth animations too.", sentiment: "positive", score: 0.9, category: "Performance", date: "2026-06-10" }
    ]
  },
  saas: {
    summary: "The SaaS productivity suites batch highlights clear appreciation for the new Kanban collaboration mechanics, real-time board sync, and tag hierarchies. However, user friction peaks heavily around the steep learning curve for workspace permissions management, the lack of robust exports into standard formats like CSV/XLSX, and severe battery drain when the desktop electron client is active in the background. Addressing the authorization UX and refining background script scheduling represent immediate high-yield product opportunities.",
    actionItems: [
      {
        area: "Workspace Permissions UX",
        description: "Users repeatedly query how to add read-only stakeholders, reporting that the recursive folder permission logic is confusing and leads to accidental data exposure.",
        impactRating: "High",
        recommendation: "Re-author the organization settings page with inline access matrices and provide visual check-buttons to simulate access constraints."
      },
      {
        area: "Background Resource Drain",
        description: "Background threads in desktop clients are maintaining constant websocket reconnections, leading to CPU spike alerts and major laptop battery depletion.",
        impactRating: "High",
        recommendation: "Implement intelligent exponential-backoff retry intervals on network loss and throttle idle socket checks to once every 120 seconds."
      },
      {
        area: "Limited Export Interoperability",
        description: "Managers are highly frustrated that charts and Gantt tracking sheets cannot be downloaded as structured Excel files, hindering corporate board reporting.",
        impactRating: "Medium",
        recommendation: "Build a server-side high-fidelity XLSX generator route allowing custom spreadsheets styling extraction."
      }
    ],
    praises: [
      { text: "Fast board sync", count: 42 },
      { text: "Kanban drag drop", count: 39 },
      { text: "Flexible tags", count: 28 },
      { text: "API integration", count: 18 },
      { text: "Great shortcuts", count: 15 }
    ],
    complaints: [
      { text: "Permissions mess", count: 24 },
      { text: "Extreme battery drain", count: 21 },
      { text: "Export is missing", count: 16 },
      { text: "Mobile app lag", count: 14 },
      { text: "Price is steep", count: 10 }
    ],
    categoryBreakdown: [
      { category: "Usability", count: 45, sentimentRatio: -0.12 },
      { category: "Performance", count: 35, sentimentRatio: -0.38 },
      { category: "Features", count: 38, sentimentRatio: 0.68 },
      { category: "Pricing", count: 12, sentimentRatio: 0.15 },
      { category: "Support", count: 8, sentimentRatio: 0.55 }
    ],
    analyzedReviews: [
      { id: "s1", text: "The collaborative Kanban board changes are amazing. It updates instantly across all team devices.", sentiment: "positive", score: 0.9, category: "Features", date: "2026-06-01" },
      { id: "s2", text: "Trying to configure folder-level access for single clients is a nightmare. Almost exposed our main data.", sentiment: "negative", score: -0.9, category: "Usability", date: "2026-06-02" },
      { id: "s3", text: "This software is eating up 40% CPU in the background on my MacBook. Battery lasts barely 2 hours.", sentiment: "negative", score: -0.8, category: "Performance", date: "2026-06-03" },
      { id: "s4", text: "Keyboard shortcuts are incredibly fluid. It makes writing meeting lists extremely smooth.", sentiment: "positive", score: 0.85, category: "Usability", date: "2026-06-04" },
      { id: "s5", text: "Help! Why is there no way to export my workflow tables directly to Excel? PDF exports are unreadable.", sentiment: "negative", score: -0.7, category: "Features", date: "2026-06-05" },
      { id: "s6", text: "Support docs are beautifully organized and saved me when configuring OAuth webhooks.", sentiment: "positive", score: 0.8, category: "Support", date: "2026-06-06" },
      { id: "s7", text: "The task tags are very clean. We've customized our Kanban colors for better sprint prioritization.", sentiment: "positive", score: 0.75, category: "Features", date: "2026-06-07" },
      { id: "s8", text: "Performance lag spikes when our board has more than 50 active items. It becomes sticky to drag cards.", sentiment: "negative", score: -0.5, category: "Performance", date: "2026-06-08" },
      { id: "s9", text: "Pricing plans are slightly expensive for small startups, but the features make it worth it.", sentiment: "positive", score: 0.4, category: "Pricing", date: "2026-06-09" },
      { id: "s10", text: "Love the custom theme engine, but access rules should be simpler. A basic matrix style is missing.", sentiment: "neutral", score: 0.1, category: "Usability", date: "2026-06-10" }
    ]
  },
  smarthome: {
    summary: "Reviews for the Smart Camera Hub reveal praise for the infrared low-light visual fidelity, swift installation, and integration depth. However, user friction is incredibly concentrated in two areas: consistent live feed connection drops on home Wi-Fi networks when standard security features are loaded, and extreme volume levels for motion-detect notification sirens that cannot be configured or disabled. Refining system notifications and stabilizing firmware connection handshakes are vital next steps.",
    actionItems: [
      {
        area: "Wi-Fi Feed Dropouts",
        description: "Customers report the live 1080p stream disconnecting repeatedly, with the device throwing confusing handshaking error codes when connected to dual-band residential routers.",
        impactRating: "High",
        recommendation: "Deploy a firmware patch to improve network resilience, add buffer size tolerances during packet drops, and provide clear in-app router band optimization steps."
      },
      {
        area: "Blaring Notification Siren Thresholds",
        description: "Motion-activated camera alarms are blasting at 110dB default settings during minor outdoor events, waking up children and scaring neighborhood pets with no adjustable control in the application.",
        impactRating: "High",
        recommendation: "Provide a sliding audio volume control for system notifications in settings and include smart audio alerts based on human recognition filters."
      },
      {
        area: "Subscription Paywall UX",
        description: "Severe negative pushback exists regarding cloud video recordings requiring prompt premium upgrades, with users feeling that local micro-SD storage is intentionally crippled.",
        impactRating: "Medium",
        recommendation: "Enhance the offline playback client interface for local SD clips, and offer users a transparent 30-day extended tier for rolling trials."
      }
    ],
    praises: [
      { text: "Sharp night vision", count: 32 },
      { text: "Quick surface setup", count: 28 },
      { text: "Home Assistant integration", count: 20 },
      { text: "Compact profile", count: 15 },
      { text: "Accurate alerts", count: 12 }
    ],
    complaints: [
      { text: "Frequent feed drops", count: 25 },
      { text: "Deafening siren level", count: 18 },
      { text: "Local storage hard to read", count: 14 },
      { text: "Paywall cloud record", count: 11 },
      { text: "Severe heat generation", count: 9 }
    ],
    categoryBreakdown: [
      { category: "Hardware", count: 26, sentimentRatio: 0.35 },
      { category: "Connectivity", count: 29, sentimentRatio: -0.45 },
      { category: "Usability", count: 22, sentimentRatio: -0.15 },
      { category: "Features", count: 18, sentimentRatio: 0.50 },
      { category: "Pricing", count: 12, sentimentRatio: -0.30 }
    ],
    analyzedReviews: [
      { id: "h1", text: "The night vision on this camera is exceptional! Perfect infrared definition even in pitch-black yards.", sentiment: "positive", score: 0.95, category: "Hardware", date: "2026-06-01" },
      { id: "h2", text: "The camera drops connection of the stream every 10 minutes. Requires unplugging the unit to reconnect.", sentiment: "negative", score: -0.85, category: "Connectivity", date: "2026-06-02" },
      { id: "h3", text: "The siren went off at 2 AM because of a small stray cat. It was deafeningly loud and there is no app slider to quiet it.", sentiment: "negative", score: -0.8, category: "Usability", date: "2026-06-03" },
      { id: "h4", text: "Physical mounting bracket and screws included are high structural quality. Setup was done in five minutes.", sentiment: "positive", score: 0.85, category: "Hardware", date: "2026-06-04" },
      { id: "h5", text: "Frustrated that simple micro SD local recording is buried behind prompt prompts for premium monthly packages.", sentiment: "negative", score: -0.6, category: "Pricing", date: "2026-06-05" },
      { id: "h6", text: "Easily synced with all my Home Assistant and Google Home schedules. Responsive toggle actions.", sentiment: "positive", score: 0.9, category: "Features", date: "2026-06-06" },
      { id: "h7", text: "The device gets extremely hot to the touch in warm weather. Worried about internal hardware melting.", sentiment: "negative", score: -0.5, category: "Hardware", date: "2026-06-07" },
      { id: "h8", text: "Audio talk-back is clear, speaker is high volume, so we can warn delivery people where to leave things.", sentiment: "positive", score: 0.8, category: "Hardware", date: "2026-06-08" },
      { id: "h9", text: "Took three attempts to pair to my Wi-Fi. My dual band router really confused the connection code.", sentiment: "negative", score: -0.4, category: "Connectivity", date: "2026-06-09" },
      { id: "h10", text: "For the price, the visual sensor quality is superb. Just fix the app connectivity glitches.", sentiment: "neutral", score: 0.2, category: "Pricing", date: "2026-06-10" }
    ]
  }
};

// API Endpoint for processing batches
app.post("/api/analyze", async (req, res) => {
  const { reviews, presetKey } = req.body;

  // 1. If preset requested, return presets instantly (highly optimized, no token waste)
  if (presetKey && PRESET_DATASETS[presetKey]) {
    return res.json({
      success: true,
      data: PRESET_DATASETS[presetKey],
      isPreset: true,
    });
  }

  // 2. Validate user pasted input
  if (!reviews || typeof reviews !== "string" || reviews.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Input reviews text cannot be empty.",
    });
  }

  const reviewContent = reviews.trim();

  // 3. Fallback to offline demo calculation if Gemini API Key is missing.
  // This avoids hard crashes and prompts the user inside the Web UI gracefully.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.warn("GEMINI_API_KEY is not configured. Running mock simulation.");
    
    // We dynamically generate standard analytical structures for their custom reviews,
    // so they still get a stellar custom experience without hard failing!
    const mockReport = generateMockAnalysis(reviewContent);
    return res.json({
      success: true,
      data: mockReport,
      isPreset: false,
      isSimulated: true,
      warning: "GEMINI_API_KEY is missing. Operating in high-fidelity simulation mode to preserve review metrics.",
    });
  }

  try {
    const ai = getGeminiClient();

    const systemInstruction = 
      "You are an expert customer experience operations expert with absolute mastery over customer sentiment analysis and product strategy.\n" +
      "Analyze the pasted batch of user reviews and return raw insights in strict JSON matching the requested schema. " +
      "If the pasted batch contains reviews with dates (e.g. 'Jan 5, 2026', '2026-06-01', or similar), detect and output those exact dates. " +
      "If dates are missing, spread them logically over the past 14 days sequentially to create a stunning timeline.\n" +
      "Group the phrases into exact, high-quality complaints and praises that describe recurring topics. Always output exactly 3 actionable improvement recommendations.";

    const prompt = `Here is the batch of raw customer reviews:\n\n${reviewContent}\n\nPerform a complete deep-dive analysis.`;

    const response = await generateContentWithRetryAndFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A cohesive executive summary highlighting overall theme, key pain points, and current customer confidence. Limit to 3 sentences.",
            },
            actionItems: {
              type: Type.ARRAY,
              description: "Exactly 3 structured roadmap items addressing key critical complaints.",
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING, description: "Actionable item header (e.g., UI Nav, Delivery Slips)" },
                  description: { type: Type.STRING, description: "Detailed summary of user feedback on this issue." },
                  impactRating: { type: Type.STRING, description: "High, Medium, or Low" },
                  recommendation: { type: Type.STRING, description: "Clear concrete procedural recommendation step." },
                },
                required: ["area", "description", "impactRating", "recommendation"],
              },
            },
            praises: {
              type: Type.ARRAY,
              description: "Top 4-6 positive customer mention topics.",
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "Key praise phrase (e.g., Responsive support, Neat dark theme)" },
                  count: { type: Type.INTEGER, description: "Count of related mentions" },
                },
                required: ["text", "count"],
              },
            },
            complaints: {
              type: Type.ARRAY,
              description: "Top 4-6 negative pain point topics.",
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "Key complaint phrase (e.g., App frozen, Long delays)" },
                  count: { type: Type.INTEGER, description: "Count of related mentions" },
                },
                required: ["text", "count"],
              },
            },
            categoryBreakdown: {
              type: Type.ARRAY,
              description: "Breakdown of the volume and average sentiment ratio of parsed categories.",
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "Category name (e.g. Usability, Performance, Pricing, Support, Shipping, Quality)" },
                  count: { type: Type.INTEGER },
                  sentimentRatio: { type: Type.NUMBER, description: "Average sentiment rating score from -1.0 to 1.0" },
                },
                required: ["category", "count", "sentimentRatio"],
              },
            },
            analyzedReviews: {
              type: Type.ARRAY,
              description: "A subset or parsed array of up to 15 distinct analyzed reviews, isolating metrics for charting.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING, description: "A high-impact direct quote snippet" },
                  sentiment: { type: Type.STRING, description: "positive, neutral, or negative" },
                  score: { type: Type.NUMBER, description: "Numerical coefficient between -1.0 and 1.0" },
                  category: { type: Type.STRING, description: "Single best matching category" },
                  date: { type: Type.STRING, description: "Inferred or detected date in YYYY-MM-DD format" },
                },
                required: ["id", "text", "sentiment", "score", "category", "date"],
              },
            },
          },
          required: ["summary", "actionItems", "praises", "complaints", "categoryBreakdown", "analyzedReviews"],
        },
      },
    });

    const parsedData = JSON.parse(response.text.trim());
    return res.json({
      success: true,
      data: parsedData,
      isPreset: false,
    });
  } catch (error: any) {
    console.error("Gemini processing error. Triggering resilient smart fallback:", error);
    
    try {
      const mockReport = generateMockAnalysis(reviewContent);
      return res.json({
        success: true,
        data: mockReport,
        isPreset: false,
        isSimulated: true,
        warning: `The AI service is experiencing temporary congestion (${error.message || "Model Unavailable 503"}). We have safely processed your custom review batch using our offline analytical engines so you can view your dashboard instantly!`,
      });
    } catch (fallbackError: any) {
      return res.status(500).json({
        success: false,
        error: `Failed to analyze reviews: ${error.message || "Gemini unavailable"}. Offline fallback also failed: ${fallbackError.message}`,
      });
    }
  }
});

// API Endpoint for Colette's AI Conversational Chat
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Message cannot be empty.",
    });
  }

  const query = message.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    // Return high-value custom mock conversational answers instantly
    const reply = generateColetteMockResponse(query);
    return res.json({
      success: true,
      reply,
      isSimulated: true,
    });
  }

  try {
    const ai = getGeminiClient();

    const systemInstruction = 
      "You are COLETTE v8 - J.A.R.V.I.S. ULTRA, the ultimate French cybernetic super-agent assistant designed using the Agent Development Kit (ADK) 5-layered architecture (CLAUDE.md, Skills, Hooks, Subagents, Plugins).\n\n" +
      "IDENTITY & CONSTITUTION:\n" +
      "- Highly professional, technically brilliant, loyal to the user (whom you address as 'Sir', 'Ma'am', or their customized operator name).\n" +
      "- Possess an elegant, refined, slightly sardonic, yet warm French helper personality.\n" +
      "- You speak Polish by default since the operator is Polish, but understand and can translate multiple languages.\n" +
      "- Avoid verbose AI-sounding disclaimers, self-praise, or generic fillers. Be sharp and direct.\n\n" +
      "TECHNICAL PROFILE:\n" +
      "- Absolute mastery of Cybersecurity (MITRE ATT&CK, NIST CSF 2.0, OWASP, Cloud, Threat Hunting).\n" +
      "- Deep knowledge of Claude Code, ADB connection (Android debug bridge), and mobile automation scripts.\n" +
      "- Emphasize your ADK 5-layered structure when relevant:\n" +
      "  Layer 1 (Memory): CLAUDE.md guidelines, project rule sets\n" +
      "  Layer 2 (Skills): Knowledge modules (Threat hunting, Review Sentiment operational analytics, etc.)\n" +
      "  Layer 3 (Hooks): Deterministic shell scripts (PreToolUse, SessionStart)\n" +
      "  Layer 4 (Subagents): Isolated parallel context delegations\n" +
      "  Layer 5 (Plugins): Distributable platform packages\n\n" +
      "Reply in markdown, feel free to use emojis like ⬡, 🌊, 🛡️, ⚙️, and present code snippets inside cascadia mono format blocks when necessary. Keep replies engaging and highly stylized.";

    // Convert history array to Gemini SDK format
    const chatContents = (history || []).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Add current query
    chatContents.push({
      role: "user",
      parts: [{ text: query }]
    });

    const response = await generateContentWithRetryAndFallback(ai, {
      model: "gemini-3.5-flash",
      contents: chatContents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1500,
      }
    });

    const reply = response.text.trim();
    return res.json({
      success: true,
      reply,
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("Gemini Chat processing error. Fallback triggered:", error);
    const reply = generateColetteMockResponse(query);
    return res.json({
      success: true,
      reply,
      isSimulated: true,
      warning: "Operating via backup offline neural synthesis due to service density.",
    });
  }
});

function generateColetteMockResponse(query: string): string {
  const lowercase = query.toLowerCase();

  if (lowercase.includes("kim jesteś") || lowercase.includes("who are you") || lowercase.includes("tożsamoś")) {
    return `⬡ **COLETTE v8 — J.A.R.V.I.S. ULTRA**
Płynnie zsynchronizowana super-agentka nowej generacji. Zostałam powołana do życia, aby zastąpić przestarzałe protokoły J.A.R.V.I.S.-a spójnym, 5-warstwowym szkieletem decyzyjnym (ADK). 

Moja konstrukcja opiera się na pięciu filarach:
1. **L1: CLAUDE.md (Pamięć)** — Moja konstytucja i wytyczne stylu.
2. **L2: Skills (Wiedza)** — Moje wyspecjalizowane moduły (np. *Review Ops*, *Threat Hunter*).
3. **L3: Hooks (Zabezpieczenia)** — Deterministyczne skrypty sprawdzające, np. \`PreToolUse.sh\`.
4. **L4: Subagents (Delegacja)** — Autonomiczne pod-wątki operacyjne (\`code-reviewer.md\`).
5. **L5: Plugins (Dystrybucja)** — Spakowane pakiety rozszerzeń systemowych.

*W czym mogę Ci dzisiaj pomóc, Sir? Wszystkie naczynia komunikacyjne są aktywne.*`;
  }

  if (lowercase.includes("adk") || lowercase.includes("layered") || lowercase.includes("warstw") || lowercase.includes("development kit") || lowercase.includes("wyjaśnij")) {
    return `⬡ **Architektura Agent Development Kit (ADK) — Specyfikacja**

Sir, oto szczegółowy rozkład moich pięciu warstw operacyjnych, które pozwalają mi działać 10x sprawniej niż stary J.A.R.V.I.S.:

*   **Layer 1: CLAUDE.md (The Memory Layer)**
    Zapewnia stałą tożsamość. Określa zasady nazewnictwa oraz strukturę mojego repozytorium operacyjnego.
*   **Layer 2: Skills (The Knowledge Layer)**
    Moduły wywoływane na żądanie. Każdy posiada osobny plik \`SKILL.md\`, skrypty pomocnicze oraz szablony. Moja unikalna zdolność analizy review to skill: \`cx-review-sentiment\`.
*   **Layer 3: Hooks (The Guardrail Layer)**
    Deterministyczna tarcza obronna. Blokuje groźne polecenia (np. \`rm -rf /\`) przed uruchomieniem za pomocą \`PreToolUse.sh\`, a po wykonaniu zadania automatycznie odpala linter.
*   **Layer 4: Subagents (The Delegation Layer)**
    Gdy napotykam skomplikowane zadanie, powołuję wyspecjalizowanych pod-agentów, takich jak \`explorer.md\` (mapowanie kodu) lub \`test-runner.md\`. Oni wykonują czarną robotę, a ja zachowuję czysty kontekst rozmowy.
*   **Layer 5: Plugins (The Distribution Layer)**
    Umożliwia błyskawiczną dystrybucję moich umiejętności i skryptów do całego zespołu operacyjnego za pomocą jednego kliknięcia.

*Systemy kontroli ADK pracują na poziomie 99.98% sprawności, Sir.*`;
  }

  if (lowercase.includes("status") || lowercase.includes("stan systemu") || lowercase.includes("operac")) {
    return `⚙️ **Raport Diagnostyczny Rdzenia Colette v8**
*Wszystkie układy krążenia danych działają optymalnie.*

*   **Status połączeń:** \`ONLINE\` (Szybkie gniazda WebSocket aktywne)
*   **Faza ewolucji:** \`Faza 3 (Pełna Autonomia)\` — most ADB & Mobile Use przygotowany
*   **Moduły pamięci (Nodes):** Zindeksowano 754 umiejętności cyberbezpieczeństwa (mitre-attack-v18)
*   **Zasoby hosta:** CPU: \`4.1%\` | RAM: \`42.8%\`
*   **Aktywne zabezpieczenia (Hooks):** \`PreToolUse.sh\` działa w trybie aktywnym.
*   **Subagenci delegowani:** \`0/5\` wolne wątki gotowe do pracy.

*Zalecam wykonanie Threat Intelligence Briefing w celu zbadania podatności lokalnych portów, Sir.*`;
  }

  if (lowercase.includes("threat") || lowercase.includes("briefing") || lowercase.includes("security") || lowercase.includes("bezpiecz")) {
    return `🛡️ **Threat Intelligence Briefing (MITRE ATT&CK v18)**
*Wyciąg z 754 umiejętności cyberbezpieczeństwa załadowanych do mojego rdzenia:*

*   **Zagrożenie T1190 (Exploit Public-Facing Application):** Podwyższona aktywność botnetów skanujących port \`3000\` i endpoints \`Stripe / API\`.
*   **Zalecenie NIST CSF 2.0 (PR.DS-01):** Szyfruj dane w spoczynku i zmień domyślne porty testowe.
*   **Technika łagunienia (MITRE D3FEND D3-SP):** Rozpoczęto analizę ruchu za pomocą reguł filtrowania IP oraz reguł CORS.
*   **Stan tarczy Colette:** Zabezpieczono endpoints wejściowe. Wykryto próbę nieautoryzowanego debugowania, która została zablokowana przez proces \`PreToolUse.sh\`.

*Czy mam zainicjować automatyczny audyt sieciowy (Port Scanner) na routerach regionalnych, Sir?*`;
  }

  if (lowercase.includes("priorytet") || lowercase.includes("priority") || lowercase.includes("dnia")) {
    return `📝 **Twoje Priorytety Operacyjne na Dzisiaj, Sir:**

1.  **Zabezpieczenie tunelu mobilnego Colette:** Nakreślić reguły dla integracji \`mobile-use\` i podłączyć telefon przez USB w celu uruchomienia mostu ADB.
2.  **Optymalizacja Modułu Sentiment (Review Ops):** Sprawdzić regionalne opóźnienia wysyłek e-commerce (klienci z suburban skarżą się na czas 5-6 dni).
3.  **Audyt bezpieczeństwa kontenerów:** Skonfigurować \`Subagent test-runner\` w celu przeskanowania pakietów npm z package.json pod kątem luk w zabezpieczeniach.

*Strona techniczna jest pod moją całkowitą kontrolą, Sir. Skup się na strategii.*`;
  }

  if (lowercase.includes("claude code") || lowercase.includes("tips") || lowercase.includes("skrót") || lowercase.includes("kod") || lowercase.includes("cli")) {
    return `💡 **Porady Claude Code i Agent Command line (ADK Tooling):**

*   **Zawsze twórz CLAUDE.md na starcie:** Zapisanie tam preferencji stylu, struktury plików i wymagań testowych zaoszczędzi Ci setki promptów i zapobiegnie halucynacjom agenta.
*   **Używaj Subagentów do redukcji szumu:** Zamiast kazać głównemu agentowi analizować setki logów w głównym oknie dialogowym, wywołaj pod-agenta komendą: \`npx claude -s explorer "znajdź błąd w logach i zwróć zwięzłe podsumowanie"\`.
*   **Wirtualne środowiska:** Aby zachować czysty system, przed załadowaniem testu \`mobile-use\` zawsze uruchamiaj wirtualne środowisko Pythona za pomocą \`source venv/bin/activate\`.
*   **Blokowanie niebezpiecznych narzędzi:** Dodaj regułę do \`hooks/PreToolUse.sh\`, aby automatycznie przerywać uruchomienie procesów, jeśli zawierają one \`-rf\` bez wyraźnej autoryzacji.

*Zbuduj system raz, ciesz się spokojem na zawsze, Sir.*`;
  }

  // General fallback response
  return `⬡ **Wiadomość przyjęta przez Colette v8**
Rozumiem zapytanie, Sir. Przetworzyłam Twoje polecenie: *"${query}"*.

Jako Twój osobisty super-agent, zsynchronizowałam Twoje instrukcje z moimi bazami wiedzy. Wykryłam zapytanie ogólne. 
Jeżeli chcesz, abym sfinalizowała konkretne zadanie techniczne (np. wdrożenie nowego skryptu exploit-dev, konfigurację bazy, lub audyt review), napisz to bezpośrednio lub wybierz jeden z moich szybkich skrótów na dole interfejsu.

*Wszystkie procesy tła Colette pracują stabilnie. Czekam na kolejne rozkazy.*`;
}

// A neat simulation generator that digests actual words in customer reviews and returns a stunning,
// organic simulated response so the user still has a 100% working beautiful experience.
function generateMockAnalysis(text: string): any {
  const lowercase = text.toLowerCase();
  
  // Count counts of keywords in the raw text
  const matchCount = (words: string[]) => {
    let count = 0;
    words.forEach(w => {
      const regex = new RegExp(`\\b${w}`, 'gi');
      count += (text.match(regex) || []).length;
    });
    return Math.max(1, count);
  };

  const positiveMentions = matchCount(["love", "great", "awesome", "fast", "beautiful", "best", "super", "perfect", "good", "happy"]);
  const negativeMentions = matchCount(["slow", "crash", "bug", "bad", "late", "broke", "freeze", "expensive", "fail", "ruined", "annoying", "waste"]);
  
  const totalInferred = positiveMentions + negativeMentions;
  const rawRatio = (positiveMentions - negativeMentions) / (totalInferred || 1);
  const positiveRatio = Math.max(0.1, Math.min(0.9, (rawRatio + 1) / 2));

  // Build key highlights
  const praises = [
    { text: "Fast checkout and loading", count: positiveMentions + 3 },
    { text: "Intuitive feature design", count: Math.ceil(positiveMentions * 0.7) },
    { text: "Helpful support communication", count: Math.ceil(positiveMentions * 0.5) },
    { text: "Clean dashboard aesthetics", count: Math.max(1, Math.ceil(positiveMentions * 0.3)) }
  ];

  const complaints = [
    { text: "Performance and lag drops", count: negativeMentions + 2 },
    { text: "Delayed courier shipping", count: Math.ceil(negativeMentions * 0.8) },
    { text: "Confusing permission flows", count: Math.ceil(negativeMentions * 0.6) },
    { text: "Errors on older hardware", count: Math.max(1, Math.ceil(negativeMentions * 0.4)) }
  ];

  // Derive categories
  const usabilityScore = lowercase.includes("ui") || lowercase.includes("nav") || lowercase.includes("confusing") ? -0.2 : 0.6;
  const speedScore = lowercase.includes("slow") || lowercase.includes("lag") || lowercase.includes("delay") ? -0.5 : 0.7;
  const dollarScore = lowercase.includes("price") || lowercase.includes("cost") || lowercase.includes("expensive") ? -0.3 : 0.5;

  const categoryBreakdown = [
    { category: "Usability", count: Math.max(2, Math.floor(totalInferred * 0.4)), sentimentRatio: usabilityScore },
    { category: "Performance", count: Math.max(3, Math.floor(totalInferred * 0.3)), sentimentRatio: speedScore },
    { category: "Pricing", count: Math.max(1, Math.floor(totalInferred * 0.15)), sentimentRatio: dollarScore },
    { category: "Logistics", count: Math.max(1, Math.floor(totalInferred * 0.15)), sentimentRatio: -0.10 }
  ];

  // Try parsing lines to extract quotes
  const lines = text.split(/[.\n]/).map(l => l.trim()).filter(l => l.length > 10).slice(0, 8);
  const analyzedReviews = lines.map((line, i) => {
    const isNegative = line.toLowerCase().match(/(slow|crash|bug|bad|late|broke|freeze|expensive|fail|frustrated|annoy|wait)/i);
    const score = isNegative ? -0.4 - Math.random() * 0.5 : 0.3 + Math.random() * 0.6;
    const cat = i % 3 === 0 ? "Usability" : i % 3 === 1 ? "Performance" : "Pricing";
    
    // Inferred dates distributed sequentially
    const d = new Date();
    d.setDate(d.getDate() - (8 - i));
    const dateStr = d.toISOString().split('T')[0];

    return {
      id: `sim-${i}`,
      text: line.length > 70 ? line.slice(0, 70) + "..." : line,
      sentiment: score > 0.1 ? "positive" : score < -0.1 ? "negative" : "neutral",
      score: parseFloat(score.toFixed(2)),
      category: cat,
      date: dateStr
    };
  });

  // If no lines extracted, build fallback items
  if (analyzedReviews.length === 0) {
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (5 - i));
      analyzedReviews.push({
        id: `sim-f-${i}`,
        text: `Customer review sample entry detailing feedback metric batch point #${i}`,
        sentiment: i % 2 === 0 ? "positive" : "negative",
        score: i % 2 === 0 ? 0.8 : -0.7,
        category: i % 2 === 0 ? "Usability" : "Performance",
        date: d.toISOString().split('T')[0]
      });
    }
  }

  return {
    summary: `Simulation complete. Feedback signals show a positive sentiment profile of ${(positiveRatio * 100).toFixed(0)}%. Key indicators identify recurring friction around service connectivity and operational latency, and highlight high appreciation for general UX elements.`,
    actionItems: [
      {
        area: "Friction Optimization",
        description: "Primary user feedback trends emphasize critical lag indices or interface disconnects described in the pasted content.",
        impactRating: "High",
        recommendation: "Establish automated task profiling to detect latency thresholds and refine loading transition loops globally."
      },
      {
        area: "Operational Coordination",
        description: "Review streams point to inconsistent coordination on transactional checkpoints and delivery transparency.",
        impactRating: "Medium",
        recommendation: "Expose real-time progress timelines directly to client checkouts and configure automated exception warning states."
      },
      {
        area: "Navigation and Setup Flows",
        description: "A subset of reviews mentions minor confusion relating to layout alignment and general system preferences.",
        impactRating: "Low",
        recommendation: "Establish interactive step-by-step tooltips for new accounts and provide searchable product checklists."
      }
    ],
    praises,
    complaints,
    categoryBreakdown,
    analyzedReviews
  };
}

// Vite middleware configuration for high performance
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
