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

const DEFAULT_ARRAY = "1, 3, -1, -3, 5, 3, 6, 7";
const DEFAULT_K = "3";
const MAX_NUMBERS = 12;

type StepAction = "remove-outdated" | "remove-tail" | "push" | "record";

interface StepSnapshot {
  action: StepAction;
  index: number;
  value: number;
  windowStart: number;
  windowEnd: number;
  dequeSnapshot: number[];
  resultSnapshot: number[];
  removedIndex?: number;
  removedValue?: number;
  maxIndex?: number;
  maxValue?: number;
  description: string;
}

interface StepLog {
  step: number;
  action: StepAction;
  description: string;
}

const ACTION_LABELS: Record<StepAction, string> = {
  "remove-outdated": "移除过期",
  "remove-tail": "维护单调",
  push: "加入队列",
  record: "记录最大值",
};

const parseNumbers = (input: string): number[] => {
  if (!input.trim()) return [];
  return input
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(Number);
};

const buildSteps = (numbers: number[], k: number): StepSnapshot[] => {
  const steps: StepSnapshot[] = [];

  if (!numbers.length) {
    steps.push({
      action: "push",
      index: -1,
      value: 0,
      windowStart: 0,
      windowEnd: -1,
      dequeSnapshot: [],
      resultSnapshot: [],
      description: "数组为空，无法构建滑动窗口。",
    });
    return steps;
  }

  if (k <= 0) {
    steps.push({
      action: "push",
      index: -1,
      value: 0,
      windowStart: 0,
      windowEnd: -1,
      dequeSnapshot: [],
      resultSnapshot: [],
      description: "窗口大小 k 必须为正整数。",
    });
    return steps;
  }

  if (k > numbers.length) {
    steps.push({
      action: "push",
      index: -1,
      value: 0,
      windowStart: 0,
      windowEnd: numbers.length - 1,
      dequeSnapshot: [],
      resultSnapshot: [],
      description: "窗口大小大于数组长度，无法形成有效窗口。",
    });
    return steps;
  }

  const deque: number[] = [];
  const results: number[] = [];

  for (let i = 0; i < numbers.length; i++) {
    const value = numbers[i];
    const windowStart = Math.max(0, i - k + 1);
    const windowEnd = i;

    while (deque.length && deque[0] < i - k + 1) {
      const removedIdx = deque.shift()!;
      steps.push({
        action: "remove-outdated",
        index: i,
        value,
        windowStart,
        windowEnd,
        dequeSnapshot: [...deque],
        resultSnapshot: [...results],
        removedIndex: removedIdx,
        removedValue: numbers[removedIdx],
        description: `索引 ${removedIdx} 超出当前窗口范围 [${windowStart}, ${windowEnd}]，从队首移除。`,
      });
    }

    while (deque.length && numbers[deque[deque.length - 1]] <= value) {
      const removedIdx = deque.pop()!;
      steps.push({
        action: "remove-tail",
        index: i,
        value,
        windowStart,
        windowEnd,
        dequeSnapshot: [...deque],
        resultSnapshot: [...results],
        removedIndex: removedIdx,
        removedValue: numbers[removedIdx],
        description: `当前值 ${value} 大于或等于队尾索引 ${removedIdx} 的值 ${numbers[removedIdx]}，将其移除以保持队列递减。`,
      });
    }

    deque.push(i);
    steps.push({
      action: "push",
      index: i,
      value,
      windowStart,
      windowEnd,
      dequeSnapshot: [...deque],
      resultSnapshot: [...results],
      description: `将索引 ${i} (值 ${value}) 加入队尾，队列保持递减。`,
    });

    if (i >= k - 1) {
      const maxIdx = deque[0];
      const maxValue = numbers[maxIdx];
      results.push(maxValue);
      steps.push({
        action: "record",
        index: i,
        value,
        windowStart,
        windowEnd,
        dequeSnapshot: [...deque],
        resultSnapshot: [...results],
        maxIndex: maxIdx,
        maxValue,
        description: `窗口 [${windowStart}, ${windowEnd}] 的最大值为 ${maxValue} (索引 ${maxIdx})，加入结果数组。`,
      });
    }
  }

  return steps;
};

