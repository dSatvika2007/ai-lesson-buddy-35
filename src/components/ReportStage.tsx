import { Lightbulb, RotateCcw, Sparkles, Target, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConceptResult, Lesson, LessonReport } from "@/lib/lesson-types";

function BulletCard({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Target;
  items: string[];
}) {
  if (!items?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ReportStage({
  lesson,
  report,
  loading,
  conceptResults,
  quizScore,
  onRestart,
}: {
  lesson: Lesson;
  report: LessonReport | null;
  loading: boolean;
  conceptResults: ConceptResult[];
  quizScore: number;
  onRestart: () => void;
}) {
  const conceptAverage = conceptResults.length
    ? conceptResults.reduce((sum, r) => sum + r.score, 0) / conceptResults.length
    : 0;
  const overall = Math.round(conceptAverage * 0.5 + quizScore * 0.5);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 pt-6 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Learning report
            </p>
            {loading ? (
              <>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </>
            ) : (
              <>
                <h2 className="font-display text-3xl leading-tight">
                  {report?.headline ?? lesson.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{report?.summary}</p>
              </>
            )}
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/70 p-6">
            <span className="font-display text-5xl">{overall}%</span>
            <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Overall</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Understanding checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conceptResults.map((result) => (
              <div key={result.conceptTitle} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{result.conceptTitle}</span>
                  <span className="text-muted-foreground">{Math.round(result.score)}%</span>
                </div>
                <Progress value={result.score} />
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Average across concepts: {Math.round(conceptAverage)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Final quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <span className="font-display text-4xl">{Math.round(quizScore)}%</span>
            <Progress value={quizScore} />
            <p className="text-sm text-muted-foreground">
              {lesson.quiz.length} multiple-choice questions on {lesson.title}.
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <BulletCard title="Strengths" icon={TrendingUp} items={report?.strengths ?? []} />
          <BulletCard title="To improve" icon={Target} items={report?.improvements ?? []} />
          <BulletCard title="Next steps" icon={Lightbulb} items={report?.nextSteps ?? []} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={onRestart}>
          <Sparkles className="mr-2 size-4" /> Learn something new
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <RotateCcw className="mr-2 size-4" /> Save / print report
        </Button>
      </div>
    </div>
  );
}
