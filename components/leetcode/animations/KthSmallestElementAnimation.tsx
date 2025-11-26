"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, StepForward } from "lucide-react";
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
} from "reactflow";
import dagre from "dagre";

import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TraversalMethod = "recursive" | "iterative";

interface TreeNode {
  id: string;
  value: number;
  index: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

type StepAction =
  | "descend"
  | "visit"
  | "move-right"
  | "backtrack"
  | "found"
  | "complete";

type NodeStatus = "current" | "stack" | "visited" | "found" | "default";

interface TreeNodeFlowData {
  value: number;
  index: number;
  status: NodeStatus;
}

interface TraversalStep {
  id: number;
  title: string;
  description: string;
  action: StepAction;
  currentNode: number | null;
  stack: number[];
  visited: number[];
  count: number;
  foundValue: number | null;
}

interface BuildTreeResult {
  root: TreeNode | null;
  nodes: TreeNode[];
}

interface ParseSuccess {
  ok: true;
  values: (number | null)[];
}

interface ParseError {
  ok: false;
  error: string;
}

type ParseResult = ParseSuccess | ParseError;

const DEFAULT_INPUT = "5, 3, 6, 2, 4, null, null, 1";
const DEFAULT_VALUES: (number | null)[] = [5, 3, 6, 2, 4, null, null, 1];
const DEFAULT_K = 3;
const MAX_NODES = 20;
const NODE_SIZE = 50;

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary",
  stack: "bg-amber-500/20 border-amber-500/80 text-amber-700",
  visited: "bg-emerald-500/20 border-emerald-500/80 text-emerald-700",
  found: "bg-red-500/20 border-red-500 text-red-700 font-bold ring-2 ring-red-500/50",
  default: "bg-card/90 border-border text-foreground",
};

