export const NODE_TYPE_COLORS = {
  folder: "#ffd180",
  file: "#90caf9",
  class: "#f48fb1",
  method: "#a5d6a7",
  object: "#ce93d8",
  function: "#80cbc4",
  "External Function": "#ffab91",
  variable: "#ffe082",
  "Local Library": "#b39ddb",
  "External Library": "#c5e1a5",
  module: "#90a4ae",
};

export const SECTION_NAME_BY_TYPE = {
  module: "Files",
  folder: "Files",
  file: "Files",
  class: "Classes",
  method: "Methods",
  object: "Objects",
  function: "Local Functions",
  "External Function": "External Functions",
  variable: "Variables",
  "Local Library": "Local Libraries",
  "External Library": "External Libraries",
};

export const SECTION_COLORS = {
  Functions: "#4caf50", // green
  Variables: "#ff9800", // orange
  Classes: "#2196f3", // blue
  Methods: "#9c27b0", // purple
  Objects: "#f44336", // red
  Libraries: "#607d8b", // gray
  Imports: "#00bcd4", // cyan
  Files: "#795548", // brown
};

export const EDGE_STYLES = {
  imports: {
    bg: "rgba(255, 182, 193, 0.15)",
    border: "1px solid rgba(255, 182, 193, 0.4)",
    color: "white",
    stroke: "blue",
  },
  uses: {
    bg: "rgba(248, 2, 125, 0.15)",
    border: "1px solid rgba(83, 10, 255, 0.4)",
    color: "white",
    stroke: "blue",
  },
  contains: {
    bg: "rgba(199, 21, 133, 0.15)",
    border: "1px solid rgba(199, 21, 133, 0.4)",
    color: "white",
    stroke: "red",
  },
};

export class NodeModel {
  constructor(raw) {
    this.id = raw.id;
    this.label = raw.name;
    this.name = raw.name;
    this.type = raw.type;
    this.color = NODE_TYPE_COLORS[raw.type] || "#ccc";
    this.sections = raw.sections || [];
    this.sectionLookup = new Map();
    this.parentSectionId = raw.parentSectionId || null;
    this.parentNodeId = raw.parentNodeId || null;
    this.expanded = raw.expanded ?? false;
    this.subnodes = raw.subnodes || [];
  }
}

export class SectionModel {
  constructor({
    id,
    name,
    color,
    parentNodeId,
    expanded = false,
    subnodes = [],
  }) {
    this.id = id;
    this.name = name;
    this.type = "section";
    this.color = color || "#ccc";
    this.expanded = expanded;
    this.subnodes = subnodes;
    this.parentNodeId = parentNodeId;
  }
}

export class RelationshipModel {
  constructor({
    id,
    source,
    target,
    relation,
    style,
    labelStyle,
    labelBgStyle,
    labelBgPadding,
  }) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.relation = relation;
    this.style = style;
    this.labelStyle = labelStyle;
    this.labelBgStyle = labelBgStyle;
    this.labelBgPadding = labelBgPadding;
  }

  resolveEndpoint(elementId, lookups, side) {
    const findHostNode = (node) => {
      let current = node;
      let guard = 0;
      while (current?.parentNodeId && guard < 50) {
        const parent = lookups.nodeLookup.get(current.parentNodeId);
        if (!parent) break;
        current = parent;
        guard += 1;
      }
      return current;
    };

    const node = lookups.nodeLookup.get(elementId);
    if (node) {
      const host = findHostNode(node);
      const isRoot =
        host?.parentNodeId === null || host?.parentNodeId === undefined;
      return {
        id: host?.id || elementId,
        handleId: isRoot && node === host ? null : `${elementId}-${side}`,
        kind: node.parentNodeId ? "subnode" : "node",
      };
    }

    const section = lookups.sectionLookup.get(elementId);
    if (section) {
      const host = lookups.nodeLookup.get(section.parentNodeId);
      const rootHost = host ? findHostNode(host) : null;
      return {
        id: rootHost?.id || section.parentNodeId,
        handleId: `${section.id}-${side}`,
        kind: "section",
      };
    }

    return { id: elementId, handleId: null, kind: "unknown" };
  }

  toEdge(lookups, index) {
    const sourceEp = this.resolveEndpoint(this.source, lookups, "source");
    const targetEp = this.resolveEndpoint(this.target, lookups, "target");
    const derivedStroke =
      sourceEp.kind === "section" || targetEp.kind === "section"
        ? "#00c853" // green for sections
        : sourceEp.kind === "subnode" || targetEp.kind === "subnode"
        ? "#ff9800" // orange for subnodes
        : null;
    const stroke = this.style?.stroke || derivedStroke || "#999";
    const style = { ...(this.style || {}), stroke };

    return {
      id: this.id || `edge-${index}`,
      source: sourceEp.id,
      target: targetEp.id,
      sourceHandle: sourceEp.handleId || undefined,
      targetHandle: targetEp.handleId || undefined,
      label: this.relation, // show relation text (e.g., "uses")
      style,
      labelStyle: this.labelStyle,
      labelBgStyle: this.labelBgStyle,
      labelBgPadding: this.labelBgPadding,
      markerEnd: undefined,
    };
  }
}
