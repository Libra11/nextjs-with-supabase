"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, RotateCcw, StepForward, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LIST = [1, 2, 3, 4];
const MAX_LENGTH = 12;
const STEP_INTERVAL = 1600;

type StepPhase =
  | "init"
  | "select-pair"
  | "swap"
  | "advance"
  | "done";

interface StepState {
  index: number;
  phase: StepPhase;
  description: string;
  prev: number | null;
  first: number | null;
  second: number | null;
  nextStart: number | null;
  links: Array<number | null>;
  dummyNext: number | null;
  swapCount: number;
  pairSwapped: boolean;
}

interface AnimationData {
  values: number[];
  steps: StepState[];
  resultValues: number[];
}

const DUMMY_INDEX = -1;

const formatNodeLabel = (values: number[], index: number | null) => {
  if (index === null) return "null";
  if (index === DUMMY_INDEX) return "虚拟头";
  if (index < 0 || index >= values.length) return "null";
  return `${values[index]} (索引 ${index})`;
};

const formatNextLabel = (values: number[], index: number | null) => {
  if (index === null) return "null";
  if (index < 0 || index >= values.length) return "null";
  return `${values[index]}`;
};

const buildSwapSteps = (values: number[]): StepState[] => {
  const length = values.length;
  const steps: StepState[] = [];
  const links = values.map((_, idx) => (idx < length - 1 ? idx + 1 : null));

  let dummyNext: number | null = length ? 0 : null;
  let prev: number | null = DUMMY_INDEX;
  let first: number | null = dummyNext;
  let second: number | null = first !== null ? links[first] ?? null : null;
  let swapCount = 0;

  const pushStep = (
    phase: StepPhase,
    description: string,
    overrides?: Partial<StepState>,
  ) => {
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      prev,
      first,
      second,
      nextStart:
        overrides && "nextStart" in overrides
          ? overrides.nextStart ?? null
          : second !== null
            ? links[second] ?? null
            : null,
      links: [...links],
      dummyNext,
      swapCount,
      pairSwapped: false,
      ...overrides,
    });
  };

  pushStep(
    "init",
    length
      ? `初始化：虚拟头指向 ${formatNodeLabel(values, first)}，准备开始交换。`
      : "链表为空，直接返回空链表。",
    {
      nextStart: second,
    },
  );

  if (length <= 1) {
    pushStep(
      "done",
      length
        ? "链表长度不足以形成一对节点，保持原状返回。"
        : "无节点可交换，返回 null。",
      {
        nextStart: null,
      },
    );
    return steps;
  }

  while (first !== null && second !== null) {
    const nextStartBeforeSwap = links[second] ?? null;

    pushStep(
      "select-pair",
      `选定节点 ${formatNodeLabel(values, first)} 和 ${formatNodeLabel(values, second)} 作为当前交换对，记录 next = ${formatNodeLabel(values, nextStartBeforeSwap)}。`,
      {
        nextStart: nextStartBeforeSwap,
      },
    );

    if (prev === DUMMY_INDEX) {
      dummyNext = second;
    } else if (prev !== null) {
      links[prev] = second;
    }

    links[second] = first;
    links[first] = nextStartBeforeSwap;
    swapCount += 1;

    pushStep(
      "swap",
      `交换指针：${formatNodeLabel(values, second)} 现在指向 ${formatNodeLabel(values, first)}，${formatNodeLabel(values, first)} 指向 ${formatNodeLabel(values, nextStartBeforeSwap)}，完成第 ${swapCount} 次交换。`,
      {
        nextStart: nextStartBeforeSwap,
        pairSwapped: true,
      },
    );

    prev = first;
    first = nextStartBeforeSwap;
    second = first !== null ? links[first] ?? null : null;

    pushStep(
      "advance",
      second !== null
        ? `移动 prev 到 ${formatNodeLabel(values, prev)}，下一对将从 ${formatNodeLabel(values, first)} 开始。`
        : `移动 prev 到 ${formatNodeLabel(values, prev)}，后续不足一对，准备结束。`,
      {
        nextStart: second,
      },
    );
  }

  pushStep(
    "done",
    dummyNext !== null
      ? `遍历完成，新头节点为 ${formatNodeLabel(values, dummyNext)}。`
      : "遍历完成，返回空链表。",
    {
      nextStart: null,
    },
  );

  return steps;
};

