const VISUAL_SCALE = 3;

const SPEED = 2 * VISUAL_SCALE;
const CELL_SIZE = 25 * VISUAL_SCALE;
const NODE_SIZE = 15 * VISUAL_SCALE;
const LINE_THICKNESS = 4;

const SCALE = [
  "A2",
  "B2",
  "C2",
  "D2",
  "E2",
  "F2",
  "G2",
  "A3",
  "B3",
  "C3",
  "D3",
  "E3",
  "F3",
  "G3",
  "A4",
  "B4",
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A5",
  "B5",
  "C5",
  "D5",
  "E5",
  "F5",
  "G5",
  "A6",
];
const NODE_MODES = ["multicast", "round-robin", "random"];
const SHORT_MODES = {
  multicast: "m",
  "round-robin": "o",
  random: "r",
};

let nodes = [];
let edges = [];

let mode = "wait";
let currentNode = null;

class Edge {
  start;
  end;
  signals = [];

  constructor(start, end) {
    this.start = start;
    this.end = end;
    this.start.edges.push(this);
  }

  draw() {
    const dx = this.end.position.x - this.start.position.x;
    const dy = this.end.position.y - this.start.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    for (let i = this.signals.length - 1; i >= 0; i--) {
      this.signals[i] += SPEED;
      if (this.signals[i] > dist) {
        this.signals.splice(i, 1);
        this.end.fire();
      }
    }

    stroke(255);
    drawEdge(
      this.start.position.x,
      this.start.position.y,
      this.end.position.x,
      this.end.position.y
    );

    for (let signal of this.signals) {
      fill(255);
      const x = Math.cos(angle) * signal + this.start.position.x;
      const y = Math.sin(angle) * signal + this.start.position.y;
      ellipse(x, y, LINE_THICKNESS * 2, LINE_THICKNESS * 2);
    }
  }

  addSignal() {
    this.signals.push(0);
  }
}

class Node {
  edges = [];
  position = { x: 0, y: 0 };
  note = "E3";
  excitement = 0;
  mode = "multicast";
  previousEdge = 0;

  constructor(x, y, note, mode = "multicast") {
    this.position = { x, y };
    this.monoSynth = new p5.MonoSynth();
    this.note = note;
    this.mode = mode;
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  draw() {
    noFill();
    strokeWeight(LINE_THICKNESS);
    if (this.mode == "multicast") {
      stroke(255);
    } else if (this.mode == "round-robin") {
      stroke(255, 0, 255);
    }

    fill(255, this.excitement * 255);
    this.excitement *= 0.9;
    ellipse(this.position.x, this.position.y, NODE_SIZE, NODE_SIZE);

    if (currentNode == this) {
      stroke(255);
      ellipse(this.position.x, this.position.y, NODE_SIZE + 10, NODE_SIZE + 10);
    }

    if (mode == "adjust-pitch") {
      fill(0);
      noStroke();
      ellipse(this.position.x, this.position.y, NODE_SIZE - 2, NODE_SIZE + -2);
      textAlign(CENTER, CENTER);
      textSize(16);
      fill(255);
      text(this.note, this.position.x, this.position.y);
    } else if (mode == "adjust-node-mode") {
      fill(0);
      noStroke();
      ellipse(this.position.x, this.position.y, NODE_SIZE - 2, NODE_SIZE + -2);
      textAlign(CENTER, CENTER);
      textSize(16);
      fill(255);
      text(this.mode, this.position.x, this.position.y);
    }

    const gridPoint = closestGridPoint(this.position.x, this.position.y);
    this.position.x = gridPoint.x;
    this.position.y = gridPoint.y;
  }

  fire() {
    this.monoSynth.play(this.note, 1, 0, 0.01);

    if (this.mode == "multicast") {
      for (const edge of this.edges) {
        edge.addSignal();
      }
    } else if (this.mode == "round-robin") {
      this.edges[this.previousEdge].addSignal();
      this.previousEdge = (this.previousEdge + 1) % this.edges.length;
    }
    this.excitement = 1;
  }
}

function drawEdge(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  strokeWeight(LINE_THICKNESS);
  line(x1, y1, x2, y2);

  push();
  translate(x1, y1);
  rotate(angle);
  line(dist / 2 - 10, -10, dist / 2, 0);
  line(dist / 2 - 10, +10, dist / 2, 0);
  pop();
}

function closestGridPoint(x, y) {
  const gridX = Math.round(x / CELL_SIZE) * CELL_SIZE;
  const gridY = Math.round(y / CELL_SIZE) * CELL_SIZE;
  return { x: gridX, y: gridY };
}

function setup() {
  canvas = createCanvas(1000, 800);
  deserializeFromUrl();
}

function draw() {
  background(0);

  // draw grid with dots
  fill(100);
  noStroke();
  for (let x = 0; x < width; x += CELL_SIZE) {
    for (let y = 0; y < height; y += CELL_SIZE) {
      ellipse(x, y, 4, 4);
    }
  }

  switch (mode) {
    case "wait":
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(32);
      text("CLICK TO BEGIN", width / 2, height / 2);
      break;
    case "drag-node":
      currentNode.position.x = mouseX;
      currentNode.position.y = mouseY;
      break;
    case "adjust-pitch":
      {
        const delta = currentNode.position.y - mouseY;
        const noteIndex = Math.floor(SCALE.length / 2) + Math.floor(delta / 20);
        if (noteIndex >= 0 && noteIndex < SCALE.length) {
          const nextNote = SCALE[noteIndex];
          if (nextNote != currentNode.note) {
            currentNode.note = nextNote;
            currentNode.monoSynth.play(currentNode.note, 1, 0, 0.01);
          }
        }
      }
      break;
    case "adjust-node-mode":
      {
        const delta = currentNode.position.y - mouseY;
        const index =
          Math.floor(NODE_MODES.length / 2) + Math.floor(delta / 50);
        if (index >= 0 && index < NODE_MODES.length) {
          const nextMode = NODE_MODES[index];
          if (nextMode != currentNode.mode) {
            currentNode.mode = nextMode;
          }
        }
      }
      break;
    case "create-edge":
      stroke(150);
      drawEdge(currentNode.position.x, currentNode.position.y, mouseX, mouseY);
      break;
  }

  for (const edge of edges) {
    edge.draw();
  }

  for (const node of nodes) {
    node.draw();
  }
}

function nodeAtPoint(x, y) {
  for (node of nodes) {
    const dx = node.position.x - x;
    const dy = node.position.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < NODE_SIZE) {
      return node;
    }
  }
}

