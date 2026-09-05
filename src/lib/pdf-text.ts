// Browser-only PDF text extraction. Import this module lazily (inside an event
// handler) so pdf.js never runs during SSR.

export class PdfExtractionError extends Error {}

const MAX_PAGES = 60;

function cleanExtractedText(raw: string): string {
  return (
    raw
      // join words broken across line ends with a hyphen
      .replace(/(\w)-\n(\w)/g, "$1$2")
      // strip page-number-only lines and common artifacts
      .replace(/^\s*(page\s*)?\d{1,4}\s*$/gim, "")
      .replace(/\f/g, "\n")
      // collapse runs of spaces/tabs
      .replace(/[ \t\u00a0]{2,}/g, " ")
      // normalise line endings and collapse 3+ blank lines
      .replace(/\r\n?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim()
  );
}

export async function extractPdfText(file: File): Promise<{ text: string; pages: number }> {
  const [pdfjs, workerSrc] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url").then((m) => m.default as string),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  let doc;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    doc = await pdfjs.getDocument({ data }).promise;
  } catch {
    throw new PdfExtractionError(
      "This PDF couldn't be opened. It may be damaged or password-protected — try re-saving it and uploading again.",
    );
  }

  const pageCount = Math.min(doc.numPages, MAX_PAGES);
  const chunks: string[] = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ");
    if (pageText.trim()) chunks.push(pageText.trim());
    page.cleanup();
  }

  const text = cleanExtractedText(chunks.join("\n\n"));
  const letters = text.replace(/[^A-Za-z\u00c0-\u024f]/g, "").length;

  if (letters < 200) {
    throw new PdfExtractionError(
      "This PDF looks like scanned images, so there's no text to read. Upload a text-based PDF, or paste the chapter text into the box below.",
    );
  }

  return { text, pages: doc.numPages };
}
