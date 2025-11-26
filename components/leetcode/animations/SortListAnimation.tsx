"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  StepForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LIST = [4, 2, 1, 3];
const MAX_LENGTH = 10;
const STEP_INTERVAL = 1600;

type StepPhase = "init" | "pass" | "merge" | "result" | "done" | "empty";
type RangeTuple = [number, number];

interface NodeState {
  id: number;
  value: number;
}

interface StepState {
  index: number;
  phase: StepPhase;
  description: string;
  size: number;
  pass: number;
  leftRange: RangeTuple | null;
  rightRange: RangeTuple | null;
  mergedRange: RangeTuple | null;
  order: NodeState[];
}

interface AnimationData {
  values: number[];
  steps: StepState[];
}

const phaseLabels: Record<StepPhase, string> = {
  init: "初始化",
  pass: "新一轮归并",
  merge: "当前合并",
  result: "合并完成",
  done: "排序完成",
  empty: "空链表",
};

const phaseHints: Record<StepPhase, string> = {
  init: "准备构建自底向上的归并框架",
  pass: "遍历整表并按固定长度切分",
  merge: "比较左右两段并写入结果",
  result: "区间已排序，等待下一段",
  done: "所有节点均已排好序",
  empty: "无需排序，直接返回 null",
};

const snapshotOrder = (order: NodeState[]) => order.map((node) => ({ ...node }));

const formatSegment = (
  segment: NodeState[],
  startIndex: number,
): string => {
  if (!segment.length) return "—";
  const valuesText = segment.map((node) => node.value).join(", ");
  const endIndex = startIndex + segment.length - 1;
  return `[${startIndex}, ${endIndex}] -> ${valuesText}`;
};

const buildSortSteps = (values: number[]): StepState[] => {
  const nodes: NodeState[] = values.map((value, idx) => ({ id: idx, value }));
  const steps: StepState[] = [];
  const n = nodes.length;
  let order = [...nodes];
  let contextSize = n ? 1 : 0;
  let contextPass = 0;

  const pushStep = (
    phase: StepPhase,
    description: string,
    overrides?: Partial<StepState>,
  ) => {
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      size: overrides?.size ?? contextSize,
      pass: overrides?.pass ?? contextPass,
      leftRange: overrides?.leftRange ?? null,
      rightRange: overrides?.rightRange ?? null,
      mergedRange: overrides?.mergedRange ?? null,
      order: overrides?.order ?? snapshotOrder(order),
    });
  };

  if (!n) {
    pushStep("empty", "链表为空，直接返回空列表。", {
      size: 0,
      pass: 0,
      order: [],
    });
    pushStep("done", "没有任何节点需要排序。", {
      size: 0,
      pass: 0,
      order: [],
    });
    return steps;
  }

  pushStep(
    "init",
    `链表长度为 ${n}，使用自底向上的归并排序。`,
    {
      size: 1,
      pass: 0,
    },
  );

  const mergeSegment = (start: number, mid: number, end: number) => {
    const left = order.slice(start, mid);
    const right = order.slice(mid, end);
    const merged: NodeState[] = [];
    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
      if (left[i].value <= right[j].value) {
        merged.push(left[i]);
        i += 1;
      } else {
        merged.push(right[j]);
        j += 1;
      }
    }

    while (i < left.length) {
      merged.push(left[i]);
      i += 1;
    }

    while (j < right.length) {
      merged.push(right[j]);
      j += 1;
    }

    for (let k = 0; k < merged.length; k += 1) {
      order[start + k] = merged[k];
    }

    return merged;
  };

  let pass = 1;

  for (let size = 1; size < n; size *= 2) {
    contextSize = size;
    contextPass = pass;
    pushStep(
      "pass",
      `第 ${pass} 轮：当前子链表长度为 ${size}，遍历整表进行合并。`,
      {
        size,
        pass,
      },
    );

    for (let start = 0; start < n; start += size * 2) {
      const mid = Math.min(start + size, n);
      const end = Math.min(start + size * 2, n);
      const leftLen = mid - start;
      const rightLen = end - mid;

      const leftLabel = formatSegment(order.slice(start, mid), start);
      const rightLabel = formatSegment(order.slice(mid, end), mid);

      contextSize = size;
      contextPass = pass;

      pushStep(
        "merge",
        rightLen
          ? `合并左段 ${leftLabel} 与右段 ${rightLabel}。`
          : `仅剩左段 ${leftLabel}，右侧长度不足 ${size}，直接保留。`,
        {
          size,
          pass,
          leftRange: leftLen ? [start, mid - 1] : null,
          rightRange: rightLen ? [mid, end - 1] : null,
        },
      );

      const merged = mergeSegment(start, mid, end);
      const mergedValues = merged.map((node) => node.value).join(", ");
      const mergedRange: RangeTuple | null = end > start ? [start, end - 1] : null;

      pushStep(
        "result",
        rightLen
          ? `区间 [${start}, ${end - 1}] 排序结果：${mergedValues}。`
          : `区间 [${start}, ${end - 1}] 保持为：${mergedValues}。`,
        {
          size,
          pass,
          mergedRange,
        },
      );
    }

    pass += 1;
  }

  pushStep(
    "done",
    `排序完成，链表最终顺序：${order.map((node) => node.value).join(", ") || "—"}。`,
    {
      size: Math.min(1 << (pass - 1), n),
      pass: pass - 1,
    },
  );

  return steps;
};