function TreeNodeNode({ data }: NodeProps<TreeNodeFlowData>) {
  const { value, index, status } = data;
  const statusClass = statusClasses[status] ?? statusClasses.default;

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 pointer-events-none"
        isConnectable={false}
      />
      <div
        className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-semibold text-sm shadow-lg transition-colors duration-300 ${statusClass}`}
      >
        <span>{value}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 pointer-events-none"
        isConnectable={false}
      />
    </div>
  );
}

const EDGE_COLOR = "rgba(148,163,184,0.5)";

const methodDescriptions: Record<TraversalMethod, string> = {
  recursive: "利用系统调用栈，中序遍历（左-根-右），计数器记录访问的节点数。",
  iterative: "使用显式栈模拟递归，中序遍历（左-根-右），计数器记录访问的节点数。",
};

const actionLabels: Record<StepAction, string> = {
  descend: "深入左侧",
  visit: "访问节点",
  "move-right": "右子树",
  backtrack: "回溯",
  found: "找到答案",
  complete: "完成",
};

export default function KthSmallestElementAnimation() {
  const [method, setMethod] = useState<TraversalMethod>("iterative");
  const [levelOrderInput, setLevelOrderInput] = useState(DEFAULT_INPUT);
  const [kInput, setKInput] = useState(DEFAULT_K.toString());
  const [treeValues, setTreeValues] = useState<(number | null)[]>([...DEFAULT_VALUES]);
  const [kValue, setKValue] = useState(DEFAULT_K);
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const treeData = useMemo(() => buildTreeData(treeValues), [treeValues]);

  const nodeMap = useMemo(() => {
    const map = new Map<number, TreeNode>();
    treeData.nodes.forEach((node) => map.set(node.index, node));
    return map;
  }, [treeData.nodes]);

  const traversalSteps = useMemo(() => {
    return method === "iterative"
      ? generateIterativeSteps(treeData.root, kValue)
      : generateRecursiveSteps(treeData.root, kValue);
  }, [method, treeData.root, kValue]);

  const stepInfo = traversalSteps[currentStep] ?? traversalSteps[0];
  const stackLabel = method === "iterative" ? "显式栈" : "递归调用栈";

  const visitedSet = useMemo(
    () => new Set(stepInfo?.visited ?? []),
    [stepInfo],
  );
  const stackSet = useMemo(() => new Set(stepInfo?.stack ?? []), [stepInfo]);

  const flowGraph = useMemo(
    () =>
      buildFlowElements(
        treeData.root,
        stepInfo?.currentNode ?? null,
        visitedSet,
        stackSet,
        stepInfo?.foundValue ?? null,
        nodeMap
      ),
    [treeData.root, stepInfo?.currentNode, visitedSet, stackSet, stepInfo?.foundValue, nodeMap],
  );

  const flowNodes = flowGraph.nodes;
  const flowEdges = flowGraph.edges;
  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });
  const nodeTypes = nodeTypesRef.current;

  const treeDepth = useMemo(() => getTreeDepth(treeData.root), [treeData.root]);
  const treeHeight = useMemo(
    () => Math.max(360, (treeDepth + 1) * 100),
    [treeDepth],
  );

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [method, treeData.root, kValue]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= traversalSteps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) =>
        Math.min(prev + 1, Math.max(0, traversalSteps.length - 1)),
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, traversalSteps.length]);

  const visitedValues = stepInfo?.visited.map((idx) => nodeMap.get(idx)?.value ?? "?") ?? [];
  const stackNodes = stepInfo?.stack
    .map((idx) => nodeMap.get(idx))
    .filter(Boolean) as TreeNode[];

  const progress =
    traversalSteps.length <= 1
      ? 1
      : currentStep / (traversalSteps.length - 1);

  const recentSteps = traversalSteps.slice(
    Math.max(0, currentStep - 2),
    currentStep + 1,
  );

  const handleApplyInput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseLevelOrderInput(levelOrderInput);
    if (!parsed.ok) {
      setInputError(parsed.error);
      return;
    }
    
    const k = parseInt(kInput, 10);
    if (isNaN(k) || k <= 0) {
        setInputError("K 必须是正整数");
        return;
    }

    // Count non-null nodes
    const nodeCount = parsed.values.filter(v => v !== null).length;
    if (k > nodeCount) {
        setInputError(`K (${k}) 不能大于节点总数 (${nodeCount})`);
        return;
    }

    setTreeValues(parsed.values);
    setKValue(k);
    setInputError(null);
  };

  const handleResetValues = () => {
    setLevelOrderInput(DEFAULT_INPUT);
    setKInput(DEFAULT_K.toString());
    setTreeValues([...DEFAULT_VALUES]);
    setKValue(DEFAULT_K);
    setInputError(null);
  };

  const handleNextStep = () => {
    setIsPlaying(false);
    setCurrentStep((prev) =>
      Math.min(prev + 1, Math.max(0, traversalSteps.length - 1)),
    );
  };

  const handleResetSteps = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handlePlayPause = () => {
    if (currentStep >= traversalSteps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const legendItems = [
    {
      label: "当前指针",
      className: "bg-primary/20 border-primary text-primary",
    },
    {
      label: "栈内节点",
      className: "bg-amber-500/20 border-amber-500/80 text-amber-600",
    },
    {
      label: "已计数",
      className: "bg-emerald-500/15 border-emerald-500/60 text-emerald-500",
    },
    {
      label: "第 K 小元素",
      className: "bg-red-500/20 border-red-500 text-red-700",
    },
  ];

  return (
    <div className="w-full min-h-[520px] rounded-xl bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">二叉搜索树中第 K 小的元素</h3>
        <p className="text-sm text-muted-foreground mt-1">
          利用 BST 的中序遍历特性（有序递增），找到第 K 个访问的节点。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 mb-6">
        <form
          onSubmit={handleApplyInput}
          className="lg:col-span-3 space-y-2"
        >
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex-1 space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    树结构 (层序遍历)
                </label>
                <Input
                value={levelOrderInput}
                onChange={(event) => setLevelOrderInput(event.target.value)}
                placeholder="例如：5, 3, 6, 2, 4"
                />
            </div>
            <div className="w-24 space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    K 值
                </label>
                <Input
                type="number"
                min={1}
                value={kInput}
                onChange={(event) => setKInput(event.target.value)}
                placeholder="K"
                />
            </div>
            <div className="flex gap-2 items-end">
              <Button type="submit" size="sm">
                应用
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleResetValues}>
                重置
              </Button>
            </div>
          </div>
          {inputError && (
            <p className="text-xs text-red-500">{inputError}</p>
          )}
        </form>

        <div className="lg:col-span-2 space-y-2">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            算法方式
          </label>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant={method === "iterative" ? "default" : "outline"}
              onClick={() => setMethod("iterative")}
            >
              迭代 (栈)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={method === "recursive" ? "default" : "outline"}
              onClick={() => setMethod("recursive")}
            >
              递归
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{methodDescriptions[method]}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-xl">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>查找进度</span>
            <span>
              步骤 {Math.min(currentStep + 1, traversalSteps.length)} / {traversalSteps.length}
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
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetSteps}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            重置
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNextStep}
          >
            <StepForward className="h-4 w-4 mr-1" />
            单步
          </Button>
          <Button type="button" size="sm" onClick={handlePlayPause}>
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-1" /> 暂停
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" /> 播放
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div
            className="relative border border-border/60 bg-card/80 rounded-xl overflow-hidden"
            style={{ minHeight: treeHeight, height: treeHeight }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-emerald-500/5 to-amber-400/5" />
            <div className="absolute top-4 left-4 flex gap-2 flex-wrap z-10">
              {legendItems.map((item) => (
                <span
                  key={item.label}
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${item.className}`}
                >
                  {item.label}
                </span>
              ))}
            </div>

            <div className="relative w-full h-full">
              {flowNodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  当前树为空。
                </div>
              ) : (
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  panOnScroll
                  zoomOnScroll
                  proOptions={{ hideAttribution: true }}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={28}
                    size={1}
                    color="rgba(148,163,184,0.25)"
                  />
                  <Controls
                    className="bg-card/90 border border-border"
                    position="top-right"
                    showInteractive={false}
                  />
                </ReactFlow>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              当前状态
            </p>
            <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                    <div className="text-2xl font-bold">{stepInfo?.count ?? 0}</div>
                    <div className="text-xs text-muted-foreground">当前计数 (count)</div>
                </div>
                <div className="text-2xl font-light text-muted-foreground">/</div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{kValue}</div>
                    <div className="text-xs text-muted-foreground">目标 (k)</div>
                </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-semibold">{stepInfo?.title}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {actionLabels[stepInfo?.action ?? "complete"]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stepInfo?.description}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">{stackLabel}</h4>
              <span className="text-xs text-muted-foreground">栈顶在右侧</span>
            </div>
            {stackNodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">栈当前为空</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stackNodes.map((node, idx) => {
                  const isTop = idx === stackNodes.length - 1;
                  return (
                    <div
                      key={`${node.id}-${idx}`}
                      className={`px-3 py-1 rounded-lg border text-sm flex items-center gap-2 ${
                        isTop
                          ? "border-primary/60 bg-primary/10 text-primary"
                          : "border-border bg-muted/40"
                      }`}
                    >
                      <span>{node.value}</span>
                      {isTop && (
                        <span className="text-[10px] uppercase tracking-wide">TOP</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">已访问序列</h4>
              <span className="text-xs text-muted-foreground">有序递增</span>
            </div>
            {visitedValues.length === 0 ? (
              <p className="text-xs text-muted-foreground">尚未访问任何节点</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {visitedValues.map((value, idx) => (
                  <div
                    key={`${value}-${idx}`}
                    className={`px-3 py-1 rounded-full border text-sm ${
                        value === stepInfo?.foundValue 
                        ? "bg-red-500/20 border-red-500 text-red-700 font-bold"
                        : "bg-emerald-500/10 border-emerald-500/40 text-emerald-700"
                    }`}
                  >
                    {value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FlowGraphResult {
  nodes: Node<TreeNodeFlowData>[];
  edges: Edge[];
}

function buildFlowElements(
  root: TreeNode | null,
  currentIndex: number | null,
  visited: Set<number>,
  stack: Set<number>,
  foundValue: number | null,
  nodeMap: Map<number, TreeNode>
): FlowGraphResult {
  if (!root) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 50,
    ranksep: 50,
    marginx: 20,
    marginy: 20,
  });

  const queue: TreeNode[] = [root];
  const treeNodes: TreeNode[] = [];
  const connections: Array<{ source: string; target: string }> = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    treeNodes.push(node);

    if (node.left) {
      queue.push(node.left);
      connections.push({ source: node.id, target: node.left.id });
    }
    if (node.right) {
      queue.push(node.right);
      connections.push({ source: node.id, target: node.right.id });
    }
  }

  treeNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_SIZE, height: NODE_SIZE });
  });
  connections.forEach(({ source, target }) => dagreGraph.setEdge(source, target));

  dagre.layout(dagreGraph);

  const nodes: Node<TreeNodeFlowData>[] = treeNodes.map((node) => {
    const layout = dagreGraph.node(node.id) as { x: number; y: number } | undefined;
    const x = layout ? layout.x : 0;
    const y = layout ? layout.y : 0;
    
    let status: NodeStatus = "default";
    if (node.value === foundValue) status = "found";
    else if (node.index === currentIndex) status = "current";
    else if (stack.has(node.index)) status = "stack";
    else if (visited.has(node.index)) status = "visited";

    return {
      id: node.id,
      position: { x: x - NODE_SIZE / 2, y: y - NODE_SIZE / 2 },
      data: { value: node.value, index: node.index, status },
      type: "treeNode",
      draggable: false,
      selectable: false,
    } satisfies Node<TreeNodeFlowData>;
  });

  const edges: Edge[] = connections.map(({ source, target }) => ({
    id: `${source}-${target}`,
    source,
    target,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
    style: { stroke: EDGE_COLOR, strokeWidth: 2 },
    animated: false,
  }));

  return { nodes, edges };
}

function parseLevelOrderInput(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, values: [] };
  }

  const segments = trimmed
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length > MAX_NODES) {
    return { ok: false, error: `节点数量过多，最多仅支持 ${MAX_NODES} 个。` };
  }

  const values: (number | null)[] = [];
  for (const segment of segments) {
    if (/^null$/i.test(segment)) {
      values.push(null);
      continue;
    }
    const value = Number(segment);
    if (Number.isNaN(value)) {
      return {
        ok: false,
        error: `无法解析 "${segment}"，请使用数字或 null。`,
      };
    }
    values.push(value);
  }

  return { ok: true, values };
}

function buildTreeData(values: (number | null)[]): BuildTreeResult {
  if (values.length === 0) {
    return { root: null, nodes: [] };
  }

  const [first] = values;
  if (first === null || first === undefined) {
    return { root: null, nodes: [] };
  }

  const createNode = (value: number, index: number): TreeNode => ({
    id: `node-${index}`,
    value,
    index,
    left: null,
    right: null,
  });

  const root = createNode(first, 0);
  const collected: TreeNode[] = [root];

  const queue: TreeNode[] = [root];
  let pointer = 1;

  while (queue.length > 0 && pointer < values.length) {
    const node = queue.shift()!;

    if (pointer < values.length) {
      const leftValue = values[pointer];
      if (leftValue !== null && leftValue !== undefined) {
        const leftNode = createNode(leftValue, pointer);
        node.left = leftNode;
        collected.push(leftNode);
        queue.push(leftNode);
      }
      pointer += 1;
    }

    if (pointer < values.length) {
      const rightValue = values[pointer];
      if (rightValue !== null && rightValue !== undefined) {
        const rightNode = createNode(rightValue, pointer);
        node.right = rightNode;
        collected.push(rightNode);
        queue.push(rightNode);
      }
      pointer += 1;
    }
  }

  return { root, nodes: collected };
}

function getTreeDepth(node: TreeNode | null): number {
  if (!node) return -1;
  return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

function generateIterativeSteps(root: TreeNode | null, k: number): TraversalStep[] {
  const steps: TraversalStep[] = [];
  let id = 1;
  const visited: number[] = [];
  let count = 0;

  const pushStep = (step: Omit<TraversalStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空。",
      action: "complete",
      currentNode: null,
      stack: [],
      visited: [],
      count: 0,
      foundValue: null
    });
    return steps;
  }

  pushStep({
    title: "初始化",
    description: `开始查找第 ${k} 小的元素。从根节点开始。`,
    action: "descend",
    currentNode: root.index,
    stack: [],
    visited: [],
    count: 0,
    foundValue: null
  });

  const stack: TreeNode[] = [];
  let current: TreeNode | null = root;

  while (current || stack.length) {
    while (current) {
      stack.push(current);
      pushStep({
        title: `压栈 ${current.value}`,
        description: `节点 ${current.value} 入栈，继续深入左子树。`,
        action: "descend",
        currentNode: current.index,
        stack: stack.map((node) => node.index),
        visited: [...visited],
        count: count,
        foundValue: null
      });
      current = current.left;
    }

    const node = stack.pop();
    if (!node) break;

    count++;
    visited.push(node.index);
    
    if (count === k) {
        pushStep({
            title: `找到第 ${k} 小元素！`,
            description: `当前节点 ${node.value} 是第 ${count} 个访问的节点，正是我们要找的答案！`,
            action: "found",
            currentNode: node.index,
            stack: stack.map((item) => item.index),
            visited: [...visited],
            count: count,
            foundValue: node.value
        });
        return steps;
    }

    pushStep({
      title: `访问 ${node.value}`,
      description: `访问节点 ${node.value}，当前计数：${count}。`,
      action: "visit",
      currentNode: node.index,
      stack: stack.map((item) => item.index),
      visited: [...visited],
      count: count,
      foundValue: null
    });

    current = node.right;
    if (current) {
      pushStep({
        title: `转向右子树`,
        description: `准备处理节点 ${node.value} 的右孩子 ${current.value}。`,
        action: "move-right",
        currentNode: current.index,
        stack: stack.map((item) => item.index),
        visited: [...visited],
        count: count,
        foundValue: null
      });
    }
  }

  return steps;
}

