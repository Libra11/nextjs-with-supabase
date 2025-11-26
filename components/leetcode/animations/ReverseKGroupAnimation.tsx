"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, StepForward, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LIST = [1, 2, 3, 4, 5];
const DEFAULT_K = 2;
const MAX_LENGTH = 10;
const MAX_GROUP_SIZE = 10;
const STEP_INTERVAL = 1600;
const DUMMY_INDEX = -1;

type StepPhase =
  | "init"
  | "check-group"
  | "prepare"
  | "reverse"
  | "connect"
  | "advance"
  | "done";

interface StepState {
  index: number;
  phase: StepPhase;
  description: string;
  groupNumber: number;
  prev: number | null;
  groupHead: number | null;
  groupTail: number | null;
  current: number | null;
  nextGroupStart: number | null;
  processedInGroup: number;
  links: Array<number | null>;
  dummyNext: number | null;
  activeGroup: number[];
  completedGroups: number;
  reversedHead: number | null;
}

interface AnimationData {
  values: number[];
  k: number;
  steps: StepState[];
  resultValues: number[];
}

const formatNodeLabel = (values: number[], index: number | null) => {
  if (index === null) return "null";
  if (index === DUMMY_INDEX) return "虚拟头";
  if (index < 0 || index >= values.length) return "null";
  return `${values[index]} (索引 ${index})`;
};

const formatValueOnly = (values: number[], index: number | null) => {
  if (index === null || index < 0 || index >= values.length) return "null";
  return `${values[index]}`;
};

const formatNextLabel = (values: number[], index: number | null) => {
  if (index === null) return "null";
  if (index < 0 || index >= values.length) return "null";
  return `${values[index]}`;
};

const buildReverseKGroupSteps = (values: number[], k: number): StepState[] => {
  const length = values.length;
  const steps: StepState[] = [];
  const links = values.map((_, idx) => (idx < length - 1 ? idx + 1 : null));

  let dummyNext: number | null = length ? 0 : null;
  let prev: number | null = DUMMY_INDEX;
  let groupNumber = 1;
  let completedGroups = 0;

  let groupHead: number | null = dummyNext;
  let groupTail: number | null = null;
  let nextGroupStart: number | null = null;
  let processedInGroup = 0;
  let current: number | null = null;
  let activeGroup: number[] = [];
  let reversedHead: number | null = null;

  const pushStep = (
    phase: StepPhase,
    description: string,
    overrides: Partial<StepState> = {},
  ) => {
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      groupNumber,
      prev,
      groupHead,
      groupTail,
      current,
      nextGroupStart,
      processedInGroup,
      links: [...links],
      dummyNext,
      activeGroup: [...activeGroup],
      completedGroups,
      reversedHead,
      ...overrides,
    });
  };

  pushStep(
    "init",
    length
      ? `初始化：创建虚拟头节点，prev 指向虚拟头，dummyNext 指向 ${formatNodeLabel(values, dummyNext)}。`
      : "链表为空，直接返回 null。",
  );

  if (!length) {
    pushStep(
      "done",
      "无节点可处理，返回空链表。",
      {
        groupHead: null,
        activeGroup: [],
      },
    );
    return steps;
  }

  if (k <= 1) {
    pushStep(
      "done",
      "k = 1 时无需反转，保持原链表返回。",
      {
        activeGroup: [],
      },
    );
    return steps;
  }

  while (true) {
    groupHead =
      prev === DUMMY_INDEX
        ? dummyNext
        : prev !== null
          ? links[prev] ?? null
          : null;

    if (groupHead === null) {
      pushStep(
        "done",
        completedGroups
          ? `所有完整分组处理完成，共反转 ${completedGroups} 组。`
          : "没有足够的节点构成一组，链表保持不变。",
        {
          activeGroup: [],
          groupHead: null,
        },
      );
      break;
    }

    activeGroup = [];
    groupTail = null;
    nextGroupStart = null;
    processedInGroup = 0;
    current = null;
    reversedHead = null;

    let walker: number | null = groupHead;
    while (walker !== null && activeGroup.length < k) {
      activeGroup.push(walker);
      walker = links[walker] ?? null;
    }

    if (activeGroup.length === k) {
      groupTail = activeGroup[activeGroup.length - 1];
      nextGroupStart = links[groupTail] ?? null;
    } else {
      nextGroupStart = walker;
    }

    pushStep(
      "check-group",
      activeGroup.length === k
        ? `第 ${groupNumber} 组共有 ${k} 个节点，可以执行反转。`
        : `剩余 ${activeGroup.length} 个节点，不足 ${k}，停止反转。`,
    );

    if (activeGroup.length < k || groupTail === null) {
      pushStep(
        "done",
        `保留最后 ${activeGroup.length} 个节点的原始顺序。`,
        {
          groupTail: null,
          nextGroupStart: null,
          current: null,
        },
      );
      break;
    }

    pushStep(
      "prepare",
      `锁定组 [${activeGroup
        .map((idx) => formatValueOnly(values, idx))
        .join(" → ")}], 记录 next = ${formatNodeLabel(values, nextGroupStart)}。`,
      {
        current: groupHead,
      },
    );

    let prevWithin: number | null = nextGroupStart;
    current = groupHead;
    processedInGroup = 0;

    while (processedInGroup < k && current !== null) {
      const nextNode = links[current] ?? null;
      links[current] = prevWithin;
      prevWithin = current;
      current = nextNode;
      processedInGroup += 1;
      reversedHead = prevWithin;

      pushStep(
        "reverse",
        `第 ${processedInGroup} 个节点反转后，局部头变为 ${formatNodeLabel(values, reversedHead)}。`,
        {
          current,
          reversedHead,
          processedInGroup,
        },
      );
    }

    const newGroupHead = reversedHead;
    const newGroupTail = groupHead;

    if (prev === DUMMY_INDEX) {
      dummyNext = newGroupHead;
    } else if (prev !== null) {
      links[prev] = newGroupHead;
    }

    pushStep(
      "connect",
      `接回链表：prev (${formatNodeLabel(values, prev)}) 指向 ${formatNodeLabel(values, newGroupHead)}，组尾 ${formatNodeLabel(values, newGroupTail)} 指向 ${formatNodeLabel(values, nextGroupStart)}。`,
      {
        groupHead: newGroupHead ?? null,
        groupTail: newGroupTail,
        current: null,
        reversedHead: newGroupHead ?? null,
      },
    );

    prev = newGroupTail ?? null;
    completedGroups += 1;

    pushStep(
      "advance",
      nextGroupStart !== null
        ? `prev 移动到组尾，下一组将从 ${formatNodeLabel(values, nextGroupStart)} 开始。`
        : "后续节点不足一组，准备收尾。",
      {
        groupHead: nextGroupStart,
        groupTail: null,
        current: null,
        activeGroup: [],
        reversedHead: null,
      },
    );

    groupNumber += 1;
  }

  return steps;
};

