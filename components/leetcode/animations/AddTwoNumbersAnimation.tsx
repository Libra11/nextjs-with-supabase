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
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LIST_L1 = [2, 4, 3];
const DEFAULT_LIST_L2 = [5, 6, 4];
const MAX_LENGTH = 8;
const STEP_INTERVAL = 1600;

type StepPhase = "init" | "add" | "final-carry" | "done";

interface StepState {
  index: number;
  phase: StepPhase;
  description: string;
  pointer1: number | null;
  pointer2: number | null;
  value1: number | null;
  value2: number | null;
  carryIn: number;
  sum: number | null;
  digit: number | null;
  carryOut: number;
  resultDigits: number[];
  zeroFromL1: boolean;
  zeroFromL2: boolean;
}

interface AnimationData {
  list1: number[];
  list2: number[];
  steps: StepState[];
}

const formatNodeLabel = (
  values: number[],
  index: number | null,
) => {
  if (index === null || index < 0 || index >= values.length) {
    return "null";
  }
  return `${values[index]} (索引 ${index})`;
};

const buildAdditionSteps = (
  list1: number[],
  list2: number[],
): StepState[] => {
  const steps: StepState[] = [];
  const resultDigits: number[] = [];

  let i = 0;
  let j = 0;
  let carry = 0;

  const cloneResult = () => [...resultDigits];

  const pushStep = (
    phase: StepPhase,
    description: string,
    overrides?: Partial<StepState>,
  ) => {
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      pointer1: null,
      pointer2: null,
      value1: null,
      value2: null,
      carryIn: 0,
      sum: null,
      digit: null,
      carryOut: 0,
      resultDigits: cloneResult(),
      zeroFromL1: false,
      zeroFromL2: false,
      ...overrides,
    });
  };

  if (!list1.length && !list2.length) {
    pushStep(
      "init",
      "两个链表均为空，直接返回空链表。",
      {
        carryIn: 0,
        carryOut: 0,
      },
    );
    pushStep(
      "done",
      "遍历完成，结果链表为空。",
      {
        carryIn: 0,
        carryOut: 0,
      },
    );
    return steps;
  }

  pushStep(
    "init",
    `初始化完成：l1 指向 ${formatNodeLabel(list1, list1.length ? 0 : null)}，l2 指向 ${formatNodeLabel(list2, list2.length ? 0 : null)}，初始进位为 0。`,
    {
      pointer1: list1.length ? 0 : null,
      pointer2: list2.length ? 0 : null,
      carryIn: 0,
      carryOut: 0,
    },
  );

  while (i < list1.length || j < list2.length) {
    const pointer1 = i < list1.length ? i : null;
    const pointer2 = j < list2.length ? j : null;

    const zeroFromL1 = pointer1 === null;
    const zeroFromL2 = pointer2 === null;

    const value1 = pointer1 !== null ? list1[pointer1] : 0;
    const value2 = pointer2 !== null ? list2[pointer2] : 0;
    const carryIn = carry;
    const sum = value1 + value2 + carryIn;
    const digit = sum % 10;
    const nextCarry = Math.floor(sum / 10);
    const updatedResult = [...resultDigits, digit];

    const descriptionParts: string[] = [];
    if (pointer1 !== null) {
      descriptionParts.push(
        `l1 当前节点 ${formatNodeLabel(list1, pointer1)}`,
      );
    } else {
      descriptionParts.push("l1 已耗尽，视作 0");
    }
    if (pointer2 !== null) {
      descriptionParts.push(
        `l2 当前节点 ${formatNodeLabel(list2, pointer2)}`,
      );
    } else {
      descriptionParts.push("l2 已耗尽，视作 0");
    }
    descriptionParts.push(
      `进位 ${carryIn}，计算 ${value1} + ${value2} + ${carryIn} = ${sum}`,
    );
    descriptionParts.push(
      `写入节点 ${digit}，新的进位为 ${nextCarry}`,
    );

    pushStep(
      "add",
      descriptionParts.join("；") + "。",
      {
        pointer1,
        pointer2,
        value1: pointer1 !== null ? value1 : null,
        value2: pointer2 !== null ? value2 : null,
        carryIn,
        sum,
        digit,
        carryOut: nextCarry,
        resultDigits: updatedResult,
        zeroFromL1,
        zeroFromL2,
      },
    );

    resultDigits.push(digit);
    carry = nextCarry;

    if (pointer1 !== null) {
      i += 1;
    } else {
      i = list1.length;
    }

    if (pointer2 !== null) {
      j += 1;
    } else {
      j = list2.length;
    }
  }

  if (carry > 0) {
    const updatedResult = [...resultDigits, carry];
    pushStep(
      "final-carry",
      `遍历结束但仍有进位 ${carry}，在结果链表末尾新增节点 ${carry}。`,
      {
        pointer1: null,
        pointer2: null,
        value1: null,
        value2: null,
        carryIn: carry,
        sum: carry,
        digit: carry,
        carryOut: 0,
        resultDigits: updatedResult,
        zeroFromL1: true,
        zeroFromL2: true,
      },
    );
    resultDigits.push(carry);
    carry = 0;
  }

  pushStep(
    "done",
    "所有节点处理完成，返回结果链表。",
    {
      pointer1: null,
      pointer2: null,
      carryIn: carry,
      carryOut: carry,
      resultDigits: cloneResult(),
    },
  );

  return steps;
};

