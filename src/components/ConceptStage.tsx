import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { AnswerFeedback, Lesson } from "@/lib/lesson-types";

const verdictStyles = {
  correct: { icon: CheckCircle2, label: "Well understood", className: "text-chart-3" },
  partial: { icon: CircleAlert, label: "Almost there", className: "text-accent-foreground" },
  incorrect: { icon: XCircle, label: "Let's revisit this", className: "text-destructive" },
} as const;

export function ConceptStage({
  lesson,
  index,
  feedback,
  evaluating,
  onSubmit,
  onNext,
}: {
  lesson: Lesson;
  index: number;
  feedback: AnswerFeedback | null;
  evaluating: boolean;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}) {
  const concept = lesson.concepts[index]!;
  const [answer, setAnswer] = useState("");
  const isLast = index === lesson.concepts.length - 1;

  useEffect(() => {
    setAnswer("");
  }, [index]);

  const Verdict = feedback ? verdictStyles[feedback.verdict] : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Concept {index + 1} of {lesson.concepts.length}
          </span>
          <span>{Math.round((index / lesson.concepts.length) * 100)}% complete</span>
        </div>
        <Progress value={(index / lesson.concepts.length) * 100} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-3xl font-normal">{concept.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="whitespace-pre-line leading-relaxed">{concept.explanation}</p>
          {concept.keyPoints?.length > 0 && (
            <ul className="space-y-2 rounded-xl bg-secondary/70 p-4">
              {concept.keyPoints.map((point) => (
                <li key={point} className="flex gap-2 text-sm">
                  <span aria-hidden className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check your understanding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-medium">{concept.question}</p>
          <Textarea
            className="min-h-28"
            placeholder="Answer in a few sentences…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={evaluating || !!feedback}
          />

          {feedback && Verdict && (
            <div className="space-y-3 rounded-xl border bg-secondary/50 p-4">
              <div className={`flex items-center gap-2 font-medium ${Verdict.className}`}>
                <Verdict.icon className="size-5" />
                {Verdict.label} · {Math.round(feedback.score)}%
              </div>
              <p className="text-sm leading-relaxed">{feedback.feedback}</p>
              <div className="rounded-lg bg-card p-3 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Model answer
                </p>
                <p className="leading-relaxed">{feedback.modelAnswer}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!feedback ? (
              <Button onClick={() => onSubmit(answer.trim())} disabled={evaluating || answer.trim().length < 2}>
                {evaluating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Checking your answer…
                  </>
                ) : (
                  "Submit answer"
                )}
              </Button>
            ) : (
              <Button onClick={onNext}>
                {isLast ? "Start the final quiz" : "Next concept"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
