/**
 * Author: Libra
 * Date: 2025-10-15 14:43:55
 * LastEditTime: 2025-10-15 15:22:06
 * LastEditors: Libra
 * Description:
 */
"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, StepForward } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_STRING = "abcabcbb";
const MAX_INPUT_LENGTH = 18;

type StepKind = "shrink" | "expand" | "update-max";

interface AnimationStep {
  kind: StepKind;
  focusIndex: number;
  windowStart: number;
  windowEnd: number;
  setSnapshot: string[];
  length: number;
  description: string;
  removed?: {
    char: string;
    index: number;
  };
  added?: {
    char: string;
  };
}

interface StepLog {
  step: number;
  kind: StepKind;
  description: string;
  focusIndex: number;
}

const KIND_LABELS: Record<StepKind, string> = {
  shrink: "收缩窗口",
  expand: "扩展窗口",
  "update-max": "更新答案",
};

const buildAnimationSteps = (input: string): AnimationStep[] => {
  const steps: AnimationStep[] = [];
  if (!input) return steps;

  let left = 0;
  const used = new Set<string>();
  let maxLen = 0;
  let maxStart = 0;
  let maxEnd = -1;

  for (let right = 0; right < input.length; right++) {
    const ch = input[right];

    if (used.has(ch)) {
      while (used.has(ch)) {
        const prevLeft = left;
        const removedChar = input[left];
        used.delete(removedChar);
        left += 1;

        steps.push({
          kind: "shrink",
          focusIndex: right,
          windowStart: left,
          windowEnd: right - 1,
          setSnapshot: Array.from(used),
          length: Math.max(0, right - left),
          description: `字符 ${ch} 已在窗口中，移除索引 ${prevLeft} 处的 ${removedChar}，left → ${left}。`,
          removed: {
            char: removedChar,
            index: prevLeft,
          },
        });
      }
    }

    used.add(ch);
    const windowStart = left;
    const windowEnd = right;
    const length = windowEnd - windowStart + 1;

    steps.push({
      kind: "expand",
      focusIndex: right,
      windowStart,
      windowEnd,
      setSnapshot: Array.from(used),
      length,
      description: `加入字符 ${ch} 后，窗口为 [${windowStart}, ${windowEnd}]，长度 ${length}。`,
      added: {
        char: ch,
      },
    });

    if (length > maxLen) {
      maxLen = length;
      maxStart = windowStart;
      maxEnd = windowEnd;

      steps.push({
        kind: "update-max",
        focusIndex: right,
        windowStart,
        windowEnd,
        setSnapshot: Array.from(used),
        length,
        description: `最长子串更新为 "${input.slice(maxStart, maxEnd + 1)}"，长度 ${length}。`,
      });
    }
  }

  return steps;
};

const formatChar = (char: string): string => {
  if (char === " ") return "␠";
  if (char === "\t") return "⇥";
  return char;
};

