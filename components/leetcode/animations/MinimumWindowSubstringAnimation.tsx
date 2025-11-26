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

const DEFAULT_SOURCE = "ADOBECODEBANC";
const DEFAULT_TARGET = "ABC";
const MAX_SOURCE_LENGTH = 22;
const MAX_TARGET_LENGTH = 10;

type StepAction = "expand" | "record" | "shrink" | "invalid" | "done";

interface CharCount {
  char: string;
  required: number;
  have: number;
  satisfied: boolean;
}

interface WindowResult {
  start: number;
  end: number;
  length: number;
  substring: string;
}

interface StepState {
  action: StepAction;
  focusIndex: number;
  windowStart: number;
  windowEnd: number;
  formed: number;
  required: number;
  counts: CharCount[];
  bestWindow: WindowResult | null;
  description: string;
  char?: string;
  improved?: boolean;
  candidate?: WindowResult;
  removed?: {
    index: number;
    char: string;
  };
}

interface StepLog {
  step: number;
  action: StepAction;
  description: string;
}

interface BuildResult {
  steps: StepState[];
  required: number;
  baseCounts: CharCount[];
}

const ACTION_LABELS: Record<StepAction, string> = {
  expand: "扩展窗口",
  record: "记录答案",
  shrink: "收缩窗口",
  invalid: "无效",
  done: "结束",
};

const LETTER_PATTERN = /^[A-Za-z]+$/;

