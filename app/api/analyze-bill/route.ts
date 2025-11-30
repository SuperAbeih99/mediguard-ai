import { SYSTEM_PROMPT } from "@/lib/ai";
import { BillAnalysis } from "@/types/analysis";

type AnalyzeResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set.");
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      { status: 500 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleFormData(request, apiKey);
  }

  return handleJson(request, apiKey);
}

async function handleJson(request: Request, apiKey: string) {
  let body: {
    billText?: string;
    userQuestion?: string;
    insuranceProvider?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body." }),
      { status: 400 }
    );
  }

  if (!body.billText || typeof body.billText !== "string") {
    return new Response(
      JSON.stringify({ error: "billText is required." }),
      { status: 400 }
    );
  }

  const insuranceContext = formatInsurance(body.insuranceProvider);

  const userMessage = `Here is the bill and my question.

Bill:
${body.billText}

Insurance:
${insuranceContext}

Question:
${body.userQuestion?.trim() || "Please analyze this bill for errors, overcharges, and next steps."}`;

  return callChatCompletion(userMessage, apiKey);
}

async function handleFormData(request: Request, apiKey: string) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid form data." }),
      { status: 400 }
    );
  }

  const billText = formData.get("billText");
  const file = formData.get("billImage");
  const userQuestion =
    typeof formData.get("userQuestion") === "string"
      ? (formData.get("userQuestion") as string).trim()
      : "";
  const insuranceProvider =
    typeof formData.get("insuranceProvider") === "string"
      ? (formData.get("insuranceProvider") as string)
      : "";

  if (!(file instanceof File) && (!billText || typeof billText !== "string")) {
    return new Response(
      JSON.stringify({
        error: "Please upload a bill image/PDF or paste the bill text.",
      }),
      { status: 400 }
    );
  }

  const insuranceContext = formatInsurance(insuranceProvider);

  if (file instanceof File) {
    return handleImageAnalysis(file, userQuestion, insuranceContext, apiKey);
  }

  const userMessage = `Here is the bill and my question.

Bill:
${billText}

Insurance:
${insuranceContext}

Question:
${userQuestion || "Please analyze this bill for errors, overcharges, and next steps."}`;

  return callChatCompletion(userMessage, apiKey);
}

async function handleImageAnalysis(
  file: File,
  userQuestion: string,
  insuranceContext: string,
  apiKey: string
) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/png";
    const imageUrl = `data:${mimeType};base64,${base64}`;

    const instructionText =
      "This is an image of a medical bill. Please read it, extract the important details, and then analyze it for possible errors, overcharges, or items worth questioning." +
      (insuranceContext ? `\nInsurance: ${insuranceContext}` : "") +
      (userQuestion ? `\nUser question: ${userQuestion}` : "");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: instructionText },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    const data = (await response.json()) as AnalyzeResponse;

    if (!response.ok) {
      console.error("OpenAI error:", data);
      throw new Error("OpenAI request failed.");
    }

    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("No answer returned from OpenAI.");
    }

    const analysis = parseAnalysis(answer);

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Image analyze bill error:", error);
    return new Response(
      JSON.stringify({
        error: "Something went wrong analyzing the bill.",
      }),
      { status: 500 }
    );
  }
}

async function callChatCompletion(userMessage: string, apiKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
      }),
    });

    const data = (await response.json()) as AnalyzeResponse;

    if (!response.ok) {
      console.error("OpenAI error:", data);
      throw new Error("OpenAI request failed.");
    }

    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("No answer returned from OpenAI.");
    }

    const analysis = parseAnalysis(answer);

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Text analyze bill error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong analyzing the bill." }),
      { status: 500 }
    );
  }
}

function parseAnalysis(answer: string): BillAnalysis {
  try {
    const parsed = JSON.parse(answer) as BillAnalysis;

    if (
      typeof parsed.summary !== "string" ||
      typeof parsed.totalBilled !== "number" ||
      !Array.isArray(parsed.items)
    ) {
      throw new Error("Invalid structure");
    }

    const normalizedItems = parsed.items.map((item) => {
      const status = item.status;
      const validStatus = status === "correct" || status === "incorrect" ? status : "correct";

      return {
        cptCode: item.cptCode || "UNKNOWN",
        description: item.description || "",
        amount: typeof item.amount === "number" ? item.amount : 0,
        status: validStatus,
        why: item.why || "",
        estimatedReasonableAmount:
          typeof item.estimatedReasonableAmount === "number"
            ? item.estimatedReasonableAmount
            : null,
      };
    });

    const issuesFound = normalizedItems.reduce(
      (count, item) => (item.status === "incorrect" ? count + 1 : count),
      0
    );

    const potentialSavings = normalizedItems.reduce((sum, item) => {
      if (
        item.status === "incorrect" &&
        typeof item.estimatedReasonableAmount === "number"
      ) {
        const delta = item.amount - item.estimatedReasonableAmount;
        return delta > 0 ? sum + delta : sum;
      }
      return sum;
    }, 0);

    return {
      summary: parsed.summary,
      insurancePlan:
        typeof parsed.insurancePlan === "string"
          ? parsed.insurancePlan
          : parsed.insurancePlan === null
          ? null
          : null,
      totalBilled: parsed.totalBilled,
      potentialSavings,
      issuesFound,
      items: normalizedItems,
      disputeLetter: parsed.disputeLetter || "",
      questionAnswer:
        typeof parsed.questionAnswer === "string"
          ? parsed.questionAnswer
          : null,
    };
  } catch (error) {
    console.error("Failed to parse analysis JSON:", error, answer);
    throw new Error("Invalid analysis data.");
  }
}

function formatInsurance(provider?: string) {
  if (!provider) return "Not provided";
  return provider;
}
