export class Section {
  constructor({ id, name, subnodes = [] }) {
    this.id = id;
    this.name = name;
    this.subnodes = subnodes; // Array of Node or subnode objects
  }

  addSubnode(subnode) {
    this.subnodes.push(subnode);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      subnodes: this.subnodes.map((n) =>
        typeof n.toJSON === "function" ? n.toJSON() : n
      ),
    };
  }
}