const buildAnimationData = (
  list1: number[],
  list2: number[],
): AnimationData => {
  const sanitizedL1 = list1.slice(0, MAX_LENGTH);
  const sanitizedL2 = list2.slice(0, MAX_LENGTH);

  return {
    list1: sanitizedL1,
    list2: sanitizedL2,
    steps: buildAdditionSteps(sanitizedL1, sanitizedL2),
  };
};

const parseListInput = (
  input: string,
  label: string,
): number[] => {
  const segments = input
    .split(/[\s,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!segments.length) {
    throw new Error(`${label} 至少需要一个节点值。`);
  }

  if (segments.length > MAX_LENGTH) {
    throw new Error(`${label} 节点数量不能超过 ${MAX_LENGTH} 个。`);
  }

  const values = segments.map((segment) => {
    const value = Number(segment);
    if (Number.isNaN(value)) {
      throw new Error(`${label} 中检测到无效数字 "${segment}"。`);
    }
    if (!Number.isInteger(value) || value < 0 || value > 9) {
      throw new Error(`${label} 节点必须是 0-9 之间的整数。`);
    }
    return value;
  });

  return values;
};

const InfoCard = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string | null;
  highlight?: boolean;
}) => (
  <div
    className={cn(
      "rounded-lg border bg-background/80 px-4 py-3",
      highlight ? "border-primary/70 bg-primary/5" : "border-border",
    )}
  >
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold">
      {value ?? "-"}
    </div>
  </div>
);

const LinkedListRow = ({
  label,
  values,
  current,
  ghostActive,
  ghostLabel,
}: {
  label: string;
  values: number[];
  current: number | null;
  ghostActive: boolean;
  ghostLabel: string;
}) => (
  <div className="flex flex-col gap-2">
    <div className="text-sm font-medium text-muted-foreground">
      {label}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {values.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted px-4 py-2 text-sm text-muted-foreground">
          空链表
        </div>
      ) : (
        values.map((value, index) => (
          <motion.div
            key={`${label}-${index}-${value}`}
            layout
            className={cn(
              "relative flex min-h-[88px] min-w-[88px] flex-col items-center justify-center rounded-xl border bg-background px-6 py-5 shadow-sm",
              current === index
                ? "border-primary shadow-primary/20 ring-2 ring-primary/40"
                : "border-border",
            )}
          >
            <div className="text-lg font-semibold">{value}</div>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
              索引 {index}
            </span>
          </motion.div>
        ))
      )}
      {ghostActive && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex min-h-[88px] min-w-[88px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/60 bg-primary/5 px-6 py-5 text-center text-sm text-primary"
        >
          <div className="text-lg font-semibold">0</div>
          <span className="text-xs">{ghostLabel}</span>
        </motion.div>
      )}
    </div>
  </div>
);

