"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, StepForward, Plus, Search, Type } from "lucide-react";
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

// --- Types ---

type OperationType = "insert" | "search" | "startsWith";

interface TrieNode {
  id: string;
  char: string;
  isEnd: boolean;
  children: { [key: string]: TrieNode };
  // Visual metadata
  x?: number;
  y?: number;
}

interface TrieStep {
  id: number;
  title: string;
  description: string;
  activeNodeId: string | null;
  highlightedPath: string[]; // List of node IDs
  status: "idle" | "running" | "success" | "failure" | "found" | "not-found";
  trieSnapshot: TrieNode; // Snapshot of the trie structure at this step
}

interface TrieFlowData {
  char: string;
  isEnd: boolean;
  status: "default" | "active" | "visited" | "found" | "error";
  isRoot: boolean;
}

// --- Constants ---

const NODE_WIDTH = 50;
const NODE_HEIGHT = 50;
const ANIMATION_SPEED = 1000;

// --- Helper: Deep Clone Trie ---
const cloneTrie = (node: TrieNode): TrieNode => {
  const newNode: TrieNode = {
    id: node.id,
    char: node.char,
    isEnd: node.isEnd,
    children: {},
  };
  for (const key in node.children) {
    newNode.children[key] = cloneTrie(node.children[key]);
  }
  return newNode;
};

// --- Custom Node Component ---

