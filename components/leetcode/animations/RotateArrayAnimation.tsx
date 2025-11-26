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

const DEFAULT_ARRAY = "1, 2, 3, 4, 5, 6, 7";
const DEFAULT_K = "3";
const MAX_LENGTH = 12;

type AlgorithmMode = "extra" | "cycle" | "reverse";

type ExtraAction = "init" | "place" | "final";
type CycleAction = "start-cycle" | "move" | "cycle-complete" | "final";
type ReverseAction = "normalize" | "reverse-section" | "final";
type StepAction = ExtraAction | CycleAction | ReverseAction;

type ReverseStage = "full" | "first" | "rest" | "normalize";

const MODE_LABELS: Record<AlgorithmMode, string> = {
  extra: "额外数组法",
  cycle: "环形替换法",
  reverse: "三次反转法",
};

const ACTION_LABELS: Record<StepAction, string> = {
  init: "初始化",
  place: "放置元素",
  "start-cycle": "开启环",
  move: "元素移动",
  "cycle-complete": "环完成",
  normalize: "参数规范化",
  "reverse-section": "反转区间",
  final: "完成",
};

const REVERSE_STAGE_LABELS: Record<ReverseStage, string> = {
  full: "整体反转",
  first: "反转前 k 段",
  rest: "反转剩余部分",
  normalize: "参数规范化",
};

interface BaseStep {
  algorithm: AlgorithmMode;
  action: StepAction;
  description: string;
}

interface ExtraStep extends BaseStep {
  algorithm: "extra";
  action: ExtraAction;
  currentIndex: number | null;
  targetIndex: number | null;
  resultArray: (number | null)[];
  originalArray: number[];
  placedCount: number;
  normalizedK: number;
}

interface CycleStep extends BaseStep {
  algorithm: "cycle";
  action: CycleAction;
  arrayState: number[];
  currentIndex: number | null;
  targetIndex: number | null;
  startIndex: number | null;
  movedCount: number;
  cycleOrder: number;
  normalizedK: number;
  completedCycle: boolean;
}

interface ReverseStep extends BaseStep {
  algorithm: "reverse";
  action: ReverseAction;
  arrayState: number[];
  left: number | null;
  right: number | null;
  stage: ReverseStage;
  normalizedK: number;
  swapPerformed: boolean;
  passCount: number;
  stageOrder: number;
}

type VisualizationStep = ExtraStep | CycleStep | ReverseStep;

interface StepLog {
  step: number;
  algorithm: AlgorithmMode;
  action: StepAction;
  description: string;
}

const formatNumberArray = (array: number[]): string =>
  `[${array.map((value) => String(value)).join(", ")}]`;

const formatNullableArray = (array: (number | null)[]): string =>
  `[${array.map((value) => (value === null ? "_" : String(value))).join(", ")}]`;

const parseNumberList = (input: string): number[] | null => {
  const segments = input
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return [];
  }

  const values: number[] = [];
  for (const segment of segments) {
    const parsed = Number(segment);
    if (Number.isNaN(parsed)) {
      return null;
    }
    values.push(parsed);
  }

  return values;
};

const normalizeRotation = (k: number, length: number): number => {
  if (length === 0) return 0;
  const mod = k % length;
  return mod < 0 ? mod + length : mod;
};

const buildExtraSteps = (nums: number[], k: number): ExtraStep[] => {
  const n = nums.length;
  if (!n) return [];

  const normalized = normalizeRotation(k, n);
  const original = [...nums];
  let result: (number | null)[] = new Array(n).fill(null);
  const steps: ExtraStep[] = [];

  steps.push({
    algorithm: "extra",
    action: "init",
    description: `规范化 k = ${normalized}，准备辅助数组进行拷贝。`,
    currentIndex: null,
    targetIndex: null,
    resultArray: [...result],
    originalArray: original,
    placedCount: 0,
    normalizedK: normalized,
  });

  if (normalized === 0) {
    steps.push({
      algorithm: "extra",
      action: "final",
      description: "k mod n = 0，无需轮转，数组保持不变。",
      currentIndex: null,
      targetIndex: null,
      resultArray: original.map((value) => value),
      originalArray: original,
      placedCount: 0,
      normalizedK: normalized,
    });
    return steps;
  }

  for (let index = 0; index < n; index++) {
    const targetIndex = (index + normalized) % n;
    const nextResult = [...result];
    nextResult[targetIndex] = original[index];
    result = nextResult;

    steps.push({
      algorithm: "extra",
      action: "place",
      description: `元素 ${original[index]} (索引 ${index}) 移动到新位置 ${targetIndex}。`,
      currentIndex: index,
      targetIndex,
      resultArray: [...result],
      originalArray: original,
      placedCount: index + 1,
      normalizedK: normalized,
    });
  }

  steps.push({
    algorithm: "extra",
    action: "final",
    description: `辅助数组构建完成：${formatNullableArray(result)}。`,
    currentIndex: null,
    targetIndex: null,
    resultArray: [...result],
    originalArray: original,
    placedCount: n,
    normalizedK: normalized,
  });

  return steps;
};

