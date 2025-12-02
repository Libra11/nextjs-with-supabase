"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Play, Pause, RotateCcw, StepForward, CheckCircle2, AlertCircle } from "lucide-react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  NodeTypes,
  Position,
  ReactFlowInstance,
  useNodesState,
  useEdgesState,
} from "reactflow";
import dagre from "dagre";
import { motion, AnimatePresence } from "framer-motion";
import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// --- Types ---

type NodeStatus = "idle" | "ready" | "processing" | "completed" | "visited";

interface CourseNodeData {
  label: string;
  inDegree: number;
  status: NodeStatus;
}

interface AnimationStep {
  id: number;
  title: string;
  description: string;
  nodes: { id: string; status: NodeStatus; inDegree: number }[];
  edges: { id: string; active: boolean }[];
  queue: string[];
  learnedCount: number;
  currentCourse: string | null;
  status: "running" | "success" | "failure";
}

// --- Constants ---

const NODE_WIDTH = 60;
const NODE_HEIGHT = 60;
const ANIMATION_SPEED = 1000;
const DEFAULT_NUM_COURSES = 4;
const DEFAULT_PREREQS = `[[1,0],
[2,1],
[3,2],
[1,3]]`; // Cycle
const INITIAL_PREREQS = `[[1,0],
[2,1],
[3,1]]`; // Solvable

// --- Custom Node Component ---

