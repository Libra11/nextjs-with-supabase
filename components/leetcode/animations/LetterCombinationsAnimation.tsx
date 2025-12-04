"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  CheckCircle2,
  Phone,
} from "lucide-react";
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
import { motion } from "framer-motion";
import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// --- Types ---

interface CombinationStep {
  id: number;
  type: "start" | "choose" | "backtrack" | "found";
  path: string; // current string built
  digitIndex: number; // which digit we are processing
  description: string;
  activeNodeId: string;
  result: string[];
}

interface TreeNodeData {
  value: string; // The letter
  path: string; // The full string at this node
  status: "default" | "active" | "visited" | "found" | "backtracked";
  isLeaf: boolean;
}

// --- Constants ---

const NODE_WIDTH = 50;
const NODE_HEIGHT = 50;
const ANIMATION_SPEED = 800;
const MAX_DIGITS = 3; // Limit to 3 to keep tree manageable (3^3=27, 4^3=64 nodes)

const PHONE_MAP: Record<string, string> = {
  "2": "abc",
  "3": "def",
  "4": "ghi",
  "5": "jkl",
  "6": "mno",
  "7": "pqrs",
  "8": "tuv",
  "9": "wxyz",
};

// --- Custom Node Component ---

const LetterNode = ({ data }: NodeProps<TreeNodeData>) => {
  const { value, path, status, isLeaf } = data;

  let bgColor = "bg-card";
  let borderColor = "border-border";
  let textColor = "text-foreground";
  let shadow = "";
  let scale = 1;

  if (status === "active") {
    bgColor = "bg-primary";
    borderColor = "border-primary";
    textColor = "text-primary-foreground";
    shadow = "shadow-[0_0_20px_rgba(var(--primary),0.5)]";
    scale = 1.1;
  } else if (status === "found") {
    bgColor = "bg-emerald-500";
    borderColor = "border-emerald-500";
    textColor = "text-white";
    shadow = "shadow-[0_0_15px_rgba(16,185,129,0.6)]";
  } else if (status === "visited") {
    bgColor = "bg-muted";
    borderColor = "border-primary/20";
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
          w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center 
          transition-all duration-300 z-10 relative
          ${bgColor} ${borderColor} ${textColor} ${shadow}
        `}
      >
        <span className="text-lg font-bold">{value || "Start"}</span>
      </motion.div>

      {path && value && (
        <div
          className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono ${status === "active" ? "text-primary font-bold" : "text-muted-foreground"}`}
        >
          "{path}"
        </div>
      )}

      {isLeaf && status === "found" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 shadow-sm z-20"
        >
          Found!
        </motion.div>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  letterNode: LetterNode,
};

// --- Main Component ---