const buildCycleSteps = (nums: number[], k: number): CycleStep[] => {
  const n = nums.length;
  if (!n) return [];

  const normalized = normalizeRotation(k, n);
  const arrayState = [...nums];
  const steps: CycleStep[] = [];

  if (normalized === 0) {
    steps.push({
      algorithm: "cycle",
      action: "final",
      description: "k mod n = 0，无需执行环形替换。",
      arrayState: [...arrayState],
      currentIndex: null,
      targetIndex: null,
      startIndex: null,
      movedCount: 0,
      cycleOrder: 0,
      normalizedK: normalized,
      completedCycle: true,
    });
    return steps;
  }

  let moved = 0;
  let cycleOrder = 0;

  for (let start = 0; moved < n; start++) {
    let current = start;
    let previousValue = arrayState[current];
    const order = cycleOrder + 1;

    steps.push({
      algorithm: "cycle",
      action: "start-cycle",
      description: `开始第 ${order} 个环：起点索引 ${start}，暂存值 ${previousValue}。`,
      arrayState: [...arrayState],
      currentIndex: current,
      targetIndex: (current + normalized) % n,
      startIndex: start,
      movedCount: moved,
      cycleOrder: order,
      normalizedK: normalized,
      completedCycle: false,
    });

    while (true) {
      const nextIndex = (current + normalized) % n;
      const temp = arrayState[nextIndex];
      arrayState[nextIndex] = previousValue;
      moved += 1;

      steps.push({
        algorithm: "cycle",
        action: "move",
        description: `将值 ${previousValue} 放入索引 ${nextIndex}，数组变为 ${formatNumberArray(arrayState)}。`,
        arrayState: [...arrayState],
        currentIndex: current,
        targetIndex: nextIndex,
        startIndex: start,
        movedCount: moved,
        cycleOrder: order,
        normalizedK: normalized,
        completedCycle: false,
      });

      current = nextIndex;
      previousValue = temp;

      if (current === start) {
        break;
      }
    }

    steps.push({
      algorithm: "cycle",
      action: "cycle-complete",
      description: `返回起点 ${start}，第 ${order} 个环结束。`,
      arrayState: [...arrayState],
      currentIndex: current,
      targetIndex: null,
      startIndex: start,
      movedCount: moved,
      cycleOrder: order,
      normalizedK: normalized,
      completedCycle: true,
    });

    cycleOrder += 1;
  }

  steps.push({
    algorithm: "cycle",
    action: "final",
    description: `全部 ${n} 个元素已完成轮换：${formatNumberArray(arrayState)}。`,
    arrayState: [...arrayState],
    currentIndex: null,
    targetIndex: null,
    startIndex: null,
    movedCount: moved,
    cycleOrder,
    normalizedK: normalized,
    completedCycle: true,
  });

  return steps;
};

