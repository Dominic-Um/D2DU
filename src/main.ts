const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

type Point = { x: number; y: number };

interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements DisplayCommand {
  points: Point[];
  thickness: number;

  constructor(start: Point, thickness: number) {
    this.points = [start];
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = this.thickness;
    const { x, y } = this.points[0];
    ctx.moveTo(x, y);
    for (const p of this.points) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
}

const lines: DisplayCommand[] = [];
const redoLines: DisplayCommand[] = [];

let currentLine: MarkerLine | null = null;
const cursor = { active: false, x: 0, y: 0 };
let currentThickness = 1;

document.body.append(document.createElement("br"));

const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
document.body.append(thickButton);

thinButton.addEventListener("click", () => {
  currentThickness = 1;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});

thickButton.addEventListener("click", () => {
  currentThickness = 5;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = new MarkerLine({ x: cursor.x, y: cursor.y }, currentThickness);
  lines.push(currentLine);
  redoLines.splice(0, redoLines.length);

  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && currentLine) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.drag(cursor.x, cursor.y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of lines) cmd.display(ctx);
}

canvas.addEventListener("drawing-changed", () => {
  redraw();
});

document.body.append(document.createElement("br"));

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.append(clearButton);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
document.body.append(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
document.body.append(redoButton);

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    const undone = lines.pop();
    if (undone) redoLines.push(undone);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redoButton.addEventListener("click", () => {
  if (redoLines.length > 0) {
    const redone = redoLines.pop();
    if (redone) lines.push(redone);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);
  redoLines.splice(0, redoLines.length);
  canvas.dispatchEvent(new Event("drawing-changed"));
});
