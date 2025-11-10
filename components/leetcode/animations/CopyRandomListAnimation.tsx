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

const MAX_NODES = 8;
const STEP_INTERVAL = 1700;

type StepPhase = "init" | "clone" | "link" | "done" | "empty";

interface RandomNodeSpec {
  value: number;
  random: number | null;
}

interface StepState {
  index: number;
  phase: StepPhase;
  description: string;
  pointer: number | null;
  clonePointer: number | null;
  clonesCreated: boolean[];
  clonesLinked: boolean[];
  cloneNextTargets: Array<number | null>;
  cloneRandomTargets: Array<number | null>;
}

interface AnimationData {
  nodes: RandomNodeSpec[];
  steps: StepState[];
}

const phaseLabels: Record<StepPhase, string> = {
  init: "初始化遍历",
  clone: "第一遍：建立映射",
  link: "第二遍：补齐指针",
  done: "收尾并返回",
  empty: "空链表特判",
};

const DEFAULT_NODES: RandomNodeSpec[] = [
  { value: 7, random: null },
  { value: 13, random: 0 },
  { value: 11, random: 4 },
  { value: 10, random: 2 },
  { value: 1, random: 0 },
];

const DEFAULT_INPUT = JSON.stringify(
  DEFAULT_NODES.map((node) => [node.value, node.random]),
);

const formatPointerLabel = (
  nodes: RandomNodeSpec[],
  index: number | null,
) => {
  if (index === null || index < 0 || index >= nodes.length) {
    return "null";
  }
  return `${nodes[index].value} (索引 ${index})`;
};

const buildAnimationData = (nodes: RandomNodeSpec[]): AnimationData => {
  const sanitized = nodes.slice(0, MAX_NODES).map((node) => ({ ...node }));
  return {
    nodes: sanitized,
    steps: buildCopySteps(sanitized),
  };
};

const buildCopySteps = (nodes: RandomNodeSpec[]): StepState[] => {
  const steps: StepState[] = [];
  const n = nodes.length;

  const clonesCreated = Array(n).fill(false) as boolean[];
  const clonesLinked = Array(n).fill(false) as boolean[];
  const cloneNextTargets = Array(n).fill(null) as Array<number | null>;
  const cloneRandomTargets = Array(n).fill(null) as Array<number | null>;

  const pushStep = (
    phase: StepPhase,
    description: string,
    overrides?: Partial<StepState>,
  ) => {
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      pointer: null,
      clonePointer: null,
      clonesCreated: [...clonesCreated],
      clonesLinked: [...clonesLinked],
      cloneNextTargets: [...cloneNextTargets],
      cloneRandomTargets: [...cloneRandomTargets],
      ...overrides,
    });
  };

  if (!n) {
    pushStep("empty", "链表为空，直接返回 null。", {
      pointer: null,
      clonePointer: null,
    });
    pushStep("done", "没有节点需要复制，结果仍为 null。", {
      pointer: null,
      clonePointer: null,
    });
    return steps;
  }

  pushStep(
    "init",
    `共 ${n} 个节点，准备执行两次遍历，并使用哈希表保存 “原节点 → 新节点” 的映射。`,
    {
      pointer: 0,
      clonePointer: 0,
    },
  );

  for (let i = 0; i < n; i += 1) {
    clonesCreated[i] = true;
    pushStep(
      "clone",
      `第一遍：创建节点 ${formatPointerLabel(nodes, i)} 的克隆，仅复制 val 并写入 map。`,
      {
        pointer: i,
        clonePointer: i,
      },
    );
  }

  pushStep(
    "clone",
    "第一遍完成，所有克隆节点已在映射中，准备根据 next / random 修复指针。",
  );

  for (let i = 0; i < n; i += 1) {
    const nextTarget = i + 1 < n ? i + 1 : null;
    const randomTarget = nodes[i].random;
    cloneNextTargets[i] = nextTarget;
    cloneRandomTargets[i] = randomTarget;
    clonesLinked[i] = true;

    pushStep(
      "link",
      `第二遍：克隆节点 ${formatPointerLabel(nodes, i)} 的 next 指向 ${formatPointerLabel(nodes, nextTarget)}，random 指向 ${formatPointerLabel(nodes, randomTarget)}。`,
      {
        pointer: i,
        clonePointer: i,
      },
    );
  }

  pushStep(
    "done",
    `全部节点均已连线，返回克隆头节点 ${formatPointerLabel(nodes, 0)}。`,
  );

  return steps;
};

