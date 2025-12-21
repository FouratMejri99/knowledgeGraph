import Node from "./node";

export default function ExpandableNode({
  id,
  data,
  onToggleNode,
  onToggleSection,
  onNodeClick,
  parentId,
}) {
  const isInRootFolder = parentId === "root-folder" || (parentId && parentId.startsWith("subfolder-"));
  
  // Extract subfolder prefix from parentId (format: "subfolder-{prefix}")
  let subfolderPrefix = null;
  if (parentId && parentId.startsWith("subfolder-")) {
    subfolderPrefix = parentId.replace("subfolder-", "");
  }
  
  return (
    <Node
      id={id}
      data={data}
      depth={0}
      onToggleNode={onToggleNode}
      onToggleSection={onToggleSection}
      onNodeClick={onNodeClick}
      isInRootFolder={isInRootFolder}
      subfolderPrefix={subfolderPrefix}
    />
  );
}
