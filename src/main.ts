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
    ctx.strokeStyle = "black";
    const { x, y } = this.points[0];
    ctx.moveTo(x, y);
    for (const p of this.points) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
}

class ToolPreview implements DisplayCommand {
  x: number;
  y: number;
  size: number;
  mode: "marker" | "sticker";
  sticker?: string | undefined;

  constructor(
    x: number,
    y: number,
    size: number,
    mode: "marker" | "sticker",
    sticker?: string,
  ) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.mode = mode;
    this.sticker = sticker;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.mode === "marker") {
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.mode === "sticker" && this.sticker) {
      ctx.font = `${this.size * 2}px sans-serif`;
      ctx.globalAlpha = 0.5;
      ctx.fillText(
        this.sticker ?? "",
        this.x - this.size / 2,
        this.y + this.size / 2,
      );
    }
    ctx.restore();
  }
}

class StickerCommand implements DisplayCommand {
  x: number;
  y: number;
  emoji: string;
  size: number;

  constructor(x: number, y: number, emoji: string, size: number) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.size = size;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = `${this.size * 2}px sans-serif`;
    ctx.fillText(this.emoji, this.x - this.size / 2, this.y + this.size / 2);
  }
}

const lines: DisplayCommand[] = [];
const redoLines: DisplayCommand[] = [];

let currentLine: MarkerLine | null = null;
let preview: ToolPreview | null = null;
const cursor = { active: false, x: 0, y: 0 };

let currentThickness = 1;
let currentTool: "marker" | "sticker" = "marker";
let currentSticker: string | null = null;

document.body.append(document.createElement("br"));

const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
document.body.append(thickButton);

const stickerButtons: { [key: string]: HTMLButtonElement } = {};
for (const emoji of ["⭐", "🔥", "😊"]) {
  const btn = document.createElement("button");
  btn.textContent = emoji;
  document.body.append(btn);
  stickerButtons[emoji] = btn;

  btn.addEventListener("click", () => {
    currentTool = "sticker";
    currentSticker = emoji;
    thinButton.classList.remove("selectedTool");
    thickButton.classList.remove("selectedTool");
    Object.values(stickerButtons).forEach((b) =>
      b.classList.remove("selectedTool")
    );
    btn.classList.add("selectedTool");
    canvas.dispatchEvent(new Event("tool-moved"));
  });
}

thinButton.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = 1;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
  Object.values(stickerButtons).forEach((b) =>
    b.classList.remove("selectedTool")
  );
});

thickButton.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = 5;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
  Object.values(stickerButtons).forEach((b) =>
    b.classList.remove("selectedTool")
  );
});

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (currentTool === "marker") {
    currentLine = new MarkerLine(
      { x: cursor.x, y: cursor.y },
      currentThickness,
    );
    lines.push(currentLine);
  } else if (currentTool === "sticker" && currentSticker) {
    const sticker = new StickerCommand(cursor.x, cursor.y, currentSticker, 8);
    lines.push(sticker);
  }

  redoLines.splice(0, redoLines.length);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (cursor.active && currentLine && currentTool === "marker") {
    currentLine.drag(cursor.x, cursor.y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    preview = currentTool === "marker"
      ? new ToolPreview(cursor.x, cursor.y, currentThickness, "marker")
      : currentSticker
      ? new ToolPreview(cursor.x, cursor.y, 8, "sticker", currentSticker)
      : null;
    canvas.dispatchEvent(new Event("tool-moved"));
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
  if (!cursor.active && preview) preview.display(ctx);
}

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

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
