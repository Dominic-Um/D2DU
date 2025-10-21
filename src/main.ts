const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

type Point = { x: number; y: number };
const lines: Point[][] = [];
const redoLines: Point[][] = [];

let currentLine: Point[] | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  redoLines.splice(0, redoLines.length);
  currentLine.push({ x: cursor.x, y: cursor.y });

  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && currentLine) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.push({ x: cursor.x, y: cursor.y });

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
  for (const line of lines) {
    if (line.length > 1) {
      ctx.beginPath();
      const { x, y } = line[0];
      ctx.moveTo(x, y);
      for (const point of line) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  }
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

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    const undoneLine = lines.pop();
    if (undoneLine) redoLines.push(undoneLine);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoLines.length > 0) {
    const restoredLine = redoLines.pop();
    if (restoredLine) lines.push(restoredLine);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);
  canvas.dispatchEvent(new Event("drawing-changed"));
});
