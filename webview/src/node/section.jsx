import { useState } from "react";
import Subnode from "./subnode";

// Section type colors
const SECTION_TYPE_COLORS = {
  Files: "#ffb3ba",
  Imports: "#baffc9",
  Classes: "#bae1ff",
  Methods: "#ffffba",
  Objects: "#ffdfba",
  "Local Functions": "#e3baff",
  "External Functions": "#c2ffe3",
  Variables: "#ffd6e0",
  "Local Libraries": "#d0e1ff",
  "External Libraries": "#e0ffd0",
};

export default function Section({ section, depth }) {
  const [expanded, setExpanded] = useState(false);
  const [subnodes, setSubnodes] = useState(section.subnodes || []);

  const toggleSection = () => setExpanded((p) => !p);

  const sectionColor = SECTION_TYPE_COLORS[section.name] || "#ccc";

  // Add a new subnode
  const addSubnode = () => {
    const newId = `sub-${Date.now()}`;
    const newSubNode = {
      id: newId,
      label: "Child Node",
      sections: [{ id: `${newId}-sec1`, name: "Section 1", subnodes: [] }],
    };
    setSubnodes((prev) => [...prev, newSubNode]);
  };

  return (
    <div
      style={{
        border: `2px solid ${sectionColor}`,
        padding: 6,
        borderRadius: 6,
        marginTop: 4,
        background: `${sectionColor}33`, // light transparent bg
        marginLeft: depth * 16,
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: "bold",
          fontSize: 12,
          color: "#000",
        }}
      >
        <span>{section.name}</span>
        <button
          onClick={toggleSection}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#000",
            fontWeight: "bold",
          }}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {/* Expanded Section Content */}
      {expanded && (
        <div style={{ marginTop: 4 }}>
          {subnodes.map((sub) => (
            <Subnode key={sub.id} data={sub} depth={depth + 1} />
          ))}

          <button
            onClick={addSubnode}
            style={{
              marginTop: 4,
              background: `blue`,
              border: `1px dashed ${sectionColor}`,
              borderRadius: 6,
              color: "white",
              padding: "3px 6px",
              cursor: "pointer",
              fontSize: 12,
              display: "block",
            }}
          >
            + Create Subnode
          </button>
        </div>
      )}
    </div>
  );
}
