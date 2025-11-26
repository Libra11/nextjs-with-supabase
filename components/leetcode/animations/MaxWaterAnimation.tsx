"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
  FormEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, ArrowRight, Droplet } from "lucide-react";

type StepAction = "move-left" | "move-right";

interface StepLog {
  step: number;
  left: number;
  right: number;
  width: number;
  minHeight: number;
  area: number;
  action: StepAction;
  description: string;
}

interface AreaSnapshot {
  left: number;
  right: number;
  width: number;
  minHeight: number;
  leftHeight: number;
  rightHeight: number;
  area: number;
}

const DEFAULT_HEIGHTS = [1, 8, 6, 2, 5, 4, 8, 3, 7];
const MAX_SUPPORTED_LENGTH = 12;

export default function MaxWaterAnimation() {
  const [heights, setHeights] = useState<number[]>([...DEFAULT_HEIGHTS]);
  const [pointers, setPointers] = useState<{ left: number; right: number }>({
    left: 0,
    right: DEFAULT_HEIGHTS.length - 1,
  });
  const [step, setStep] = useState(0);
  const [maxArea, setMaxArea] = useState(0);
  const [bestPair, setBestPair] = useState<[number, number] | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<AreaSnapshot | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [arrayInput, setArrayInput] = useState(DEFAULT_HEIGHTS.join(", "));
  const [inputError, setInputError] = useState<string | null>(null);
  const barsContainerRef = useRef<HTMLDivElement | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [waterOverlay, setWaterOverlay] = useState<{
    left: number;
    width: number;
    height: number;
    top: number;
    area: number;
    leftIndex: number;
    rightIndex: number;
  } | null>(null);

  useEffect(() => {
    barRefs.current = barRefs.current.slice(0, heights.length);
  }, [heights.length]);

  const totalSteps = useMemo(
    () => Math.max(heights.length - 1, 0),
    [heights.length],
  );
  const progress = totalSteps ? Math.min(step / totalSteps, 1) : 0;
  const finished =
    heights.length < 2 || pointers.left >= pointers.right || heights.length === 0;

  const maxHeightValue = useMemo(() => {
    if (!heights.length) return 1;
    return Math.max(...heights, 1);
  }, [heights]);

  const upcomingSnapshot = useMemo(() => {
    if (
      heights.length < 2 ||
      pointers.left < 0 ||
      pointers.right < 0 ||
      pointers.left >= heights.length ||
      pointers.right >= heights.length ||
      pointers.left >= pointers.right
    ) {
      return null;
    }

    const leftHeight = heights[pointers.left];
    const rightHeight = heights[pointers.right];
    const width = pointers.right - pointers.left;
    const minHeight = Math.min(leftHeight, rightHeight);

    return {
      left: pointers.left,
      right: pointers.right,
      width,
      minHeight,
      leftHeight,
      rightHeight,
      area: width * minHeight,
    };
  }, [heights, pointers]);

  useLayoutEffect(() => {
    if (!upcomingSnapshot || !barsContainerRef.current) {
      setWaterOverlay(null);
      return;
    }

    const computeOverlay = () => {
      const container = barsContainerRef.current;
      if (!container) return;

      const leftEl = barRefs.current[upcomingSnapshot.left];
      const rightEl = barRefs.current[upcomingSnapshot.right];
      if (!leftEl || !rightEl) {
        setWaterOverlay(null);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();
      const containerStyles = window.getComputedStyle(container);
      const paddingBottom = parseFloat(containerStyles.paddingBottom || "0");
      const baseline = containerRect.height - paddingBottom;

      const startX =
        leftRect.left - containerRect.left + leftRect.width;
      const endX = rightRect.left - containerRect.left;
      const width = Math.max(endX - startX, 0);
      const shorterHeight = Math.min(leftRect.height, rightRect.height);
      if (width <= 0 || shorterHeight <= 0) {
        setWaterOverlay(null);
        return;
      }
      const top = Math.max(baseline - shorterHeight, 0);

      setWaterOverlay({
        left: startX,
        width,
        height: shorterHeight,
        top,
        area: upcomingSnapshot.area,
        leftIndex: upcomingSnapshot.left,
        rightIndex: upcomingSnapshot.right,
      });
    };

    computeOverlay();
    window.addEventListener("resize", computeOverlay);
    return () => {
      window.removeEventListener("resize", computeOverlay);
    };
  }, [upcomingSnapshot]);

  const performStep = useCallback(() => {
    if (
      heights.length < 2 ||
      pointers.left < 0 ||
      pointers.right < 0 ||
      pointers.left >= heights.length ||
      pointers.right >= heights.length ||
      pointers.left >= pointers.right
    ) {
      return;
    }

    const leftIdx = pointers.left;
    const rightIdx = pointers.right;
    const leftHeight = heights[leftIdx];
    const rightHeight = heights[rightIdx];
    const width = rightIdx - leftIdx;
    const minHeight = Math.min(leftHeight, rightHeight);
    const area = width * minHeight;
    const action: StepAction =
      leftHeight <= rightHeight ? "move-left" : "move-right";

    setLastSnapshot({
      left: leftIdx,
      right: rightIdx,
      width,
      minHeight,
      leftHeight,
      rightHeight,
      area,
    });

    setLogs((prev) => [
      ...prev,
      {
        step: prev.length + 1,
        left: leftIdx,
        right: rightIdx,
        width,
        minHeight,
        area,
        action,
        description:
          action === "move-left"
            ? `左边较短（${leftHeight} ≤ ${rightHeight}），右移 left 指针尝试寻找更高的左边界。`
            : `右边较短（${rightHeight} < ${leftHeight}），左移 right 指针期望提升短板高度。`,
      },
    ]);

    if (area > maxArea) {
      setMaxArea(area);
      setBestPair([leftIdx, rightIdx]);
    }

    const nextPointers =
      action === "move-left"
        ? { left: leftIdx + 1, right: rightIdx }
        : { left: leftIdx, right: rightIdx - 1 };

    setPointers(nextPointers);
    setStep((prev) => prev + 1);

    if (
      nextPointers.left >= nextPointers.right ||
      nextPointers.left < 0 ||
      nextPointers.right < 0
    ) {
      setIsPlaying(false);
    }
  }, [heights, pointers, maxArea]);

  useEffect(() => {
    if (!isPlaying) return;
    if (finished) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      performStep();
    }, 1600);

    return () => clearTimeout(timer);
  }, [isPlaying, finished, performStep]);

  const reset = (values?: number[]) => {
    const next = values ? [...values] : [...heights];
    const rightIndex = next.length ? next.length - 1 : 0;

    setHeights(next);
    setPointers({ left: 0, right: rightIndex });
    setStep(0);
    setMaxArea(0);
    setBestPair(null);
    setLastSnapshot(null);
    setLogs([]);
    setIsPlaying(false);
  };

  const applyArray = (values: number[]) => {
    const cloned = [...values];
    setHeights(cloned);
    setPointers({ left: 0, right: cloned.length - 1 });
    setStep(0);
    setMaxArea(0);
    setBestPair(null);
    setLastSnapshot(null);
    setLogs([]);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (finished) {
      reset();
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleNext = () => {
    if (!finished) {
      performStep();
    }
  };

  const handleApplyInput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const segments = arrayInput
      .split(/[\s,，]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length < 2) {
      setInputError("请至少输入两个非负整数，高度表示每根柱子的高度。");
      return;
    }

    if (segments.length > MAX_SUPPORTED_LENGTH) {
      setInputError(
        `为保证动画效果，请输入不超过 ${MAX_SUPPORTED_LENGTH} 个高度值。`,
      );
      return;
    }

    const parsed = segments.map((segment) => Number(segment));

    if (parsed.some((value) => Number.isNaN(value))) {
      setInputError("检测到无法解析的数字，请仅输入整数并使用逗号或空格分隔。");
      return;
    }

    if (parsed.some((value) => value < 0)) {
      setInputError("高度必须为非负整数。");
      return;
    }

    if (parsed.some((value) => !Number.isInteger(value))) {
      setInputError("为了便于展示，请输入整数高度。");
      return;
    }

    setInputError(null);
    setArrayInput(parsed.join(", "));
    applyArray(parsed);
  };

  const handleUseDefault = () => {
    setArrayInput(DEFAULT_HEIGHTS.join(", "));
    setInputError(null);
    applyArray([...DEFAULT_HEIGHTS]);
  };

  const latestLog = logs[logs.length - 1] ?? null;

  const bestSnapshot = useMemo(() => {
    if (!bestPair) return null;
    const [leftIdx, rightIdx] = bestPair;
    if (
      leftIdx < 0 ||
      rightIdx < 0 ||
      leftIdx >= heights.length ||
      rightIdx >= heights.length ||
      leftIdx >= rightIdx
    ) {
      return null;
    }
    const leftHeight = heights[leftIdx];
    const rightHeight = heights[rightIdx];
    const width = rightIdx - leftIdx;

    return {
      left: leftIdx,
      right: rightIdx,
      minHeight: Math.min(leftHeight, rightHeight),
      width,
      area: width * Math.min(leftHeight, rightHeight),
      leftHeight,
      rightHeight,
    };
  }, [bestPair, heights]);

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">盛最多水的容器 - 双指针动画</h3>
        <p className="text-sm text-muted-foreground mt-1">
          左右指针向内收缩，每次选择较短边移动，尝试在 O(n) 时间内找到最大面积。
        </p>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleApplyInput}
        className="mb-6 bg-card border border-border rounded-lg p-4 flex flex-col gap-3"
      >
        <label className="text-xs font-medium text-muted-foreground">
          自定义高度数组
        </label>
        <div className="flex flex-col lg:flex-row gap-3">
          <Input
            value={arrayInput}
            onChange={(event) => setArrayInput(event.target.value)}
            placeholder="例如：1, 8, 6, 2, 5, 4, 8, 3, 7"
          />
          <div className="flex gap-2">
            <Button type="submit">应用数组</Button>
            <Button variant="secondary" type="button" onClick={handleUseDefault}>
              使用示例
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          使用逗号或空格分隔，每次实验建议 2 - {MAX_SUPPORTED_LENGTH} 个高度值。
        </p>
        {inputError && (
          <p className="text-xs text-destructive">{inputError}</p>
        )}
      </form>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button onClick={togglePlay} variant="default">
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                暂停
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {finished ? "重新开始" : "播放"}
              </>
            )}
          </Button>
          <Button onClick={handleNext} type="button" variant="outline">
            <ArrowRight className="w-4 h-4 mr-2" />
            单步执行
          </Button>
          <Button onClick={() => reset()} type="button" variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Droplet className="w-4 h-4 text-primary" />
          <span>
            最大水量：{" "}
            <span className="font-semibold text-foreground">{maxArea}</span>
          </span>
          {bestSnapshot && (
            <span className="text-xs text-muted-foreground/80">
              (索引 {bestSnapshot.left} 与 {bestSnapshot.right})
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>迭代进度</span>
          <span>
            {Math.min(step, totalSteps)} / {totalSteps || 1} 步
          </span>
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

      {/* Bars Visualization */}
      <div className="relative mb-6">
        <div
          ref={barsContainerRef}
          className="relative min-h-[240px] flex items-end justify-center gap-4 px-4 pb-10"
        >
          <AnimatePresence>
            {!finished && waterOverlay && (
              <motion.div
                key={`water-${waterOverlay.leftIndex}-${waterOverlay.rightIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute pointer-events-none z-0 flex items-center justify-center"
                style={{
                  left: waterOverlay.left,
                  top: waterOverlay.top,
                  width: waterOverlay.width,
                  height: waterOverlay.height,
                }}
              >
                <div className="w-full h-full bg-blue-500/20 border-2 border-blue-500/40 rounded-sm flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600 relative z-10">
                    面积: {waterOverlay.area}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {heights.map((value, idx) => {
            const barHeight =
              value === 0
                ? 6
                : Math.max((value / maxHeightValue) * 200, 12);
            const isLeft =
              !finished &&
              idx === pointers.left &&
              pointers.left < heights.length;
            const isRight =
              !finished &&
              idx === pointers.right &&
              pointers.right < heights.length;
            const isBest =
              bestPair !== null &&
              (idx === bestPair[0] || idx === bestPair[1]);
            const highlight =
              (isLeft || isRight) && (!bestPair || !isBest)
                ? "border-primary bg-primary/20"
                : "border-border bg-muted/60";

            return (
              <motion.div
                key={`${idx}-${value}`}
                layout
                className={`relative w-12 flex flex-col items-center justify-end`}
              >
                <span className="text-[10px] text-muted-foreground/70 mb-1">
                  #{idx}
                </span>
                <motion.div
                  ref={(element) => {
                    barRefs.current[idx] = element ?? null;
                  }}
                  layout
                  className={`w-full rounded-t-md border ${highlight} flex items-end justify-center relative overflow-visible`}
                  style={{ height: `${barHeight}px` }}
                  animate={{
                    scale: isBest ? 1.05 : isLeft || isRight ? 1.03 : 1,
                    y: isLeft || isRight ? -6 : 0,
                  }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="text-xs font-semibold text-muted-foreground relative z-20">
                    {value}
                  </span>
                </motion.div>
                {(isLeft || isRight) && (
                  <div className="absolute -bottom-7 flex items-center gap-1">
                    {isLeft && (
                      <span className="px-2 py-0.5 rounded-full border border-primary/40 bg-primary/15 text-[10px] text-primary">
                        left
                      </span>
                    )}
                    {isRight && (
                      <span className="px-2 py-0.5 rounded-full border border-primary/40 bg-primary/15 text-[10px] text-primary">
                        right
                      </span>
                    )}
                  </div>
                )}
                {isBest && (
                  <span className="absolute -top-5 text-[10px] text-primary font-semibold">
                    最优
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            最近一次计算
          </p>
          {lastSnapshot ? (
            <div className="text-sm space-y-1">
              <p>
                指针 ({lastSnapshot.left}, {lastSnapshot.right}) → 宽度{" "}
                {lastSnapshot.width}
              </p>
              <p>
                较短高度 {lastSnapshot.minHeight}，面积{" "}
                <span className="font-semibold">
                  {lastSnapshot.width} × {lastSnapshot.minHeight} ={" "}
                  {lastSnapshot.area}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              点击播放或单步执行，查看面积计算过程。
            </p>
          )}
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            下一步预览
          </p>
          {upcomingSnapshot ? (
            <div className="text-sm space-y-1">
              <p>
                即将比较索引 ({upcomingSnapshot.left},{" "}
                {upcomingSnapshot.right})
              </p>
              <p>
                宽度 {upcomingSnapshot.width}，边界高度为{" "}
                {upcomingSnapshot.leftHeight} / {upcomingSnapshot.rightHeight}
              </p>
              <p className="text-xs text-muted-foreground/80">
                预估面积 {upcomingSnapshot.area}，移动{" "}
                {upcomingSnapshot.leftHeight <= upcomingSnapshot.rightHeight
                  ? "左指针"
                  : "右指针"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              双指针已相遇，所有组合均已考察。
            </p>
          )}
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            当前最优解
          </p>
          {bestSnapshot ? (
            <div className="text-sm space-y-1">
              <p>
                索引 ({bestSnapshot.left}, {bestSnapshot.right})，宽度{" "}
                {bestSnapshot.width}
              </p>
              <p>
                高度 min({bestSnapshot.leftHeight}, {bestSnapshot.rightHeight}){" "}
                = {bestSnapshot.minHeight}
              </p>
              <p className="font-semibold text-primary">
                面积 {bestSnapshot.width} × {bestSnapshot.minHeight} ={" "}
                {bestSnapshot.area}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              目前还没有发现更优的容器，正在探索中。
            </p>
          )}
        </motion.div>
      </div>

      {/* Logs */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-muted-foreground">
            迭代日志
          </p>
          {latestLog && (
            <span className="text-xs text-muted-foreground">
              最新：第 {latestLog.step} 步
            </span>
          )}
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {logs.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                日志为空。播放动画以查看每次指针移动的原因。
              </motion.p>
            ) : (
              logs.map((log) => (
                <motion.div
                  key={log.step}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-xs bg-muted/70 rounded-md px-3 py-2 border border-border/70"
                >
                  <p className="font-semibold text-muted-foreground">
                    第 {log.step} 步 · 面积 {log.area}
                  </p>
                  <p className="text-muted-foreground/80 mt-1">{log.description}</p>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
