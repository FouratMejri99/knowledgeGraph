import { useState } from "react";

export default function ExpandableNode({ data }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [nodeName, setNodeName] = useState(data.label || "");
  const [sections, setSections] = useState(data.sections || []);

  const toggleNode = () => setExpanded((prev) => !prev);
  const toggleSection = (id) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSectionNameChange = (id, newName) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  };

  const handleSubnodeNameChange = (sectionId, subId, newName) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              subnodes: s.subnodes.map((sub) =>
                sub.id === subId ? { ...sub, name: newName } : sub
              ),
            }
          : s
      )
    );
  };

  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 8,
        background: "#ffffff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        padding: 10,
        minWidth: 180,
        transition: "all 0.2s ease",
      }}
    >
      {/* Node Header */}
      <div
        onClick={toggleNode}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          paddingBottom: 4,
        }}
      >
        <input
          type="text"
          value={nodeName}
          onChange={(e) => setNodeName(e.target.value)}
          style={{
            border: "none",
            background: "transparent",
            fontWeight: 600,
            fontSize: 14,
            color: "#1a1a1a",
            width: "100%",
            outline: "none",
          }}
        />
        <button
          style={{
            border: "none",
            background: "#f0f0f0",
            color: "#333",
            borderRadius: "50%",
            width: 22,
            height: 22,
            cursor: "pointer",
            fontSize: 13,
            marginLeft: 6,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#e0e0e0")}
          onMouseLeave={(e) => (e.target.style.background = "#f0f0f0")}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {/* Sections */}
      {expanded && sections.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {sections.map((section) => (
            <div
              key={section.id}
              style={{
                border: "1px solid #f1c232",
                borderRadius: 6,
                background: "#fff7e6",
                padding: 6,
                marginTop: 6,
              }}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSection(section.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) =>
                    handleSectionNameChange(section.id, e.target.value)
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#333",
                    width: "100%",
                    outline: "none",
                  }}
                />
                <button
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  {expandedSections[section.id] ? "−" : "+"}
                </button>
              </div>

              {/* Subnodes */}
              {expandedSections[section.id] && (
                <div style={{ marginTop: 4 }}>
                  {section.subnodes.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        background: "#f2f4f8",
                        border: "1px solid #d0d7de",
                        borderRadius: 4,
                        padding: 4,
                        marginTop: 4,
                        fontSize: 12,
                        color: "#444",
                      }}
                    >
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) =>
                          handleSubnodeNameChange(
                            section.id,
                            sub.id,
                            e.target.value
                          )
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          width: "100%",
                          fontSize: 12,
                          color: "#444",
                          outline: "none",
                        }}
                      />
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
