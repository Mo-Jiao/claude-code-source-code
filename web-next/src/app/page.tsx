import Link from "next/link";
import { LAYERS, LESSON_META } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 py-8">
      <header className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Claude Code 源码教程</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          从 Harness Engineering 视角拆解 51 万行源码 · 17 课完整解析
        </p>
        <Link
          href="/s00"
          className="inline-block rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          开始学习 →
        </Link>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LAYERS.map((layer) => (
          <div
            key={layer.id}
            className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-700"
          >
            <h3 className="mb-3 font-semibold" style={{ color: layer.color }}>
              {layer.label}
            </h3>
            <ul className="space-y-1.5">
              {layer.lessons.map((id) => (
                <li key={id}>
                  <Link
                    href={`/${id}`}
                    className="block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    <span className="mr-1 font-mono text-xs opacity-50">{id}</span>
                    {LESSON_META[id]?.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
