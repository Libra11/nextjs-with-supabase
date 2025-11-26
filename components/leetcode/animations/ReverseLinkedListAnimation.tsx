"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, RotateCcw, StepForward, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LIST = [1, 2, 3, 4, 5];
const MAX_LENGTH = 8;
const STEP_INTERVAL = 1600;

type StepAction = "init" | "inspect" | "reverse" | "done";

interface StepState {
  index: number;
  action: StepAction;
  description: string;
  prev: number | null;
  curr: number | null;
  next: number | null;
  links: Array<number | null>;
  reversedNodes: number[];
}

interface AnimationData {
  values: number[];
  steps: StepState[];
}

const formatNodeLabel = (values: number[], index: number | null) => {
  if (index === null || index < 0 || index >= values.length) return "null";
  return `${values[index]} (索引 ${index})`;
};

const buildReverseSteps = (values: number[]): StepState[] => {
  const n = values.length;
  const steps: StepState[] = [];
  const initialLinks = values.map((_, idx) =>
    idx < n - 1 ? idx + 1 : null,
  );

  let links = [...initialLinks];
  let prev: number | null = null;
  let curr: number | null = n ? 0 : null;
  const reversed = new Set<number>();

  const pushStep = (
    action: StepAction,
    description: string,
    overrides?: Partial<StepState>,
  ) => {
    steps.push({
      index: steps.length + 1,
      action,
      description,
      prev,
      curr,
      next: curr !== null ? links[curr] : null,
      links: [...links],
      reversedNodes: Array.from(reversed),
      ...overrides,
    });
  };

  if (n === 0) {
    steps.push({
      index: 1,
      action: "init",
      description: "链表为空，直接返回 null。",
      prev: null,
      curr: null,
      next: null,
      links: [],
      reversedNodes: [],
    });
    steps.push({
      index: 2,
      action: "done",
      description: "遍历完成，结果仍为 null。",
      prev: null,
      curr: null,
      next: null,
      links: [],
      reversedNodes: [],
    });
    return steps;
  }

  pushStep(
    "init",
    `初始化：prev = null，curr 指向头节点 ${formatNodeLabel(values, curr)}。`,
  );

  while (curr !== null) {
    const nextIndex = links[curr];

    pushStep(
      "inspect",
      `准备处理节点 ${formatNodeLabel(values, curr)}，记录 next = ${formatNodeLabel(values, nextIndex)}。`,
      {
        next: nextIndex,
      },
    );

    const updatedLinks = [...links];
    updatedLinks[curr] = prev;
    links = updatedLinks;
    reversed.add(curr);

    const prevBeforeUpdate = prev;
    prev = curr;
    curr = nextIndex;

    pushStep(
      "reverse",
      `反转指针：节点 ${formatNodeLabel(values, prev)} 现在指向 ${formatNodeLabel(values, prevBeforeUpdate)}。` +
        ` prev 前移到 ${formatNodeLabel(values, prev)}，curr 移动到 ${formatNodeLabel(values, curr)}。`,
      {
        prev,
        curr,
        next: curr !== null ? links[curr] : null,
        links: [...links],
        reversedNodes: Array.from(reversed),
      },
    );
  }

  pushStep(
    "done",
    `遍历完成，新头节点为 ${formatNodeLabel(values, prev)}。`,
    {
      prev,
      curr: null,
      next: null,
    },
  );

  return steps;
};

const buildAnimationData = (values: number[]): AnimationData => {
  const sanitized = values.slice(0, MAX_LENGTH);
  return {
    values: sanitized,
    steps: buildReverseSteps(sanitized),
  };
};

const parseValuesInput = (input: string): number[] => {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  const segments = trimmed
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return [];
  }

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

export default function ReverseLinkedListAnimation() {
  const [listInput, setListInput] = useState(DEFAULT_LIST.join(", "));
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(DEFAULT_LIST),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { values, steps } = animationData;
  const currentStep =
    steps[stepIndex] ?? steps[steps.length - 1] ?? ({} as StepState);

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

  const reversedSet = useMemo(
    () => new Set(currentStep.reversedNodes ?? []),
    [currentStep.reversedNodes],
  );

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
        <h3 className="text-xl font-bold">反转链表 - 双指针演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          通过 prev 与 curr 的移动展示链表指针如何倒转，并实时观察 next 断开再拼接的过程。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
          <span>时间复杂度 O(n) · 空间复杂度 O(1)</span>
          {currentStep?.index && (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-xs text-muted-foreground">
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                prev
              </p>
              <p>
                {currentStep
                  ? formatNodeLabel(values, currentStep.prev)
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                curr
              </p>
              <p>
                {currentStep
                  ? formatNodeLabel(values, currentStep.curr)
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                next
              </p>
              <p>
                {currentStep
                  ? formatNodeLabel(values, currentStep.next)
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex-1">
            {values.length ? (
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex items-stretch gap-4 min-w-[320px]">
                  {values.map((value, idx) => {
                    const isPrev = currentStep?.prev === idx;
                    const isCurr = currentStep?.curr === idx;
                    const isReversed = reversedSet.has(idx);
                    const nextIndex =
                      currentStep?.links?.[idx] ?? (idx < values.length - 1
                        ? idx + 1
                        : null);
                    const nextLabel =
                      nextIndex !== null && nextIndex >= 0 && nextIndex < values.length
                        ? `${values[nextIndex]}`
                        : "null";

                    return (
                      <motion.div
                        key={`${value}-${idx}`}
                        layout
                        className={cn(
                          "relative flex flex-col items-center justify-between w-28 h-40 rounded-2xl border-2 px-4 py-5 transition-all duration-300 shadow-sm",
                          isCurr
                            ? "border-primary text-primary bg-primary/10 shadow-primary/20"
                            : isPrev
                              ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
                              : isReversed
                                ? "border-amber-500/60 text-amber-600 bg-amber-500/10"
                                : "border-border/70 text-foreground bg-card/70",
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            节点 {idx}
                          </span>
                          <span className="text-2xl font-semibold">{value}</span>
                        </div>

                        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                          <span className="uppercase tracking-wide">next</span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full border text-[11px] font-medium",
                              nextLabel === "null"
                                ? "border-slate-300 text-slate-400"
                                : "border-primary/40 text-primary",
                            )}
                          >
                            {nextLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide">
                          {isPrev && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-600">
                              prev
                            </span>
                          )}
                          {isCurr && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/40 text-primary">
                              curr
                            </span>
                          )}
                          {!isCurr && currentStep?.next === idx && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-blue-500">
                              next
                            </span>
                          )}
                          {isReversed && !isPrev && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-600">
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
                ? currentStep.action === "done"
                  ? "反转完成"
                  : currentStep.action === "reverse"
                    ? "已反转当前指针"
                    : currentStep.action === "inspect"
                      ? "检查并保存 next"
                      : "初始化"
                : "等待输入"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card/80 border border-border/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCcw className="w-4 h-4 text-primary" />
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
                    <p className="text-sm text-foreground">{step.description}</p>
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
                  placeholder="例如：1, 2, 3, 4, 5"
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