export default function AddTwoNumbersAnimation() {
  const [list1Input, setList1Input] = useState(
    DEFAULT_LIST_L1.join(", "),
  );
  const [list2Input, setList2Input] = useState(
    DEFAULT_LIST_L2.join(", "),
  );
  const [animationData, setAnimationData] = useState<AnimationData>(
    () => buildAnimationData(DEFAULT_LIST_L1, DEFAULT_LIST_L2),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { list1, list2, steps } = animationData;
  const currentStep =
    steps[stepIndex] ??
    steps[steps.length - 1] ??
    ({} as StepState);

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
    setStepIndex((prev) => {
      if (!steps.length) return prev;
      if (prev >= steps.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  const handleApplyInputs = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    try {
      const parsedL1 = parseListInput(
        list1Input,
        "链表 l1",
      );
      const parsedL2 = parseListInput(
        list2Input,
        "链表 l2",
      );
      const data = buildAnimationData(parsedL1, parsedL2);
      setAnimationData(data);
      setStepIndex(0);
      setIsPlaying(false);
      setInputError(null);
      setList1Input(parsedL1.join(", "));
      setList2Input(parsedL2.join(", "));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "输入解析失败，请重试。";
      setInputError(message);
    }
  };

  const handleUseDefault = () => {
    setList1Input(DEFAULT_LIST_L1.join(", "));
    setList2Input(DEFAULT_LIST_L2.join(", "));
    setAnimationData(
      buildAnimationData(DEFAULT_LIST_L1, DEFAULT_LIST_L2),
    );
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
  };

  const resultDigits = currentStep.resultDigits ?? [];
  const highlightResultIndex = resultDigits.length
    ? resultDigits.length - 1
    : null;

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg bg-gradient-to-br from-background to-muted/30 p-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <h3 className="text-xl font-bold">
          两数相加算法演示
        </h3>
        <p className="text-sm text-muted-foreground">
          链表以逆序存储数字，逐节点累加并处理进位。
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            步骤 {Math.min(stepIndex + 1, steps.length)} /{" "}
            {steps.length || 1}
          </span>
          <span>当前状态：{currentStep.phase ?? "未知"}</span>
        </div>
        <div className="h-2 w-full max-w-xl overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-primary"
            animate={{
              width: `${Math.floor(progress * 100)}%`,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
        <form
          onSubmit={handleApplyInputs}
          className="flex flex-col gap-4 rounded-lg border bg-background/80 p-4 shadow-sm"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">
              链表 l1 节点（逆序）
            </label>
            <Textarea
              value={list1Input}
              onChange={(event) =>
                setList1Input(event.target.value)
              }
              placeholder="例如：2, 4, 3"
              className="min-h-[96px] resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              链表 l2 节点（逆序）
            </label>
            <Textarea
              value={list2Input}
              onChange={(event) =>
                setList2Input(event.target.value)
              }
              placeholder="例如：5, 6, 4"
              className="min-h-[96px] resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            节点值需为 0-9 的整数，节点数量不超过 {MAX_LENGTH}。
          </p>
          {inputError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {inputError}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="sm">
              应用输入
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleUseDefault}
            >
              使用示例
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              重置步骤
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handlePlayToggle} size="sm">
              {isPlaying ? (
                <>
                  <Pause className="mr-1 h-4 w-4" />
                  暂停
                </>
              ) : (
                <>
                  <Play className="mr-1 h-4 w-4" />
                  播放
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleNextStep}
            >
              <StepForward className="mr-1 h-4 w-4" />
              下一步
            </Button>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border bg-background/70 p-4 shadow-sm">
            <LinkedListRow
              label="链表 l1 (逆序)"
              values={list1}
              current={currentStep.pointer1 ?? null}
              ghostActive={
                currentStep.zeroFromL1 &&
                (currentStep.phase === "add" ||
                  currentStep.phase === "final-carry")
              }
              ghostLabel="来自空节点的 0"
            />
            <LinkedListRow
              label="链表 l2 (逆序)"
              values={list2}
              current={currentStep.pointer2 ?? null}
              ghostActive={
                currentStep.zeroFromL2 &&
                (currentStep.phase === "add" ||
                  currentStep.phase === "final-carry")
              }
              ghostLabel="来自空节点的 0"
            />
            <LinkedListRow
              label="结果链表 (逆序)"
              values={resultDigits}
              current={
                currentStep.phase === "init"
                  ? null
                  : highlightResultIndex
              }
              ghostActive={false}
              ghostLabel=""
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <InfoCard
              label="进位输入"
              value={currentStep.carryIn ?? 0}
            />
            <InfoCard
              label="当前位总和"
              value={
                currentStep.sum !== null
                  ? currentStep.sum
                  : "-"
              }
            />
            <InfoCard
              label="写入节点"
              value={
                currentStep.digit !== null
                  ? currentStep.digit
                  : "-"
              }
              highlight={
                currentStep.phase === "add" ||
                currentStep.phase === "final-carry"
              }
            />
            <InfoCard
              label="新的进位"
              value={currentStep.carryOut ?? 0}
              highlight={currentStep.carryOut > 0}
            />
          </div>

          <div className="rounded-lg border bg-background/80 p-4 text-sm leading-relaxed text-muted-foreground">
            {currentStep.description ?? "等待步骤开始。"}
          </div>

          <div className="rounded-lg border bg-background/80 p-4">
            <div className="text-sm font-semibold text-muted-foreground">
              步骤记录
            </div>
            <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
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
        </div>
      </div>
    </div>
  );
}
