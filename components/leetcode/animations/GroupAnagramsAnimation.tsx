"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";

interface StepLog {
  step: number;
  word: string;
  key: string;
  action: "create" | "append";
  description: string;
}

const WORDS = ["eat", "tea", "tan", "ate", "nat", "bat"];

export default function GroupAnagramsAnimation() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [result, setResult] = useState<string[][]>([]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (step < WORDS.length) {
        nextStep();
      } else {
        setIsPlaying(false);
      }
    }, 1600);

    return () => clearTimeout(timer);
  }, [isPlaying, step]);

  const nextStep = () => {
    if (step >= WORDS.length) return;

    const word = WORDS[step];
    const key = word.split("").sort().join("");
    const action: StepLog["action"] = groups[key] ? "append" : "create";

    setCurrentIndex(step);
    setHighlightKey(key);

    let updatedGroups: Record<string, string[]> = {};
    setGroups((prev) => {
      updatedGroups = {
        ...prev,
        [key]: prev[key] ? [...prev[key], word] : [word],
      };
      return updatedGroups;
    });

    setLogs((prev) => [
      ...prev,
      {
        step: step + 1,
        word,
        key,
        action,
        description:
          action === "create"
            ? `首次遇到键 "${key}"，创建新分组并放入 "${word}"。`
            : `键 "${key}" 已存在，将 "${word}" 加入分组。`,
      },
    ]);

    setStep((prev) => prev + 1);
    setResult(Object.values(updatedGroups));

    if (step + 1 === WORDS.length) {
      setIsPlaying(false);
    }
  };

  const reset = () => {
    setStep(0);
    setIsPlaying(false);
    setCurrentIndex(-1);
    setHighlightKey(null);
    setGroups({});
    setLogs([]);
    setResult([]);
  };

  const togglePlay = () => {
    if (step >= WORDS.length) {
      reset();
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const progress = Math.min(step / WORDS.length, 1);
  const currentWord = currentIndex >= 0 ? WORDS[currentIndex] : null;
  const upcomingWord = step < WORDS.length ? WORDS[step] : null;
  const latestLog = logs[logs.length - 1] ?? null;

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">字母异位词分组 - 动画演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          使用哈希表记录排序后的键，将相同键的字符串聚合在一起。
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>进度</span>
          <span>
            {Math.min(step, WORDS.length)} / {WORDS.length}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Words Row */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {WORDS.map((word, idx) => (
          <motion.div
            key={word + idx}
            className={`min-w-[70px] h-16 rounded-lg border-2 flex flex-col items-center justify-center text-sm font-semibold uppercase tracking-wide ${
              currentIndex === idx
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border"
            }`}
            animate={{
              y: currentIndex === idx ? -8 : 0,
              scale: currentIndex === idx ? 1.05 : 1,
            }}
            transition={{ duration: 0.25 }}
          >
            {word}
            <span className="text-[10px] opacity-60 mt-1">索引 {idx}</span>
          </motion.div>
        ))}
      </div>

      {/* Hash Map Visualization */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">哈希表（排序后的字符串作为键）</p>
        <div className="bg-card border border-border rounded-lg p-4 min-h-[100px]">
          <AnimatePresence initial={false}>
            {Object.keys(groups).length === 0 ? (
              <motion.p
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                目前还没有任何键，等待字符串处理...
              </motion.p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(groups).map(([key, list]) => (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      highlightKey === key
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/40"
                    }`}
                  >
                    <p className="uppercase text-xs font-semibold tracking-widest text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      键: "{key}"
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {list.map((item, idx) => (
                        <span
                          key={`${key}-${item}-${idx}`}
                          className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Explanation Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">当前步骤</p>
          {currentWord ? (
            <>
              <p className="text-sm">
                正在处理字符串 <span className="font-semibold">{currentWord}</span>。
              </p>
              <p className="text-xs text-muted-foreground">
                排序后得到键{" "}
                <span className="font-semibold text-primary">{highlightKey}</span>
                ，用于在哈希表归类。
              </p>
            </>
          ) : step === 0 ? (
            <p className="text-sm text-muted-foreground">
              点击开始或单步按钮，观察如何通过哈希表分组异位词。
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              已处理完所有字符串，最终的分组已在下方展示。
            </p>
          )}
          {upcomingWord && (
            <p className="text-xs text-muted-foreground">
              下一步将处理：{upcomingWord}
            </p>
          )}
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">算法要点</p>
          <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
            <li>① 将字符串按字母排序，排序结果作为分组键。</li>
            <li>② 使用哈希表存储键与对应字符串列表。</li>
            <li>③ 遇到相同键时，将字符串追加到同一分组。</li>
            <li>④ 遍历结束后，哈希表的值即为所有分组。</li>
          </ul>
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">执行轨迹</p>
          <div className="flex-1 overflow-hidden">
            <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
              <AnimatePresence initial={false}>
                {logs.length === 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-muted-foreground"
                  >
                    每一步的处理结果会记录在这里，方便回顾。
                  </motion.p>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      key={log.step}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`rounded-md border px-2 py-1.5 text-xs ${
                        log.action === "create"
                          ? "border-sky-400/60 bg-sky-500/10 text-sky-700 dark:text-sky-200"
                          : "border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                      }`}
                    >
                      <p className="font-medium text-[11px] uppercase tracking-wide text-muted-foreground">
                        Step {log.step}
                      </p>
                      <p className="mt-0.5 leading-relaxed text-[11px] text-foreground">
                        {log.description}
                      </p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
          {latestLog && (
            <p className="text-[11px] text-muted-foreground">
              最近步骤：字符串 {latestLog.word} → 键 "{latestLog.key}"
            </p>
          )}
        </motion.div>
      </div>

      {/* Result */}
      {result.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/30 border border-secondary/60 rounded-lg p-4 mb-4"
        >
          <p className="text-sm font-semibold text-muted-foreground mb-2">
            最终分组（哈希表的 value）：
          </p>
          <div className="flex flex-wrap gap-2">
            {result.map((group, idx) => (
              <div
                key={`group-${idx}`}
                className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs flex items-center gap-2"
              >
                <span className="font-semibold text-muted-foreground">
                  组 {idx + 1}
                </span>
                <div className="flex flex-wrap gap-1">
                  {group.map((item, innerIdx) => (
                    <span
                      key={`${item}-${innerIdx}`}
                      className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button
          onClick={nextStep}
          size="sm"
          variant="secondary"
          disabled={isPlaying || step >= WORDS.length}
        >
          单步
        </Button>
        <Button onClick={togglePlay} size="sm">
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              暂停
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {step === 0 ? "开始" : "继续"}
            </>
          )}
        </Button>
        <Button onClick={reset} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          重置
        </Button>
      </div>
    </div>
  );
}