const buildReverseSteps = (nums: number[], k: number): ReverseStep[] => {
  const n = nums.length;
  if (!n) return [];

  const normalized = normalizeRotation(k, n);
  const arrayState = [...nums];
  const steps: ReverseStep[] = [];

  steps.push({
    algorithm: "reverse",
    action: "normalize",
    description: `规范化参数：k mod n = ${normalized}。`,
    arrayState: [...arrayState],
    left: null,
    right: null,
    stage: "normalize",
    normalizedK: normalized,
    swapPerformed: false,
    passCount: 0,
    stageOrder: 0,
  });

  if (normalized === 0) {
    steps.push({
      algorithm: "reverse",
      action: "final",
      description: "k mod n = 0，无需反转操作。",
      arrayState: [...arrayState],
      left: null,
      right: null,
      stage: "normalize",
      normalizedK: normalized,
      swapPerformed: false,
      passCount: 0,
      stageOrder: 0,
    });
    return steps;
  }

  const reverseSection = (
    start: number,
    end: number,
    stage: ReverseStage,
    stageOrder: number
  ) => {
    const stageLabel = REVERSE_STAGE_LABELS[stage];
    let left = start;
    let right = end;
    let pass = 0;

    if (left >= right) {
      steps.push({
        algorithm: "reverse",
        action: "reverse-section",
        description: `${stageLabel}：区间 [${start}, ${end}] 无需交换。`,
        arrayState: [...arrayState],
        left: null,
        right: null,
        stage,
        normalizedK: normalized,
        swapPerformed: false,
        passCount: 0,
        stageOrder,
      });
      return;
    }

    while (left < right) {
      const temp = arrayState[left];
      arrayState[left] = arrayState[right];
      arrayState[right] = temp;
      pass += 1;

      steps.push({
        algorithm: "reverse",
        action: "reverse-section",
        description: `${stageLabel}：交换索引 ${left} 与 ${right}，数组变为 ${formatNumberArray(arrayState)}。`,
        arrayState: [...arrayState],
        left,
        right,
        stage,
        normalizedK: normalized,
        swapPerformed: true,
        passCount: pass,
        stageOrder,
      });

      left += 1;
      right -= 1;
    }
  };

  reverseSection(0, n - 1, "full", 1);
  reverseSection(0, normalized - 1, "first", 2);
  reverseSection(normalized, n - 1, "rest", 3);

  steps.push({
    algorithm: "reverse",
    action: "final",
    description: `三次反转完成：${formatNumberArray(arrayState)}。`,
    arrayState: [...arrayState],
    left: null,
    right: null,
    stage: "rest",
    normalizedK: normalized,
    swapPerformed: false,
    passCount: 0,
    stageOrder: 4,
  });

  return steps;
};