const CourseNode = ({ data }: NodeProps<CourseNodeData>) => {
  const { label, inDegree, status } = data;

  let bgColor = "bg-card";
  let borderColor = "border-border";
  let textColor = "text-foreground";
  let shadow = "";
  let scale = 1;

  if (status === "processing") {
    bgColor = "bg-orange-500/20";
    borderColor = "border-orange-500";
    textColor = "text-orange-600";
    shadow = "shadow-[0_0_20px_rgba(249,115,22,0.4)]";
    scale = 1.1;
  } else if (status === "completed") {
    bgColor = "bg-emerald-500/20";
    borderColor = "border-emerald-500";
    textColor = "text-emerald-600";
  } else if (status === "ready") {
    bgColor = "bg-blue-500/20";
    borderColor = "border-blue-500";
    textColor = "text-blue-600";
    shadow = "shadow-[0_0_15px_rgba(59,130,246,0.3)]";
  } else if (status === "idle") {
    bgColor = "bg-muted";
    borderColor = "border-border";
    textColor = "text-muted-foreground";
  }

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: scale }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center 
          transition-all duration-300 z-10 relative bg-background
          ${bgColor} ${borderColor} ${textColor} ${shadow}
        `}
      >
        <span className="text-lg font-bold">{label}</span>
        <span className="text-[9px] opacity-80 font-mono leading-none mt-0.5">
          in:{inDegree}
        </span>
      </motion.div>
      {status === "ready" && (
        <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm"
        >
            Ready
        </motion.div>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  courseNode: CourseNode,
};

// --- Main Component ---

export default function CourseScheduleAnimation() {
  // State
  const [numCoursesInput, setNumCoursesInput] = useState(String(DEFAULT_NUM_COURSES));
  const [prereqsInput, setPrereqsInput] = useState(INITIAL_PREREQS);
  const [steps, setSteps] = useState<AnimationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);

  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // --- Logic: Generate Steps ---

  const generateData = (n: number, prereqs: [number, number][]) => {
    const steps: AnimationStep[] = [];
    let stepId = 0;

    // Init graph
    const adj: number[][] = Array.from({ length: n }, () => []);
    const inDegree = new Array(n).fill(0);
    const initialEdges: { id: string; from: number; to: number; active: boolean }[] = [];

    prereqs.forEach(([course, prereq], idx) => {
        adj[prereq].push(course);
        inDegree[course]++;
        initialEdges.push({ id: `e${prereq}-${course}-${idx}`, from: prereq, to: course, active: true });
    });

    const initialNodes = Array.from({ length: n }, (_, i) => ({
        id: String(i),
        status: "idle" as NodeStatus,
        inDegree: inDegree[i],
    }));

    // Helper to push step
    const pushStep = (
        title: string, 
        description: string, 
        currentNodes: typeof initialNodes, 
        currentEdges: typeof initialEdges, 
        queue: number[], 
        learnedCount: number,
        currentCourse: number | null,
        status: AnimationStep["status"] = "running"
    ) => {
        steps.push({
            id: stepId++,
            title,
            description,
            nodes: JSON.parse(JSON.stringify(currentNodes)),
            edges: JSON.parse(JSON.stringify(currentEdges)),
            queue: queue.map(String),
            learnedCount,
            currentCourse: currentCourse !== null ? String(currentCourse) : null,
            status,
        });
    };

    // Step 1: Init
    pushStep("初始化", `构建图并统计入度。共有 ${n} 门课程，${prereqs.length} 条依赖关系。`, initialNodes, initialEdges, [], 0, null);

    // Step 2: Fill Queue
    const queue: number[] = [];
    const currentNodes = JSON.parse(JSON.stringify(initialNodes));
    
    for (let i = 0; i < n; i++) {
        if (inDegree[i] === 0) {
            queue.push(i);
            currentNodes[i].status = "ready";
        }
    }

    pushStep("寻找入口", `将所有入度为 0 的课程加入队列。`, currentNodes, initialEdges, queue, 0, null);

    let learnedCount = 0;
    const currentEdges = JSON.parse(JSON.stringify(initialEdges));

    // Step 3: BFS
    while (queue.length > 0) {
        const u = queue.shift()!;
        currentNodes[u].status = "processing";

        pushStep("开始学习", `从队列中取出课程 ${u} 进行学习。`, currentNodes, currentEdges, queue, learnedCount, u);

        learnedCount++;
        currentNodes[u].status = "completed";
        
        // Deactivate edges
        currentEdges.forEach((e: any) => {
            if (e.from === u) e.active = false;
        });

        pushStep("课程完成", `课程 ${u} 学习完成。移除从它出发的边。`, currentNodes, currentEdges, queue, learnedCount, u);

        const neighbors = adj[u];
        if (neighbors.length > 0) {
            for (const v of neighbors) {
                currentNodes[v].inDegree--;
                
                let desc = `课程 ${u} 完成，课程 ${v} 的入度减 1 (当前: ${currentNodes[v].inDegree})。`;
                
                if (currentNodes[v].inDegree === 0) {
                    queue.push(v);
                    currentNodes[v].status = "ready";
                    desc += ` 入度变为 0，加入队列。`;
                }

                pushStep("更新依赖", desc, currentNodes, currentEdges, queue, learnedCount, u);
            }
        }
    }

    // Final
    if (learnedCount === n) {
        pushStep("完成", "所有课程学习完毕，存在拓扑排序。", currentNodes, currentEdges, [], learnedCount, null, "success");
    } else {
        pushStep("无法完成", `队列为空，但只学习了 ${learnedCount}/${n} 门课程。存在环。`, currentNodes, currentEdges, [], learnedCount, null, "failure");
    }

    return { steps, initialNodes, initialEdges };
  };

  // --- Handlers ---

  const handleStart = () => {
    try {
        const n = parseInt(numCoursesInput);
        if (isNaN(n) || n <= 0 || n > 20) throw new Error("课程数量必须是 1-20 之间的数字");

        const prereqs = parsePrereqs(prereqsInput, n);
        
        const { steps: newSteps, initialNodes, initialEdges } = generateData(n, prereqs);
        
        setSteps(newSteps);
        setCurrentStepIndex(0);
        setError(null);
        setIsPlaying(false);

        // Layout
        const g = new dagre.graphlib.Graph();
        g.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 80 });
        g.setDefaultEdgeLabel(() => ({}));

        initialNodes.forEach(node => {
            g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
        });
        initialEdges.forEach(edge => {
            g.setEdge(String(edge.from), String(edge.to));
        });

        dagre.layout(g);

        const flowNodes: Node<CourseNodeData>[] = initialNodes.map(node => {
            const dagreNode = g.node(node.id);
            return {
                id: node.id,
                type: "courseNode",
                position: { x: dagreNode.x - NODE_WIDTH / 2, y: dagreNode.y - NODE_HEIGHT / 2 },
                data: {
                    label: node.id,
                    inDegree: node.inDegree,
                    status: "idle",
                },
            };
        });

        const flowEdges: Edge[] = initialEdges.map(edge => ({
            id: edge.id,
            source: String(edge.from),
            target: String(edge.to),
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
            style: { stroke: "#94a3b8", strokeWidth: 1.5 },
            animated: false,
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);

        setTimeout(() => {
            flowInstanceRef.current?.fitView({ duration: 500, padding: 0.2 });
            setIsPlaying(true);
        }, 100);

    } catch (err: any) {
        setError(err.message || "输入无效");
    }
  };

  const parsePrereqs = (input: string, numCourses: number): [number, number][] => {
      try {
        const arr = JSON.parse(input);
        if (!Array.isArray(arr)) throw new Error("必须是数组格式");
        const validEdges: [number, number][] = [];
        arr.forEach((pair, idx) => {
            if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`第 ${idx + 1} 项格式错误`);
            const [course, prereq] = pair;
            if (typeof course !== "number" || typeof prereq !== "number") throw new Error(`第 ${idx + 1} 项包含非数字`);
            if (course < 0 || course >= numCourses || prereq < 0 || prereq >= numCourses) throw new Error(`课程编号必须在 0 到 ${numCourses - 1} 之间`);
            validEdges.push([course, prereq]);
        });
        return validEdges;
      } catch (e) {
        throw new Error("解析错误: 请确保输入是有效的 JSON 数组格式");
      }
  };

  // --- Animation Loop ---

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, ANIMATION_SPEED);
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  // --- Update Graph ---

  useEffect(() => {
      if (steps.length === 0) return;
      const currentStep = steps[currentStepIndex];

      setNodes((nds) => nds.map(node => {
          const nodeState = currentStep.nodes.find(n => n.id === node.id);
          return {
              ...node,
              data: {
                  ...node.data,
                  status: nodeState?.status || "idle",
                  inDegree: nodeState?.inDegree ?? 0,
              }
          };
      }));

      setEdges((eds) => eds.map(edge => {
          const edgeState = currentStep.edges.find(e => e.id === edge.id);
          const isActive = edgeState?.active ?? true;
          return {
              ...edge,
              style: {
                  ...edge.style,
                  stroke: isActive ? "#94a3b8" : "#e2e8f0",
                  strokeWidth: isActive ? 1.5 : 1,
                  opacity: isActive ? 1 : 0.3,
              },
              markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: isActive ? "#94a3b8" : "#e2e8f0",
              }
          };
      }));

  }, [currentStepIndex, steps, setNodes, setEdges]);

  // --- Render ---

  const currentStep = steps[currentStepIndex];

  return (
    <div className="w-full space-y-6">
      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 space-y-4 md:col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">配置</h3>
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">课程数量</label>
                <Input
                    value={numCoursesInput}
                    onChange={(e) => setNumCoursesInput(e.target.value)}
                    type="number"
                    min={1}
                    max={20}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">先修关系 (JSON)</label>
                <Textarea
                    value={prereqsInput}
                    onChange={(e) => setPrereqsInput(e.target.value)}
                    className="font-mono min-h-[80px] text-xs"
                    placeholder="[[1,0], [2,1]]"
                />
            </div>
            <Button onClick={handleStart} disabled={isPlaying} className="w-full">
                应用并开始
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">队列 (Queue)</h3>
            <div className="flex gap-2 min-h-[40px] items-center overflow-x-auto pb-1 bg-muted/30 p-2 rounded-md">
                {currentStep?.queue.length > 0 ? (
                    <AnimatePresence>
                        {currentStep.queue.map(id => (
                            <motion.div
                                key={`q-${id}`}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-blue-200"
                            >
                                {id}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <span className="text-xs text-muted-foreground italic pl-1">空</span>
                )}
            </div>
          </div>

          <Separator />
          
          <div className="flex items-center justify-between pt-2">
             <Button variant="ghost" size="icon" onClick={() => {
                 setIsPlaying(false);
                 setCurrentStepIndex(0);
             }} title="重置">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={steps.length === 0 || currentStepIndex >= steps.length - 1}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
                }}
                disabled={steps.length === 0 || currentStepIndex >= steps.length - 1}
              >
                <StepForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Graph Visualization */}
        <div className="md:col-span-2 h-[500px] border border-border/50 rounded-xl overflow-hidden bg-background/50 relative shadow-inner flex flex-col">
            <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur p-3 rounded-lg border border-border shadow-sm max-w-[300px]">
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant={
                        currentStep?.status === "success" ? "default" : 
                        currentStep?.status === "failure" ? "destructive" : "secondary"
                    }>
                        {currentStep?.title || "准备就绪"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        Step {currentStepIndex + 1}/{steps.length || 1}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {currentStep?.description || "点击应用开始演示"}
                </p>
            </div>

            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                 <div className="bg-background/80 backdrop-blur p-2 rounded-lg border border-border shadow-sm text-[10px] space-y-1.5 min-w-[100px]">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-muted border border-border"></div>
                        <span>未就绪 (In &gt; 0)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-500"></div>
                        <span>就绪 (In = 0)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-100 border border-orange-500"></div>
                        <span>学习中</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-500"></div>
                        <span>已完成</span>
                    </div>
                 </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onInit={(instance) => (flowInstanceRef.current = instance)}
                fitView
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls className="bg-background/90 border-border" />
            </ReactFlow>
        </div>
      </div>
    </div>
  );
}
