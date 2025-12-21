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

function getNodePrefix(node) {
  const name = node.name || node.label || "";
  const parts = name.split("/");
  return parts.length > 1 ? parts[0] : null;
}

function groupNodesByPrefix(roots) {
  const groups = new Map();
  const ungrouped = [];
  
  roots.forEach((node) => {
    const prefix = getNodePrefix(node);
    if (prefix) {
      if (!groups.has(prefix)) {
        groups.set(prefix, []);
      }
      groups.get(prefix).push(node);
    } else {
      ungrouped.push(node);
    }
  });
  
  return { groups, ungrouped };
}

function layoutNodesInRootFolder(roots) {
  // Sort nodes alphabetically
  const sortedRoots = [...roots].sort((a, b) => {
    const aName = (a.name || a.label || "").toLowerCase();
    const bName = (b.name || b.label || "").toLowerCase();
    return aName.localeCompare(bName);
  });

  // Group nodes by prefix for subfolders
  const { groups, ungrouped } = groupNodesByPrefix(sortedRoots);
  
  const NODES_PER_ROW = 3;
  const NODE_WIDTH = 280;
  const NODE_HEIGHT = 200;
  const SUBFOLDER_WIDTH = 900;
  const SPACING = 24; // Increased spacing between nodes
  const SUBFOLDER_SPACING = 32; // Increased spacing between subfolders
  const CONTENT_PADDING_TOP = 24; // Top padding in content area
  const CONTENT_PADDING_SIDE = 20; // Side padding in content area
  
  const flowNodes = [];
  const HEADER_HEIGHT = 50;
  // Start position for content inside root folder (after header)
  let currentY = HEADER_HEIGHT + CONTENT_PADDING_TOP;
  
  // Layout subfolders first
  const sortedPrefixes = Array.from(groups.keys()).sort();
  sortedPrefixes.forEach((prefix) => {
    const nodesInGroup = groups.get(prefix);
    const sortedNodesInGroup = [...nodesInGroup].sort((a, b) => {
      const aName = (a.name || a.label || "").toLowerCase();
      const bName = (b.name || b.label || "").toLowerCase();
      return aName.localeCompare(bName);
    });
    
    const numRows = Math.ceil(sortedNodesInGroup.length / NODES_PER_ROW);
    // Calculate content height (excluding header): top padding + nodes + spacing + bottom padding
    const contentHeight = CONTENT_PADDING_TOP + numRows * NODE_HEIGHT + (numRows - 1) * SPACING + 24;
    // Total height: header + content height
    const subfolderHeight = HEADER_HEIGHT + contentHeight;
    
    // Create subfolder
    const subfolderId = `subfolder-${prefix}`;
    flowNodes.push({
      id: subfolderId,
      type: "folder",
      position: { x: CONTENT_PADDING_SIDE, y: currentY },
      data: {
        label: prefix,
        expanded: true,
        isSubfolder: true,
        totalContentHeight: contentHeight,
      },
      style: {
        width: SUBFOLDER_WIDTH,
        height: subfolderHeight,
      },
      parentId: "root-folder",
      extent: "parent",
      draggable: false,
    });
    
    // Layout nodes inside subfolder (positions relative to subfolder origin, must be below header)
    sortedNodesInGroup.forEach((node, index) => {
      const row = Math.floor(index / NODES_PER_ROW);
      const col = index % NODES_PER_ROW;
      const nodeX = CONTENT_PADDING_SIDE + col * (NODE_WIDTH + SPACING);
      // Position nodes below subfolder header: header height (50) + top padding (24) + row offset
      const nodeY = HEADER_HEIGHT + CONTENT_PADDING_TOP + row * (NODE_HEIGHT + SPACING);
      flowNodes.push({
        id: node.id,
        type: "expandable",
        position: {
          x: nodeX,
          y: nodeY,
        },
        data: {
          ...node,
          expanded: false,
          originalPosition: {
            x: nodeX,
            y: nodeY,
          },
          originalParentId: subfolderId,
        },
        parentId: subfolderId,
        extent: "parent",
        draggable: false,
      });
    });
    
    currentY += subfolderHeight + SUBFOLDER_SPACING;
  });
  
  // Layout ungrouped nodes (positions relative to root folder origin, must be below header)
  ungrouped.forEach((node, index) => {
    const row = Math.floor(index / NODES_PER_ROW);
    const col = index % NODES_PER_ROW;
    const nodeX = CONTENT_PADDING_SIDE + col * (NODE_WIDTH + SPACING);
    // Position relative to root folder origin: header (50) + top padding (24) + row offset
    // currentY already includes header + padding + all previous subfolders, so use it as base for first row
    const baseY = currentY;
    const nodeY = baseY + row * (NODE_HEIGHT + SPACING);
    flowNodes.push({
      id: node.id,
      type: "expandable",
      position: {
        x: nodeX,
        y: nodeY,
      },
      data: {
        ...node,
        expanded: false,
        originalPosition: {
          x: nodeX,
          y: nodeY,
        },
        originalParentId: "root-folder",
      },
      parentId: "root-folder",
      extent: "parent",
      draggable: false,
    });
  });
  
  // Update currentY for total height calculation
  const numUngroupedRows = Math.ceil(ungrouped.length / NODES_PER_ROW);
  if (ungrouped.length > 0) {
    currentY += numUngroupedRows * (NODE_HEIGHT + SPACING);
  }
  currentY += 24; // Bottom padding
  // Adjust to get total content height (subtract header since currentY includes it)
  const contentHeight = currentY - HEADER_HEIGHT;
  
  return { flowNodes, totalHeight: contentHeight };
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
  
  // Create root folder with subfolders
  const { flowNodes: nodesInFolder, totalHeight } = layoutNodesInRootFolder(roots);
  const HEADER_HEIGHT = 50;
  const CONTENT_PADDING = 48; // Top (24) + bottom (24) padding
  const folderWidth = 3 * 280 + 4 * 24 + 40; // 3 nodes * 280px + 4 spacings * 24px + 40px side padding
  const folderHeight = Math.max(200, HEADER_HEIGHT + totalHeight);
  
  const rootFolder = {
    id: "root-folder",
    type: "folder",
    position: { x: 50, y: 50 },
    data: {
      label: "root",
      expanded: true,
      isRootFolder: true,
      totalContentHeight: totalHeight,
    },
    style: {
      width: folderWidth,
      height: folderHeight,
    },
  };
  
  const flowNodes = [rootFolder, ...nodesInFolder];
  const relationshipEdges = buildRelationshipEdges(rawEdges, nodeMap);

  return {
    nodes: flowNodes,
    relationships: relationshipEdges,
    nodeMap,
  };
}
