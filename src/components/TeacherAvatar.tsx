import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";

const LANG_TAGS: Record<string, string> = {
  hindi: "hi-IN",
  english: "en-US",
};

/**
 * Friendly speaking avatar that reads the current concept aloud
 * with the browser's built-in speech synthesis.
 */
export function TeacherAvatar({
  text,
  title,
  language = "English",
}: {
  text: string;
  title?: string;
  language?: string;
}) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
    setPaused(false);
  }, []);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.98;
    utterance.pitch = 1.02;
    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text]);

  // Auto-read whenever a new concept appears.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    speak();
    return stop;
  }, [speak, stop]);

  function toggle() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (!speaking) {
      speak();
      return;
    }
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  const animating = speaking && !paused;

  return (
    <section
      aria-label="Narrating teacher"
      className="mx-auto flex w-full max-w-2xl items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm"
    >
      <div className="relative grid size-16 shrink-0 place-items-center">
        {animating && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
            <span className="absolute -inset-1 animate-pulse rounded-full bg-primary/10" />
          </>
        )}
        <span
          className={`relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 ${
            animating ? "scale-105" : "scale-100"
          }`}
        >
          <svg viewBox="0 0 48 48" className="size-9" aria-hidden>
            <circle cx="18" cy="19" r="2.6" fill="currentColor" />
            <circle cx="30" cy="19" r="2.6" fill="currentColor" />
            <ellipse
              cx="24"
              cy="31"
              rx="7"
              ry={animating ? 5 : 2.2}
              fill="currentColor"
              className="transition-all duration-200"
            />
          </svg>
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title ?? "Your teacher"}</p>
        <p className="text-sm text-muted-foreground">
          {!supported
            ? "Read-aloud isn't available in this browser."
            : animating
              ? "Reading the explanation aloud…"
              : paused
                ? "Narration paused"
                : "Narration finished — press play to hear it again."}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={toggle}
        disabled={!supported}
        aria-label={animating ? "Pause narration" : "Play narration"}
      >
        {!supported ? (
          <VolumeX className="size-4" />
        ) : animating ? (
          <Pause className="size-4" />
        ) : speaking && paused ? (
          <Play className="size-4" />
        ) : (
          <Volume2 className="size-4" />
        )}
        <span className="ml-2">{animating ? "Pause" : paused ? "Resume" : "Play"}</span>
      </Button>
    </section>
  );
}