const applyKGroupReverse = (values: number[], k: number): number[] => {
  const copy = values.slice();
  if (k <= 1) return copy;
  for (let start = 0; start + k <= copy.length; start += k) {
    const segment = copy.slice(start, start + k).reverse();
    for (let offset = 0; offset < k; offset++) {
      copy[start + offset] = segment[offset];
    }
  }
  return copy;
};

const buildAnimationData = (values: number[], requestedK: number): AnimationData => {
  const sanitized = values.slice(0, MAX_LENGTH);
  const normalizedK = Math.max(1, Math.min(requestedK, MAX_GROUP_SIZE));

  return {
    values: sanitized,
    k: normalizedK,
    steps: buildReverseKGroupSteps(sanitized, normalizedK),
    resultValues: applyKGroupReverse(sanitized, normalizedK),
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
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error(`检测到无效整数 "${segment}"，请重新输入。`);
    }
    return value;
  });

  return values;
};

const parseGroupSize = (input: string): number => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("请输入 k 的值。");
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error("k 必须是正整数。");
  }
  if (value <= 0) {
    throw new Error("k 需要大于等于 1。");
  }
  if (value > MAX_GROUP_SIZE) {
    throw new Error(`k 不可超过 ${MAX_GROUP_SIZE}。`);
  }

  return value;
};

type PointerType =
  | "prev"
  | "group-head"
  | "group-tail"
  | "current"
  | "reversed-head";

const pointerStyles: Record<PointerType, string> = {
  prev: "border-sky-500/60 bg-sky-500/10 text-sky-600",
  "group-head": "border-primary/60 bg-primary/10 text-primary",
  "group-tail": "border-amber-500/60 bg-amber-500/10 text-amber-600",
  current: "border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-600",
  "reversed-head": "border-emerald-500/60 bg-emerald-500/10 text-emerald-600",
};

const pointerLabels: Record<PointerType, string> = {
  prev: "prev",
  "group-head": "组头",
  "group-tail": "组尾",
  current: "curr",
  "reversed-head": "反转头",
};

const PointerBadge = ({ type }: { type: PointerType }) => (
  <span
    className={cn(
      "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
      pointerStyles[type],
    )}
  >
    {pointerLabels[type]}
  </span>
);