function generateRecursiveSteps(root: TreeNode | null, k: number): TraversalStep[] {
  const steps: TraversalStep[] = [];
  let id = 1;
  const visited: number[] = [];
  const stack: TreeNode[] = [];
  let count = 0;
  let found = false;

  const pushStep = (step: Omit<TraversalStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空。",
      action: "complete",
      currentNode: null,
      stack: [],
      visited: [],
      count: 0,
      foundValue: null
    });
    return steps;
  }

  pushStep({
    title: "开始递归",
    description: `开始查找第 ${k} 小的元素。`,
    action: "descend",
    currentNode: root.index,
    stack: [],
    visited: [],
    count: 0,
    foundValue: null
  });

  const traverse = (node: TreeNode | null) => {
    if (!node || found) return;

    stack.push(node);
    pushStep({
      title: `进入 ${node.value}`,
      description: `递归处理节点 ${node.value} 的左子树。`,
      action: "descend",
      currentNode: node.index,
      stack: stack.map((item) => item.index),
      visited: [...visited],
      count: count,
      foundValue: null
    });

    traverse(node.left);

    if (found) return;

    count++;
    visited.push(node.index);
    
    if (count === k) {
        found = true;
        pushStep({
            title: `找到第 ${k} 小元素！`,
            description: `当前节点 ${node.value} 是第 ${count} 个访问的节点，答案是 ${node.value}。`,
            action: "found",
            currentNode: node.index,
            stack: stack.map((item) => item.index),
            visited: [...visited],
            count: count,
            foundValue: node.value
        });
        return;
    }

    pushStep({
      title: `访问 ${node.value}`,
      description: `访问节点 ${node.value}，当前计数：${count}。`,
      action: "visit",
      currentNode: node.index,
      stack: stack.map((item) => item.index),
      visited: [...visited],
      count: count,
      foundValue: null
    });

    if (node.right) {
      pushStep({
        title: `右子树 ${node.right.value}`,
        description: `继续递归处理节点 ${node.right.value}。`,
        action: "move-right",
        currentNode: node.right.index,
        stack: stack.map((item) => item.index),
        visited: [...visited],
        count: count,
        foundValue: null
      });
    }

    traverse(node.right);

    if (found) return;

    stack.pop();
    if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      pushStep({
        title: `回到 ${parent.value}`,
        description: `节点 ${node.value} 完成，回溯到父节点 ${parent.value}。`,
        action: "backtrack",
        currentNode: parent.index,
        stack: stack.map((item) => item.index),
        visited: [...visited],
        count: count,
        foundValue: null
      });
    }
  };

  traverse(root);

  if (!found) {
    pushStep({
        title: "遍历结束",
        description: "遍历了所有节点，未找到第 K 小元素（可能 K 超出范围）。",
        action: "complete",
        currentNode: null,
        stack: [],
        visited: [...visited],
        count: count,
        foundValue: null
    });
  }

  return steps;
}
