import { useRef, useState } from "react";
import { FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { LessonSettings } from "@/lib/lesson-types";

const MAX_CHARS = 40000;

export function SetupForm({
  onSubmit,
  loading,
}: {
  onSubmit: (settings: LessonSettings) => void;
  loading: boolean;
}) {
  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [level, setLevel] = useState<LessonSettings["level"]>("beginner");
  const [style, setStyle] = useState<LessonSettings["style"]>("balanced");
  const [language, setLanguage] = useState("English");
  const [conceptCount, setConceptCount] = useState(4);
  const [quizCount, setQuizCount] = useState(5);
  const [extracting, setExtracting] = useState(false);
  const [reviewNotice, setReviewNotice] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);


  async function handleFile(file: File | undefined) {
    if (!file) return;
    const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
    const isText = /\.(txt|md|markdown|csv|json)$/i.test(file.name) || file.type.startsWith("text/");

    if (!isPdf && !isText) {
      toast.error("That file type isn't supported yet", {
        description: "Upload a PDF, .txt or .md file, or paste your notes into the box below.",
      });
      return;
    }
    if (file.size > (isPdf ? 25_000_000 : 2_000_000)) {
      toast.error("That file is too large", {
        description: isPdf ? "Please use a PDF under 25 MB." : "Please use a file under 2 MB.",
      });
      return;
    }

    if (isPdf) {
      setExtracting(true);
      try {
        const { extractPdfText, PdfExtractionError } = await import("@/lib/pdf-text");
        try {
          const { text, pages } = await extractPdfText(file);
          setSourceText(text.slice(0, MAX_CHARS));
          setFileName(file.name);
          setReviewNotice(true);
          toast.success(`Read ${pages} page${pages === 1 ? "" : "s"} from ${file.name}`, {
            description: "Check the text below and edit anything that looks off.",
          });
        } catch (error) {
          if (error instanceof PdfExtractionError) {
            toast.error("Couldn't read this PDF", { description: error.message });
          } else {
            toast.error("Couldn't read this PDF", {
              description: "Something went wrong reading the file. Try again or paste the text instead.",
            });
          }
        }
      } finally {
        setExtracting(false);
      }
      return;
    }

    try {
      const text = await file.text();
      setSourceText(text.slice(0, MAX_CHARS));
      setFileName(file.name);
      setReviewNotice(true);
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error("The file could not be read. Try pasting the text instead.");
    }
  }


  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!topic.trim() && !sourceText.trim()) {
      toast.error("Tell me what to teach", { description: "Add a topic or upload your study material." });
      return;
    }
    onSubmit({
      topic: topic.trim(),
      sourceText: sourceText.trim(),
      level,
      style,
      language: language.trim() || "English",
      conceptCount,
      quizCount,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label htmlFor="topic">What do you want to learn?</Label>
            <Input
              id="topic"
              placeholder="e.g. Photosynthesis, Newton's laws, React hooks"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Study material (optional)</Label>
            <Textarea
              id="material"
              placeholder="Paste your notes, chapter text or transcript here…"
              className="min-h-40 resize-y"
              value={sourceText}
              onChange={(e) => {
                setSourceText(e.target.value.slice(0, MAX_CHARS));
                setFileName(null);
              }}
              disabled={loading}
            />
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInput}
                type="file"
                accept=".txt,.md,.markdown,.csv,.json,text/plain"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => fileInput.current?.click()}
              >
                <Upload className="mr-2 size-4" /> Upload a text file
              </Button>
              {fileName && (
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
                  <FileText className="size-3.5" /> {fileName}
                  <button
                    type="button"
                    aria-label="Remove file"
                    onClick={() => {
                      setFileName(null);
                      setSourceText("");
                    }}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {sourceText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-6 pt-6">
          <p className="font-display text-2xl">Lesson settings</p>

          <div className="space-y-2">
            <Label>Learner level</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as LessonSettings["level"])} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Explanation depth</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as LessonSettings["style"])} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Concepts</Label>
              <span className="text-sm text-muted-foreground">{conceptCount}</span>
            </div>
            <Slider
              min={2}
              max={8}
              step={1}
              value={[conceptCount]}
              onValueChange={([v]) => setConceptCount(v ?? 4)}
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Quiz questions</Label>
              <span className="text-sm text-muted-foreground">{quizCount}</span>
            </div>
            <Slider
              min={3}
              max={10}
              step={1}
              value={[quizCount]}
              onValueChange={([v]) => setQuizCount(v ?? 5)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Building your lesson…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" /> Create my lesson
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
