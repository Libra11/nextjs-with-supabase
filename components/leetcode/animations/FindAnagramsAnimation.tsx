/**
 * Author: Libra
 * Date: 2025-10-15 21:52:49
 * LastEditTime: 2025-10-15 22:05:24
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
import { Play, Pause, RotateCcw, StepForward, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_TEXT = "cbaebabacd";
const DEFAULT_PATTERN = "abc";
const MAX_TEXT_LENGTH = 18;
const MAX_PATTERN_LENGTH = 10;

type StepAction = "add" | "remove" | "check";

interface StepState {
  action: StepAction;
  focusIndex: number;
  windowStart: number;
  windowEnd: number;
  counts: number[];
  matchedStarts: number[];
  isMatch: boolean;
  description: string;
  char?: string;
}

interface StepLog {
  step: number;
  action: StepAction;
  description: string;
}

const ACTION_LABELS: Record<StepAction, string> = {
  add: "扩展窗口",
  remove: "收缩窗口",
  check: "验证窗口",
};

const INDEX_OF_A = "a".charCodeAt(0);

const toIndex = (char: string) => char.charCodeAt(0) - INDEX_OF_A;

const cloneCounts = (counts: number[]) => counts.slice();

const buildSteps = (
  text: string,
  pattern: string
): {
  steps: StepState[];
  patternCounts: number[];
} => {
  const steps: StepState[] = [];
  const patternCounts = new Array(26).fill(0);
  const windowCounts = new Array(26).fill(0);
  const matchedStarts: number[] = [];

  for (const char of pattern) {
    patternCounts[toIndex(char)] += 1;
  }

  if (!text.length || !pattern.length) {
    steps.push({
      action: "check",
      focusIndex: -1,
      windowStart: 0,
      windowEnd: -1,
      counts: cloneCounts(windowCounts),
      matchedStarts: [],
      isMatch: false,
      description: "输入字符串或模式为空，无法执行滑动窗口。",
    });
    return { steps, patternCounts };
  }

  if (pattern.length > text.length) {
    steps.push({
      action: "check",
      focusIndex: -1,
      windowStart: 0,
      windowEnd: -1,
      counts: cloneCounts(windowCounts),
      matchedStarts: [],
      isMatch: false,
      description: `模式长度 ${pattern.length} 大于文本长度 ${text.length}，无法得到任何窗口。`,
    });
    return { steps, patternCounts };
  }

  let windowStart = 0;
  let windowEnd = -1;

  const pushCheckStep = (start: number, end: number) => {
    let isMatch = true;
    for (let i = 0; i < 26; i++) {
      if (windowCounts[i] !== patternCounts[i]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      matchedStarts.push(start);
    }

    steps.push({
      action: "check",
      focusIndex: start,
      windowStart: start,
      windowEnd: end,
      counts: cloneCounts(windowCounts),
      matchedStarts: cloneCounts(matchedStarts),
      isMatch,
      description: isMatch
        ? `窗口 [${start}, ${end}] 子串 "${text.slice(start, end + 1)}" 与模式完全匹配，记录起点 ${start}。`
        : `窗口 [${start}, ${end}] 与模式频率不一致，继续滑动窗口。`,
    });
  };

  // 初始化窗口
  for (let right = 0; right < pattern.length; right++) {
    const char = text[right];
    const index = toIndex(char);
    windowCounts[index] += 1;
    windowEnd = right;

    steps.push({
      action: "add",
      focusIndex: right,
      windowStart,
      windowEnd,
      counts: cloneCounts(windowCounts),
      matchedStarts: cloneCounts(matchedStarts),
      isMatch: false,
      char,
      description: `扩展窗口，加入字符 ${char}（索引 ${right}），窗口为 [${windowStart}, ${windowEnd}]。`,
    });
  }

  pushCheckStep(windowStart, windowEnd);

  for (let right = pattern.length; right < text.length; right++) {
    const removeIndex = right - pattern.length;
    const removeChar = text[removeIndex];
    const removeCharIdx = toIndex(removeChar);
    windowCounts[removeCharIdx] -= 1;
    windowStart = removeIndex + 1;

    steps.push({
      action: "remove",
      focusIndex: removeIndex,
      windowStart,
      windowEnd,
      counts: cloneCounts(windowCounts),
      matchedStarts: cloneCounts(matchedStarts),
      isMatch: false,
      char: removeChar,
      description: `从窗口移除字符 ${removeChar}（索引 ${removeIndex}），窗口起点移动到 ${windowStart}。`,
    });

    const char = text[right];
    const idx = toIndex(char);
    windowCounts[idx] += 1;
    windowEnd = right;

    steps.push({
      action: "add",
      focusIndex: right,
      windowStart,
      windowEnd,
      counts: cloneCounts(windowCounts),
      matchedStarts: cloneCounts(matchedStarts),
      isMatch: false,
      char,
      description: `添加新字符 ${char}（索引 ${right}），当前窗口为 [${windowStart}, ${windowEnd}]。`,
    });

    pushCheckStep(windowStart, windowEnd);
  }

  return { steps, patternCounts };
};

const validateLowercase = (value: string) => /^[a-z]+$/.test(value);

export default function FindAnagramsAnimation() {
  const [textInput, setTextInput] = useState(DEFAULT_TEXT);
  const [patternInput, setPatternInput] = useState(DEFAULT_PATTERN);
  const [activeText, setActiveText] = useState(DEFAULT_TEXT);
  const [activePattern, setActivePattern] = useState(DEFAULT_PATTERN);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [patternCounts, setPatternCounts] = useState<number[]>(
    new Array(26).fill(0)
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [windowStart, setWindowStart] = useState(0);
  const [windowEnd, setWindowEnd] = useState(-1);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [removedIndex, setRemovedIndex] = useState<number | null>(null);
  const [currentCounts, setCurrentCounts] = useState<number[]>(
    new Array(26).fill(0)
  );
  const [matchedStarts, setMatchedStarts] = useState<number[]>([]);
  const [currentAction, setCurrentAction] = useState<StepAction | null>(null);
  const [currentIsMatch, setCurrentIsMatch] = useState(false);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [textError, setTextError] = useState<string | null>(null);
  const [patternError, setPatternError] = useState<string | null>(null);
  const processedStepRef = useRef(-1);

  const initializeState = useCallback(
    (text: string, pattern: string, autoPlay = false) => {
      const sanitizedText = text.trim();
      const sanitizedPattern = pattern.trim();
      const { steps: generatedSteps, patternCounts: patternFreq } = buildSteps(
        sanitizedText,
        sanitizedPattern
      );

      setActiveText(sanitizedText);
      setActivePattern(sanitizedPattern);
      setSteps(generatedSteps);
      setPatternCounts(patternFreq);
      setStepIndex(0);
      setIsPlaying(autoPlay && generatedSteps.length > 0);
      setWindowStart(0);
      setWindowEnd(
        sanitizedPattern.length &&
          sanitizedPattern.length <= sanitizedText.length
          ? sanitizedPattern.length - 1
          : -1
      );
      setFocusIndex(null);
      setRemovedIndex(null);
      setCurrentCounts(new Array(26).fill(0));
      setMatchedStarts([]);
      setCurrentAction(null);
      setCurrentIsMatch(false);
      setLogs([]);
      processedStepRef.current = -1;
    },
    []
  );

  useEffect(() => {
    initializeState(DEFAULT_TEXT, DEFAULT_PATTERN);
  }, [initializeState]);

  const nextStep = useCallback(() => {
    setStepIndex((prev) => {
      if (prev >= steps.length) {
        setIsPlaying(false);
        return prev;
      }

      const alreadyProcessed = processedStepRef.current === prev;
      const nextIdx = prev + 1;

      if (!alreadyProcessed) {
        processedStepRef.current = prev;
        const step = steps[prev];

        setCurrentAction(step.action);
        setCurrentIsMatch(step.isMatch);
        setWindowStart(step.windowStart);
        setWindowEnd(step.windowEnd);
        setFocusIndex(
          step.action === "check" ? step.windowEnd : step.focusIndex
        );
        setRemovedIndex(step.action === "remove" ? step.focusIndex : null);
        setCurrentCounts(step.counts);
        setMatchedStarts(step.matchedStarts);

        setLogs((prevLogs) => {
          const nextLogs = [
            ...prevLogs,
            {
              step: prev + 1,
              action: step.action,
              description: step.description,
            },
          ];
          return nextLogs.slice(-14);
        });
      }

      if (nextIdx >= steps.length) {
        setIsPlaying(false);
      }

      return nextIdx;
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

    const text = textInput.trim();
    const pattern = patternInput.trim();

    if (!text.length) {
      setTextError("请输入文本字符串 s。");
      return;
    }

    if (!pattern.length) {
      setPatternError("请输入模式字符串 p。");
      return;
    }

    if (!validateLowercase(text)) {
      setTextError("只支持小写字母 a-z。");
      return;
    }
    if (!validateLowercase(pattern)) {
      setPatternError("只支持小写字母 a-z。");
      return;
    }

    if (text.length > MAX_TEXT_LENGTH) {
      setTextError(`为便于展示，请输入不超过 ${MAX_TEXT_LENGTH} 个字符。`);
      return;
    }
    if (pattern.length > MAX_PATTERN_LENGTH) {
      setPatternError(`模式长度请不超过 ${MAX_PATTERN_LENGTH} 个字符。`);
      return;
    }

    setTextError(null);
    setPatternError(null);
    initializeState(text, pattern);
  };

  const handleReset = () => {
    initializeState(activeText, activePattern);
  };

  const togglePlay = () => {
    if (!steps.length) return;

    if (stepIndex >= steps.length) {
      initializeState(activeText, activePattern, true);
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  const progress = useMemo(() => {
    if (!steps.length) return 0;
    return Math.min(stepIndex / steps.length, 1);
  }, [stepIndex, steps]);

  const lettersForTable = useMemo(() => {
    const chars: string[] = [];
    for (let i = 0; i < 26; i++) {
      if (patternCounts[i] > 0 || currentCounts[i] > 0) {
        chars.push(String.fromCharCode(INDEX_OF_A + i));
      }
    }
    return chars;
  }, [patternCounts, currentCounts]);

  const isComplete = stepIndex >= steps.length && steps.length > 0;

  const patternLength = activePattern.length;

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/70 to-muted/20 p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">
          找到字符串中所有字母异位词 - 滑动窗口演示
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          使用固定长度的滑动窗口维护字符频率，逐步比较窗口与模式的计数是否完全一致。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
            <form
              onSubmit={handleApply}
              className="flex flex-col gap-3 md:flex-row md:items-center"
            >
              <div className="flex-1 space-y-2">
                <Input
                  value={textInput}
                  onChange={(event) => setTextInput(event.target.value)}
                  placeholder="文本字符串 s，例如: cbaebabacd"
                  maxLength={MAX_TEXT_LENGTH}
                />
                {textError && (
                  <p className="text-xs text-destructive">{textError}</p>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={patternInput}
                  onChange={(event) => setPatternInput(event.target.value)}
                  placeholder="模式字符串 p，例如: abc"
                  maxLength={MAX_PATTERN_LENGTH}
                />
                {patternError && (
                  <p className="text-xs text-destructive">{patternError}</p>
                )}
              </div>
              <Button type="submit" variant="secondary">
                应用参数
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              当前示例：s = "{activeText}", p = "{activePattern}"
            </p>
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
              {activeText.length ? (
                activeText.split("").map((char, idx) => {
                  const inWindow =
                    windowEnd >= windowStart &&
                    idx >= windowStart &&
                    idx <= windowEnd;
                  const isFocus =
                    focusIndex === idx && currentAction !== "check";
                  const isRemoved = removedIndex === idx;
                  const isMatchedWindow =
                    patternLength > 0 &&
                    matchedStarts.some(
                      (start) => idx >= start && idx < start + patternLength
                    );

                  const cellClasses = cn(
                    "w-14 h-20 rounded-xl border-2 flex items-center justify-center text-xl font-semibold transition-all duration-200 relative",
                    isRemoved
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : inWindow
                        ? "border-primary/80 bg-primary/10 text-primary"
                        : "border-muted bg-muted/30 text-foreground",
                    isFocus ? "shadow-lg shadow-primary/25" : "",
                    isMatchedWindow ? "ring-2 ring-amber-500/70" : ""
                  );

                  return (
                    <div
                      key={`${idx}-${char}`}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="relative">
                        {idx === windowStart && windowEnd >= windowStart && (
                          <motion.span
                            layoutId="pointer-left-anagram"
                            className="absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-2 text-xs font-semibold text-primary"
                          >
                            L
                          </motion.span>
                        )}
                        {idx === windowEnd && windowEnd >= windowStart && (
                          <motion.span
                            layoutId="pointer-right-anagram"
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
                        {currentAction === "check" &&
                          currentIsMatch &&
                          idx >= windowStart &&
                          idx <= windowEnd && (
                            <motion.span
                              layout
                              className="absolute left-1/2 top-full -translate-x-1/2 translate-y-7 text-[10px] font-semibold text-amber-500"
                            >
                              命中
                            </motion.span>
                          )}
                        <motion.div
                          className={cellClasses}
                          animate={{ y: isFocus && !isRemoved ? -10 : 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 18,
                          }}
                        >
                          {char}
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
                  输入文本为空。
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
                {windowEnd >= windowStart
                  ? `"${activeText.slice(windowStart, windowEnd + 1)}"`
                  : "空窗口"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                left = {windowEnd >= windowStart ? windowStart : "-"}, right ={" "}
                {windowEnd >= windowStart ? windowEnd : "-"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground/80">
                长度{" "}
                {windowEnd >= windowStart ? windowEnd - windowStart + 1 : 0}
              </div>
            </div>
            <div className="rounded-xl border bg-background/70 p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                匹配结果
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <ListChecks className="h-4 w-4" />
                {matchedStarts.length
                  ? `找到 ${matchedStarts.length} 个起点：${matchedStarts.join(", ")}`
                  : "尚未找到匹配窗口"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-background/70 p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              模式与窗口字符频率
            </div>
            {lettersForTable.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {lettersForTable.map((char) => {
                  const idx = toIndex(char);
                  const targetCount = patternCounts[idx];
                  const windowCount = currentCounts[idx];
                  const perfectMatch = targetCount === windowCount;

                  return (
                    <div
                      key={char}
                      className={cn(
                        "rounded-lg border p-3 text-sm transition-colors duration-200",
                        perfectMatch && targetCount + windowCount > 0
                          ? "border-amber-500/60 bg-amber-500/10 text-amber-600"
                          : "border-border/60 bg-background/60"
                      )}
                    >
                      <div className="text-base font-semibold mb-1 uppercase">
                        {char}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>模式</span>
                        <span>{targetCount}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>窗口</span>
                        <span>{windowCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                当前窗口为空，暂无字符频率。
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
                点击播放或单步执行，查看滑动窗口的每一次变化。
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
                        <span>{ACTION_LABELS[log.action]}</span>
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
