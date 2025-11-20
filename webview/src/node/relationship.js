// relationship.js
export class Relationship {
  constructor({ name, type, sourceElement, targetElement }) {
    this.name = name;
    this.type = type;
    this.sourceElement = sourceElement;
    this.targetElement = targetElement;
  }

  // Return color based on type
  getColor() {
    const TYPE_COLORS = {
      Inheritance: "#ff6f61",
      Usage: "#6fc1ff",
      Dependency: "#ffd166",
      Association: "#06d6a0",
    };
    return TYPE_COLORS[this.type] || "#aaa";
  }

  // Returns source id based on expansion
  getSourceId() {
    if (this.sourceElement.expanded === false && this.sourceElement.sections) {
      // If collapsed, point to Section itself
      return this.sourceElement.id;
    } else if (
      this.sourceElement.subnodes &&
      this.sourceElement.subnodes.length
    ) {
      // If expanded, could point to subnodes
      return this.sourceElement.subnodes.map((sn) => sn.id);
    }
    return this.sourceElement.id;
  }

  // Returns target id based on expansion
  getTargetId() {
    if (this.targetElement.expanded === false && this.targetElement.sections) {
      return this.targetElement.id;
    } else if (
      this.targetElement.subnodes &&
      this.targetElement.subnodes.length
    ) {
      return this.targetElement.subnodes.map((sn) => sn.id);
    }
    return this.targetElement.id;
  }

  // Convert to React Flow edge objects
  toEdges() {
    const sourceIds = Array.isArray(this.getSourceId())
      ? this.getSourceId()
      : [this.getSourceId()];
    const targetIds = Array.isArray(this.getTargetId())
      ? this.getTargetId()
      : [this.getTargetId()];

    const edges = [];
    sourceIds.forEach((sId) => {
      targetIds.forEach((tId) => {
        edges.push({
          id: `edge-${sId}-${tId}`,
          source: sId,
          target: tId,
          style: { stroke: this.getColor(), strokeWidth: 2 },
          animated: true,
          label: this.name,
        });
      });
    });

    return edges;
  }
}
