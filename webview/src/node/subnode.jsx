import Node from "./node";

export default function Subnode({
  data,
  depth,
  onToggleNode,
  onToggleSection,
  showChildren = true,
  inset = true,
}) {
  return (
    <div
      style={
        inset
          ? { marginLeft: depth * 18, marginTop: 6, marginBottom: 2 }
          : { margin: 0 }
      }
    >
      <Node
        id={data.id}
        data={data}
        depth={depth}
        onToggleNode={onToggleNode}
        onToggleSection={onToggleSection}
        showChildren={showChildren}
      />
    </div>
  );
}
