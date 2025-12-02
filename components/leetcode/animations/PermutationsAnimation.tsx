"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Play, Pause, RotateCcw, StepForward, CheckCircle2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

// --- Types ---

interface PermutationStep {
  id: number;
  type: "start" | "choose" | "backtrack" | "found";
  path: number[];
  visited: boolean[];
  description: string;
  activeNodeId: string; // ID in the tree
  result: number[][];
}

interface TreeNodeData {
  value: number | null; // The number added at this step
  path: number[]; // The full path at this node
  status: "default" | "active" | "visited" | "found" | "backtracked";
  isLeaf: boolean;
}

// --- Constants ---

const NODE_WIDTH = 60;
const NODE_HEIGHT = 60;
const ANIMATION_SPEED = 800;
const MAX_NUMS = 4; // Limit to 4 to keep tree manageable (4! = 24 leaves)

// --- Custom Node Component ---

const PermutationNode = ({ data }: NodeProps<TreeNodeData>) => {
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
  } else if (status === "backtracked") {
    bgColor = "bg-muted/50";
    borderColor = "border-border/50";
    textColor = "text-muted-foreground/50";
  }

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: scale }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center 
          transition-all duration-300 z-10 relative
          ${bgColor} ${borderColor} ${textColor} ${shadow}
        `}
      >
        <span className="text-lg font-bold">{value === null ? "[]" : value}</span>
        {path.length > 0 && value !== null && (
            <span className="text-[8px] opacity-70 font-mono leading-none mt-1">
                {path.join(",")}
            </span>
        )}
      </motion.div>
      {isLeaf && status === "found" && (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 shadow-sm"
        >
            Found!
        </motion.div>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  permNode: PermutationNode,
};

// --- Main Component ---

export default function PermutationsAnimation() {
  // State
  const [inputStr, setInputStr] = useState("1,2,3");
  const [nums, setNums] = useState<number[]>([1, 2, 3]);
  const [steps, setSteps] = useState<PermutationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);

  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // --- Logic: Generate Steps & Tree ---

  const generateData = (numbers: number[]) => {
    const steps: PermutationStep[] = [];
    const result: number[][] = [];
    
    // We need to build the tree structure upfront for layout, or build it incrementally.
    // For ReactFlow with Dagre, it's often easier to build the full tree structure first 
    // to get the layout, then animate the status of nodes.
    
    const treeNodes: { id: string; value: number | null; path: number[]; parentId: string | null }[] = [];
    const treeEdges: { id: string; source: string; target: string }[] = [];
    
    // Root
    treeNodes.push({ id: "root", value: null, path: [], parentId: null });
    
    const generateTree = (currentPath: number[], parentId: string, used: boolean[]) => {
        if (currentPath.length === numbers.length) {
            return;
        }

        for (let i = 0; i < numbers.length; i++) {
            if (!used[i]) {
                const val = numbers[i];
                const newPath = [...currentPath, val];
                const nodeId = `node-${newPath.join("-")}`;
                
                treeNodes.push({ id: nodeId, value: val, path: newPath, parentId });
                treeEdges.push({ id: `${parentId}-${nodeId}`, source: parentId, target: nodeId });
                
                const newUsed = [...used];
                newUsed[i] = true;
                generateTree(newPath, nodeId, newUsed);
            }
        }
    };
    
    generateTree([], "root", new Array(numbers.length).fill(false));
    
    // Now generate steps for the animation
    const backtrack = (path: number[], visited: boolean[], parentId: string) => {
        // Step: Arrive at node
        // But we want to show the "choice" being made.
        
        if (path.length === numbers.length) {
            result.push([...path]);
            steps.push({
                id: steps.length,
                type: "found",
                path: [...path],
                visited: [...visited],
                description: `找到完整排列: [${path.join(", ")}]`,
                activeNodeId: parentId,
                result: [...result], // Copy current results
            });
            return;
        }

        for (let i = 0; i < numbers.length; i++) {
            if (visited[i]) continue;

            // Choose
            visited[i] = true;
            path.push(numbers[i]);
            const nodeId = `node-${path.join("-")}`;
            
            steps.push({
                id: steps.length,
                type: "choose",
                path: [...path],
                visited: [...visited],
                description: `选择数字 ${numbers[i]}`,
                activeNodeId: nodeId,
                result: [...result],
            });

            backtrack(path, visited, nodeId);

            // Backtrack
            path.pop();
            visited[i] = false;
            
            steps.push({
                id: steps.length,
                type: "backtrack",
                path: [...path],
                visited: [...visited],
                description: `回溯: 撤销选择 ${numbers[i]}`,
                activeNodeId: parentId, // Go back to parent
                result: [...result],
            });
        }
    };

    // Initial step
    steps.push({
        id: 0,
        type: "start",
        path: [],
        visited: new Array(numbers.length).fill(false),
        description: "开始回溯算法",
        activeNodeId: "root",
        result: [],
    });

    backtrack([], new Array(numbers.length).fill(false), "root");
    
    return { steps, treeNodes, treeEdges };
  };

  // --- Handlers ---

  const handleStart = () => {
    // Parse input
    const parts = inputStr.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
    const parsedNums = parts.map(Number);
    
    if (parsedNums.some(isNaN)) {
        setError("请输入有效的数字");
        return;
    }
    if (parsedNums.length === 0) {
        setError("请输入至少一个数字");
        return;
    }
    if (new Set(parsedNums).size !== parsedNums.length) {
        setError("数字不能重复");
        return;
    }
    if (parsedNums.length > MAX_NUMS) {
        setError(`为了演示效果，最多支持 ${MAX_NUMS} 个数字`);
        return;
    }

    setError(null);
    setNums(parsedNums);
    setIsPlaying(false);
    
    const { steps: newSteps, treeNodes, treeEdges } = generateData(parsedNums);
    setSteps(newSteps);
    setCurrentStepIndex(0);
    
    // Layout Graph
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", nodesep: 30, ranksep: 50 });
    g.setDefaultEdgeLabel(() => ({}));

    treeNodes.forEach(node => {
        g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });
    treeEdges.forEach(edge => {
        g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const flowNodes: Node<TreeNodeData>[] = treeNodes.map(node => {
        const dagreNode = g.node(node.id);
        return {
            id: node.id,
            type: "permNode",
            position: { x: dagreNode.x - NODE_WIDTH / 2, y: dagreNode.y - NODE_HEIGHT / 2 },
            data: {
                value: node.value,
                path: node.path,
                status: "default",
                isLeaf: node.path.length === parsedNums.length,
            },
        };
    });

    const flowEdges: Edge[] = treeEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
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

  // --- Update Node Styles based on Step ---

  useEffect(() => {
    if (steps.length === 0) return;
    
    const currentStep = steps[currentStepIndex];
    
    setNodes((nds) => 
        nds.map((node) => {
            const nodePath = node.data.path;
            const stepPath = currentStep.path;
            
            let status: TreeNodeData["status"] = "default";
            
            // Check if this node is part of the current path
            // A node is on the current path if its path is a prefix of the current step path
            // AND the node ID matches the activeNodeId or one of its ancestors
            
            // Simpler logic:
            // 1. If node.id === activeNodeId -> active
            // 2. If node is in the current recursion stack (part of path) -> visited
            // 3. If node is a completed leaf found previously -> found
            
            // We can determine if a node is "on the path" by checking if the node's path matches the beginning of the current step path
            const isPrefix = nodePath.length <= stepPath.length && 
                             nodePath.every((val, idx) => val === stepPath[idx]);
            
            if (node.id === currentStep.activeNodeId) {
                status = currentStep.type === "found" ? "found" : "active";
            } else if (isPrefix) {
                status = "visited";
            } else {
                // Check if this node was fully explored (backtracked from)
                // This is harder to track without history. 
                // But we can say: if it's not on current path, it's default or backtracked.
                // For visualization simplicity, let's keep it default or maybe dim it.
                status = "default";
            }
            
            // Keep "found" status for leaves that are in the result set
            // Check if this node's path is in currentStep.result
            const isResult = currentStep.result.some(res => 
                res.length === nodePath.length && res.every((v, i) => v === nodePath[i])
            );
            
            if (isResult && node.data.isLeaf) {
                status = "found";
            }

            return {
                ...node,
                data: {
                    ...node.data,
                    status,
                },
                // Bring active node to front
                zIndex: status === "active" ? 10 : 0,
            };
        })
    );
    
    // Auto-pan to active node
    if (flowInstanceRef.current && currentStep.activeNodeId) {
        const node = nodes.find(n => n.id === currentStep.activeNodeId);
        if (node) {
            // Optional: Smooth pan to node. 
            // flowInstanceRef.current.setCenter(node.position.x, node.position.y, { duration: 500, zoom: 1 });
            // Might be too jumpy, let's stick to fitView initially or manual pan.
        }
    }

  }, [currentStepIndex, steps, setNodes]); // Removed 'nodes' from dependency to avoid loop, relying on functional update

  // --- Render ---

  const currentStep = steps[currentStepIndex];

  return (
    <div className="w-full space-y-6">
      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 space-y-4 md:col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">输入数组</h3>
            <div className="flex gap-2">
              <Input
                value={inputStr}
                onChange={(e) => setInputStr(e.target.value)}
                placeholder="例如: 1,2,3"
                className="font-mono"
              />
              <Button onClick={handleStart} disabled={isPlaying}>
                生成
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">当前状态</h3>
            <div className="flex flex-wrap gap-2">
                {nums.map((num, idx) => {
                    const isUsed = currentStep?.visited[idx];
                    return (
                        <div 
                            key={idx}
                            className={`
                                w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-all
                                ${isUsed 
                                    ? "bg-muted text-muted-foreground border-transparent opacity-50" 
                                    : "bg-background text-foreground border-border shadow-sm"}
                            `}
                        >
                            {num}
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-muted-foreground">
                {currentStep ? "灰色表示已使用 (visited=true)" : "输入数字开始演示"}
            </p>
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

        {/* Tree Visualization */}
        <div className="md:col-span-2 h-[500px] border border-border/50 rounded-xl overflow-hidden bg-background/50 relative shadow-inner flex flex-col">
            <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur p-2 rounded-lg border border-border shadow-sm max-w-[250px]">
                <h4 className="text-sm font-bold mb-1">{currentStep?.type === "found" ? "🎉 找到排列" : currentStep?.description || "准备就绪"}</h4>
                <div className="text-xs text-muted-foreground font-mono">
                    Path: [{currentStep?.path.join(", ")}]
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
        <h3 className="text-sm font-medium text-muted-foreground mb-3">结果集 ({currentStep?.result.length || 0})</h3>
        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
            {currentStep?.result.map((res, idx) => (
                <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-md font-mono text-sm flex items-center gap-2"
                >
                    <span>[{res.join(", ")}]</span>
                    <CheckCircle2 className="w-3 h-3" />
                </motion.div>
            ))}
            {currentStep?.result.length === 0 && (
                <span className="text-sm text-muted-foreground italic">暂无结果...</span>
            )}
        </div>
      </Card>
    </div>
  );
}
