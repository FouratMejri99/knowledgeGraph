import Node from "./node";

export default function ExpandableNode({
  id,
  data,
  onToggleNode,
  onToggleSection,
}) {
  return (
    <Node
      id={id}
      data={data}
      depth={0}
      onToggleNode={onToggleNode}
      onToggleSection={onToggleSection}
    />
  );
}
