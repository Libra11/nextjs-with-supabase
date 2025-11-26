"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Types
type CellType = "0" | "1";
type CellStatus = "water" | "land" | "visited" | "current" | "scanning";

interface GridCell {
  row: number;
  col: number;
  value: CellType;
  status: CellStatus;
  islandId?: number; // Which island this cell belongs to
}

interface AnimationStep {
  id: number;
  title: string;
  description: string;
  gridState: GridCell[][];
  currentCell: [number, number] | null;
  islandCount: number;
  scanPos: [number, number] | null; // Current position in the outer loop
  action: "scan" | "found" | "dfs-visit" | "dfs-backtrack" | "finished";
}

const DEFAULT_GRID_INPUT = `11110
11010
11000
00000`;

const CELL_SIZE = 60;

export default function NumIslandsAnimation() {
  const [inputStr, setInputStr] = useState(DEFAULT_GRID_INPUT);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [steps, setSteps] = useState<AnimationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    handleApply();
  }, []);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    // Speed up scanning steps, slow down DFS steps
    const currentAction = steps[currentStepIndex]?.action;
    const delay = currentAction === "scan" ? 100 : 600;

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps]);

  const handleApply = (e?: FormEvent) => {
    e?.preventDefault();
    try {
      const parsedGrid = parseGridInput(inputStr);
      setGrid(parsedGrid);
      const generatedSteps = generateSteps(parsedGrid);
      setSteps(generatedSteps);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Invalid input");
      setSteps([]);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const currentStep = steps[currentStepIndex];
  const displayGrid = currentStep?.gridState || grid;

  return (
    <div className="space-y-6 w-full">
      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">岛屿数量动画演示</h3>
            <p className="text-sm text-muted-foreground">
              使用深度优先搜索 (DFS) 遍历网格，统计连通的陆地区域数量。
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              网格配置 (0: 水, 1: 陆地)
            </label>
            <Textarea
              value={inputStr}
              onChange={(e) => setInputStr(e.target.value)}
              placeholder="11000\n11000..."
              className="font-mono min-h-[100px]"
            />
            <p className="text-[10px] text-muted-foreground">
              每行输入一行网格，用换行分隔。字符只允许 '0' 和 '1'。
            </p>
          </div>
          <div className="flex flex-col justify-end gap-2 min-w-[80px]">
            <Button onClick={handleApply} className="w-full">
              应用
            </Button>
            <Button variant="outline" onClick={handleReset} className="w-full">
              重置
            </Button>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Visualization */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left: Grid */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-center min-h-[400px] overflow-auto">
          {displayGrid.length > 0 ? (
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${displayGrid[0].length}, ${CELL_SIZE}px)`,
              }}
            >
              {displayGrid.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  const isCurrent =
                    currentStep?.currentCell?.[0] === rIdx &&
                    currentStep?.currentCell?.[1] === cIdx;
                  const isScan =
                    currentStep?.scanPos?.[0] === rIdx &&
                    currentStep?.scanPos?.[1] === cIdx;

                  return (
                    <motion.div
                      key={`${rIdx}-${cIdx}`}
                      layout
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                        opacity: isScan ? 0.8 : 1,
                      }}
                      className={`
                        w-[60px] h-[60px] rounded-md flex items-center justify-center text-lg font-bold border transition-colors duration-300
                        ${getCellColor(cell, isCurrent, isScan)}
                      `}
                    >
                      {cell.value === "1" && cell.status === "visited"
                        ? cell.islandId
                        : cell.value}
                    </motion.div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">暂无网格数据</div>
          )}

          {/* Playback Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 p-2 rounded-lg border border-border shadow-lg backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setCurrentStepIndex(
                  Math.min(steps.length - 1, currentStepIndex + 1)
                )
              }
              disabled={currentStepIndex >= steps.length - 1}
            >
              <StepForward className="h-4 w-4" />
            </Button>
            <div className="text-xs text-muted-foreground w-20 text-center tabular-nums">
              {currentStepIndex + 1} / {steps.length}
            </div>
          </div>
        </div>

        {/* Right: Status */}
        <div className="flex flex-col gap-4 h-full">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sm">当前统计</h4>
              <Badge variant="default" className="text-base px-3">
                岛屿数量: {currentStep?.islandCount || 0}
              </Badge>
            </div>

            {currentStep ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">当前动作:</span>
                    <Badge
                      variant={
                        currentStep.action === "scan" ? "secondary" : "outline"
                      }
                    >
                      {getActionLabel(currentStep.action)}
                    </Badge>
                  </div>
                  {currentStep.currentCell && (
                    <div className="flex justify-between items-center border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">处理坐标:</span>
                      <span className="font-mono">
                        [{currentStep.currentCell[0]},{" "}
                        {currentStep.currentCell[1]}]
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground leading-relaxed bg-card p-2 rounded border border-border/50">
                  <span className="font-semibold text-foreground block mb-1">
                    {currentStep.title}
                  </span>
                  {currentStep.description}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center">
                准备开始
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-1">
            <h4 className="font-semibold text-sm mb-2">图例</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-mono">
                  0
                </div>
                <span>水 (0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-600 text-white flex items-center justify-center font-mono">
                  1
                </div>
                <span>未发现陆地 (1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-200 border border-emerald-300 text-emerald-800 flex items-center justify-center font-mono">
                  1
                </div>
                <span>已归属岛屿 (显示ID)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-400 border border-orange-500 text-white flex items-center justify-center font-mono"></div>
                <span>当前处理节点</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-400 flex items-center justify-center font-mono"></div>
                <span>扫描位置</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Logic & Helpers ---

function getCellColor(
  cell: GridCell,
  isCurrent: boolean,
  isScan: boolean
): string {
  if (isCurrent)
    return "bg-orange-400 border-orange-500 text-white shadow-lg z-10";
  if (isScan) return "bg-yellow-100 border-yellow-400 text-yellow-700";

  if (cell.status === "visited") {
    // Generate a distinct-ish color based on island ID if needed, or just uniform
    // For simplicity, let's use a lighter green indicating "processed land"
    return "bg-emerald-200 border-emerald-400 text-emerald-800";
  }

  if (cell.value === "1") return "bg-emerald-500 border-emerald-600 text-white";

  // Water
  return "bg-blue-50 border-blue-200 text-blue-300";
}

function getActionLabel(action: string): string {
  switch (action) {
    case "scan":
      return "扫描网格";
    case "found":
      return "发现新岛屿";
    case "dfs-visit":
      return "DFS 扩展";
    case "dfs-backtrack":
      return "DFS 回溯";
    case "finished":
      return "完成";
    default:
      return action;
  }
}

function parseGridInput(input: string): GridCell[][] {
  const rows = input.trim().split("\n");
  return rows.map((rowStr, r) =>
    rowStr
      .trim()
      .split("")
      .map((char, c) => {
        if (char !== "0" && char !== "1")
          throw new Error(
            `Invalid character at row ${r + 1}, col ${c + 1}: ${char}`
          );
        return {
          row: r,
          col: c,
          value: char as CellType,
          status: char === "1" ? "land" : "water",
        };
      })
  );
}

function generateSteps(initialGrid: GridCell[][]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const rows = initialGrid.length;
  if (rows === 0) return steps;
  const cols = initialGrid[0].length;

  // Deep copy helper
  const cloneGrid = (g: GridCell[][]) =>
    g.map((row) => row.map((c) => ({ ...c })));

  let stepId = 0;
  let islandCount = 0;
  const currentGrid = cloneGrid(initialGrid);

  // Directions: Up, Right, Down, Left
  const dirs = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  function dfs(r: number, c: number, id: number) {
    // Mark as visited
    currentGrid[r][c].status = "visited";
    currentGrid[r][c].islandId = id;

    steps.push({
      id: stepId++,
      title: "DFS 扩展",
      description: `将坐标 [${r}, ${c}] 标记为岛屿 ${id} 的一部分，并尝试向四周扩展。`,
      gridState: cloneGrid(currentGrid),
      currentCell: [r, c],
      islandCount,
      scanPos: [r, c],
      action: "dfs-visit",
    });

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;

      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        currentGrid[nr][nc].status === "land"
      ) {
        dfs(nr, nc, id);
      }
    }

    // Backtrack step (optional visual, good for understanding)
    steps.push({
      id: stepId++,
      title: "DFS 回溯",
      description: `坐标 [${r}, ${c}] 的所有方向已探索完毕，返回上一层。`,
      gridState: cloneGrid(currentGrid),
      currentCell: [r, c],
      islandCount,
      scanPos: [r, c],
      action: "dfs-backtrack",
    });
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Scan Step
      steps.push({
        id: stepId++,
        title: "扫描网格",
        description: `检查坐标 [${r}, ${c}]。当前值: ${currentGrid[r][c].value}`,
        gridState: cloneGrid(currentGrid),
        currentCell: null,
        islandCount,
        scanPos: [r, c],
        action: "scan",
      });

      if (currentGrid[r][c].status === "land") {
        islandCount++;

        steps.push({
          id: stepId++,
          title: "发现新岛屿!",
          description: `坐标 [${r}, ${c}] 是未访问的陆地。岛屿计数 +1 (当前: ${islandCount})。开始 DFS 标记整个岛屿。`,
          gridState: cloneGrid(currentGrid),
          currentCell: [r, c],
          islandCount,
          scanPos: [r, c],
          action: "found",
        });

        dfs(r, c, islandCount);
      }
    }
  }

  steps.push({
    id: stepId++,
    title: "完成",
    description: `遍历结束。总共发现 ${islandCount} 个岛屿。`,
    gridState: cloneGrid(currentGrid),
    currentCell: null,
    islandCount,
    scanPos: null,
    action: "finished",
  });

  return steps;
}