const buildSteps = (source: string, target: string): BuildResult => {
  const uniqueChars: string[] = [];
  const need = new Map<string, number>();

  for (const char of target) {
    need.set(char, (need.get(char) ?? 0) + 1);
    if (!uniqueChars.includes(char)) {
      uniqueChars.push(char);
    }
  }

  const required = need.size;
  const baseCounts: CharCount[] = uniqueChars.map((char) => ({
    char,
    required: need.get(char) ?? 0,
    have: 0,
    satisfied: false,
  }));

  const steps: StepState[] = [];

  if (!source.length || !target.length) {
    steps.push({
      action: "invalid",
      focusIndex: -1,
      windowStart: 0,
      windowEnd: -1,
      formed: 0,
      required,
      counts: baseCounts,
      bestWindow: null,
      description: target.length
        ? "字符串 s 为空，无法查找子串。"
        : "字符串 t 为空，题目无意义。",
    });
    return { steps, required, baseCounts };
  }

  if (target.length > source.length) {
    steps.push({
      action: "invalid",
      focusIndex: -1,
      windowStart: 0,
      windowEnd: -1,
      formed: 0,
      required,
      counts: baseCounts,
      bestWindow: null,
      description: `t 的长度 ${target.length} 大于 s 的长度 ${source.length}，不存在符合条件的窗口。`,
    });
    return { steps, required, baseCounts };
  }

  const window = new Map<string, number>();
  let formed = 0;
  let left = 0;
  let best: WindowResult | null = null;

  const buildCountsSnapshot = (): CharCount[] =>
    uniqueChars.map((char) => {
      const requiredCount = need.get(char) ?? 0;
      const haveCount = window.get(char) ?? 0;
      return {
        char,
        required: requiredCount,
        have: haveCount,
        satisfied: requiredCount > 0 ? haveCount >= requiredCount : true,
      };
    });

  for (let right = 0; right < source.length; right++) {
    const char = source[right];
    const nextCount = (window.get(char) ?? 0) + 1;
    window.set(char, nextCount);

    if (need.has(char) && nextCount === need.get(char)) {
      formed += 1;
    }

    steps.push({
      action: "expand",
      focusIndex: right,
      windowStart: left,
      windowEnd: right,
      formed,
      required,
      counts: buildCountsSnapshot(),
      bestWindow: best,
      char,
      description: `右指针移动到索引 ${right}，加入字符 ${char}，窗口为 [${left}, ${right}]。`,
    });

    while (left <= right && formed === required) {
      const windowLength = right - left + 1;
      const previousBest = best;
      const improved = !best || windowLength < best.length;
      if (improved) {
        best = {
          start: left,
          end: right,
          length: windowLength,
          substring: source.slice(left, right + 1),
        };
      }

      steps.push({
        action: "record",
        focusIndex: right,
        windowStart: left,
        windowEnd: right,
        formed,
        required,
        counts: buildCountsSnapshot(),
        bestWindow: best,
        improved,
        candidate: {
          start: left,
          end: right,
          length: windowLength,
          substring: source.slice(left, right + 1),
        },
        description: improved
          ? `窗口 [${left}, ${right}] 满足条件并更新答案，长度 ${windowLength}。`
          : `窗口 [${left}, ${right}] 满足条件，但长度 ${windowLength} 不优于当前最优 ${
              previousBest?.length ?? windowLength
            }。`,
      });

      const leftChar = source[left];
      const updatedCount = (window.get(leftChar) ?? 0) - 1;
      if (updatedCount <= 0) {
        window.delete(leftChar);
      } else {
        window.set(leftChar, updatedCount);
      }

      const nextFormed =
        need.has(leftChar) && updatedCount < (need.get(leftChar) ?? 0)
          ? formed - 1
          : formed;

      steps.push({
        action: "shrink",
        focusIndex: left,
        windowStart: left + 1,
        windowEnd: right,
        formed: nextFormed,
        required,
        counts: buildCountsSnapshot(),
        bestWindow: best,
        removed: {
          index: left,
          char: leftChar,
        },
        description: `尝试收缩窗口，移除索引 ${left} 的字符 ${leftChar}，left → ${
          left + 1
        }。`,
      });

      formed = nextFormed;
      left += 1;
    }
  }

  const finalCounts = buildCountsSnapshot();

  if (!best) {
    steps.push({
      action: "invalid",
      focusIndex: -1,
      windowStart: 0,
      windowEnd: -1,
      formed,
      required,
      counts: finalCounts,
      bestWindow: null,
      description: `遍历结束，未找到覆盖 "${target}" 的子串。`,
    });
  } else {
    steps.push({
      action: "done",
      focusIndex: best.end,
      windowStart: best.start,
      windowEnd: best.end,
      formed,
      required,
      counts: finalCounts,
      bestWindow: best,
      description: `算法结束，最小窗口为 [${best.start}, ${best.end}]，子串 "${best.substring}" (长度 ${best.length})。`,
    });
  }

  return { steps, required, baseCounts };
};

