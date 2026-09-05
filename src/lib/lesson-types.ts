export type Concept = {
  title: string;
  explanation: string;
  keyPoints: string[];
  question: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type Lesson = {
  title: string;
  overview: string;
  concepts: Concept[];
  quiz: QuizQuestion[];
};

export type AnswerFeedback = {
  score: number;
  verdict: "correct" | "partial" | "incorrect";
  feedback: string;
  modelAnswer: string;
};

export type ConceptResult = {
  conceptTitle: string;
  question: string;
  answer: string;
  score: number;
  verdict: AnswerFeedback["verdict"];
  feedback: string;
};

export type LessonReport = {
  headline: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
};

export type LessonSettings = {
  topic: string;
  sourceText: string;
  level: "beginner" | "intermediate" | "advanced";
  conceptCount: number;
  quizCount: number;
  style: "concise" | "balanced" | "detailed";
  language: string;
};