const buildAnimationData = (values: number[]): AnimationData => {
  const sanitized = values.slice(0, MAX_LENGTH);
  const resultValues = sanitized.slice();

  for (let i = 0; i + 1 < resultValues.length; i += 2) {
    const temp = resultValues[i];
    resultValues[i] = resultValues[i + 1];
    resultValues[i + 1] = temp;
  }

  return {
    values: sanitized,
    steps: buildSwapSteps(sanitized),
    resultValues,
  };
};

const parseListInput = (input: string): number[] => {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  const segments = trimmed
    .split(/[\s,，、,]+/)
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
    if (!Number.isFinite(value)) {
      throw new Error(`检测到无效数字 "${segment}"，请重新输入。`);
    }
    if (!Number.isInteger(value)) {
      throw new Error("节点值必须是整数。");
    }
    return value;
  });

  return values;
};

type PointerType = "prev" | "first" | "second";

const pointerStyles: Record<PointerType, string> = {
  prev: "border-sky-500/60 bg-sky-500/10 text-sky-600",
  first: "border-primary/60 bg-primary/10 text-primary",
  second: "border-amber-500/60 bg-amber-500/10 text-amber-600",
};

const pointerLabels: Record<PointerType, string> = {
  prev: "prev",
  first: "first",
  second: "second",
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
  isActivePair?: boolean;
  isNextFocus?: boolean;
  nextLabel?: string;
}

