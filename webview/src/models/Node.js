/**
 * Represents a Node in the Knowledge Graph.
 * A Node can contain multiple Sections, and can also serve as a Subnode.
 */
export class Node {
  constructor({ id, name, type = "default", sections = [] }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.sections = sections; // Array of Section objects
  }

  /**
   * Get the display color based on the Node type.
   */
  getColor() {
    const typeColors = {
      default: "#b2ebf2",
      input: "#c8e6c9",
      process: "#bbdefb",
      output: "#ffe0b2",
      error: "#ffcdd2",
    };
    return typeColors[this.type] || typeColors.default;
  }

  /**
   * Add a new section to the node.
   * @param {Section} section
   */
  addSection(section) {
    this.sections.push(section);
  }

  /**
   * Convert the Node and its hierarchy to a ReactFlow-friendly structure.
   */
  toReactFlowData() {
    return {
      id: this.id,
      type: "expandable",
      data: {
        label: this.name,
        type: this.type,
        color: this.getColor(),
        sections: this.sections.map((s) => s.toJSON()),
      },
      position: { x: 0, y: 0 },
    };
  }

  /**
   * Export Node to JSON for saving / serialization.
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      sections: this.sections.map((s) => s.toJSON()),
    };
  }
}