const parseNodesInput = (input: string): RandomNodeSpec[] => {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error("请输入合法的 JSON 数组，例如 [[7,null],[13,0]]。");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("输入必须是 [[val, random_index], ...] 的二维数组。");
  }

  if (parsed.length > MAX_NODES) {
    throw new Error(`节点数量不能超过 ${MAX_NODES} 个。`);
  }

  const nodes = (parsed as unknown[]).map((entry, index) => {
    if (!Array.isArray(entry) || entry.length !== 2) {
      throw new Error(
        `第 ${index + 1} 个元素必须是形如 [val, random_index] 的数组。`,
      );
    }

    const [rawValue, rawRandom] = entry as [unknown, unknown];

    if (typeof rawValue !== "number" || Number.isNaN(rawValue)) {
      throw new Error(`第 ${index + 1} 个节点的 val 需要是数字。`);
    }

    if (rawRandom !== null && typeof rawRandom !== "number") {
      throw new Error(
        `第 ${index + 1} 个节点的 random 索引需要是整数或 null。`,
      );
    }

    if (typeof rawRandom === "number" && !Number.isInteger(rawRandom)) {
      throw new Error(`第 ${index + 1} 个节点的 random 索引必须是整数。`);
    }

    return {
      value: rawValue,
      random: rawRandom as number | null,
    };
  });

  nodes.forEach((node, idx) => {
    if (node.random === null) return;
    if (node.random < 0 || node.random >= nodes.length) {
      throw new Error(
        `第 ${idx + 1} 个节点的 random 索引 ${node.random} 越界（当前链表长度为 ${nodes.length}）。`,
      );
    }
  });

  return nodes;
};

