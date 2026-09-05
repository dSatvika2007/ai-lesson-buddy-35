import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ConceptStage } from "@/components/ConceptStage";
import { IntroVideo } from "@/components/IntroVideo";
import { QuizStage } from "@/components/QuizStage";
import { ReportStage } from "@/components/ReportStage";
import { SetupForm } from "@/components/SetupForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { evaluateAnswer, generateLesson, generateReport } from "@/lib/lesson.functions";
import type {
  AnswerFeedback,
  ConceptResult,
  Lesson,
  LessonReport,
  LessonSettings,
} from "@/lib/lesson-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Teacher — Learn any topic, concept by concept" },
      {
        name: "description",
        content:
          "Upload a chapter or name a topic and AI Teacher builds a guided lesson with understanding checks, a final quiz and a personal learning report.",
      },
      { property: "og:title", content: "AI Teacher" },
      {
        property: "og:description",
        content: "AI-guided lessons with understanding checks, a final quiz and a learning report.",
      },
    ],
  }),
  component: Index,
});

type Stage = "setup" | "lesson" | "quiz" | "report";

function Index() {
  const createLesson = useServerFn(generateLesson);
  const gradeAnswer = useServerFn(evaluateAnswer);
  const buildReport = useServerFn(generateReport);

  const [stage, setStage] = useState<Stage>("setup");
  const [settings, setSettings] = useState<LessonSettings | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [results, setResults] = useState<ConceptResult[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [report, setReport] = useState<LessonReport | null>(null);

  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [reporting, setReporting] = useState(false);

  async function handleGenerate(next: LessonSettings) {
    setGenerating(true);
    try {
      const result = await createLesson({ data: next });
      if (!result.ok) {
        toast.error("Couldn't build the lesson", { description: result.message });
        return;
      }
      if (!result.data.concepts.length) {
        toast.error("The lesson came back empty", { description: "Try again with a clearer topic." });
        return;
      }
      setSettings(next);
      setLesson(result.data);
      setConceptIndex(0);
      setFeedback(null);
      setResults([]);
      setQuizScore(0);
      setReport(null);
      setStage("lesson");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Connection problem", { description: "Please check your connection and try again." });
    } finally {
      setGenerating(false);
    }
  }

  async function handleAnswer(answer: string) {
    if (!lesson || !settings) return;
    const concept = lesson.concepts[conceptIndex]!;
    setEvaluating(true);
    try {
      const result = await gradeAnswer({
        data: {
          lessonTitle: lesson.title,
          conceptTitle: concept.title,
          conceptExplanation: concept.explanation,
          question: concept.question,
          answer,
          language: settings.language,
        },
      });
      if (!result.ok) {
        toast.error("Couldn't check your answer", { description: result.message });
        return;
      }
      setFeedback(result.data);
      setResults((prev) => [
        ...prev,
        {
          conceptTitle: concept.title,
          question: concept.question,
          answer,
          score: result.data.score,
          verdict: result.data.verdict,
          feedback: result.data.feedback,
        },
      ]);
    } catch {
      toast.error("Connection problem", { description: "Please try submitting your answer again." });
    } finally {
      setEvaluating(false);
    }
  }

  function handleNext() {
    if (!lesson) return;
    if (conceptIndex + 1 < lesson.concepts.length) {
      setConceptIndex(conceptIndex + 1);
      setFeedback(null);
    } else {
      setStage("quiz");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleQuizFinish(score: number) {
    if (!lesson || !settings) return;
    setQuizScore(score);
    setStage("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setReporting(true);
    try {
      const result = await buildReport({
        data: {
          lessonTitle: lesson.title,
          language: settings.language,
          quizScore: score,
          conceptResults: results.map((r) => ({
            conceptTitle: r.conceptTitle,
            score: r.score,
            feedback: r.feedback,
          })),
        },
      });
      if (!result.ok) {
        toast.error("Couldn't write the report", { description: result.message });
        return;
      }
      setReport(result.data);
    } catch {
      toast.error("Connection problem", { description: "Your scores are shown, but the summary failed." });
    } finally {
      setReporting(false);
    }
  }

  function restart() {
    setStage("setup");
    setLesson(null);
    setReport(null);
    setResults([]);
    setFeedback(null);
    setConceptIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <p className="font-display text-2xl leading-none">AI Teacher</p>
              <p className="text-xs text-muted-foreground">Your patient personal tutor</p>
            </div>
          </div>
          {stage !== "setup" && (
            <Button variant="ghost" size="sm" onClick={restart}>
              New lesson
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        {stage === "setup" && (
          <>
            <section className="max-w-2xl space-y-4">
              <h1 className="font-display text-5xl leading-tight sm:text-6xl">
                Learn anything, one concept at a time.
              </h1>
              <p className="text-muted-foreground">
                Name a topic or bring your own chapter. AI Teacher turns it into a guided lesson, asks you
                questions along the way, quizzes you at the end and writes your personal learning report.
              </p>
            </section>
            <SetupForm onSubmit={handleGenerate} loading={generating} />
            {generating && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Designing your lesson — this usually takes
                    20–40 seconds.
                  </p>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {lesson && stage !== "setup" && (
          <>
            <div className="space-y-2">
              <h1 className="font-display text-4xl leading-tight">{lesson.title}</h1>
              <p className="text-sm text-muted-foreground">{lesson.overview}</p>
            </div>
            {stage === "lesson" && lesson.concepts[conceptIndex] && (
              <TeacherAvatar
                key={conceptIndex}
                title={lesson.concepts[conceptIndex]!.title}
                text={lesson.concepts[conceptIndex]!.explanation}
              />
            )}
            <IntroVideo title={lesson.title} />
          </>
        )}

        {lesson && stage === "lesson" && (
          <ConceptStage
            lesson={lesson}
            index={conceptIndex}
            feedback={feedback}
            evaluating={evaluating}
            onSubmit={handleAnswer}
            onNext={handleNext}
          />
        )}

        {lesson && stage === "quiz" && (
          <QuizStage lesson={lesson} onFinish={handleQuizFinish} loading={reporting} />
        )}

        {lesson && stage === "report" && (
          <ReportStage
            lesson={lesson}
            report={report}
            loading={reporting}
            conceptResults={results}
            quizScore={quizScore}
            onRestart={restart}
          />
        )}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        AI Teacher · lessons are generated by AI and may contain mistakes.
      </footer>
    </div>
  );
}