export default function SlidingWindowMaxAnimation() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY);
  const [kInput, setKInput] = useState(DEFAULT_K);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [kValue, setKValue] = useState(0);
  const [steps, setSteps] = useState<StepSnapshot[]>([]);

  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [windowStart, setWindowStart] = useState(0);
  const [windowEnd, setWindowEnd] = useState(-1);
  const [dequeIndices, setDequeIndices] = useState<number[]>([]);
  const [results, setResults] = useState<number[]>([]);
  const [currentAction, setCurrentAction] = useState<StepAction | null>(null);
  const [removedIndex, setRemovedIndex] = useState<number | null>(null);
  const [highlightMaxIndex, setHighlightMaxIndex] = useState<number | null>(null);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [arrayError, setArrayError] = useState<string | null>(null);
  const [kError, setKError] = useState<string | null>(null);
  const processedStepRef = useRef(-1);

  const initializeState = useCallback(
    (values: number[], k: number, autoPlay = false) => {
      const limited = values.slice(0, MAX_NUMBERS);
      const generatedSteps = buildSteps(limited, k);

      setNumbers(limited);
      setKValue(k);
      setSteps(generatedSteps);
      setStepIndex(0);
      setIsPlaying(autoPlay && generatedSteps.length > 0);
      setCurrentIndex(null);
      setWindowStart(0);
      setWindowEnd(-1);
      setDequeIndices([]);
      setResults([]);
      setCurrentAction(null);
      setRemovedIndex(null);
      setHighlightMaxIndex(null);
      setLogs([]);
      processedStepRef.current = -1;
    },
    []
  );

  useEffect(() => {
    const defaultNumbers = parseNumbers(DEFAULT_ARRAY);
    const defaultK = Number(DEFAULT_K);
    initializeState(defaultNumbers, defaultK);
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
        setCurrentIndex(step.index);
        setWindowStart(step.windowStart);
        setWindowEnd(step.windowEnd);
        setDequeIndices(step.dequeSnapshot);
        setResults(step.resultSnapshot);
        setRemovedIndex(step.removedIndex ?? null);
        setHighlightMaxIndex(step.maxIndex ?? null);

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
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, steps.length, nextStep]);

  const handleApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedNumbers = parseNumbers(arrayInput);
    if (!parsedNumbers.length) {
      setArrayError("请输入至少一个数字，使用逗号或空格分隔。");
      return;
    }

    if (parsedNumbers.some((num) => Number.isNaN(num))) {
      setArrayError("存在无效数字，请检查输入。");
      return;
    }

    if (parsedNumbers.length > MAX_NUMBERS) {
      setArrayError(`为便于展示，请输入不超过 ${MAX_NUMBERS} 个数字。`);
      return;
    }

    setArrayError(null);

    const trimmedK = kInput.trim();
    if (!trimmedK) {
      setKError("请输入窗口大小 k。");
      return;
    }

    const parsedK = Number(trimmedK);
    if (Number.isNaN(parsedK)) {
      setKError("k 必须为有效数字。");
      return;
    }

    if (parsedK < 1) {
      setKError("k 需要大于等于 1。");
      return;
    }

    if (parsedK > parsedNumbers.length) {
      setKError("k 不能大于数组长度。");
      return;
    }

    setKError(null);
    initializeState(parsedNumbers, parsedK);
  };

  const handleReset = () => {
    initializeState(numbers, kValue);
  };

  const togglePlay = () => {
    if (!steps.length) return;
    if (stepIndex >= steps.length) {
      initializeState(numbers, kValue, true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const progress = useMemo(() => {
    if (!steps.length) return 0;
    return Math.min(stepIndex / steps.length, 1);
  }, [stepIndex, steps]);

  const isComplete = stepIndex >= steps.length && steps.length > 0;

  const windowFormed = windowEnd - windowStart + 1 >= kValue && kValue > 0;

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/70 to-muted/20 p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">滑动窗口最大值 - 单调队列演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          使用单调递减队列维护窗口最大值，每个元素最多进出队列一次，实现 O(n) 求解。
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
                  value={arrayInput}
                  onChange={(event) => setArrayInput(event.target.value)}
                  placeholder="输入数组，例如: 1, 3, -1, -3, 5, 3, 6, 7"
                />
                {arrayError && (
                  <p className="text-xs text-destructive">{arrayError}</p>
                )}
              </div>
              <div className="w-full md:w-32 space-y-2">
                <Input
                  value={kInput}
                  onChange={(event) => setKInput(event.target.value)}
                  placeholder="窗口 k"
                />
                {kError && <p className="text-xs text-destructive">{kError}</p>}
              </div>
              <Button type="submit" variant="secondary">
                应用参数
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              当前示例：nums = [{numbers.join(", ")}], k = {kValue}
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
              {numbers.length ? (
                numbers.map((num, idx) => {
                  const inWindow =
                    windowEnd >= windowStart &&
                    idx >= windowStart &&
                    idx <= windowEnd;
                  const inDeque = dequeIndices.includes(idx);
                  const isFront = dequeIndices[0] === idx;
                  const isCurrent =
                    currentIndex === idx && currentAction !== "record";
                  const isRemoved =
                    removedIndex === idx &&
                    (currentAction === "remove-outdated" ||
                      currentAction === "remove-tail");
                  const isMax = highlightMaxIndex === idx && currentAction === "record";

                  const cellClasses = cn(
                    "w-20 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-lg font-semibold transition-all duration-200 relative",
                    isRemoved
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : inWindow
                      ? "border-primary/80 bg-primary/10 text-primary"
                      : "border-muted bg-muted/30 text-foreground",
                    inDeque ? "ring-2 ring-primary/40" : "",
                    isFront ? "ring-offset-2 ring-primary" : "",
                    isCurrent ? "shadow-lg shadow-primary/25" : "",
                    isMax ? "ring-2 ring-amber-500/80" : ""
                  );

                  return (
                    <div
                      key={`${idx}-${num}`}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="relative">
                        {idx === windowStart && windowEnd >= windowStart && (
                          <motion.span
                            layoutId="pointer-left-sw"
                            className="absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-2 text-xs font-semibold text-primary"
                          >
                            L
                          </motion.span>
                        )}
                        {idx === windowEnd && windowEnd >= windowStart && (
                          <motion.span
                            layoutId="pointer-right-sw"
                            className="absolute left-1/2 top-full -translate-x-1/2 translate-y-2 text-xs font-semibold text-primary"
                          >
                            R
                          </motion.span>
                        )}
                        {isRemoved && (
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-4 text-[10px] font-semibold text-destructive">
                            移除
                          </span>
                        )}
                        {isMax && (
                          <motion.span
                            layout
                            className="absolute left-1/2 top-full -translate-x-1/2 translate-y-7 text-[10px] font-semibold text-amber-500"
                          >
                            最大
                          </motion.span>
                        )}
                        <motion.div
                          className={cellClasses}
                          animate={{ y: isCurrent ? -10 : 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 18,
                          }}
                        >
                          <span>{num}</span>
                          <span className="text-[11px] text-muted-foreground">
                            索引 {idx}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground">
                  当前数组为空。
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
                  ? `"${numbers.slice(windowStart, windowEnd + 1).join(", ")}"`
                  : "窗口未形成"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                left = {windowEnd >= windowStart ? windowStart : "-"}, right ={" "}
                {windowEnd >= windowStart ? windowEnd : "-"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground/80">
                长度 {windowEnd >= windowStart ? windowEnd - windowStart + 1 : 0}{" "}
                {windowFormed ? "(窗口已满)" : ""}
              </div>
            </div>
            <div className="rounded-xl border bg-background/70 p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                结果数组
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {results.length ? (
                  results.map((value, idx) => (
                    <span
                      key={`${value}-${idx}`}
                      className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                    >
                      {value}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">尚无结果</span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-background/70 p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              单调队列状态 (索引 → 数值)
            </div>
            {dequeIndices.length ? (
              <div className="flex flex-wrap items-center gap-3">
                {dequeIndices.map((idx, order) => (
                  <motion.div
                    key={`${idx}-${order}`}
                    layout
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm flex items-center gap-2 transition-colors duration-200",
                      order === 0
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border/60 bg-background/60"
                    )}
                  >
                    <span className="font-semibold">#{idx}</span>
                    <span className="text-muted-foreground">值 {numbers[idx]}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">队列为空，等待元素加入。</p>
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
                点击播放或单步执行，观察队列如何维护窗口最大值。
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
