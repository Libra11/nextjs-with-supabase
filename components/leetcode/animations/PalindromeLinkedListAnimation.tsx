"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, RotateCcw, StepForward, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LIST = [1, 2, 2, 1];
const MAX_LENGTH = 10;
const STEP_INTERVAL = 1600;

type Phase = "init" | "find-mid" | "reverse" | "compare" | "done";

interface ComparedPair {
  left: number;
  right: number;
  match: boolean;
}

interface StepState {
  index: number;
  phase: Phase;
  description: string;
  slow: number | null;
  fast: number | null;
  prev: number | null;
  curr: number | null;
  next: number | null;
  left: number | null;
  right: number | null;
  links: Array<number | null>;
  reversedNodes: number[];
  comparedPairs: ComparedPair[];
  palindromeSoFar: boolean;
}

interface AnimationData {
  values: number[];
  steps: StepState[];
}

const formatNodeLabel = (values: number[], index: number | null) => {
  if (index === null || index < 0 || index >= values.length) {
    return "null";
  }
  return `${values[index]} (索引 ${index})`;
};

const buildPalindromeSteps = (values: number[]): StepState[] => {
  const n = values.length;
  const steps: StepState[] = [];
  const links = values.map((_, idx) => (idx < n - 1 ? idx + 1 : null));
  const reversed = new Set<number>();
  const compared: ComparedPair[] = [];
  let palindrome = true;

  const pushStep = (
    phase: Phase,
    description: string,
    overrides?: Partial<StepState>
  ) => {
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      slow: null,
      fast: null,
      prev: null,
      curr: null,
      next: null,
      left: null,
      right: null,
      links: [...links],
      reversedNodes: Array.from(reversed),
      comparedPairs: [...compared],
      palindromeSoFar: palindrome,
      ...overrides,
    });
  };

  if (n === 0) {
    pushStep("init", "链表为空，默认判定为回文。");
    pushStep("done", "遍历结束，链表为空视为回文。");
    return steps;
  }

  let slow: number | null = 0;
  let fast: number | null = 0;

  pushStep(
    "init",
    `初始化：slow 与 fast 都指向头节点 ${formatNodeLabel(values, 0)}，准备寻找链表中点。`,
    { slow, fast }
  );

  while (true) {
    if (fast === null) break;
    const fastNext = links[fast];
    if (fastNext === null) break;
    const fastNextNext = links[fastNext];
    if (fastNextNext === null) break;

    const nextSlow = slow !== null ? links[slow] : null;
    const nextFast = fastNextNext;

    if (
      nextSlow === null ||
      nextFast === null
    ) {
      break;
    }

    slow = nextSlow;
    fast = nextFast;

    pushStep(
      "find-mid",
      `快指针向前移动两步到 ${formatNodeLabel(values, fast)}，慢指针移动一步到 ${formatNodeLabel(values, slow)}。`,
      { slow, fast }
    );
  }

  pushStep(
    "find-mid",
    `快指针无法再前进，慢指针停在中点 ${formatNodeLabel(values, slow)}。`,
    { slow, fast }
  );

  const secondHalfStart = slow !== null ? links[slow] : null;
  if (secondHalfStart === null) {
    pushStep("done", "链表仅有一个节点，天然是回文链表。", {
      slow,
      palindromeSoFar: true,
    });
    return steps;
  }

  pushStep(
    "reverse",
    `开始反转后半部分，首个要处理的节点是 ${formatNodeLabel(values, secondHalfStart)}。`,
    { slow, curr: secondHalfStart, prev: null, next: links[secondHalfStart] }
  );

  let prevIdx: number | null = null;
  let currIdx: number | null = secondHalfStart;

  while (currIdx !== null) {
    const nextIdx = links[currIdx];
    links[currIdx] = prevIdx;
    reversed.add(currIdx);

    const newPrev = currIdx;
    const newCurr = nextIdx;

    pushStep(
      "reverse",
      `将节点 ${formatNodeLabel(values, newPrev)} 的 next 指向 ${formatNodeLabel(values, prevIdx)}，反转片段的新头节点为 ${formatNodeLabel(values, newPrev)}。`,
      {
        slow,
        prev: newPrev,
        curr: newCurr,
        next: nextIdx,
      }
    );

    prevIdx = newPrev;
    currIdx = newCurr;
  }

  const secondHalfHead = prevIdx;
  if (slow !== null) {
    links[slow] = secondHalfHead;
  }

  pushStep(
    "reverse",
    `后半部分反转完成，新的半链头节点为 ${formatNodeLabel(values, secondHalfHead)}，并连接在中点之后。`,
    {
      slow,
      prev: secondHalfHead,
      curr: null,
      next: null,
    }
  );

  let left: number | null = 0;
  let right: number | null = secondHalfHead;

  while (right !== null && left !== null) {
    const match = values[left] === values[right];
    compared.push({ left, right, match });

    pushStep(
      "compare",
      `比较节点 ${formatNodeLabel(values, left)} 与 ${formatNodeLabel(values, right)}，${
        match ? "数值相同，继续移动两个指针。" : "数值不同，提前判定为非回文。"
      }`,
      {
        slow,
        left,
        right,
        palindromeSoFar: palindrome && match,
      }
    );

    if (!match) {
      palindrome = false;
      break;
    }

    left = links[left] ?? null;
    right = links[right] ?? null;
  }

  pushStep(
    "done",
    palindrome
      ? "所有对应节点均相同，链表是回文。"
      : "发现不匹配节点，链表不是回文。",
    {
      slow,
      palindromeSoFar: palindrome,
    }
  );

  return steps;
};

