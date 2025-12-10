import { Handle, Position } from "@xyflow/react";
import { SECTION_COLORS, SECTION_NAME_BY_TYPE } from "../utils/model";
import Section from "./section";
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

  // Group sections by their normalized type (Functions, Variables, etc.)
  // All sections with the same type go into the same rectangular frame
  const groupedSections = sortedSections.reduce((groups, section) => {
    // Normalize section name to group "Local Functions" and "External Functions" as "Functions"
    const normalizedType = normalizeBucket(section.name || "");
    if (!groups[normalizedType]) {
      groups[normalizedType] = [];
    }
    groups[normalizedType].push(section);
    return groups;
  }, {});

  return (
    <div
      style={{
        border: `1px solid ${headerColor}`,
        borderRadius: 8,
        background: "transparent",
        padding: 0,
        minWidth: 220,
        fontFamily: "Arial, sans-serif",
        fontSize: 13,
        color: "#000",
        overflow: "hidden",
      }}
    >
      {/* Handles are always visible so relations can be created without expanding */}
      <>
        <Handle
          type="target"
          position={Position.Left}
          id={`${data.id}-target`}
          style={{
            background: headerColor,
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
          id={`${data.id}-source`}
          style={{
            background: headerColor,
            opacity: 0,
            width: 16,
            height: 16,
            border: "none",
            pointerEvents: "all",
          }}
        />
      </>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: headerColor,
          borderRadius: 6,
          padding: "4px 6px",
        }}
      >
        <span
          onClick={() => onToggleNode?.(data.id)}
          style={{
            fontWeight: "bold",
            fontSize: 18,
            marginRight: 6,
            userSelect: "none",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {expanded ? "−" : "+"}
        </span>

        <span
          style={{
            border: "none",
            background: "transparent",
            color: "#000",
            fontWeight: "bold",
            fontSize: 13,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={data.label}
        >
          {data.label}
        </span>

        <span
          style={{
            marginLeft: 6,
            padding: "2px 8px",
            borderRadius: 12,
            background: "#fff",
            color: "#4fc3f7",
            fontSize: 11,
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          {data.type}
        </span>
      </div>

      {expanded && showChildren && (
        <div
          style={{
            marginTop: 4,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginRight: 8, // add right-side breathing room from border
          }}
        >
          {/* Render sections grouped by type in colored rectangular frames */}
          {Object.entries(groupedSections).map(([type, sections]) => {
            const groupColor = SECTION_COLORS[type] || "#ccc";
            return (
              <div
                key={type}
                style={{
                  background: `${groupColor}40`, // semi-transparent fill
                  border: `3px solid ${groupColor}`,
                  borderRadius: 8,
                  padding: 8,
                  marginBottom: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  boxShadow: `0 2px 4px ${groupColor}30`,
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

          {(sortedSections.length === 0 || !data.sections?.length) &&
            sortedSubnodes.map((sub) => (
              <Subnode
                key={sub.id}
                data={sub}
                depth={1}
                onToggleNode={onToggleNode}
                onToggleSection={onToggleSection}
              />
            ))}
        </div>
      )}
    </div>
  );
}