interface NodeCardProps {
  type: "dummy" | "node" | "null";
  value?: number | string;
  index?: number;
  pointers?: PointerType[];
  isActive?: boolean;
  isNextFocus?: boolean;
  nextLabel?: string;
}

const NodeCard = ({
  type,
  value,
  index,
  pointers = [],
  isActive = false,
  isNextFocus = false,
  nextLabel,
}: NodeCardProps) => (
  <motion.div
    layout
    className={cn(
      "relative flex min-h-[90px] min-w-[90px] flex-col items-center justify-center rounded-xl border px-6 py-5 text-center shadow-sm",
      type === "dummy"
        ? "border-muted-foreground/40 bg-muted/20 text-muted-foreground"
        : type === "null"
          ? "border-border bg-background/60 text-muted-foreground"
          : "border-border bg-background",
      isActive && type === "node"
        ? "ring-2 ring-primary/40 border-primary/70 bg-primary/5"
        : undefined,
      isNextFocus && type === "node"
        ? "border-dashed border-amber-400 bg-amber-50"
        : undefined,
    )}
  >
    {!!pointers.length && (
      <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2">
        {pointers.map((pointer) => (
          <PointerBadge key={pointer} type={pointer} />
        ))}
      </div>
    )}

    <div className="text-lg font-semibold">
      {type === "dummy" ? "虚拟头" : type === "null" ? "null" : value}
    </div>

    {type === "node" && typeof index === "number" && (
      <span className="mt-2 text-xs text-muted-foreground">索引 {index}</span>
    )}

    {type !== "null" && nextLabel !== undefined && (
      <div className="mt-3 flex flex-col items-center gap-1 text-xs text-muted-foreground">
        <span className="uppercase tracking-wide">next</span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
            nextLabel === "null"
              ? "border-slate-300 text-slate-400"
              : "border-primary/40 text-primary",
          )}
        >
          {nextLabel}
        </span>
      </div>
    )}
  </motion.div>
);

interface LinkedListVisualizationProps {
  values: number[];
  step: StepState;
}

const LinkedListVisualization = ({ values, step }: LinkedListVisualizationProps) => {
  const activeSet = useMemo(() => new Set(step.activeGroup ?? []), [step.activeGroup]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-muted-foreground">指针操作演示</div>
      <div className="flex flex-wrap items-center gap-3">
        <NodeCard
          type="dummy"
          pointers={step.prev === DUMMY_INDEX ? ["prev"] : []}
          nextLabel={formatNextLabel(values, step.dummyNext)}
        />

        {values.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted px-4 py-2 text-sm text-muted-foreground">
            空链表
          </div>
        ) : (
          values.map((value, index) => {
            const pointers: PointerType[] = [];
            if (step.prev === index) pointers.push("prev");
            if (step.groupHead === index) pointers.push("group-head");
            if (step.groupTail === index) pointers.push("group-tail");
            if (step.current === index) pointers.push("current");
            if (step.reversedHead === index) pointers.push("reversed-head");

            const nextIndex = step.links[index] ?? null;
            const nextLabel = formatNextLabel(values, nextIndex);

            return (
              <NodeCard
                key={`${value}-${index}`}
                type="node"
                value={value}
                index={index}
                pointers={pointers}
                isActive={activeSet.has(index)}
                isNextFocus={step.nextGroupStart === index}
                nextLabel={nextLabel}
              />
            );
          })
        )}

        <NodeCard type="null" />
      </div>
    </div>
  );
};

const InfoCard = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={cn(
      "rounded-lg border bg-background/80 px-4 py-3",
      highlight ? "border-primary/70 bg-primary/5" : "border-border",
    )}
  >
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold leading-tight">{value}</div>
  </div>
);

const phaseLabels: Record<StepPhase, string> = {
  init: "初始化",
  "check-group": "检查组",
  prepare: "锁定组",
  reverse: "反转中",
  connect: "接回",
  advance: "推进",
  done: "完成",
};