const buildAnimationData = (values: number[]): AnimationData => {
  const sanitized = values.slice(0, MAX_LENGTH);
  return {
    values: sanitized,
    steps: buildPalindromeSteps(sanitized),
  };
};

const parseValuesInput = (input: string): number[] => {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const segments = trimmed
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) return [];

  if (segments.length > MAX_LENGTH) {
    throw new Error(`节点数量不能超过 ${MAX_LENGTH} 个。`);
  }

  const values = segments.map((segment) => {
    const value = Number(segment);
    if (Number.isNaN(value)) {
      throw new Error(`检测到无效数字 "${segment}"，请重新输入。`);
    }
    return value;
  });

  return values;
};

export default function PalindromeLinkedListAnimation() {
  const [listInput, setListInput] = useState(DEFAULT_LIST.join(", "));
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(DEFAULT_LIST)
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { values, steps } = animationData;
  const currentStep = steps[stepIndex] ?? steps[steps.length - 1] ?? null;

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, STEP_INTERVAL);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, steps.length]);

  const progress = useMemo(() => {
    if (!steps.length) return 0;
    if (steps.length === 1) return stepIndex >= steps.length - 1 ? 1 : 0;
    return stepIndex / (steps.length - 1);
  }, [stepIndex, steps.length]);

  const reversedSet = useMemo(() => {
    if (!currentStep) return new Set<number>();
    return new Set(currentStep.reversedNodes ?? []);
  }, [currentStep]);

  const matchedNodes = useMemo(() => {
    const set = new Set<number>();
    currentStep?.comparedPairs.forEach(({ left, right, match }) => {
      if (match) {
        set.add(left);
        set.add(right);
      }
    });
    return set;
  }, [currentStep]);

  const mismatchNodes = useMemo(() => {
    const set = new Set<number>();
    currentStep?.comparedPairs.forEach(({ left, right, match }) => {
      if (!match) {
        set.add(left);
        set.add(right);
      }
    });
    return set;
  }, [currentStep]);

  const palindromeResult = steps[steps.length - 1]?.palindromeSoFar ?? true;

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (stepIndex >= steps.length - 1) {
      setStepIndex(0);
    }
    setIsPlaying(true);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  const handleApplyInputs = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPlaying(false);

    try {
      const parsed = parseValuesInput(listInput);
      const data = buildAnimationData(parsed);
      setAnimationData(data);
      setStepIndex(0);
      setInputError(null);
      setListInput(parsed.join(", "));
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message);
      } else {
        setInputError("解析输入时出错，请检查格式。");
      }
    }
  };

  const handleRestoreDefaults = () => {
    const data = buildAnimationData(DEFAULT_LIST);
    setAnimationData(data);
    setListInput(DEFAULT_LIST.join(", "));
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
  };

  const displayedLogs = steps.slice(0, stepIndex + 1);

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">回文链表 - 快慢指针判定</h3>
        <p className="text-sm text-muted-foreground mt-1">
          使用快慢指针定位中点，演示后半部分反转与前后指针对比的详细过程。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
          <span>时间复杂度 O(n) · 空间复杂度 O(1)</span>
          {currentStep && (
            <span>
              步骤 {currentStep.index} / {steps.length}
            </span>
          )}
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

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6 flex-grow">
        <div className="bg-card/80 border border-border/60 rounded-xl p-5 flex flex-col">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-xs text-muted-foreground">
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                slow
              </p>
              <p>
                {currentStep ? formatNodeLabel(values, currentStep.slow) : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                fast
              </p>
              <p>
                {currentStep ? formatNodeLabel(values, currentStep.fast) : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                prev / curr
              </p>
              <p>
                {currentStep
                  ? `${formatNodeLabel(values, currentStep.prev)} / ${formatNodeLabel(values, currentStep.curr)}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                compare L / R
              </p>
              <p>
                {currentStep
                  ? `${formatNodeLabel(values, currentStep.left)} / ${formatNodeLabel(values, currentStep.right)}`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex-1">
            {values.length ? (
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex items-stretch gap-4 min-w-[320px]">
                  {values.map((value, idx) => {
                    const isSlow = currentStep?.slow === idx;
                    const isFast = currentStep?.fast === idx;
                    const isPrev = currentStep?.prev === idx;
                    const isCurr = currentStep?.curr === idx;
                    const isLeft = currentStep?.left === idx;
                    const isRight = currentStep?.right === idx;
                    const isReversed = reversedSet.has(idx);
                    const isMatched = matchedNodes.has(idx);
                    const isMismatch = mismatchNodes.has(idx);

                    const badges: string[] = [];
                    if (isSlow) badges.push("slow");
                    if (isFast) badges.push("fast");
                    if (isPrev) badges.push("prev");
                    if (isCurr) badges.push("curr");
                    if (isLeft) badges.push("left");
                    if (isRight) badges.push("right");

                    const nextIndex =
                      currentStep?.links?.[idx] ??
                      (idx < values.length - 1 ? idx + 1 : null);
                    const nextLabel =
                      nextIndex !== null &&
                      nextIndex >= 0 &&
                      nextIndex < values.length
                        ? `${values[nextIndex]}`
                        : "null";

                    const cardClass = cn(
                      "relative flex flex-col items-center justify-between w-28 h-44 rounded-2xl border-2 px-4 py-5 transition-all duration-300 shadow-sm",
                      isMismatch
                        ? "border-red-500 text-red-600 bg-red-500/10 shadow-red-500/20"
                        : isLeft || isRight
                          ? "border-primary text-primary bg-primary/10 shadow-primary/20"
                          : isCurr
                            ? "border-blue-500 text-blue-600 bg-blue-500/10"
                            : isPrev
                              ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
                              : isSlow
                                ? "border-violet-500 text-violet-600 bg-violet-500/10"
                                : isFast
                                  ? "border-sky-500 text-sky-600 bg-sky-500/10"
                                  : isMatched
                                    ? "border-emerald-400/70 text-emerald-600 bg-emerald-400/10"
                                    : isReversed
                                      ? "border-amber-500/70 text-amber-600 bg-amber-500/10"
                                      : "border-border/70 text-foreground bg-card/70"
                    );

                    return (
                      <motion.div
                        key={`${value}-${idx}`}
                        layout
                        className={cardClass}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            节点 {idx}
                          </span>
                          <span className="text-2xl font-semibold">
                            {value}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                          <span className="uppercase tracking-wide">next</span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full border text-[11px] font-medium",
                              nextLabel === "null"
                                ? "border-slate-300 text-slate-400"
                                : "border-primary/40 text-primary"
                            )}
                          >
                            {nextLabel}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-1 text-[11px] uppercase tracking-wide">
                          {badges.map((badge) => (
                            <span
                              key={badge}
                              className={cn(
                                "px-2 py-0.5 rounded-full border",
                                badge === "slow" &&
                                  "border-violet-500/50 text-violet-600 bg-violet-500/15",
                                badge === "fast" &&
                                  "border-sky-500/50 text-sky-600 bg-sky-500/15",
                                badge === "prev" &&
                                  "border-emerald-500/40 text-emerald-600 bg-emerald-500/15",
                                badge === "curr" &&
                                  "border-blue-500/40 text-blue-600 bg-blue-500/15",
                                (badge === "left" || badge === "right") &&
                                  "border-primary/40 text-primary bg-primary/15"
                              )}
                            >
                              {badge}
                            </span>
                          ))}
                          {isMatched && !isMismatch && !isLeft && !isRight && (
                            <span className="px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-600 bg-emerald-500/15">
                              match
                            </span>
                          )}
                          {isMismatch && (
                            <span className="px-2 py-0.5 rounded-full border border-red-500/40 text-red-600 bg-red-500/15">
                              mismatch
                            </span>
                          )}
                          {isReversed && !isMatched && !isMismatch && (
                            <span className="px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-600 bg-amber-500/15">
                              reversed
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                当前链表为空，请在右侧输入框中提供节点。
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePlayToggle}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    暂停
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    播放
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
                disabled={stepIndex >= steps.length - 1}
                className="flex items-center gap-2"
              >
                <StepForward className="w-4 h-4" />
                下一步
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              {currentStep
                ? currentStep.phase === "done"
                  ? palindromeResult
                    ? "判定完成：是回文链表"
                    : "判定完成：不是回文链表"
                  : currentStep.phase === "compare"
                    ? "对比两端节点"
                    : currentStep.phase === "reverse"
                      ? "反转后半部分"
                      : currentStep.phase === "find-mid"
                        ? "定位链表中点"
                        : "初始化状态"
                : "等待输入"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card/80 border border-border/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-muted-foreground">
                当前推理
              </p>
            </div>
            {currentStep ? (
              <p className="text-sm leading-relaxed text-foreground">
                {currentStep.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                输入链表后点击应用即可开始演示。
              </p>
            )}
          </div>

          <div className="bg-card/80 border border-border/60 rounded-xl p-4 flex-1">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              步骤记录
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {displayedLogs.map((step) => (
                  <motion.div
                    key={step.index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="border border-border/60 bg-background/80 rounded-lg px-3 py-2 text-sm"
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      步骤 {step.index}
                    </p>
                    <p className="text-sm text-foreground">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-card/80 border border-border/60 rounded-xl p-4">
            <p className="text-sm font-semibold text-muted-foreground mb-3">
              自定义数据
            </p>
            <form onSubmit={handleApplyInputs} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  链表节点（逗号或空格分隔，最多 {MAX_LENGTH} 个）
                </label>
                <Textarea
                  value={listInput}
                  onChange={(event) => setListInput(event.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                  placeholder="例如：1, 2, 3, 2, 1"
                />
              </div>
              {inputError && (
                <p className="text-xs text-destructive">{inputError}</p>
              )}
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" className="flex-1">
                  应用数据
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRestoreDefaults}
                >
                  恢复默认
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