export default function RotateArrayAnimation() {
  const [arrayInput, setArrayInput] = useState<string>(DEFAULT_ARRAY);
  const [kInput, setKInput] = useState<string>(DEFAULT_K);
  const [arrayError, setArrayError] = useState<string | null>(null);
  const [kError, setKError] = useState<string | null>(null);

  const [numbers, setNumbers] = useState<number[]>([]);
  const [kValue, setKValue] = useState<number>(0);
  const [mode, setMode] = useState<AlgorithmMode>("extra");

  const [extraSteps, setExtraSteps] = useState<ExtraStep[]>([]);
  const [cycleSteps, setCycleSteps] = useState<CycleStep[]>([]);
  const [reverseSteps, setReverseSteps] = useState<ReverseStep[]>([]);

  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<VisualizationStep | null>(
    null
  );
  const [logs, setLogs] = useState<StepLog[]>([]);
  const processedStepRef = useRef(-1);

  const initialize = useCallback((values: number[], k: number) => {
    const limited = values.slice(0, MAX_LENGTH);
    setNumbers(limited);
    setKValue(k);
    setExtraSteps(buildExtraSteps(limited, k));
    setCycleSteps(buildCycleSteps(limited, k));
    setReverseSteps(buildReverseSteps(limited, k));
    setStepIndex(0);
    setIsPlaying(false);
    setCurrentStep(null);
    setLogs([]);
    processedStepRef.current = -1;
  }, []);

  useEffect(() => {
    const defaults = parseNumberList(DEFAULT_ARRAY) ?? [];
    const defaultK = Number(DEFAULT_K);
    initialize(defaults, Number.isNaN(defaultK) ? 0 : defaultK);
  }, [initialize]);

  const activeSteps = useMemo(() => {
    if (mode === "extra") return extraSteps;
    if (mode === "cycle") return cycleSteps;
    return reverseSteps;
  }, [mode, extraSteps, cycleSteps, reverseSteps]);

  const displayedStep =
    currentStep && currentStep.algorithm === mode
      ? currentStep
      : activeSteps.length
        ? activeSteps[0] ?? null
        : null;

  const normalizedK = numbers.length
    ? normalizeRotation(kValue, numbers.length)
    : 0;

  const resetPlayback = useCallback(() => {
    setStepIndex(0);
    setIsPlaying(false);
    setCurrentStep(null);
    setLogs([]);
    processedStepRef.current = -1;
  }, []);

  useEffect(() => {
    resetPlayback();
  }, [mode, resetPlayback]);

  const nextStep = useCallback(() => {
    if (!activeSteps.length) return;

    setStepIndex((previous) => {
      if (previous >= activeSteps.length) {
        setIsPlaying(false);
        return previous;
      }

      const alreadyProcessed = processedStepRef.current === previous;
      const nextIndex = previous + 1;

      if (!alreadyProcessed) {
        processedStepRef.current = previous;
        const step = activeSteps[previous];
        setCurrentStep(step);
        setLogs((prevLogs) => {
          const nextLogs = [
            ...prevLogs,
            {
              step: previous + 1,
              algorithm: step.algorithm,
              action: step.action,
              description: step.description,
            },
          ];
          return nextLogs.slice(-18);
        });
      }

      if (nextIndex >= activeSteps.length) {
        setIsPlaying(false);
      }

      return nextIndex;
    });
  }, [activeSteps]);

  useEffect(() => {
    if (!isPlaying) return;
    if (!activeSteps.length) {
      setIsPlaying(false);
      return;
    }
    if (stepIndex >= activeSteps.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      nextStep();
    }, 1400);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, activeSteps.length, nextStep]);

  const togglePlay = () => {
    if (!activeSteps.length) return;
    const finished = stepIndex >= activeSteps.length;

    if (finished) {
      resetPlayback();
      setIsPlaying(true);
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  const progress = useMemo(() => {
    if (!activeSteps.length) return 0;
    return Math.min(stepIndex / activeSteps.length, 1);
  }, [stepIndex, activeSteps.length]);

  const isComplete =
    activeSteps.length > 0 && stepIndex >= activeSteps.length;

  const handleApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedNumbers = parseNumberList(arrayInput);
    if (parsedNumbers === null || !parsedNumbers.length) {
      setArrayError("请输入有效的数组元素，例如 1, 2, 3。");
      return;
    }
    if (parsedNumbers.length > MAX_LENGTH) {
      setArrayError(`为便于展示，请输入不超过 ${MAX_LENGTH} 个数字。`);
      return;
    }

    const trimmedK = kInput.trim();
    if (!trimmedK.length) {
      setKError("请输入轮转步数 k。");
      return;
    }
    const parsedK = Number(trimmedK);
    if (!Number.isInteger(parsedK) || parsedK < 0) {
      setKError("k 需要是非负整数。");
      return;
    }

    setArrayError(null);
    setKError(null);
    initialize(parsedNumbers, parsedK);
  };

  const handleUseDefault = () => {
    setArrayInput(DEFAULT_ARRAY);
    setKInput(DEFAULT_K);
    setArrayError(null);
    setKError(null);
    const defaults = parseNumberList(DEFAULT_ARRAY) ?? [];
    const defaultK = Number(DEFAULT_K);
    initialize(defaults, Number.isNaN(defaultK) ? 0 : defaultK);
  };

  const renderArrayRow = (
    label: string,
    values: (number | null)[],
    highlightMap: Record<number, string> = {}
  ) => (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {values.map((value, index) => {
          const highlightClass =
            highlightMap[index] ?? "border-muted bg-muted/30 text-foreground";
          return (
            <motion.div
              key={`${label}-${index}`}
              layout
              className={cn(
                "relative flex h-20 w-16 flex-col items-center justify-center rounded-xl border-2 text-xl font-semibold transition-all duration-200",
                highlightClass
              )}
            >
              <span>{value === null ? "–" : value}</span>
              <span className="absolute -bottom-5 text-[10px] tracking-wide text-muted-foreground">
                {index}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderVisualization = () => {
    if (!numbers.length) {
      return (
        <div className="text-sm text-muted-foreground">
          暂无数组，请先输入数据并点击应用参数。
        </div>
      );
    }

    if (mode === "extra") {
      const step =
        displayedStep && displayedStep.algorithm === "extra"
          ? displayedStep
          : extraSteps[0] ?? null;

      const original =
        step?.originalArray ?? numbers.map((value) => value);
      const result =
        step?.resultArray ?? new Array(numbers.length).fill(null);

      const originalHighlight: Record<number, string> = {};
      const resultHighlight: Record<number, string> = {};

      if (step?.currentIndex != null) {
        originalHighlight[step.currentIndex] =
          "border-primary bg-primary/15 text-primary";
      }
      if (step?.targetIndex != null) {
        resultHighlight[step.targetIndex] =
          "border-emerald-500 bg-emerald-500/10 text-emerald-600";
      }

      return (
        <div className="space-y-6">
          {renderArrayRow("原始数组", original, originalHighlight)}
          {renderArrayRow("新数组", result, resultHighlight)}
        </div>
      );
    }

    if (mode === "cycle") {
      const step =
        displayedStep && displayedStep.algorithm === "cycle"
          ? displayedStep
          : cycleSteps[0] ?? null;
      const arrayState =
        step?.arrayState ?? numbers.map((value) => value);

      const highlightMap: Record<number, string> = {};
      if (step?.startIndex != null) {
        highlightMap[step.startIndex] =
          "border-amber-500 bg-amber-500/10 text-amber-600";
      }
      if (step?.targetIndex != null) {
        highlightMap[step.targetIndex] =
          "border-emerald-500 bg-emerald-500/10 text-emerald-600";
      }
      if (step?.currentIndex != null) {
        highlightMap[step.currentIndex] =
          "border-primary bg-primary/15 text-primary";
      }

      return renderArrayRow("当前数组", arrayState, highlightMap);
    }

    const step =
      displayedStep && displayedStep.algorithm === "reverse"
        ? displayedStep
        : reverseSteps[0] ?? null;
    const arrayState =
      step?.arrayState ?? numbers.map((value) => value);

    const highlightMap: Record<number, string> = {};
    if (step?.left != null) {
      highlightMap[step.left] =
        "border-primary bg-primary/15 text-primary";
    }
    if (step?.right != null) {
      highlightMap[step.right] =
        "border-emerald-500 bg-emerald-500/10 text-emerald-600";
    }

    return renderArrayRow("当前数组", arrayState, highlightMap);
  };

  const renderStats = () => {
    if (!numbers.length) {
      return (
        <p className="text-sm text-muted-foreground">
          当动画运行时，这里会展示算法状态。
        </p>
      );
    }

    if (!displayedStep) {
      return (
        <p className="text-sm text-muted-foreground">
          点击播放或单步执行，查看算法细节。
        </p>
      );
    }

    if (displayedStep.algorithm === "extra") {
      return (
        <div className="grid gap-3 text-sm">
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">规范化 k</div>
            <div className="font-semibold">
              {displayedStep.normalizedK} (原始 k = {kValue})
            </div>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">已放置元素</div>
            <div className="font-semibold">
              {displayedStep.placedCount} / {numbers.length}
            </div>
          </div>
          {displayedStep.currentIndex != null && (
            <div className="rounded-lg border px-3 py-2">
              <div className="text-xs text-muted-foreground">当前元素</div>
              <div className="font-semibold">
                索引 {displayedStep.currentIndex} →{" "}
                {displayedStep.targetIndex}
              </div>
            </div>
          )}
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">当前结果</div>
            <div className="font-semibold">
              {formatNullableArray(displayedStep.resultArray)}
            </div>
          </div>
        </div>
      );
    }

    if (displayedStep.algorithm === "cycle") {
      return (
        <div className="grid gap-3 text-sm">
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">规范化 k</div>
            <div className="font-semibold">
              {displayedStep.normalizedK} (原始 k = {kValue})
            </div>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">已移动元素</div>
            <div className="font-semibold">
              {displayedStep.movedCount} / {numbers.length}
            </div>
          </div>
          {displayedStep.startIndex != null && (
            <div className="rounded-lg border px-3 py-2">
              <div className="text-xs text-muted-foreground">当前环</div>
              <div className="font-semibold">
                第 {displayedStep.cycleOrder} 个环，起点 {displayedStep.startIndex}
              </div>
            </div>
          )}
          {displayedStep.currentIndex != null &&
            displayedStep.targetIndex != null && (
              <div className="rounded-lg border px-3 py-2">
                <div className="text-xs text-muted-foreground">当前移动</div>
                <div className="font-semibold">
                  {displayedStep.currentIndex} → {displayedStep.targetIndex}
                </div>
              </div>
            )}
        </div>
      );
    }

    const stageLabel = REVERSE_STAGE_LABELS[displayedStep.stage] ?? "阶段";

    return (
      <div className="grid gap-3 text-sm">
        <div className="rounded-lg border px-3 py-2">
          <div className="text-xs text-muted-foreground">规范化 k</div>
          <div className="font-semibold">
            {displayedStep.normalizedK} (原始 k = {kValue})
          </div>
        </div>
        <div className="rounded-lg border px-3 py-2">
          <div className="text-xs text-muted-foreground">当前阶段</div>
          <div className="font-semibold">
            {stageLabel} (步骤 {displayedStep.stageOrder})
          </div>
        </div>
        {(displayedStep.left != null || displayedStep.right != null) && (
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">指针位置</div>
            <div className="font-semibold">
              左 {displayedStep.left ?? "—"} / 右 {displayedStep.right ?? "—"}
            </div>
          </div>
        )}
        {displayedStep.passCount > 0 && (
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">已完成交换</div>
            <div className="font-semibold">{displayedStep.passCount}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/60 to-muted/20 p-6">
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">自定义输入</h3>
            <form className="space-y-4" onSubmit={handleApply}>
              <div className="grid gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  数组元素
                </label>
                <Input
                  value={arrayInput}
                  onChange={(event) => {
                    setArrayInput(event.target.value);
                    setArrayError(null);
                  }}
                  placeholder="示例：1, 2, 3, 4, 5, 6, 7"
                />
                <p className="text-xs text-muted-foreground">
                  使用逗号或空格分隔，最多支持 {MAX_LENGTH} 个数字。
                </p>
                {arrayError && (
                  <p className="text-xs text-destructive">{arrayError}</p>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  轮转步数 k
                </label>
                <Input
                  value={kInput}
                  onChange={(event) => {
                    setKInput(event.target.value);
                    setKError(null);
                  }}
                  placeholder="示例：3"
                />
                {kError && (
                  <p className="text-xs text-destructive">{kError}</p>
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
              当前数组：[ {numbers.join(", ")} ]，k = {kValue}
            </p>
          </div>

          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  {MODE_LABELS[mode]}
                </span>
                <span className="text-xs text-muted-foreground">
                  步骤 {Math.min(stepIndex + 1, activeSteps.length || 1)} /{" "}
                  {activeSteps.length || 1}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={mode === "extra" ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => setMode("extra")}
                >
                  额外数组
                </Button>
                <Button
                  type="button"
                  variant={mode === "cycle" ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => setMode("cycle")}
                >
                  环形替换
                </Button>
                <Button
                  type="button"
                  variant={mode === "reverse" ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => setMode("reverse")}
                >
                  三次反转
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={togglePlay}
                  disabled={!activeSteps.length}
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
                  disabled={isPlaying || !activeSteps.length || isComplete}
                  className="flex items-center gap-2"
                >
                  <StepForward className="h-4 w-4" />
                  单步
                </Button>
                <Button
                  onClick={resetPlayback}
                  type="button"
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  重置
                </Button>
              </div>

              <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                ></div>
              </div>

              <AnimatePresence mode="wait">
                {displayedStep ? (
                  <motion.div
                    key={`${displayedStep.algorithm}-${displayedStep.action}-${stepIndex}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-primary text-sm"
                  >
                    <div className="text-xs uppercase tracking-wide">
                      {ACTION_LABELS[displayedStep.action]}
                    </div>
                    <p className="text-primary/90">{displayedStep.description}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="rounded-lg border border-muted px-3 py-2 text-muted-foreground text-sm"
                  >
                    点击播放或单步执行，查看数组轮转过程。
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background/80 p-6 shadow-sm">
          {renderVisualization()}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">状态速览</h4>
            {renderStats()}
          </div>

          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">执行日志</h4>
            <div className="h-56 overflow-auto rounded-lg bg-muted/20 p-3">
              {logs.length ? (
                <ul className="space-y-2 text-xs leading-relaxed">
                  {logs.map((log) => (
                    <li
                      key={`${log.step}-${log.algorithm}-${log.action}`}
                      className="rounded-md bg-background/70 p-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">
                          步骤 {log.step}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {MODE_LABELS[log.algorithm]} · {ACTION_LABELS[log.action]}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {log.description}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  暂无日志
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

