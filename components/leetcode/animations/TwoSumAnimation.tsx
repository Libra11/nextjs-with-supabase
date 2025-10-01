/**
 * Two Sum Animation Component
 * Visualizes the Two Sum algorithm using hash map approach
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Pause } from "lucide-react";

interface ArrayItem {
  value: number;
  index: number;
}

export default function TwoSumAnimation() {
  const nums: ArrayItem[] = [
    { value: 2, index: 0 },
    { value: 7, index: 1 },
    { value: 11, index: 2 },
    { value: 15, index: 3 },
  ];
  const target = 9;

  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [hashMap, setHashMap] = useState<Record<number, number>>({});
  const [found, setFound] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (step < nums.length) {
        nextStep();
      } else {
        setIsPlaying(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, step]);

  const nextStep = () => {
    if (step >= nums.length) return;

    const current = nums[step];
    const complement = target - current.value;

    setCurrentIndex(step);

    // Check if complement exists in hash map
    if (complement in hashMap) {
      setFound([hashMap[complement], step]);
      setStep(step + 1);
      setIsPlaying(false);
    } else {
      // Add current value to hash map
      setHashMap((prev) => ({ ...prev, [current.value]: step }));
      setStep(step + 1);
    }
  };

  const reset = () => {
    setStep(0);
    setCurrentIndex(-1);
    setHashMap({});
    setFound(null);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (step >= nums.length && !found) {
      reset();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full h-[400px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">两数之和算法演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          目标和: <span className="font-semibold text-primary">{target}</span>
        </p>
      </div>

      {/* Array Visualization */}
      <div className="flex-1 flex items-center justify-center gap-4 mb-6">
        {nums.map((item, idx) => (
          <motion.div
            key={idx}
            className={`
              w-20 h-20 rounded-lg flex flex-col items-center justify-center
              border-2 transition-colors
              ${
                found && (found[0] === idx || found[1] === idx)
                  ? "bg-green-500 text-white border-green-600"
                  : currentIndex === idx
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border"
              }
            `}
            animate={{
              scale: currentIndex === idx ? 1.1 : 1,
              y: currentIndex === idx ? -10 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-xs opacity-70">index: {idx}</div>
          </motion.div>
        ))}
      </div>

      {/* Hash Map Visualization */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Hash Map:</p>
        <div className="bg-card border border-border rounded-lg p-3 min-h-[60px]">
          <AnimatePresence>
            {Object.entries(hashMap).length === 0 ? (
              <p className="text-sm text-muted-foreground">空</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(hashMap).map(([value, index]) => (
                  <motion.div
                    key={value}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                  >
                    {value} → {index}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Result */}
      {found && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 dark:bg-green-900/30 border border-green-500 rounded-lg p-3 mb-4 text-center"
        >
          <p className="text-green-800 dark:text-green-200 font-medium">
            找到答案! 索引: [{found[0]}, {found[1]}]
          </p>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
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
    </div>
  );
}