export default function CopyRandomListAnimation() {
  const [listInput, setListInput] = useState<string>(DEFAULT_INPUT);
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(DEFAULT_NODES),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { nodes, steps } = animationData;
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

  const createdSet = useMemo(() => {
    const set = new Set<number>();
    currentStep?.clonesCreated?.forEach((created, idx) => {
      if (created) set.add(idx);
    });
    return set;
  }, [currentStep?.clonesCreated]);

  const linkedSet = useMemo(() => {
    const set = new Set<number>();
    currentStep?.clonesLinked?.forEach((linked, idx) => {
      if (linked) set.add(idx);
    });
    return set;
  }, [currentStep?.clonesLinked]);

  const activeCloneIndex = currentStep?.clonePointer ?? null;
  const activeNextTarget =
    activeCloneIndex !== null
      ? currentStep?.cloneNextTargets?.[activeCloneIndex] ?? null
      : null;
  const activeRandomTarget =
    activeCloneIndex !== null
      ? currentStep?.cloneRandomTargets?.[activeCloneIndex] ?? null
      : null;

  const createdCount = currentStep?.clonesCreated?.filter(Boolean).length ?? 0;
  const linkedCount = currentStep?.clonesLinked?.filter(Boolean).length ?? 0;

  const phaseLabel = currentStep ? phaseLabels[currentStep.phase] : "等待输入";

  const phaseHint = currentStep
    ? currentStep.phase === "link"
      ? "正在补全克隆链表的指针"
      : currentStep.phase === "clone"
        ? "遍历原链表并创建副本"
        : currentStep.phase === "done"
          ? "深拷贝完成"
          : currentStep.phase === "empty"
            ? "空链表直接返回 null"
            : "初始化哈希映射"
    : "等待输入";

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
      const parsed = parseNodesInput(listInput);
      const data = buildAnimationData(parsed);
      setAnimationData(data);
      setStepIndex(0);
      setInputError(null);
      setListInput(JSON.stringify(parsed.map((node) => [node.value, node.random])));
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message);
      } else {
        setInputError("解析输入时出错，请检查格式。");
      }
    }
  };

  const handleRestoreDefaults = () => {
    const data = buildAnimationData(DEFAULT_NODES);
    setAnimationData(data);
    setListInput(DEFAULT_INPUT);
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
  };

  const displayedLogs = steps.slice(0, stepIndex + 1);

  return (
    <div className="w-full min-h-[560px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">随机链表的复制 · 哈希映射演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          展示如何通过两次遍历 + Map 深拷贝包含 random 指针的链表。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
          <span>时间复杂度 O(n) · 空间复杂度 O(n)</span>
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
                阶段
              </p>
              <p className="text-sm font-semibold text-foreground">{phaseLabel}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {phaseHint}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                原链表指针
              </p>
              <p className="text-sm font-semibold text-foreground">
                {formatPointerLabel(nodes, currentStep?.pointer ?? null)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                random 来源：节点自身携带
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                克隆进度
              </p>
              <p className="text-sm font-semibold text-foreground">
                {formatPointerLabel(nodes, currentStep?.clonePointer ?? null)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                已创建 {createdCount}/{nodes.length || 0} · 已连线 {linkedCount}/{nodes.length || 0}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>原始链表</span>
                {nodes.length > 0 && <span>节点数 {nodes.length}</span>}
              </div>
              {nodes.length ? (
                <div className="w-full overflow-x-auto pb-2">
                  <div className="flex items-stretch gap-4 min-w-[320px]">
                    {nodes.map((node, idx) => {
                      const isPointer = currentStep?.pointer === idx;
                      const isRandomTarget = activeRandomTarget === idx;
                      const isNextTarget = activeNextTarget === idx;
                      const nextLabel = formatPointerLabel(
                        nodes,
                        idx + 1 < nodes.length ? idx + 1 : null,
                      );
                      const randomLabel = formatPointerLabel(
                        nodes,
                        node.random,
                      );

                      return (
                        <motion.div
                          key={`origin-${idx}`}
                          layout
                          className={cn(
                            "relative flex flex-col items-center justify-between w-32 h-44 rounded-2xl border-2 px-4 py-4 transition-all duration-300 shadow-sm",
                            isPointer
                              ? "border-primary text-primary bg-primary/10 shadow-primary/30"
                              : isRandomTarget
                                ? "border-fuchsia-500/60 text-fuchsia-600 bg-fuchsia-500/5"
                                : isNextTarget
                                  ? "border-sky-500/60 text-sky-600 bg-sky-500/5"
                                  : "border-border/70 text-foreground bg-card/70",
                          )}
                        >
                          <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end text-[10px] uppercase tracking-wide">
                            {isPointer && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/40 text-primary">
                                curr
                              </span>
                            )}
                            {!isPointer && isNextTarget && (
                              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/40 text-sky-600">
                                next 目标
                              </span>
                            )}
                            {!isPointer && isRandomTarget && (
                              <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/40 text-fuchsia-600">
                                random 目标
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              节点 {idx}
                            </span>
                            <span className="text-2xl font-semibold text-foreground">
                              {node.value}
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                            <span className="uppercase tracking-wide">next</span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full border text-[11px] leading-tight text-center",
                                nextLabel === "null"
                                  ? "border-border/70 text-muted-foreground"
                                  : "border-sky-500/40 text-sky-600",
                              )}
                            >
                              {nextLabel}
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                            <span className="uppercase tracking-wide">random</span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full border text-[11px] leading-tight text-center",
                                randomLabel === "null"
                                  ? "border-border/70 text-muted-foreground"
                                  : "border-fuchsia-500/40 text-fuchsia-600",
                              )}
                            >
                              {randomLabel}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  当前链表为空，请在右侧输入框中提供节点。
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>克隆链表</span>
                {nodes.length > 0 && <span>来自 map 的新节点</span>}
              </div>
              {nodes.length ? (
                <div className="w-full overflow-x-auto pb-2">
                  <div className="flex items-stretch gap-4 min-w-[320px]">
                    {nodes.map((node, idx) => {
                      const isClonePointer = currentStep?.clonePointer === idx;
                      const status = linkedSet.has(idx)
                        ? "linked"
                        : createdSet.has(idx)
                          ? "created"
                          : "pending";
                      const statusLabel =
                        status === "linked"
                          ? "已连线"
                          : status === "created"
                            ? "已创建"
                            : "待创建";
                      const nextLabel = formatPointerLabel(
                        nodes,
                        currentStep?.cloneNextTargets?.[idx] ?? null,
                      );
                      const randomLabel = formatPointerLabel(
                        nodes,
                        currentStep?.cloneRandomTargets?.[idx] ?? null,
                      );

                      return (
                        <motion.div
                          key={`clone-${idx}`}
                          layout
                          className={cn(
                            "relative flex flex-col items-center justify-between w-32 h-48 rounded-2xl border-2 px-4 py-4 transition-all duration-300 shadow-sm",
                            status === "linked"
                              ? "border-primary text-primary bg-primary/10 shadow-primary/30"
                              : status === "created"
                                ? "border-amber-500/70 text-amber-600 bg-amber-500/10"
                                : "border-dashed border-border/70 text-muted-foreground bg-card/40",
                            isClonePointer && "ring-2 ring-primary/40",
                          )}
                        >
                          <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end text-[10px] uppercase tracking-wide">
                            {isClonePointer && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/40 text-primary">
                                clone curr
                              </span>
                            )}
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full border",
                                status === "linked"
                                  ? "border-primary/50 bg-primary/10 text-primary"
                                  : status === "created"
                                    ? "border-amber-500/50 bg-amber-500/10 text-amber-600"
                                    : "border-border/60 text-muted-foreground",
                              )}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              克隆 {idx}
                            </span>
                            <span className="text-2xl font-semibold text-foreground">
                              {node.value}
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground w-full">
                            <span className="uppercase tracking-wide">next</span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full border text-[11px] leading-tight text-center w-full",
                                status === "pending"
                                  ? "border-border/60 text-muted-foreground"
                                  : nextLabel === "null"
                                    ? "border-border/60 text-muted-foreground"
                                    : "border-sky-500/40 text-sky-600",
                              )}
                            >
                              {status === "pending" ? "—" : nextLabel}
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground w-full">
                            <span className="uppercase tracking-wide">random</span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full border text-[11px] leading-tight text-center w-full",
                                status === "pending"
                                  ? "border-border/60 text-muted-foreground"
                                  : randomLabel === "null"
                                    ? "border-border/60 text-muted-foreground"
                                    : "border-fuchsia-500/40 text-fuchsia-600",
                              )}
                            >
                              {status === "pending" ? "—" : randomLabel}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  还没有克隆节点，等待输入后自动生成。
                </div>
              )}
            </div>
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
                  节点数组（JSON 格式，最多 {MAX_NODES} 个）
                </label>
                <Textarea
                  value={listInput}
                  onChange={(event) => setListInput(event.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                  placeholder="例如：[[7,null],[13,0],[11,4]]"
                />
                <p className="text-[11px] text-muted-foreground">
                  每个元素形如 [val, random_index]，random_index 可为 null。
                </p>
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