const buildAnimationData = (values: number[]): AnimationData => {
  const sanitized = values.slice(0, MAX_LENGTH);
  return {
    values: sanitized,
    steps: buildSortSteps(sanitized),
  };
};

const parseListInput = (input: string): number[] => {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  const segments = trimmed
    .split(/[\s,，、]+/)
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

export default function SortListAnimation() {
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
    if (steps.length === 1) {
      return stepIndex >= steps.length - 1 ? 1 : 0;
    }
    return stepIndex / (steps.length - 1);
  }, [stepIndex, steps.length]);

  const nodeOrder = currentStep?.order ?? [];

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
      const parsed = parseListInput(listInput);
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
  const phaseLabel = currentStep ? phaseLabels[currentStep.phase] : "";
  const phaseHint = currentStep ? phaseHints[currentStep.phase] : "等待输入";

  const isInRange = (range: RangeTuple | null, index: number) => {
    if (!range) return false;
    return index >= range[0] && index <= range[1];
  };

  const getNodeStatus = (index: number) => {
    if (isInRange(currentStep?.mergedRange ?? null, index)) return "merged";
    if (isInRange(currentStep?.leftRange ?? null, index)) return "left";
    if (isInRange(currentStep?.rightRange ?? null, index)) return "right";
    return "default";
  };

  const statusStyles: Record<string, string> = {
    left:
      "border-sky-500/70 text-sky-600 bg-sky-500/10 shadow-sky-500/20",
    right:
      "border-amber-500/70 text-amber-600 bg-amber-500/10 shadow-amber-500/20",
    merged:
      "border-primary text-primary bg-primary/10 shadow-primary/30",
    default: "border-border/70 text-foreground bg-card/70",
  };

  const badgeStyles: Record<string, string> = {
    left: "bg-sky-500/10 border border-sky-500/40 text-sky-600",
    right: "bg-amber-500/10 border border-amber-500/40 text-amber-600",
    merged: "bg-primary/10 border border-primary/40 text-primary",
    default: "",
  };

  return (
    <div className="w-full min-h-[560px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">排序链表 · 自底向上归并演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          显示每一轮子链表长度翻倍的过程，并用颜色区分左右段与合并结果。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
          <span>时间复杂度 O(n log n) · 空间复杂度 O(1)</span>
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
                当前阶段
              </p>
              <p className="text-sm font-semibold text-foreground">{phaseLabel}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{phaseHint}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                子链表长度
              </p>
              <p className="text-sm font-semibold text-foreground">
                {currentStep?.size ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                每轮翻倍：1 → 2 → 4 …
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                当前轮次
              </p>
              <p className="text-sm font-semibold text-foreground">
                第 {currentStep?.pass ?? 0} 轮
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                轮次越大，分段越长
              </p>
            </div>
          </div>

          <div className="flex-1">
            {nodeOrder.length ? (
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex items-stretch gap-4 min-w-[320px]">
                  {nodeOrder.map((node, idx) => {
                    const status = getNodeStatus(idx);
                    const badgeClass = badgeStyles[status] || "";
                    const borderClass = statusStyles[status] || statusStyles.default;

                    return (
                      <motion.div
                        key={`${node.id}-${idx}-${currentStep?.index ?? 0}`}
                        layout
                        className={cn(
                          "relative flex flex-col items-center justify-between w-28 h-40 rounded-2xl border-2 px-4 py-4 transition-all duration-300 shadow-sm",
                          borderClass,
                        )}
                      >
                        {status !== "default" && (
                          <span
                            className={cn(
                              "absolute top-2 right-2 px-2 py-0.5 text-[10px] uppercase tracking-wide rounded-full",
                              badgeClass,
                            )}
                          >
                            {status === "left"
                              ? "左段"
                              : status === "right"
                                ? "右段"
                                : "合并"}
                          </span>
                        )}

                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            位置 {idx}
                          </span>
                          <span className="text-3xl font-semibold text-foreground">
                            {node.value}
                          </span>
                        </div>

                        <div className="text-[11px] text-muted-foreground text-center">
                          原索引 {node.id}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm border border-dashed border-border/60 rounded-lg">
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
            <span className="text-xs text-muted-foreground">{phaseHint}</span>
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
                  placeholder="例如：4, 2, 1, 3"
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
