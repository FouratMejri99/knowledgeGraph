import { useState } from "react";

export default function NodeComponent({ node }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const toggleNode = () => setExpanded((prev) => !prev);
  const toggleSection = (id) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div
      style={{
        border: "2px solid #00796b",
        borderRadius: 10,
        padding: 12,
        background: "#e0f7fa",
        width: 280,
        fontFamily: "sans-serif",
      }}
    >
      {/* Node header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={toggleNode}
      >
        <strong>{node.name}</strong>
        <button style={{ cursor: "pointer" }}>{expanded ? "−" : "+"}</button>
      </div>

      {/* Expand sections */}
      {expanded && (
        <div style={{ marginTop: 8, paddingLeft: 10 }}>
          {node.sections.map((section) => (
            <div
              key={section.id}
              style={{
                border: "1px solid #f57c00",
                borderRadius: 6,
                background: "#fff3e0",
                marginTop: 6,
                padding: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onClick={() => toggleSection(section.id)}
              >
                <span>{section.name}</span>
                <button style={{ cursor: "pointer" }}>
                  {expandedSections[section.id] ? "−" : "+"}
                </button>
              </div>

              {/* Expand subnodes */}
              {expandedSections[section.id] && (
                <div style={{ marginTop: 6, paddingLeft: 8 }}>
                  {section.subnodes.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        border: "1px solid #3f51b5",
                        borderRadius: 4,
                        padding: 4,
                        marginTop: 4,
                        background: "#e8eaf6",
                        fontSize: 13,
                      }}
                    >
                      {sub.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
