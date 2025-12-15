import { Handle, Position } from "@xyflow/react";
import { SECTION_COLORS, SECTION_NAME_BY_TYPE } from "../utils/model";
import Subnode from "./subnode";

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

const bucketForType = (type) =>
  normalizeBucket(SECTION_NAME_BY_TYPE[type] || type || "unknown");

const sortSubnodes = (subs) =>
  [...(subs || [])].sort((a, b) => {
    const aBucket = bucketForType(a.type);
    const bBucket = bucketForType(b.type);
    const aIdx = priorityIndex[aBucket] ?? Number.MAX_SAFE_INTEGER;
    const bIdx = priorityIndex[bBucket] ?? Number.MAX_SAFE_INTEGER;
    if (aIdx !== bIdx) return aIdx - bIdx;
    const aName = a.name || a.label || aBucket;
    const bName = b.name || b.label || bBucket;
    return aName.localeCompare(bName);
  });

export default function Section({
  section,
  depth,
  onToggleSection,
  onToggleNode,
  showChildren = true,
}) {
  const expanded = section.expanded ?? false;
  // Get color from SECTION_COLORS based on section name, normalize "Local Functions"/"External Functions" to "Functions"
  const normalizedName = normalizeBucket(section.name || "");
  const sectionColor =
    SECTION_COLORS[normalizedName] ||
    SECTION_COLORS[section.name] ||
    section.color ||
    "#ccc";

  return (
    <div
      style={{
        position: "relative", // REQUIRED
        border: `1px solid ${sectionColor}`,
        padding: 4,
        borderRadius: 4,
        marginTop: 2,
        marginBottom: 2,
        background: "transparent",
        marginLeft: depth * 8,
      }}
    >
      {/* Section handles */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${section.id}-target`}
        style={{
          background: sectionColor,
          opacity: 0,
          width: 16,
          height: 16,
          border: "none",
          pointerEvents: "all",
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id={`${section.id}-source`}
        style={{
          background: sectionColor,
          opacity: 0,
          width: 16,
          height: 16,
          border: "none",
          pointerEvents: "all",
        }}
      />

      {/* HEADER ROW (you MUST keep this) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
          fontSize: 12,
          color: "#000",
        }}
      >
        <span>{section.name}</span>

        <button
          onClick={() => onToggleSection?.(section.parentNodeId, section.id)}
          tabIndex={-1}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#000",
            fontWeight: "bold",
            padding: "0 4px",
            outline: "none",
          }}
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {/* Subnodes */}
      {expanded &&
        showChildren &&
        sortSubnodes(section.subnodes).map((sub) => (
          <Subnode
            key={sub.id}
            data={sub}
            depth={depth + 1}
            onToggleNode={onToggleNode}
            onToggleSection={onToggleSection}
          />
        ))}
    </div>
  );
}
