"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, ArrowRightLeft } from "lucide-react";

interface StepLog {
  step: number;
  fast: number;
  slow: number;
  swapped: boolean;
  description: string;
}

const INITIAL_ARRAY = [0, 1, 0, 3, 12];

export default function MoveZeroesAnimation() {
  const [array, setArray] = useState<number[]>([...INITIAL_ARRAY]);
  const [slow, setSlow] = useState(0);
  const [fast, setFast] = useState(0);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<StepLog[]>([]);

  const progress = useMemo(() => {
    return array.length === 0
      ? 1
      : Math.min(fast / array.length, 1);
  }, [fast, array.length]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (fast < array.length) {
        nextStepInternal();
      } else {
        setIsPlaying(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, fast, array.length]);

  const reset = () => {
    setArray([...INITIAL_ARRAY]);
    setSlow(0);
    setFast(0);
    setStep(0);
    setLogs([]);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (fast >= array.length) {
      reset();
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const nextStepInternal = () => {
    if (fast >= array.length) return;

    const current = array[fast];
    setStep((prev) => prev + 1);

    if (current !== 0) {
      const swapped = slow !== fast;
      setArray((prev) => {
        const next = [...prev];
        if (swapped) {
          [next[slow], next[fast]] = [next[fast], next[slow]];
        }
        return next;
      });

      setLogs((prev) => [
        ...prev,
        {
          step: prev.length + 1,
          fast,
          slow,
          swapped,
          description: swapped
            ? `fast=${fast} 指向非零 ${current}，与 slow=${slow} 交换，将其移动到前面。`
            : `fast=${fast} 指向非零 ${current}，slow 与 fast 相同，无需交换。`,
        },
      ]);

      setSlow((prev) => prev + 1);
    } else {
      setLogs((prev) => [
        ...prev,
        {
          step: prev.length + 1,
          fast,
          slow,
          swapped: false,
          description: `fast=${fast} 位置是 0，保持 slow=${slow}，继续向后查找非零元素。`,
        },
      ]);
    }

    setFast((prev) => prev + 1);
  };

  const handleNext = () => {
    if (fast < array.length) {
      nextStepInternal();
    }
  };

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">移动零 - 双指针演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          快慢指针协同将非零元素前移，最后补零保持顺序。
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>阶段：交换版本（无额外补零）</span>
          <span>
            slow: {slow} | fast: {fast} | step: {step}
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

      {/* Array Visualization */}
      <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
        {array.map((value, idx) => {
          const isFast = fast === idx;
          const isSlow = slow === idx && slow < array.length;

          return (
            <motion.div
              key={`${value}-${idx}-${step}`}
              layout
              className={`relative w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center text-lg font-semibold ${
                idx < slow
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-card border-border text-foreground"
              }`}
              animate={{
                scale: isFast ? 1.08 : 1,
                y: isFast ? -10 : 0,
              }}
              transition={{ duration: 0.25 }}
            >
              {value}
              {(isFast || isSlow) && (
                <div className="absolute -bottom-6 flex items-center gap-1">
                  {isFast && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                      fast
                    </span>
                  )}
                  {isSlow && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                      slow
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Explanation Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">当前步骤</p>
          {fast < array.length ? (
            <p className="text-sm">
              fast 指向索引 {fast}，元素 {array[fast]}。
              {array[fast] !== 0
                ? " 触发与 slow 指针对应元素的交换，保持非零元素向前。"
                : " 遇到 0，fast 前进，slow 保持不动等待下一个非零元素。"}
            </p>
          ) : (
            <p className="text-sm">
              遍历完成，所有非零元素按相对顺序排列在数组前部，零被自然推至尾部。
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            slow 指向下一个非零元素要放的位置，fast 负责遍历寻找非零元素。
          </p>
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">算法要点</p>
          <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
            <li>① fast 遍历数组，slow 追踪下一个非零放置的位置。</li>
            <li>② fast 遇到非零时，与 slow 位置元素进行交换。</li>
            <li>③ slow 仅在成功放置非零后自增，维持元素相对顺序。</li>
            <li>④ 使用交换实现原地移动，零会自然移动到数组末尾。</li>
          </ul>
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">执行轨迹</p>
          <div className="flex-1 overflow-hidden">
            <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
              <AnimatePresence initial={false}>
                {logs.length === 0 ? (
                  <motion.p
                    key="empty-log"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-muted-foreground"
                  >
                    每一步的快慢指针操作都会记录在这里。
                  </motion.p>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      key={log.step}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`rounded-md border px-2 py-1.5 text-xs ${
                        log.swapped
                          ? "border-sky-400/60 bg-sky-500/10 text-sky-700 dark:text-sky-200"
                          : "border-border/60 bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <p className="font-medium text-[11px] uppercase tracking-wide text-muted-foreground">
                        Step {log.step}
                      </p>
                      <p className="mt-0.5 leading-relaxed text-[11px] text-foreground">
                        {log.description}
                      </p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
          {logs.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              最近：slow={logs[logs.length - 1].slow}, fast=
              {logs[logs.length - 1].fast}
            </p>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button
          onClick={handleNext}
          size="sm"
          variant="secondary"
          disabled={isPlaying || fast >= array.length}
        >
          单步
        </Button>
        <Button onClick={togglePlay} size="sm">
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              暂停
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {step === 0 ? "开始" : "继续"}
            </>
          )}
        </Button>
        <Button onClick={reset} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          重置
        </Button>
      </div>

      {/* Hint */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground flex justify-center items-center gap-1">
          <ArrowRightLeft className="w-3 h-3" />
          快慢指针的交换操作只在发现非零元素时触发，零会自然向后移动。
        </p>
      </div>
    </div>
  );
}