export default function LetterCombinationsDemo() {
  // State
  const [inputStr, setInputStr] = useState("23");
  const [digits, setDigits] = useState<string>("23");
  const [steps, setSteps] = useState<CombinationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);

  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // --- Logic: Generate Steps & Tree ---

  const generateData = (inputDigits: string) => {
    const steps: CombinationStep[] = [];
    const result: string[] = [];

    const treeNodes: {
      id: string;
      value: string;
      path: string;
      parentId: string | null;
    }[] = [];
    const treeEdges: { id: string; source: string; target: string }[] = [];

    // Root
    treeNodes.push({ id: "root", value: "", path: "", parentId: null });

    // Generate Tree Structure (DFS)
    const buildTree = (
      index: number,
      currentPath: string,
      parentId: string
    ) => {
      if (index === inputDigits.length) {
        return;
      }

      const digit = inputDigits[index];
      const letters = PHONE_MAP[digit] || "";

      for (const char of letters) {
        const newPath = currentPath + char;
        const nodeId = `node-${newPath}`; // Unique ID based on path

        treeNodes.push({ id: nodeId, value: char, path: newPath, parentId });
        treeEdges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
        });

        buildTree(index + 1, newPath, nodeId);
      }
    };

    buildTree(0, "", "root");

    // Generate Animation Steps (Backtracking)
    const backtrack = (
      index: number,
      currentPath: string,
      parentId: string
    ) => {
      if (index === inputDigits.length) {
        result.push(currentPath);
        steps.push({
          id: steps.length,
          type: "found",
          path: currentPath,
          digitIndex: index,
          description: `找到组合: "${currentPath}"`,
          activeNodeId: parentId, // Using parentId logic, but actually it's the current node which corresponds to parentId in next recursion?
          // Actually, when index == length, parentId passed in is the node ID of the last character.
          result: [...result],
        });
        return;
      }

      const digit = inputDigits[index];
      const letters = PHONE_MAP[digit] || "";

      for (const char of letters) {
        const newPath = currentPath + char;
        const nodeId = `node-${newPath}`;

        steps.push({
          id: steps.length,
          type: "choose",
          path: newPath,
          digitIndex: index,
          description: `数字 ${digit} 选择字母 '${char}'`,
          activeNodeId: nodeId,
          result: [...result],
        });

        backtrack(index + 1, newPath, nodeId);

        // Backtrack step
        steps.push({
          id: steps.length,
          type: "backtrack",
          path: currentPath,
          digitIndex: index,
          description: `回溯: 撤销 '${char}'`,
          activeNodeId: parentId,
          result: [...result],
        });
      }
    };

    // Initial step
    steps.push({
      id: 0,
      type: "start",
      path: "",
      digitIndex: 0,
      description: "开始搜索",
      activeNodeId: "root",
      result: [],
    });

    if (inputDigits.length > 0) {
      backtrack(0, "", "root");
    }

    return { steps, treeNodes, treeEdges };
  };

  // --- Handlers ---

  const handleStart = () => {
    const cleanInput = inputStr.replace(/[^2-9]/g, "");

    if (cleanInput.length === 0) {
      setError("请输入 2-9 之间的数字");
      return;
    }
    if (cleanInput.length > MAX_DIGITS) {
      setError(`为了演示效果，建议最多输入 ${MAX_DIGITS} 个数字`);
      // Don't return, just warn but allows it if they really want, or truncate?
      // Let's truncate to avoid browser crash on huge trees
      // cleanInput = cleanInput.slice(0, MAX_DIGITS);
      return;
    }

    setError(null);
    setDigits(cleanInput);
    setIsPlaying(false);

    const { steps: newSteps, treeNodes, treeEdges } = generateData(cleanInput);
    setSteps(newSteps);
    setCurrentStepIndex(0);

    // Layout Graph
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", nodesep: 20, ranksep: 60 });
    g.setDefaultEdgeLabel(() => ({}));

    treeNodes.forEach((node) => {
      g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });
    treeEdges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const flowNodes: Node<TreeNodeData>[] = treeNodes.map((node) => {
      const dagreNode = g.node(node.id);
      return {
        id: node.id,
        type: "letterNode",
        position: {
          x: dagreNode.x - NODE_WIDTH / 2,
          y: dagreNode.y - NODE_HEIGHT / 2,
        },
        data: {
          value: node.value,
          path: node.path,
          status: "default",
          isLeaf: node.path.length === cleanInput.length,
        },
      };
    });

    const flowEdges: Edge[] = treeEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "default",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      style: { stroke: "#94a3b8", strokeWidth: 1.5, opacity: 0.5 },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);

    setTimeout(() => {
      flowInstanceRef.current?.fitView({ duration: 500, padding: 0.1 });
      setIsPlaying(true);
    }, 100);
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

  // --- Update Node Styles ---

  useEffect(() => {
    if (steps.length === 0) return;

    const currentStep = steps[currentStepIndex];
    const targetLength = digits.length;

    setNodes((nds) =>
      nds.map((node) => {
        const nodePath = node.data.path;
        const stepPath = currentStep.path;

        let status: TreeNodeData["status"] = "default";

        // Active node
        if (node.id === currentStep.activeNodeId) {
          status = currentStep.type === "found" ? "found" : "active";
        }
        // Visited path (prefix of current path)
        else if (stepPath.startsWith(nodePath) && nodePath.length > 0) {
          status = "visited";
        }
        // Special case: Root
        else if (node.id === "root") {
          status = "visited";
        }

        // If it was a found leaf in the result set, keep it green?
        // Or just let the current animation state dictate.
        // Let's make fully found paths stay green if they are in the result set so far.
        const isFoundInResult = currentStep.result.includes(nodePath);
        if (isFoundInResult && nodePath.length === targetLength) {
          status = "found";
        }

        return {
          ...node,
          data: {
            ...node.data,
            status,
          },
          zIndex: status === "active" || status === "found" ? 10 : 0,
        };
      })
    );
  }, [currentStepIndex, steps, digits.length, setNodes]);

  const currentStep = steps[currentStepIndex];

  return (
    <div className="w-full space-y-6">
      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 space-y-4 md:col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              输入数字 (2-9)
            </h3>
            <div className="flex gap-2">
              <Input
                value={inputStr}
                onChange={(e) =>
                  setInputStr(e.target.value.replace(/[^2-9]/g, ""))
                }
                placeholder="例如: 23"
                className="font-mono"
                maxLength={4}
              />
              <Button onClick={handleStart} disabled={isPlaying}>
                生成
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex flex-wrap gap-1 mt-2">
              {digits.split("").map((d, i) => (
                <Badge key={i} variant="outline" className="font-mono">
                  {d}: {PHONE_MAP[d]}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              当前操作
            </h3>
            <div className="p-3 bg-muted/30 rounded-lg min-h-[60px] text-sm flex items-center justify-center text-center">
              {currentStep ? currentStep.description : "输入数字开始演示"}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(0);
              }}
              title="重置"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={
                  steps.length === 0 || currentStepIndex >= steps.length - 1
                }
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
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) =>
                    Math.min(prev + 1, steps.length - 1)
                  );
                }}
                disabled={
                  steps.length === 0 || currentStepIndex >= steps.length - 1
                }
              >
                <StepForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Tree Visualization */}
        <div className="md:col-span-2 h-[500px] border border-border/50 rounded-xl overflow-hidden bg-background/50 relative shadow-inner flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur p-2 rounded-lg border border-border shadow-sm max-w-[250px]">
            <h4 className="text-sm font-bold mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>输入: {digits}</span>
            </h4>
            <div className="text-xs text-muted-foreground font-mono">
              当前路径: "{currentStep?.path}"
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
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls className="bg-background/90 border-border" />
          </ReactFlow>
        </div>
      </div>

      {/* Results Area */}
      <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          结果集 ({currentStep?.result.length || 0})
        </h3>
        <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto custom-scrollbar">
          {currentStep?.result.map((res, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-md font-mono text-sm flex items-center gap-2"
            >
              <span>"{res}"</span>
              {idx === currentStep.result.length - 1 &&
                currentStep.type === "found" && (
                  <motion.span
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </motion.span>
                )}
            </motion.div>
          ))}
          {currentStep?.result.length === 0 && (
            <span className="text-sm text-muted-foreground italic">
              暂无结果...
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