export default function MinimumWindowSubstringAnimation() {
  const [sourceInput, setSourceInput] = useState(DEFAULT_SOURCE);
  const [targetInput, setTargetInput] = useState(DEFAULT_TARGET);
  const [activeSource, setActiveSource] = useState(DEFAULT_SOURCE);
  const [activeTarget, setActiveTarget] = useState(DEFAULT_TARGET);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [windowStart, setWindowStart] = useState(0);
  const [windowEnd, setWindowEnd] = useState(-1);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [removedIndex, setRemovedIndex] = useState<number | null>(null);
  const [currentAction, setCurrentAction] = useState<StepAction | null>(null);
  const [counts, setCounts] = useState<CharCount[]>([]);
  const [formed, setFormed] = useState(0);
  const [required, setRequired] = useState(0);
  const [bestWindow, setBestWindow] = useState<WindowResult | null>(null);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const processedStepRef = useRef(-1);

  const initializeState = useCallback(
    (source: string, target: string, autoplay = false) => {
      const { steps: computedSteps, required: requiredKinds, baseCounts } =
        buildSteps(source, target);

      setActiveSource(source);
      setActiveTarget(target);
      setSourceInput(source);
      setTargetInput(target);
      setSteps(computedSteps);
      setStepIndex(0);
      setIsPlaying(autoplay && computedSteps.length > 0);
      setWindowStart(0);
      setWindowEnd(-1);
      setFocusIndex(null);
      setRemovedIndex(null);
      setCurrentAction(null);
      setCounts(baseCounts);
      setFormed(0);
      setRequired(requiredKinds);
      setBestWindow(null);
      setLogs([]);
      processedStepRef.current = -1;
    },
    []
  );

  useEffect(() => {
    initializeState(DEFAULT_SOURCE, DEFAULT_TARGET);
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
        setWindowStart(step.windowStart);
        setWindowEnd(step.windowEnd);
        setFormed(step.formed);
        setRequired(step.required);
        setCounts(step.counts);
        setBestWindow(step.bestWindow);

        if (step.action === "shrink") {
          setFocusIndex(step.removed?.index ?? null);
          setRemovedIndex(step.removed?.index ?? null);
        } else if (step.action === "invalid") {
          setFocusIndex(null);
          setRemovedIndex(null);
        } else {
          setFocusIndex(step.focusIndex >= 0 ? step.focusIndex : null);
          setRemovedIndex(null);
        }

        setLogs((prevLogs) => {
          const nextLogs = [
            ...prevLogs,
            {
              step: prev + 1,
              action: step.action,
              description: step.description,
            },
          ];
          return nextLogs.slice(-18);
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

    const trimmedSource = sourceInput.trim();
    const trimmedTarget = targetInput.trim();

    if (!trimmedSource.length) {
      setSourceError("请输入字符串 s。");
      return;
    }
    if (!trimmedTarget.length) {
      setTargetError("请输入字符串 t。");
      return;
    }

    if (!LETTER_PATTERN.test(trimmedSource)) {
      setSourceError("为便于展示，仅支持英文字母。");
      return;
    }
    if (!LETTER_PATTERN.test(trimmedTarget)) {
      setTargetError("为便于展示，仅支持英文字母。");
      return;
    }

    if (trimmedSource.length > MAX_SOURCE_LENGTH) {
      setSourceError(`s 最长支持 ${MAX_SOURCE_LENGTH} 个字符。`);
      return;
    }
    if (trimmedTarget.length > MAX_TARGET_LENGTH) {
      setTargetError(`t 最长支持 ${MAX_TARGET_LENGTH} 个字符。`);
      return;
    }

    setSourceError(null);
    setTargetError(null);
    initializeState(trimmedSource, trimmedTarget);
  };

  const handleReset = () => {
    initializeState(activeSource, activeTarget);
  };

  const handleUseDefault = () => {
    initializeState(DEFAULT_SOURCE, DEFAULT_TARGET);
  };

  const togglePlay = () => {
    if (!steps.length) return;

    const isFinished = stepIndex >= steps.length;
    if (isFinished) {
      initializeState(activeSource, activeTarget, true);
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  const progress = useMemo(() => {
    if (!steps.length) return 0;
    return Math.min(stepIndex / steps.length, 1);
  }, [stepIndex, steps]);

  const currentSubstring =
    windowEnd >= windowStart && windowEnd >= 0
      ? activeSource.slice(windowStart, windowEnd + 1)
      : "";

  const isComplete = stepIndex >= steps.length && steps.length > 0;

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/60 to-muted/20 p-6">
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">自定义输入</h3>
            <form className="space-y-4" onSubmit={handleApply}>
              <div className="grid gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  字符串 s
                </label>
                <Input
                  value={sourceInput}
                  onChange={(event) => {
                    setSourceInput(event.target.value);
                    setSourceError(null);
                  }}
                  placeholder="示例：ADOBECODEBANC"
                />
                {sourceError && (
                  <p className="text-xs text-destructive">{sourceError}</p>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  字符串 t
                </label>
                <Input
                  value={targetInput}
                  onChange={(event) => {
                    setTargetInput(event.target.value);
                    setTargetError(null);
                  }}
                  placeholder="示例：ABC"
                />
                {targetError && (
                  <p className="text-xs text-destructive">{targetError}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="flex items-center gap-2">
                  应用参数
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseDefault}
                >
                  使用默认示例
                </Button>
              </div>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              当前示例：s = &quot;{activeSource}&quot;, t = &quot;{activeTarget}
              &quot;
            </p>
          </div>

          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  onClick={togglePlay}
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
                  type="button"
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  重置
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                步骤 {Math.min(stepIndex + 1, steps.length || 1)} /{" "}
                {steps.length || 1}
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden mb-6">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>

            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                  <span className="font-semibold text-primary">
                    形成条件
                  </span>
                  {formed} / {required || 0}
                </span>
                <AnimatePresence mode="wait">
                  {bestWindow ? (
                    <motion.span
                      key="best"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-1 text-sm"
                    >
                      最优窗口: [{bestWindow.start}, {bestWindow.end}] 长度{" "}
                      {bestWindow.length}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="no-best"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground text-sm"
                    >
                      暂无最优窗口
                    </motion.span>
                  )}
                </AnimatePresence>
                {currentAction && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
                    当前动作：{ACTION_LABELS[currentAction]}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                当前窗口：{windowStart <= windowEnd ? `[${windowStart}, ${windowEnd}]` : "未形成窗口"}
                {currentSubstring && (
                  <>
                    ，子串 &quot;
                    <span className="font-semibold text-foreground">
                      {currentSubstring}
                    </span>
                    &quot;
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background/80 p-6 shadow-sm">
          <div className="flex flex-wrap gap-3 justify-center">
            {activeSource.split("").map((char, index) => {
              const inWindow =
                windowEnd >= windowStart &&
                index >= windowStart &&
                index <= windowEnd;
              const isBest =
                bestWindow &&
                index >= bestWindow.start &&
                index <= bestWindow.end;
              const isFocus = focusIndex === index;
              const isRemoved = removedIndex === index;

              return (
                <motion.div
                  key={`${char}-${index}`}
                  layout
                  className={cn(
                    "relative flex h-20 w-14 flex-col items-center justify-center rounded-xl border-2 text-xl font-semibold transition-all duration-200",
                    inWindow
                      ? "border-primary/70 bg-primary/10"
                      : "border-muted bg-muted/40",
                    isBest && "ring-2 ring-amber-500",
                    isFocus && "scale-105 shadow-lg border-primary bg-primary/20",
                    isRemoved && "border-destructive text-destructive bg-destructive/10"
                  )}
                >
                  <span>{char}</span>
                  <span className="absolute -bottom-5 text-[10px] tracking-wide text-muted-foreground">
                    {index}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">目标字符统计</h4>
            {counts.length ? (
              <div className="grid gap-2">
                {counts.map((item) => (
                  <div
                    key={item.char}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                      item.satisfied
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                        : "border-muted bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-3 font-medium">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-background shadow-sm">
                        {item.char}
                      </span>
                      <span>需要 {item.required}</span>
                    </div>
                    <div className="text-sm font-semibold">
                      当前 {item.have}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {item.satisfied ? "已满足" : "未满足"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                字符串 t 中无需要跟踪的字符。
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">演算法日志</h4>
            <div className="h-56 overflow-auto rounded-lg bg-muted/20 p-3">
              {logs.length ? (
                <ul className="space-y-2 text-xs leading-relaxed">
                  {logs.map((log) => (
                    <li key={log.step} className="rounded-md bg-background/60 p-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">
                          步骤 {log.step}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {ACTION_LABELS[log.action]}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{log.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  暂无日志
                </div>
              )}
            </div>
            {bestWindow && (
              <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700">
                <div className="font-semibold mb-1">当前最优答案</div>
                <p>
                  子串 <span className="font-semibold">"{bestWindow.substring}"</span>{" "}
                  出现在区间 [{bestWindow.start}, {bestWindow.end}]，长度{" "}
                  {bestWindow.length}。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