export default function LongestSubstringAnimation() {
  const [inputValue, setInputValue] = useState(DEFAULT_STRING);
  const [activeString, setActiveString] = useState(DEFAULT_STRING);
  const [chars, setChars] = useState<string[]>([]);
  const [steps, setSteps] = useState<AnimationStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [windowStart, setWindowStart] = useState(0);
  const [windowEnd, setWindowEnd] = useState(-1);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [removedIndex, setRemovedIndex] = useState<number | null>(null);
  const [currentSet, setCurrentSet] = useState<string[]>([]);
  const [maxWindow, setMaxWindow] = useState({ start: 0, end: -1, length: 0 });
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [inputError, setInputError] = useState<string | null>(null);
  const processedStepRef = useRef(-1);

  const initializeState = useCallback((value: string, autoPlay = false) => {
    const normalized = value.replace(/\r?\n/g, "");
    setActiveString(normalized);
    setChars(normalized.split(""));
    const nextSteps = buildAnimationSteps(normalized);
    setSteps(nextSteps);
    setStepIndex(0);
    setWindowStart(0);
    setWindowEnd(-1);
    setPendingIndex(null);
    setRemovedIndex(null);
    setCurrentSet([]);
    setMaxWindow({ start: 0, end: -1, length: 0 });
    setLogs([]);
    setIsPlaying(autoPlay && nextSteps.length > 0);
    setInputValue(normalized);
    processedStepRef.current = -1;
  }, []);

  useEffect(() => {
    initializeState(DEFAULT_STRING);
  }, [initializeState]);

  const nextStep = useCallback(() => {
    setStepIndex((prevIndex) => {
      if (prevIndex >= steps.length) {
        setIsPlaying(false);
        return prevIndex;
      }

      const alreadyProcessed = processedStepRef.current === prevIndex;
      const nextIndex = prevIndex + 1;

      if (!alreadyProcessed) {
        processedStepRef.current = prevIndex;
        const step = steps[prevIndex];
        setPendingIndex(step.focusIndex);
        setRemovedIndex(step.removed ? step.removed.index : null);
        setWindowStart(step.windowStart);
        setWindowEnd(step.windowEnd);
        setCurrentSet(step.setSnapshot);

        if (step.kind === "update-max") {
          setMaxWindow({
            start: step.windowStart,
            end: step.windowEnd,
            length: step.length,
          });
        }

        setLogs((prevLogs) => {
          const nextLogs = [
            ...prevLogs,
            {
              step: prevIndex + 1,
              kind: step.kind,
              description: step.description,
              focusIndex: step.focusIndex,
            },
          ];
          return nextLogs.slice(-14);
        });
      }

      if (nextIndex >= steps.length) {
        setIsPlaying(false);
      }

      return nextIndex;
    });
  }, [steps]);

  useEffect(() => {
    if (!isPlaying) return;
    if (stepIndex >= steps.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      nextStep();
    }, 1400);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, steps.length, nextStep]);

  const handleApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sanitized = inputValue.replace(/\r?\n/g, "");

    if (sanitized.length > MAX_INPUT_LENGTH) {
      setInputError(`请输入不超过 ${MAX_INPUT_LENGTH} 个字符。`);
      return;
    }

    setInputError(null);
    initializeState(sanitized);
  };

  const handleReset = () => {
    initializeState(activeString);
  };

  const togglePlay = () => {
    if (!steps.length) return;

    if (stepIndex >= steps.length) {
      initializeState(activeString, true);
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  const progress = useMemo(() => {
    if (!steps.length) return 0;
    return Math.min(stepIndex / steps.length, 1);
  }, [stepIndex, steps]);

  const currentWindowLength = useMemo(() => {
    if (windowEnd < windowStart) return 0;
    return windowEnd - windowStart + 1;
  }, [windowStart, windowEnd]);

  const currentWindowChars = useMemo(() => {
    if (!chars.length || windowEnd < windowStart) return "";
    return chars.slice(windowStart, windowEnd + 1).join("");
  }, [chars, windowStart, windowEnd]);

  const maxWindowChars = useMemo(() => {
    if (!chars.length || maxWindow.end < maxWindow.start) return "";
    return chars.slice(maxWindow.start, maxWindow.end + 1).join("");
  }, [chars, maxWindow]);

  const isComplete = stepIndex >= steps.length && steps.length > 0;

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/70 to-muted/20 p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">
          无重复字符的最长子串 - 滑动窗口演示
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          通过滑动窗口与哈希集合实时维护窗口内字符，保证每个字符只被访问两次，实现
          O(n) 求解。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
            <form
              onSubmit={handleApply}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="输入要演示的字符串，例如: pwwkew"
                maxLength={MAX_INPUT_LENGTH}
              />
              <Button type="submit" variant="secondary">
                应用字符串
              </Button>
            </form>
            {inputError ? (
              <p className="mt-2 text-xs text-destructive">{inputError}</p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                当前示例："{activeString || "空字符串"}"
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={togglePlay}
                  variant="default"
                  disabled={!steps.length}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      暂停
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      {isComplete ? "重新播放" : "播放"}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => nextStep()}
                  variant="outline"
                  disabled={isPlaying || !steps.length || isComplete}
                  className="flex items-center gap-2"
                >
                  <StepForward className="h-4 w-4" />
                  单步
                </Button>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  重置
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                步骤 {Math.min(stepIndex + 1, steps.length || 1)} /{" "}
                {steps.length || 1}
              </div>
            </div>

            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden mb-6">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              {chars.length ? (
                chars.map((char, idx) => {
                  const inWindow =
                    windowEnd >= windowStart &&
                    idx >= windowStart &&
                    idx <= windowEnd;
                  const inMaxWindow =
                    maxWindow.end >= maxWindow.start &&
                    idx >= maxWindow.start &&
                    idx <= maxWindow.end;
                  const isPending = pendingIndex === idx;
                  const isRemoved = removedIndex === idx;

                  const cellClasses = cn(
                    "w-14 h-20 rounded-xl border-2 flex items-center justify-center text-xl font-semibold transition-all duration-200 relative",
                    isRemoved
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : inWindow
                        ? "border-primary/80 bg-primary/10 text-primary"
                        : "border-muted bg-muted/30 text-foreground",
                    isPending && !isRemoved
                      ? "shadow-lg shadow-primary/25"
                      : "",
                    inMaxWindow ? "ring-2 ring-amber-500/70" : ""
                  );

                  return (
                    <div
                      key={`${idx}-${char}`}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="relative">
                        {idx === windowStart && chars.length > 0 && (
                          <motion.span
                            layoutId="pointer-left"
                            className="absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-2 text-xs font-semibold text-primary"
                          >
                            L
                          </motion.span>
                        )}
                        {pendingIndex === idx && (
                          <motion.span
                            layoutId="pointer-right"
                            className="absolute left-1/2 top-full -translate-x-1/2 translate-y-2 text-xs font-semibold text-primary"
                          >
                            R
                          </motion.span>
                        )}
                        {isRemoved && (
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-1 text-[10px] font-semibold text-destructive">
                            移除
                          </span>
                        )}
                        <motion.div
                          className={cellClasses}
                          animate={{ y: isPending && !isRemoved ? -10 : 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 18,
                          }}
                        >
                          {formatChar(char)}
                        </motion.div>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        索引 {idx}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground">
                  当前字符串为空，窗口中无字符。
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-background/70 p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                当前窗口
              </div>
              <div className="mt-2 text-lg font-semibold">
                {currentWindowChars ? `"${currentWindowChars}"` : "空窗口"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                left = {windowStart}, right ={" "}
                {windowEnd >= windowStart ? windowEnd : "无效"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground/80">
                长度 {currentWindowLength}
              </div>
            </div>
            <div className="rounded-xl border bg-background/70 p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                最长子串
              </div>
              <div className="mt-2 text-lg font-semibold">
                {maxWindow.length ? `"${maxWindowChars}"` : "暂未找到"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                left = {maxWindow.length ? maxWindow.start : "-"}, right ={" "}
                {maxWindow.length ? maxWindow.end : "-"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground/80">
                长度 {maxWindow.length}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-background/70 p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              窗口中的哈希集合
            </div>
            {currentSet.length ? (
              <div className="flex flex-wrap gap-2">
                {currentSet.map((item, idx) => (
                  <span
                    key={`${item}-${idx}`}
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {formatChar(item)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                集合为空，当前窗口内没有重复字符。
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold">执行日志</h4>
            <span className="text-xs text-muted-foreground">
              共 {steps.length} 步
            </span>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                点击播放或单步执行，查看滑动窗口的每一次移动。
              </p>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {[...logs].reverse().map((log) => (
                    <motion.li
                      key={log.step}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-lg border border-border/60 bg-background/60 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{KIND_LABELS[log.kind]}</span>
                        <span>步骤 {log.step}</span>
                      </div>
                      <p className="text-sm leading-snug text-foreground">
                        {log.description}
                      </p>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
