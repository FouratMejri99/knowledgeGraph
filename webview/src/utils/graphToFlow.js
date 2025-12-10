import {
  EDGE_STYLES,
  NODE_TYPE_COLORS,
  NodeModel,
  RelationshipModel,
  SECTION_NAME_BY_TYPE,
} from "./model";

function buildNodeMap(rawNodes) {
  const scopeMap = new Map();
  const nodeMap = new Map();

  rawNodes.forEach((node) => {
    scopeMap.set(node.id, node.scope || []);
    nodeMap.set(
      node.id,
      new NodeModel({
        ...node,
        color: NODE_TYPE_COLORS[node.type] || "#ccc",
        expanded: false,
      })
    );
  });

  return { nodeMap, scopeMap };
}

function attachChildToParent(parent, child) {
  // Track parent node so we can route edges to the correct ReactFlow node handle
  child.parentSectionId = null;
  child.parentNodeId = parent.id;
  parent.subnodes.push(child);
}

function attachByScope(rawNodes, nodeMap, scopeMap) {
  const hasParent = new Set();

  rawNodes.forEach((node) => {
    const scope = scopeMap.get(node.id) || [];
    if (!scope.length) return;

    const parentId = scope[scope.length - 1];
    const parent = nodeMap.get(parentId);
    const child = nodeMap.get(node.id);
    if (!parent || !child) return;

    attachChildToParent(parent, child);
    hasParent.add(child.id);
  });

  return hasParent;
}

function attachByContainsEdges(rawEdges, nodeMap, hasParent) {
  rawEdges
    .filter((e) => e.relation === "contains")
    .forEach((edge) => {
      const parent = nodeMap.get(edge.source);
      const child = nodeMap.get(edge.target);
      if (!parent || !child || hasParent.has(child.id)) return;

      attachChildToParent(parent, child);
      hasParent.add(child.id);
    });
}

function buildRelationshipEdges(rawEdges, nodeMap) {
  const relationships = [];
  const dedupe = new Set();

  rawEdges
    .filter((e) => e.relation !== "contains" && e.relation !== "uses")
    .forEach((edge, index) => {
      const hasSource = nodeMap.has(edge.source);
      const hasTarget = nodeMap.has(edge.target);
      if (!hasSource || !hasTarget) return;

      const key = `${edge.source}-${edge.target}-${edge.relation}`;
      if (dedupe.has(key)) return;
      dedupe.add(key);

      const styleCfg = EDGE_STYLES[edge.relation] || {
        bg: "rgba(255, 182, 193, 0.15)",
        border: "1px solid rgba(255, 182, 193, 0.4)",
        color: "white",
        stroke: "white",
      };

      relationships.push(
        new RelationshipModel({
          id: `edge-${index}`,
          source: edge.source,
          target: edge.target,
          relation: edge.relation,
          style: {
            stroke: styleCfg.stroke,
            strokeWidth: 1,
          },
          labelStyle: {
            fill: styleCfg.color,
            fontSize: 11,
            fontWeight: 600,
          },
          labelBgStyle: {
            fill: styleCfg.bg,
            stroke: styleCfg.border,
            rx: 12,
            ry: 12,
          },
          labelBgPadding: [6, 10],
        })
      );
    });

  return relationships;
}

const PRIORITY_ORDER = [
  "Files",
  "Imports",
  "Classes",
  "Methods",
  "Objects",
  "Functions",
  "Variables",
  "Libraries",
];

const priorityIndex = PRIORITY_ORDER.reduce((acc, key, idx) => {
  acc[key] = idx;
  return acc;
}, {});

const normalizeBucket = (bucket) => {
  const map = {
    "Local Functions": "Functions",
    "External Functions": "Functions",
    "Local Libraries": "Libraries",
    "External Libraries": "Libraries",
  };
  return map[bucket] || bucket;
};

export const bucketForType = (type) =>
  normalizeBucket(SECTION_NAME_BY_TYPE[type] || type || "unknown");

export const sortByPriority = (items, mapper) =>
  [...(items || [])].sort((a, b) => {
    const aBucket = normalizeBucket(mapper(a));
    const bBucket = normalizeBucket(mapper(b));
    const aIdx = priorityIndex[aBucket] ?? Number.MAX_SAFE_INTEGER;
    const bIdx = priorityIndex[bBucket] ?? Number.MAX_SAFE_INTEGER;
    if (aIdx !== bIdx) return aIdx - bIdx;
    const aName = a.name || a.label || aBucket;
    const bName = b.name || b.label || bBucket;
    return aName.localeCompare(bName);
  });

function layoutRoots(roots) {
  return roots.map((node, index) => ({
    id: node.id,
    type: "expandable",
    position: {
      x: 80 + (index % 5) * 360,
      y: 80 + Math.floor(index / 5) * 220,
    },
    data: node,
  }));
}

export function graphToFlow(rawNodes = [], rawEdges = []) {
  const { nodeMap, scopeMap } = buildNodeMap(rawNodes);

  const hasParent = attachByScope(rawNodes, nodeMap, scopeMap);
  attachByContainsEdges(rawEdges, nodeMap, hasParent);

  // annotate parent/child relationships for sections and subnodes so handles resolve cleanly
  const annotateHierarchy = (
    node,
    parentNodeId = null,
    parentSectionId = null
  ) => {
    node.parentNodeId = parentNodeId;
    node.parentSectionId = parentSectionId;

    (node.sections || []).forEach((sec) => {
      sec.parentNodeId = node.id;
      (sec.subnodes || []).forEach((sub) =>
        annotateHierarchy(sub, node.id, sec.id)
      );
    });

    (node.subnodes || []).forEach((sub) =>
      annotateHierarchy(sub, node.id, null)
    );
  };

  const roots = [...nodeMap.values()].filter((node) => !hasParent.has(node.id));
  roots.forEach((root) => annotateHierarchy(root));
  const flowNodes = layoutRoots(roots);
  const relationshipEdges = buildRelationshipEdges(rawEdges, nodeMap);

  return {
    nodes: flowNodes,
    relationships: relationshipEdges,
    nodeMap,
  };
}
