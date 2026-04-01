import Link from "next/link";
import { LESSON_ORDER, LESSON_META, LAYERS } from "@/lib/constants";
import { LayerBadge } from "@/components/ui/badge";
import { LessonDetailClient } from "./client";
import docsData from "@/data/generated/docs.json";

export function generateStaticParams() {
  return LESSON_ORDER.map((lesson) => ({ lesson }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lesson: string }>;
}) {
  const { lesson } = await params;

  const meta = LESSON_META[lesson];

  if (!meta) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">课程未找到</h1>
        <p className="mt-2 text-zinc-500">{lesson}</p>
      </div>
    );
  }

  const layer = LAYERS.find((l) => l.id === meta.layer);

  const doc = (docsData as any).docs.find((d: any) => d.id === lesson);

  const pathIndex = LESSON_ORDER.indexOf(lesson as typeof LESSON_ORDER[number]);
  const prevLesson = pathIndex > 0 ? LESSON_ORDER[pathIndex - 1] : null;
  const nextLesson =
    pathIndex < LESSON_ORDER.length - 1
      ? LESSON_ORDER[pathIndex + 1]
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-10 py-4">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-zinc-100 px-3 py-1 font-mono text-lg font-bold dark:bg-zinc-800">
            {lesson}
          </span>
          <h1 className="text-2xl font-bold sm:text-3xl">{meta.title}</h1>
          {layer && (
            <LayerBadge layer={meta.layer}>{layer.label}</LayerBadge>
          )}
        </div>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          {meta.subtitle}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span>预计阅读 {meta.readingTime}</span>
        </div>
        {meta.keyInsight && (
          <blockquote className="border-l-4 border-zinc-300 pl-4 text-sm italic text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
            {meta.keyInsight}
          </blockquote>
        )}
      </header>

      {/* Lesson content */}
      {doc && (
        <LessonDetailClient
          lesson={lesson}
          learn={doc.learn}
          source={doc.source}
          deepDive={doc.deepDive}
        />
      )}

      {/* Prev / Next navigation */}
      <nav className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-700">
        {prevLesson ? (
          <Link
            href={`/${prevLesson}`}
            className="group flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              &larr;
            </span>
            <div>
              <div className="text-xs text-zinc-400">上一课</div>
              <div className="font-medium">
                {prevLesson} - {LESSON_META[prevLesson]?.title}
              </div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link
            href={`/${nextLesson}`}
            className="group flex items-center gap-2 text-right text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
          >
            <div>
              <div className="text-xs text-zinc-400">下一课</div>
              <div className="font-medium">
                {LESSON_META[nextLesson]?.title} - {nextLesson}
              </div>
            </div>
            <span className="transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  );
}
