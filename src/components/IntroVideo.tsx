import { PlayCircle } from "lucide-react";

/**
 * Fixed intro video slot shown above every lesson.
 * Drop a link into INTRO_VIDEO_URL (YouTube/Vimeo embed URL or an .mp4 file)
 * and the player renders automatically.
 */
const INTRO_VIDEO_URL =
  "https://projects-results.d-id.com/google-oauth2%7C110187163811411333059/prj_IcUK7gQF5R4j5gbJW73vG/result.mp4";

export function IntroVideo({ title }: { title?: string }) {
  const isFile = /\.(mp4|webm|ogg)(\?|$)/i.test(INTRO_VIDEO_URL);

  return (
    <section aria-label="Lesson intro video" className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative aspect-video w-full bg-secondary">
        {INTRO_VIDEO_URL ? (
          isFile ? (
            <video className="h-full w-full" src={INTRO_VIDEO_URL} controls preload="metadata" />
          ) : (
            <iframe
              className="h-full w-full"
              src={INTRO_VIDEO_URL}
              title="Lesson intro video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
            <PlayCircle className="size-12 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium text-foreground">Intro video coming soon</p>
            <p className="max-w-sm px-6 text-xs text-muted-foreground">
              This player is reserved for your welcome video. Share a link or file and it will appear here.
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
        <p className="text-sm font-medium">{title ? `Intro · ${title}` : "Lesson intro"}</p>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">Placeholder</span>
      </div>
    </section>
  );
}