const TrieNodeComponent = ({ data }: NodeProps<TrieFlowData>) => {
  const { char, isEnd, status, isRoot } = data;

  let bgColor = "bg-card";
  let borderColor = "border-border";
  let textColor = "text-foreground";
  let shadow = "";

  if (status === "active") {
    bgColor = "bg-primary/20";
    borderColor = "border-primary";
    textColor = "text-primary";
    shadow = "shadow-[0_0_15px_rgba(var(--primary),0.4)]";
  } else if (status === "found") {
    bgColor = "bg-emerald-500/20";
    borderColor = "border-emerald-500";
    textColor = "text-emerald-600";
    shadow = "shadow-[0_0_15px_rgba(16,185,129,0.4)]";
  } else if (status === "error") {
    bgColor = "bg-destructive/20";
    borderColor = "border-destructive";
    textColor = "text-destructive";
  } else if (status === "visited") {
    bgColor = "bg-muted";
    borderColor = "border-primary/30";
  }

  // Special styling for isEnd nodes
  const isEndStyle = isEnd ? "ring-2 ring-offset-2 ring-emerald-500/50" : "";

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <motion.div
        layout
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          w-12 h-12 rounded-full border-2 flex items-center justify-center 
          text-lg font-bold transition-colors duration-300
          ${bgColor} ${borderColor} ${textColor} ${shadow} ${isEndStyle}
        `}
      >
        {isRoot ? "ROOT" : char}
      </motion.div>
      {isEnd && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-emerald-600 font-bold bg-emerald-100 px-1 rounded">
          END
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  trieNode: TrieNodeComponent,
};

// --- Main Component ---

export default function TrieAnimation() {
  // State
  const [root, setRoot] = useState<TrieNode>({ id: "root", char: "", isEnd: false, children: {} });
  const [inputValue, setInputValue] = useState("");
  const [steps, setSteps] = useState<TrieStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [lastOperation, setLastOperation] = useState<{ type: OperationType; word: string } | null>(null);

  // Refs
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // --- Logic: Generate Steps ---

  const generateSteps = (
    type: OperationType,
    word: string,
    currentRoot: TrieNode
  ): { newRoot: TrieNode; steps: TrieStep[] } => {
    const newRoot = cloneTrie(currentRoot);
    const steps: TrieStep[] = [];
    let currentNode = newRoot;
    let path: string[] = [newRoot.id];

    // Initial Step
    steps.push({
      id: 0,
      title: "开始",
      description: `准备执行 ${type}("${word}")`,
      activeNodeId: newRoot.id,
      highlightedPath: [...path],
      status: "running",
      trieSnapshot: cloneTrie(newRoot),
    });

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const child = currentNode.children[char];

      if (type === "insert") {
        if (!child) {
          // Create new node
          const newNodeId = `node-${Math.random().toString(36).substr(2, 9)}`;
          currentNode.children[char] = {
            id: newNodeId,
            char: char,
            isEnd: false,
            children: {},
          };
          
          steps.push({
            id: steps.length,
            title: `插入字符 '${char}'`,
            description: `字符 '${char}' 不存在，创建新节点。`,
            activeNodeId: currentNode.children[char].id,
            highlightedPath: [...path, currentNode.children[char].id],
            status: "running",
            trieSnapshot: cloneTrie(newRoot),
          });
        } else {
          steps.push({
            id: steps.length,
            title: `字符 '${char}' 已存在`,
            description: `找到字符 '${char}'，移动到该节点。`,
            activeNodeId: child.id,
            highlightedPath: [...path, child.id],
            status: "running",
            trieSnapshot: cloneTrie(newRoot),
          });
        }
        currentNode = currentNode.children[char];
        path.push(currentNode.id);
      } else {
        // Search or StartsWith
        if (!child) {
          steps.push({
            id: steps.length,
            title: `查找失败`,
            description: `字符 '${char}' 不存在，路径中断。`,
            activeNodeId: currentNode.id,
            highlightedPath: [...path],
            status: "failure",
            trieSnapshot: cloneTrie(newRoot),
          });
          return { newRoot, steps };
        }
        
        currentNode = child;
        path.push(currentNode.id);
        steps.push({
          id: steps.length,
          title: `匹配字符 '${char}'`,
          description: `成功匹配字符 '${char}'，继续查找。`,
          activeNodeId: currentNode.id,
          highlightedPath: [...path],
          status: "running",
          trieSnapshot: cloneTrie(newRoot),
        });
      }
    }

    // Final Step
    if (type === "insert") {
      currentNode.isEnd = true;
      steps.push({
        id: steps.length,
        title: "插入完成",
        description: `标记当前节点为单词结尾。`,
        activeNodeId: currentNode.id,
        highlightedPath: [...path],
        status: "success",
        trieSnapshot: cloneTrie(newRoot),
      });
    } else if (type === "search") {
      if (currentNode.isEnd) {
        steps.push({
          id: steps.length,
          title: "查找成功",
          description: `单词 "${word}" 存在于 Trie 中。`,
          activeNodeId: currentNode.id,
          highlightedPath: [...path],
          status: "found",
          trieSnapshot: cloneTrie(newRoot),
        });
      } else {
        steps.push({
          id: steps.length,
          title: "查找失败",
          description: `前缀 "${word}" 存在，但不是完整单词。`,
          activeNodeId: currentNode.id,
          highlightedPath: [...path],
          status: "not-found",
          trieSnapshot: cloneTrie(newRoot),
        });
      }
    } else if (type === "startsWith") {
      steps.push({
        id: steps.length,
        title: "前缀匹配成功",
        description: `前缀 "${word}" 存在于 Trie 中。`,
        activeNodeId: currentNode.id,
        highlightedPath: [...path],
        status: "found",
        trieSnapshot: cloneTrie(newRoot),
      });
    }

    return { newRoot, steps };
  };

  // --- Handlers ---

  const handleOperation = (type: OperationType) => {
    if (!inputValue.trim()) return;
    
    // Reset animation state
    setIsPlaying(false);
    
    // If we are inserting, we update the root immediately for the "final" state, 
    // but we use the steps to visualize the transition.
    // Actually, for React state, we should probably keep the "current displayed root" separate from the "actual data root"
    // But to simplify, we will generate steps based on the *current* root, and the steps will contain snapshots.
    
    // However, if we insert, the tree structure changes.
    // The `generateSteps` function returns the `newRoot` and the `steps`.
    // We should set the `root` state to `newRoot` ONLY after the animation finishes?
    // Or we can just use the snapshots in the steps to render.
    // Let's use the snapshots.
    
    const { newRoot, steps: newSteps } = generateSteps(type, inputValue.trim().toLowerCase(), root);
    
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setLastOperation({ type, word: inputValue.trim() });
    
    // If it's an insert, we eventually want to update the main root state
    // But for now, we rely on the steps to show the progress.
    // We will update the main `root` state when the animation is "committed" or we can just update it now
    // and let the animation play out using the snapshots.
    // Better: Update root now, so subsequent operations use the new tree.
    if (type === "insert") {
        setRoot(newRoot);
    }

    // Auto-play
    setIsPlaying(true);
  };

  const handleReset = () => {
    setRoot({ id: "root", char: "", isEnd: false, children: {} });
    setSteps([]);
    setCurrentStepIndex(0);
    setInputValue("");
    setLastOperation(null);
    setIsPlaying(false);
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

  // --- Layout & Rendering ---

  const currentStep = steps[currentStepIndex];
  // If no steps (initial state), use the current root
  const displayRoot = currentStep ? currentStep.trieSnapshot : root;

  useEffect(() => {
    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(displayRoot, currentStep);
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    
    // Fit view on first render or major changes
    if (flowInstanceRef.current && (currentStepIndex === 0 || currentStepIndex === steps.length - 1)) {
        setTimeout(() => {
            flowInstanceRef.current?.fitView({ duration: 400, padding: 0.2 });
        }, 50);
    }
  }, [displayRoot, currentStep, currentStepIndex, setNodes, setEdges]);

  // --- Dagre Layout ---

  const getLayoutedElements = (rootNode: TrieNode, step: TrieStep | undefined) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", nodesep: 30, ranksep: 60 });
    g.setDefaultEdgeLabel(() => ({}));

    // Traverse and add to graph
    const traverse = (node: TrieNode) => {
      g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
      Object.values(node.children).forEach((child) => {
        g.setEdge(node.id, child.id);
        traverse(child);
      });
    };
    traverse(rootNode);

    dagre.layout(g);

    const nodes: Node<TrieFlowData>[] = [];
    const edges: Edge[] = [];

    const traverseForFlow = (node: TrieNode) => {
      const dagreNode = g.node(node.id);
      
      let status: TrieFlowData["status"] = "default";
      if (step) {
        if (step.activeNodeId === node.id) {
            status = step.status === "failure" || step.status === "not-found" ? "error" : 
                     step.status === "found" || step.status === "success" ? "found" : "active";
        } else if (step.highlightedPath.includes(node.id)) {
            status = "visited";
        }
      }

      nodes.push({
        id: node.id,
        type: "trieNode",
        position: { x: dagreNode.x - NODE_WIDTH / 2, y: dagreNode.y - NODE_HEIGHT / 2 },
        data: {
          char: node.char,
          isEnd: node.isEnd,
          status,
          isRoot: node.id === "root",
        },
      });

      Object.values(node.children).forEach((child) => {
        edges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
          style: { stroke: "#94a3b8", strokeWidth: 1.5 },
        });
        traverseForFlow(child);
      });
    };
    traverseForFlow(rootNode);

    return { nodes, edges };
  };

  // --- Render ---

  return (
    <div className="w-full space-y-6">
      {/* Controls Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 space-y-4 md:col-span-2 lg:col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">操作控制</h3>
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.replace(/[^a-zA-Z]/g, ""))}
                placeholder="输入单词 (仅字母)"
                className="font-mono"
                maxLength={10}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                onClick={() => handleOperation("insert")} 
                disabled={!inputValue || isPlaying}
                variant="default"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-1" /> 插入
              </Button>
              <Button 
                onClick={() => handleOperation("search")} 
                disabled={!inputValue || isPlaying}
                variant="secondary"
                className="w-full"
              >
                <Search className="w-4 h-4 mr-1" /> 搜索
              </Button>
              <Button 
                onClick={() => handleOperation("startsWith")} 
                disabled={!inputValue || isPlaying}
                variant="outline"
                className="w-full"
              >
                <Type className="w-4 h-4 mr-1" /> 前缀
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handleReset} title="重置 Trie">
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

        {/* Status Panel */}
        <Card className="p-4 md:col-span-2 lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm flex flex-col justify-center min-h-[160px]">
          <AnimatePresence mode="wait">
            {currentStep ? (
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={
                    currentStep.status === "success" || currentStep.status === "found" ? "default" :
                    currentStep.status === "failure" || currentStep.status === "not-found" ? "destructive" : "secondary"
                  }>
                    {currentStep.title}
                  </Badge>
                  {lastOperation && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {lastOperation.type}("{lastOperation.word}")
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentStep.description}
                </p>
              </motion.div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                <p>Trie (前缀树) 初始化完成。</p>
                <p>请在左侧输入单词并选择操作。</p>
              </div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Canvas */}
      <div className="h-[500px] border border-border/50 rounded-xl overflow-hidden bg-background/50 relative shadow-inner">
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
        
        {/* Legend */}
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur p-2 rounded-lg border border-border shadow-sm text-xs space-y-1">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-primary bg-primary/20"></div>
                <span>当前节点</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-500/20"></div>
                <span>匹配/结束</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-border bg-card"></div>
                <span>普通节点</span>
            </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-emerald-500/50 ring-2 ring-emerald-500/20"></div>
                <span>单词结尾 (isEnd)</span>
            </div>
        </div>
      </div>
    </div>
  );
}