function dragNode() {
  const selected = nodeAtPoint(mouseX, mouseY);
  if (selected) {
    currentNode = selected;
    mode = "drag-node";
  }
}

function adjustPitch() {
  const selected = nodeAtPoint(mouseX, mouseY);
  if (selected) {
    currentNode = selected;
    mode = "adjust-pitch";
  }
}

function adjustNodeMode() {
  const selected = nodeAtPoint(mouseX, mouseY);
  if (selected) {
    currentNode = selected;
    mode = "adjust-node-mode";
  }
}

function createNodeOrEdge() {
  const selected = nodeAtPoint(mouseX, mouseY);
  if (selected) {
    currentNode = selected;
    mode = "create-edge";
  } else {
    const node = new Node(mouseX, mouseY, "E3");
    nodes.push(node);
    serializeToUrl();
  }
}

function playNode() {
  const selected = nodeAtPoint(mouseX, mouseY);
  if (selected) {
    selected.fire();
  }
}

function keyPressed() {
  console.log(keyCode);
  switch (keyCode) {
    case 8:
      // backspace - delete node
      if (currentNode) {
        for (let i = edges.length - 1; i >= 0; i--) {
          const edge = edges[i];
          if (edge.start == currentNode || edge.end == currentNode) {
            edges.splice(i, 1);
          }
        }

        for (let i = nodes.length - 1; i >= 0; i--) {
          const node = nodes[i];
          if (node == currentNode) {
            nodes.splice(i, 1);
          }
        }
        currentNode = null;
      }
      serializeToUrl();
      break;
    case 32:
      // spacebar - clear all signals
      for (const edge of edges) {
        edge.signals = [];
      }
      break;
  }
}

function mousePressed() {
  switch (mode) {
    case "wait":
      userStartAudio();
      mode = "select";
      break;
    case "select":
      if (keyIsDown(18)) {
        adjustPitch();
      } else if (keyIsDown(192)) {
        adjustNodeMode();
      } else if (keyIsDown(224) || keyIsDown(91) || keyIsDown(93)) {
        createNodeOrEdge();
      } else {
        dragNode();
      }
      break;
  }
}

function mouseReleased() {
  switch (mode) {
    case "create-edge":
      const selected = nodeAtPoint(mouseX, mouseY);
      if (selected && selected != currentNode) {
        const edge = new Edge(currentNode, selected);
        edges.push(edge);
      }
      mode = "select";
      currentNode = null;
      serializeToUrl();
      break;
    case "adjust-pitch":
    case "adjust-node-mode":
    case "drag-node":
      mode = "select";
      serializeToUrl();
      break;
  }
}

function doubleClicked() {
  switch (mode) {
    case "select":
      playNode();
      break;
  }
}

function serialize(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].id = i;
  }

  let serialized = "";
  for (node of nodes) {
    const edges = node.edges.map((edge) => edge.end.id);
    const cellX = Math.round(node.position.x / CELL_SIZE);
    const cellY = Math.round(node.position.y / CELL_SIZE);

    const shortMode = SHORT_MODES[node.mode];
    const str = `${cellX} ${cellY} ${node.note} ${shortMode} ${edges.join(
      " "
    )}`;
    serialized += str + "\n";
  }
  return serialized;
}

function serializeToUrl() {
  let serialized = serialize(nodes);
  serialized = serialized.trim();
  serialized = serialized.replace(/\n/g, ",");
  serialized = serialized.replace(/\s/g, ".");
  window.history.replaceState(
    { html: serialized, pageTitle: "" },
    "",
    `?${serialized}`
  );
}

function deserialize(str) {
  str = str.trim();

  if (str.length == 0) {
    return { nodes: [], edges: [] };
  }
  const lines = str.split("\n");
  const nodes = [];
  const edges = [];

  for (let line of lines) {
    const parts = line.trim().split(" ");
    const cellX = parseInt(parts[0]);
    const cellY = parseInt(parts[1]);
    const note = parts[2];
    const mode = NODE_MODES[Object.values(SHORT_MODES).indexOf(parts[3])];

    const x = cellX * CELL_SIZE;
    const y = cellY * CELL_SIZE;
    const node = new Node(x, y, note, mode);
    nodes.push(node);
  }

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(" ");
    const edgeIds = parts.slice(4).map((id) => parseInt(id));
    for (let edgeId of edgeIds) {
      const edge = new Edge(nodes[i], nodes[edgeId]);
      edges.push(edge);
    }
  }
  return { nodes, edges };
}

function deserializeFromUrl() {
  let queryString = window.location.search.substring(1);
  queryString = queryString.replace(/\,/g, "\n");
  queryString = queryString.replace(/\./g, " ");
  const { nodes: newNodes, edges: newEdges } = deserialize(queryString);
  nodes = newNodes;
  edges = newEdges;
}
