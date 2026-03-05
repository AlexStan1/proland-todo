import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { input, currentDate } = await req.json();

    if (!input?.trim()) {
      return NextResponse.json({ error: "No input" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI key not configured" }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model:      "gpt-4o",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a task parser. Today is ${currentDate}.
Extract structured data from natural language task input.
Return ONLY a raw JSON object — absolutely no markdown, no backticks, no code fences, no explanation.
Schema:
{
  "title": string,
  "dueDate": "YYYY-MM-DD" | null,
  "priority": 1 | 2 | 3 | 4,
  "projectName": string | null,
  "labels": string[]
}
Priority: 1=urgent/p1, 2=high/p2, 3=normal/p3, 4=none (default).
Extract #ProjectName for projectName. Extract @label for labels. Strip those tokens from the title.`,
        },
        { role: "user", content: input },
      ],
    });

    const raw  = completion.choices[0]?.message?.content ?? "{}";
    // Strip any accidental markdown fences
    const clean = raw.replace(/^```(?:json)?/i, "").replace(/```$/,"").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      // If GPT still returned something weird, fall back to plain title
      parsed = { title: input.trim(), dueDate: null, priority: 4, projectName: null, labels: [] };
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("parse-task error:", err?.message ?? err);
    return NextResponse.json(
      { error: err?.message ?? "Parse failed" },
      { status: 500 }
    );
  }
}
