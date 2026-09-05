import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Lesson } from "@/lib/lesson-types";

export function QuizStage({
  lesson,
  onFinish,
  loading,
}: {
  lesson: Lesson;
  onFinish: (score: number) => void;
  loading: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const total = lesson.quiz.length;
  const answeredCount = Object.keys(answers).length;
  const correctCount = lesson.quiz.filter((q, i) => answers[i] === q.correctIndex).length;
  const score = total > 0 ? (correctCount / total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Final quiz</span>
          <span>
            {answeredCount} of {total} answered
          </span>
        </div>
        <Progress value={total ? (answeredCount / total) * 100 : 0} />
      </div>

      {lesson.quiz.map((question, qIndex) => {
        const selected = answers[qIndex];
        return (
          <Card key={question.question}>
            <CardHeader>
              <CardTitle className="text-base font-medium leading-relaxed">
                {qIndex + 1}. {question.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RadioGroup
                value={selected === undefined ? "" : String(selected)}
                onValueChange={(v) => setAnswers((prev) => ({ ...prev, [qIndex]: Number(v) }))}
                disabled={submitted}
                className="gap-2"
              >
                {question.options.map((option, oIndex) => {
                  const isCorrect = oIndex === question.correctIndex;
                  const state = submitted
                    ? isCorrect
                      ? "border-chart-3 bg-chart-3/10"
                      : selected === oIndex
                        ? "border-destructive bg-destructive/10"
                        : "border-border"
                    : "border-border hover:border-primary/60";
                  return (
                    <div
                      key={option}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${state}`}
                    >
                      <RadioGroupItem value={String(oIndex)} id={`q${qIndex}-o${oIndex}`} />
                      <Label htmlFor={`q${qIndex}-o${oIndex}`} className="flex-1 cursor-pointer font-normal">
                        {option}
                      </Label>
                      {submitted && isCorrect && <CheckCircle2 className="size-4 text-chart-3" />}
                      {submitted && !isCorrect && selected === oIndex && (
                        <XCircle className="size-4 text-destructive" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
              {submitted && (
                <p className="rounded-lg bg-secondary/70 p-3 text-sm text-muted-foreground">
                  {question.explanation}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          {submitted ? (
            <>
              <p className="text-sm">
                You scored{" "}
                <span className="font-display text-2xl">
                  {correctCount}/{total}
                </span>{" "}
                ({Math.round(score)}%)
              </p>
              <Button onClick={() => onFinish(score)} disabled={loading}>
                {loading ? "Preparing your report…" : "See my learning report"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Answer every question to submit the quiz.</p>
              <Button onClick={() => setSubmitted(true)} disabled={answeredCount < total}>
                Submit quiz
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
