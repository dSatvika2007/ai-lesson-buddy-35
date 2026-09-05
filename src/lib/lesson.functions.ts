import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { AnswerFeedback, Lesson, LessonReport } from "./lesson-types";

const settingsSchema = z.object({
  topic: z.string().trim().max(300).default(""),
  sourceText: z.string().trim().max(40000).default(""),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  conceptCount: z.number().int().min(2).max(8).default(4),
  quizCount: z.number().int().min(3).max(10).default(5),
  style: z.enum(["concise", "balanced", "detailed"]).default("balanced"),
  language: z.string().trim().min(2).max(40).default("English"),
});

const answerInputSchema = z.object({
  lessonTitle: z.string().trim().max(300),
  conceptTitle: z.string().trim().max(300),
  conceptExplanation: z.string().trim().max(8000),
  question: z.string().trim().max(1000),
  answer: z.string().trim().min(1).max(4000),
  language: z.string().trim().min(2).max(40).default("English"),
});

const reportInputSchema = z.object({
  lessonTitle: z.string().trim().max(300),
  language: z.string().trim().min(2).max(40).default("English"),
  quizScore: z.number().min(0).max(100),
  conceptResults: z
    .array(
      z.object({
        conceptTitle: z.string().max(300),
        score: z.number().min(0).max(100),
        feedback: z.string().max(2000),
      }),
    )
    .max(20),
});

type Result<T> = { ok: true; data: T } | { ok: false; message: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  const { AiError } = await import("./ai-gateway.server");
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, message: error.message };
    console.error(error);
    return { ok: false, message: "Something went wrong while contacting the AI. Please try again." };
  }
}

const lessonJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "overview", "concepts", "quiz"],
  properties: {
    title: { type: "string" },
    overview: { type: "string" },
    concepts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "explanation", "keyPoints", "question"],
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
          keyPoints: { type: "array", items: { type: "string" } },
          question: { type: "string" },
        },
      },
    },
    quiz: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "options", "correctIndex", "explanation"],
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          explanation: { type: "string" },
        },
      },
    },
  },
};

export const generateLesson = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data }) => {
    return run(async () => {
      const { generateJson, AiError } = await import("./ai-gateway.server");
      const source = data.sourceText.slice(0, 40000);
      if (!data.topic && !source) {
        throw new AiError(400, "Add a topic or upload study material first.");
      }
      const depth =
        data.style === "concise"
          ? "Keep each explanation to about 80 words."
          : data.style === "detailed"
            ? "Explain each concept thoroughly in about 250 words with an example."
            : "Explain each concept clearly in about 150 words with a short example.";

      const lesson = await generateJson<Lesson>({
        schemaName: "lesson",
        schema: lessonJsonSchema,
        system: [
          "You are AI Teacher, an expert tutor who designs structured micro-lessons.",
          `Write EVERY piece of text in ${data.language}: lesson title, overview, concept titles, explanations, key points, understanding-check questions, and all quiz questions, options and explanations. Do not mix in any other language except unavoidable technical terms. Target a ${data.level} learner.`,
          depth,
          `Produce exactly ${data.conceptCount} concepts, ordered from foundational to advanced.`,
          "Each concept needs 3-4 key points and one open-ended understanding-check question the learner answers in a few sentences.",
          `Produce exactly ${data.quizCount} multiple-choice quiz questions with exactly 4 options each, correctIndex as the 0-based index of the correct option, and a one-sentence explanation.`,
          "Never invent facts that contradict provided study material.",
        ].join(" "),
        user: source
          ? `Topic or focus: ${data.topic || "(derive from the material)"}\n\nStudy material:\n${source}`
          : `Build the lesson about: ${data.topic}`,
      });

      return {
        ...lesson,
        concepts: lesson.concepts.filter((c) => c.title && c.explanation),
        quiz: lesson.quiz.filter((q) => Array.isArray(q.options) && q.options.length >= 2),
      };
    });
  });

const feedbackJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "verdict", "feedback", "modelAnswer"],
  properties: {
    score: { type: "integer" },
    verdict: { type: "string", enum: ["correct", "partial", "incorrect"] },
    feedback: { type: "string" },
    modelAnswer: { type: "string" },
  },
};

export const evaluateAnswer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => answerInputSchema.parse(input))
  .handler(async ({ data }) => {
    return run(async () => {
      const { generateJson } = await import("./ai-gateway.server");
      return generateJson<AnswerFeedback>({
        schemaName: "answer_feedback",
        schema: feedbackJsonSchema,
        system: [
          "You are AI Teacher grading a learner's short answer.",
          `Write every field of your reply entirely in ${data.language}, even when the learner answered in another language.`,
          "Score from 0 to 100 based only on the concept taught.",
          "verdict: 'correct' for 80+, 'partial' for 40-79, 'incorrect' below 40.",
          "feedback: 2-3 encouraging sentences naming what was right and what was missing.",
          "modelAnswer: a compact ideal answer in 1-3 sentences.",
        ].join(" "),
        user: `Lesson: ${data.lessonTitle}\nConcept: ${data.conceptTitle}\nWhat was taught: ${data.conceptExplanation}\nQuestion: ${data.question}\nLearner answer: ${data.answer}`,
      });
    });
  });

const reportJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "summary", "strengths", "improvements", "nextSteps"],
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    nextSteps: { type: "array", items: { type: "string" } },
  },
};

export const generateReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => reportInputSchema.parse(input))
  .handler(async ({ data }) => {
    return run(async () => {
      const { generateJson } = await import("./ai-gateway.server");
      return generateJson<LessonReport>({
        schemaName: "lesson_report",
        schema: reportJsonSchema,
        system: [
          "You are AI Teacher writing a short end-of-lesson learning report.",
          `Reply in ${data.language}.`,
          "headline: one motivating sentence. summary: 2-3 sentences on overall performance.",
          "strengths, improvements and nextSteps: 2-4 short bullet strings each, concrete and actionable.",
        ].join(" "),
        user: `Lesson: ${data.lessonTitle}\nFinal quiz score: ${Math.round(data.quizScore)}%\nPer-concept results:\n${data.conceptResults
          .map((r) => `- ${r.conceptTitle}: ${Math.round(r.score)}% — ${r.feedback}`)
          .join("\n")}`,
      });
    });
  });
