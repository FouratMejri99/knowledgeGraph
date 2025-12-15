import { Handle, Position } from "@xyflow/react";
import { SECTION_COLORS, SECTION_NAME_BY_TYPE } from "../utils/model";

import Section from "./section";
import Subnode from "./subnode";

/* =======================
   Layout constants
======================= */
const SPACING = 8;
const BORDER_RADIUS = 8;
const HANDLE_SIZE = 10;

/* =======================
   Priority handling
======================= */
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

function bucketForType(type) {
  return normalizeBucket(SECTION_NAME_BY_TYPE[type] || type || "unknown");
}

function sortByPriority(list, getBucket) {
  return [...(list || [])].sort((a, b) => {
    const aBucket = normalizeBucket(getBucket(a));
    const bBucket = normalizeBucket(getBucket(b));
    const aIdx = priorityIndex[aBucket] ?? Number.MAX_SAFE_INTEGER;
    const bIdx = priorityIndex[bBucket] ?? Number.MAX_SAFE_INTEGER;

    if (aIdx !== bIdx) return aIdx - bIdx;

    const aName = a.name || a.label || aBucket;
    const bName = b.name || b.label || bBucket;
    return aName.localeCompare(bName);
  });
}

/* =======================
   Node Component
======================= */
export default function Node({
  data,
  onToggleNode,
  onToggleSection,
  showChildren = true,
}) {
  const expanded = data.expanded ?? false;
  const headerColor = data.color || "#4caf50";

  const sortedSections = sortByPriority(data.sections, (s) => s.name);
  const sortedSubnodes = sortByPriority(data.subnodes, (s) =>
    bucketForType(s.type)
  );

  const groupedSections = sortedSections.reduce((groups, section) => {
    const normalizedType = normalizeBucket(section.name || "");
    if (!groups[normalizedType]) groups[normalizedType] = [];
    groups[normalizedType].push(section);
    return groups;
  }, {});

  const groupedSubnodes = sortedSubnodes.reduce((groups, node) => {
    const normalizedType = bucketForType(node.type);
    if (!groups[normalizedType]) groups[normalizedType] = [];
    groups[normalizedType].push(node);
    return groups;
  }, {});

  /* =======================
     Handle style
  ======================= */
  const handleStyle = {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    background: "#5c3cb3ff",
    border: "2px solid #fff",
    borderRadius: "50%",
  };

  return (
    <div
      style={{
        border: `1px solid ${headerColor}`,
        borderRadius: BORDER_RADIUS,
        background: "transparent",
        position: "relative",
        minWidth: 220,
        fontFamily: "Arial, sans-serif",
        fontSize: 13,
        overflow: "hidden",
      }}
    >
      {/* =======================
          Handles (touch node)
      ======================= */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${data.id}-target`}
        style={{
          background: "transparent",
          border: "none",
          boxShadow: "none",
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id={`${data.id}-source`}
        style={{
          background: "transparent",
          border: "none",
          boxShadow: "none",
        }}
      />

      {/* =======================
          Header
      ======================= */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: SPACING,
          background: headerColor,
          padding: SPACING,
          borderRadius: BORDER_RADIUS,
        }}
      >
        <span
          onClick={() => onToggleNode?.(data.id)}
          style={{
            fontWeight: "bold",
            fontSize: 18,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {expanded ? "−" : "+"}
        </span>

        <span
          title={data.label}
          style={{
            flex: 1,
            fontWeight: "bold",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {data.label}
        </span>

        <span
          style={{
            padding: "2px 8px",
            borderRadius: 12,
            background: "#fff",
            color: "#4d91dfff",
            fontSize: 11,
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          {data.type}
        </span>
      </div>

      {/* =======================
          Children
      ======================= */}
      {expanded && showChildren && (
        <div
          style={{
            marginTop: SPACING,
            padding: SPACING,
            display: "flex",
            flexDirection: "column",
            gap: SPACING,
          }}
        >
          {/* Sections */}
          {Object.entries(groupedSections).map(([type, sections]) => {
            const groupColor = SECTION_COLORS[type] || "#ccc";

            return (
              <div
                key={type}
                style={{
                  background: `${groupColor}40`,
                  border: `2px solid ${groupColor}`,
                  borderRadius: BORDER_RADIUS,
                  padding: SPACING,
                  display: "flex",
                  flexDirection: "column",
                  gap: SPACING,
                }}
              >
                {sections.map((sec) => (
                  <Section
                    key={sec.id}
                    section={sec}
                    depth={0}
                    onToggleSection={onToggleSection}
                    onToggleNode={onToggleNode}
                  />
                ))}
              </div>
            );
          })}

          {/* Subnodes */}
          {Object.entries(groupedSubnodes).map(([type, subs]) => {
            const groupColor = SECTION_COLORS[type] || "#ccc";

            return (
              <div
                key={type}
                style={{
                  background: `${groupColor}40`,
                  border: `2px solid ${groupColor}`,
                  borderRadius: BORDER_RADIUS,
                  padding: "12px 20px 14px 8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: SPACING,
                }}
              >
                {subs.map((sub) => (
                  <Subnode
                    key={sub.id}
                    data={sub}
                    depth={1}
                    onToggleNode={onToggleNode}
                    onToggleSection={onToggleSection}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