export default function ReverseKGroupAnimation() {
  const [listInput, setListInput] = useState(DEFAULT_LIST.join(", "));
  const [kInput, setKInput] = useState(String(DEFAULT_K));
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(DEFAULT_LIST, DEFAULT_K),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { values, k, steps, resultValues } = animationData;
  const currentStep =
    steps[stepIndex] ?? steps[steps.length - 1] ?? ({} as StepState);

  useEffect(() => {
    if (!isPlaying) return;
    if (!steps.length) {
      setIsPlaying(false);
      return;
    }

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
  }, [isPlaying, steps, stepIndex]);

  const displayedLogs = useMemo(
    () =>
      steps.slice(
        0,
        Math.min(stepIndex + 1, steps.length),
      ),
    [steps, stepIndex],
  );

  const progress = steps.length > 1 ? stepIndex / (steps.length - 1) : 1;

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

  const handleNextStep = () => {
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
      const parsedValues = parseListInput(listInput);
      const parsedK = parseGroupSize(kInput);
      const data = buildAnimationData(parsedValues, parsedK);
      setAnimationData(data);
      setStepIndex(0);
      setInputError(null);
      setListInput(parsedValues.join(", "));
      setKInput(String(parsedK));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "输入解析失败，请重试。";
      setInputError(message);
    }
  };

  const handleUseDefault = () => {
    const data = buildAnimationData(DEFAULT_LIST, DEFAULT_K);
    setAnimationData(data);
    setListInput(DEFAULT_LIST.join(", "));
    setKInput(String(DEFAULT_K));
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
  };

  const phaseLabel = currentStep.phase
    ? phaseLabels[currentStep.phase as StepPhase]
    : "未知";

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg bg-gradient-to-br from-background to-muted/30 p-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <h3 className="text-xl font-bold">K 个一组翻转链表</h3>
        <p className="text-sm text-muted-foreground">
          使用虚拟头节点与分组指针，逐组完成局部反转并重新接回链表。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>
            步骤 {Math.min(stepIndex + 1, steps.length)} / {steps.length || 1}
          </span>
          <span>阶段：{phaseLabel}</span>
          <span>k = {k}</span>
        </div>
        <div className="h-2 w-full max-w-3xl overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${Math.floor(progress * 100)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <form
          onSubmit={handleApplyInputs}
          className="flex flex-col gap-4 rounded-lg border bg-background/80 p-4 shadow-sm"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">链表节点（按顺序输入）</label>
            <Textarea
              value={listInput}
              onChange={(event) => setListInput(event.target.value)}
              placeholder="例如：1, 2, 3, 4, 5"
              className="min-h-[96px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">每组大小 k (1 ~ {MAX_GROUP_SIZE})</label>
            <Input
              value={kInput}
              onChange={(event) => setKInput(event.target.value)}
              inputMode="numeric"
              placeholder="例如：2"
            />
          </div>

          {inputError && (
            <div className="rounded-lg border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {inputError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              应用输入
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={handleUseDefault}
            >
              <RotateCcw className="h-4 w-4" />
              使用默认示例
            </Button>
          </div>

          <div className="h-px w-full bg-muted" />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              重置步骤
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleNextStep}
            >
              <StepForward className="h-4 w-4" />
              下一步
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={handlePlayToggle}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  暂停
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  播放
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg border bg-background/70 p-4 text-sm leading-relaxed text-muted-foreground">
            {currentStep.description ?? "等待步骤开始。"}
          </div>
        </form>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border bg-background/80 p-4 shadow-sm">
            <LinkedListVisualization values={values} step={currentStep} />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="prev 指针"
              value={formatNodeLabel(values, currentStep.prev ?? null)}
              highlight={currentStep.prev === DUMMY_INDEX}
            />
            <InfoCard
              label="当前组起点"
              value={formatNodeLabel(values, currentStep.groupHead ?? null)}
              highlight={currentStep.phase === "prepare" || currentStep.phase === "reverse"}
            />
            <InfoCard
              label="下一组起点"
              value={formatNodeLabel(values, currentStep.nextGroupStart ?? null)}
              highlight={currentStep.phase === "advance"}
            />
            <InfoCard
              label="已完成组数"
              value={`${currentStep.completedGroups ?? 0}`}
            />
          </div>

          <div className="rounded-lg border bg-background/80 p-4 shadow-sm">
            <div className="text-sm font-semibold text-muted-foreground">
              步骤记录
            </div>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {displayedLogs.map((step) => (
                  <motion.div
                    key={step.index}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm",
                      step.index === currentStep.index
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background",
                    )}
                  >
                    <div className="text-xs text-muted-foreground">
                      步骤 {step.index} · {phaseLabels[step.phase]}
                    </div>
                    <div>{step.description}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="rounded-lg border bg-background/80 p-4 shadow-sm">
            <div className="text-sm font-semibold text-muted-foreground">
              最终链表（仅完整分组被翻转）
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {resultValues.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted px-4 py-2 text-sm text-muted-foreground">
                  空链表
                </div>
              ) : (
                resultValues.map((value, index) => (
                  <motion.div
                    key={`${value}-${index}`}
                    layout
                    className="flex min-h-[64px] min-w-[64px] flex-col items-center justify-center rounded-lg border border-border bg-background/90 px-4 py-3 shadow-sm"
                  >
                    <span className="text-lg font-semibold">{value}</span>
                    <span className="text-xs text-muted-foreground">索引 {index}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