const NodeCard = ({
  type,
  value,
  index,
  pointers = [],
  isActivePair = false,
  isNextFocus = false,
  nextLabel,
}: NodeCardProps) => (
  <motion.div
    layout
    className={cn(
      "relative flex min-h-[88px] min-w-[88px] flex-col items-center justify-center rounded-xl border px-6 py-5 text-center shadow-sm",
      type === "dummy"
        ? "border-muted-foreground/40 bg-muted/20 text-muted-foreground"
        : type === "null"
          ? "border-border bg-background/70 text-muted-foreground"
          : "border-border bg-background",
      isActivePair && type === "node"
        ? "border-primary shadow-primary/20 ring-2 ring-primary/40"
        : undefined,
      isNextFocus && type === "node"
        ? "border-dashed border-amber-400 bg-amber-50"
        : undefined,
    )}
  >
    {!!pointers.length && (
      <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 gap-2">
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
  label: string;
  values: number[];
  step: StepState;
  highlightPair?: boolean;
  showDummy?: boolean;
  showNullTail?: boolean;
}

const LinkedListVisualization = ({
  label,
  values,
  step,
  highlightPair = true,
  showDummy = true,
  showNullTail = true,
}: LinkedListVisualizationProps) => {
  const activeSet = new Set<number | null>([
    highlightPair ? step.first ?? null : null,
    highlightPair ? step.second ?? null : null,
  ]);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap items-center gap-3">
        {showDummy && (
          <NodeCard
            type="dummy"
            pointers={
              step.prev === DUMMY_INDEX ? ["prev"] : []
            }
            isNextFocus={step.nextStart === DUMMY_INDEX}
            nextLabel={formatNextLabel(values, step.dummyNext)}
          />
        )}

        {values.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted px-4 py-2 text-sm text-muted-foreground">
            空链表
          </div>
        ) : (
          values.map((value, index) => {
            const pointers: PointerType[] = [];
            if (step.prev === index) pointers.push("prev");
            if (step.first === index) pointers.push("first");
            if (step.second === index) pointers.push("second");

            const isActivePair = highlightPair && activeSet.has(index);
            const isNextFocus = step.nextStart === index;
            const nextIndex = step.links[index] ?? null;
            const nextLabel = formatNextLabel(values, nextIndex);

            return (
              <NodeCard
                key={`${value}-${index}`}
                type="node"
                value={value}
                index={index}
                pointers={pointers}
                isActivePair={isActivePair}
                isNextFocus={isNextFocus}
                nextLabel={nextLabel}
              />
            );
          })
        )}

        {showNullTail && (
          <NodeCard type="null" nextLabel={undefined} />
        )}
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
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

export default function SwapPairsAnimation() {
  const [listInput, setListInput] = useState(
    DEFAULT_LIST.join(", "),
  );
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(DEFAULT_LIST),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { values, steps, resultValues } = animationData;
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
  }, [isPlaying, stepIndex, steps.length]);

  const progress = useMemo(() => {
    if (steps.length <= 1) {
      return stepIndex >= steps.length - 1 ? 1 : 0;
    }
    return stepIndex / (steps.length - 1);
  }, [stepIndex, steps.length]);

  const displayedLogs = useMemo(
    () =>
      steps.slice(
        0,
        Math.min(stepIndex + 1, steps.length),
      ),
    [steps, stepIndex],
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
      const data = buildAnimationData(parsedValues);
      setAnimationData(data);
      setStepIndex(0);
      setInputError(null);
      setListInput(parsedValues.join(", "));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "输入解析失败，请重试。";
      setInputError(message);
    }
  };

  const handleUseDefault = () => {
    const data = buildAnimationData(DEFAULT_LIST);
    setAnimationData(data);
    setListInput(DEFAULT_LIST.join(", "));
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
  };

  const formatPointerInfo = (
    label: string,
    position: number | null,
  ) => `${label} → ${formatNodeLabel(values, position)}`;

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg bg-gradient-to-br from-background to-muted/30 p-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <h3 className="text-xl font-bold">两两交换链表中的节点</h3>
        <p className="text-sm text-muted-foreground">
          使用虚拟头与临时指针，在一趟遍历中两两交换节点。
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            步骤 {Math.min(stepIndex + 1, steps.length)} / {steps.length || 1}
          </span>
          <span>阶段：{currentStep.phase ?? "未知"}</span>
        </div>
        <div className="h-2 w-full max-w-xl overflow-hidden rounded-full bg-muted">
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
            <label className="text-sm font-medium">链表节点（顺序表示从头到尾）</label>
            <Textarea
              value={listInput}
              onChange={(event) => setListInput(event.target.value)}
              placeholder="例如：1, 2, 3, 4"
              className="min-h-[96px]"
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
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={handleNextStep}
            >
              <StepForward className="h-4 w-4" />
              下一步
            </Button>
          </div>

          <div className="rounded-lg border bg-background/80 p-4 text-sm leading-relaxed text-muted-foreground">
            {currentStep.description ?? "等待步骤开始。"}
          </div>

          <div className="rounded-lg border bg-background/80 p-4">
            <div className="text-sm font-semibold text-muted-foreground">
              步骤记录
            </div>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {displayedLogs.map((log) => (
                  <motion.div
                    key={log.index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm",
                      log.index === currentStep.index
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background",
                    )}
                  >
                    <div className="text-xs text-muted-foreground">
                      步骤 {log.index}
                    </div>
                    <div>{log.description}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-4 rounded-lg border bg-background/70 p-4 shadow-sm">
          <LinkedListVisualization
            label="指针操作演示"
            values={values}
            step={currentStep}
            highlightPair
            showDummy
            showNullTail
          />

          <div className="rounded-lg border bg-background/70 p-4">
            <div className="text-sm font-medium text-muted-foreground">
              交换后的链表
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="prev 指针"
              value={formatPointerInfo("prev", currentStep.prev ?? null)}
              highlight={currentStep.phase === "advance" || currentStep.prev === DUMMY_INDEX}
            />
            <InfoCard
              label="first 指针"
              value={formatPointerInfo("first", currentStep.first ?? null)}
              highlight={currentStep.phase === "select-pair" || currentStep.phase === "swap"}
            />
            <InfoCard
              label="second 指针"
              value={formatPointerInfo("second", currentStep.second ?? null)}
              highlight={currentStep.phase === "select-pair" || currentStep.phase === "swap"}
            />
            <InfoCard
              label="下一对起点"
              value={`next → ${formatNodeLabel(values, currentStep.nextStart ?? null)}`}
              highlight={currentStep.phase === "select-pair" || currentStep.phase === "advance"}
            />
            <InfoCard
              label="累计交换对数"
              value={`${currentStep.swapCount ?? 0}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
