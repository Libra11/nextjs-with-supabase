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
  | "complete";

type NodeStatus = "current" | "stack" | "visited" | "default";

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

const DEFAULT_INPUT = "1, null, 2, 3";
const DEFAULT_VALUES: (number | null)[] = [1, null, 2, 3];
const MAX_NODES = 15;
const NODE_SIZE = 96;

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary",
  stack: "bg-amber-500/20 border-amber-500/80 text-amber-700",
  visited: "bg-emerald-500/20 border-emerald-500/80 text-emerald-700",
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
        className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center font-semibold text-lg shadow-lg ${statusClass}`}
      >
        <span>{value}</span>
        <span className="text-[10px] text-muted-foreground/80 font-normal">
          #{index}
        </span>
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

const EDGE_COLOR = "rgba(234,179,8,0.8)";

const methodDescriptions: Record<TraversalMethod, string> = {
  recursive: "利用系统调用栈，先压栈再回溯，天然遵循左 → 根 → 右的顺序。",
  iterative:
    "使用显式栈模拟递归：不断向左下潜，遇到叶子后弹栈访问，再转向右子树。",
};

const actionLabels: Record<StepAction, string> = {
  descend: "深入左侧",
  visit: "访问节点",
  "move-right": "右子树",
  backtrack: "回溯",
  complete: "完成",
};

export default function BinaryTreeInorderTraversalAnimation() {
  const [method, setMethod] = useState<TraversalMethod>("recursive");
  const [levelOrderInput, setLevelOrderInput] = useState(DEFAULT_INPUT);
  const [treeValues, setTreeValues] = useState<(number | null)[]>([...DEFAULT_VALUES]);
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
      ? generateIterativeSteps(treeData.root)
      : generateRecursiveSteps(treeData.root);
  }, [method, treeData.root]);

  const stepInfo = traversalSteps[currentStep] ?? traversalSteps[0];
  const stackLabel =
    method === "iterative" ? "显式栈" : "递归调用栈（系统栈帧）";

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
      ),
    [treeData.root, stepInfo?.currentNode, visitedSet, stackSet],
  );

  const flowNodes = flowGraph.nodes;
  const flowEdges = flowGraph.edges;
  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });
  const nodeTypes = nodeTypesRef.current;

  const treeDepth = useMemo(() => getTreeDepth(treeData.root), [treeData.root]);
  const treeHeight = useMemo(
    () => Math.max(360, (treeDepth + 1) * 180),
    [treeDepth],
  );

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [method, treeData.root]);

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
    }, 1500);

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
    setTreeValues(parsed.values);
    setInputError(null);
  };

  const handleResetValues = () => {
    setLevelOrderInput(DEFAULT_INPUT);
    setTreeValues([...DEFAULT_VALUES]);
    setInputError(null);
  };

  const handleClearValues = () => {
    setLevelOrderInput("");
    setTreeValues([]);
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
      label: method === "iterative" ? "栈内节点" : "递归栈帧",
      className: "bg-amber-500/20 border-amber-500/80 text-amber-600",
    },
    {
      label: "已访问",
      className: "bg-emerald-500/15 border-emerald-500/60 text-emerald-500",
    },
  ];

  return (
    <div className="w-full min-h-[520px] rounded-xl bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">二叉树中序遍历动画</h3>
        <p className="text-sm text-muted-foreground mt-1">
          左子树 → 根节点 → 右子树，可以选择递归或迭代方式观察指针和栈的变化。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 mb-6">
        <form
          onSubmit={handleApplyInput}
          className="lg:col-span-3 space-y-2"
        >
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            层序遍历输入（使用 null 表示空节点，最多 {MAX_NODES} 项）
          </label>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={levelOrderInput}
              onChange={(event) => setLevelOrderInput(event.target.value)}
              placeholder="例如：1, null, 2, 3"
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                应用输入
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleResetValues}>
                使用示例
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleClearValues}>
                清空
              </Button>
            </div>
          </div>
          {inputError ? (
            <p className="text-xs text-red-500">{inputError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              示例 [1, null, 2, 3] 表示根节点 1，其右子树为 2，2 的左孩子为 3。
            </p>
          )}
        </form>

        <div className="lg:col-span-2 space-y-2">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            遍历方式
          </label>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant={method === "recursive" ? "default" : "outline"}
              onClick={() => setMethod("recursive")}
            >
              递归
            </Button>
            <Button
              type="button"
              size="sm"
              variant={method === "iterative" ? "default" : "outline"}
              onClick={() => setMethod("iterative")}
            >
              迭代（栈）
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{methodDescriptions[method]}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-xl">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>遍历进度</span>
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
                  当前树为空，结果数组也将为空。
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
              当前步骤
            </p>
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
                      <span className="text-[10px] text-muted-foreground">#{node.index}</span>
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
              <h4 className="text-sm font-semibold">中序输出</h4>
              <span className="text-xs text-muted-foreground">左 → 根 → 右</span>
            </div>
            {visitedValues.length === 0 ? (
              <p className="text-xs text-muted-foreground">尚未访问任何节点</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {visitedValues.map((value, idx) => (
                  <div
                    key={`${value}-${idx}`}
                    className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-sm text-emerald-700"
                  >
                    {value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-3">步骤日志</h4>
        {recentSteps.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无步骤</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {recentSteps.map((step) => (
              <div
                key={step.id}
                className="border border-border rounded-lg p-3 bg-card"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">{step.title}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {actionLabels[step.action]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        )}
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
): FlowGraphResult {
  if (!root) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 110,
    ranksep: 140,
    marginx: 40,
    marginy: 40,
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
    const status = getNodeStatus(node.index, currentIndex, stack, visited);

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

function getNodeStatus(
  index: number,
  current: number | null,
  stack: Set<number>,
  visited: Set<number>,
): NodeStatus {
  if (current === index) return "current";
  if (stack.has(index)) return "stack";
  if (visited.has(index)) return "visited";
  return "default";
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

function generateIterativeSteps(root: TreeNode | null): TraversalStep[] {
  const steps: TraversalStep[] = [];
  let id = 1;
  const visited: number[] = [];

  const pushStep = (step: Omit<TraversalStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空，中序遍历的结果也是空数组。",
      action: "complete",
      currentNode: null,
      stack: [],
      visited: [],
    });
    return steps;
  }

  pushStep({
    title: "初始化",
    description: "创建一个空栈，从根节点开始向左尝试。",
    action: "descend",
    currentNode: root.index,
    stack: [],
    visited: [],
  });

  const stack: TreeNode[] = [];
  let current: TreeNode | null = root;

  while (current || stack.length) {
    while (current) {
      stack.push(current);
      pushStep({
        title: `压栈 ${current.value}`,
        description: `节点 ${current.value} 入栈，继续深入它的左子树。`,
        action: "descend",
        currentNode: current.index,
        stack: stack.map((node) => node.index),
        visited: [...visited],
      });
      current = current.left;
    }

    const node = stack.pop();
    if (!node) break;

    visited.push(node.index);
    pushStep({
      title: `访问 ${node.value}`,
      description: `左子树处理完毕，将节点 ${node.value} 加入结果。`,
      action: "visit",
      currentNode: node.index,
      stack: stack.map((item) => item.index),
      visited: [...visited],
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
      });
    }
  }

  pushStep({
    title: "遍历完成",
    description: "栈与指针均为空，遍历告一段落。",
    action: "complete",
    currentNode: null,
    stack: [],
    visited: [...visited],
  });

  return steps;
}

function generateRecursiveSteps(root: TreeNode | null): TraversalStep[] {
  const steps: TraversalStep[] = [];
  let id = 1;
  const visited: number[] = [];
  const stack: TreeNode[] = [];

  const pushStep = (step: Omit<TraversalStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空，中序遍历的结果也是空数组。",
      action: "complete",
      currentNode: null,
      stack: [],
      visited: [],
    });
    return steps;
  }

  pushStep({
    title: "开始递归",
    description: "函数调用栈会保存路径，先深入左子树后访问根节点。",
    action: "descend",
    currentNode: root.index,
    stack: [],
    visited: [],
  });

  const traverse = (node: TreeNode | null) => {
    if (!node) return;

    stack.push(node);
    pushStep({
      title: `进入 ${node.value}`,
      description: `递归处理节点 ${node.value} 的左子树。`,
      action: "descend",
      currentNode: node.index,
      stack: stack.map((item) => item.index),
      visited: [...visited],
    });

    traverse(node.left);

    visited.push(node.index);
    pushStep({
      title: `访问 ${node.value}`,
      description: `左子树完成，输出当前节点 ${node.value}。`,
      action: "visit",
      currentNode: node.index,
      stack: stack.map((item) => item.index),
      visited: [...visited],
    });

    if (node.right) {
      pushStep({
        title: `右子树 ${node.right.value}`,
        description: `继续递归处理节点 ${node.right.value}。`,
        action: "move-right",
        currentNode: node.right.index,
        stack: stack.map((item) => item.index),
        visited: [...visited],
      });
    }

    traverse(node.right);

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
      });
    }
  };

  traverse(root);

  pushStep({
    title: "递归结束",
    description: "所有节点都访问完毕，得到完整的中序序列。",
    action: "complete",
    currentNode: null,
    stack: [],
    visited: [...visited],
  });

  return steps;
}
