import { boundaries, line, circle, css, toDate, isOver, toCoord } from "./utils";
import { tooltip } from "./tooltip";
import { sliderChart } from "./slider";

const WIDTH = 600;
const HEIGHT = 200;
const DPI_WIDTH = WIDTH * 2;
const DPI_HEIGHT = HEIGHT * 2;
const ROWS_COUNT = 5;
const PADDING = 40;
const VIEW_HEIGHT = DPI_HEIGHT - 2 * PADDING;
const VIEW_WIDTH = DPI_WIDTH;

export function chart(root, data) {
  const canvas = root.querySelector("[data-el=main]");
  const slider = root.querySelector("[data-el=slider]");
  sliderChart(slider, data, DPI_WIDTH);
  const tip = tooltip(document.querySelector("[data-el=tooltip]"));
  const ctx = canvas.getContext("2d");
  let raf;

  css(canvas, {
    width: `${WIDTH}px`,
    height: `${HEIGHT}px`,
  });

  canvas.width = DPI_WIDTH;
  canvas.height = DPI_HEIGHT;

  const proxy = new Proxy(
    {},
    {
      set(...args) {
        const result = Reflect.set(...args);
        raf = requestAnimationFrame(paint);
        return result;
      },
    }
  );

  function clear() {
    ctx.clearRect(0, 0, DPI_WIDTH, DPI_HEIGHT);
  }

  function paint() {
    clear();

    const [yMin, yMax] = boundaries(data);
    const yRatio = VIEW_HEIGHT / (yMax - yMin);
    const xRatio = VIEW_WIDTH / (data.columns[0].length - 2);

    const yData = data.columns.filter((col) => data.types[col[0]] === "line");
    const xData = data.columns.filter(
      (col) => data.types[col[0]] !== "line"
    )[0];

    yAxis(ctx, yMin, yMax);
    xAxis(ctx, xData, yData, xRatio, proxy);

    yData
      .map(toCoord(xRatio, yRatio, DPI_HEIGHT, PADDING))
      .forEach((coords, idx) => {
        const color = data.colors[yData[idx][0]];
        line(ctx, coords, { color });

        for (const [x, y] of coords) {
          if (isOver(proxy.mouse, x, coords.length, DPI_WIDTH)) {
            circle(ctx, [x, y], color);
            break;
          }
        }
      });
  }

  function xAxis(ctx, xData, yData, xRatio, { mouse }) {
    const colsCount = 6;
    const step = Math.round(xData.length / colsCount);

    ctx.beginPath();
    ctx.fillStyle = "black";

    for (let i = 1; i < xData.length; i++) {
      const x = i * xRatio;

      if ((i - 1) % step === 0) {
        const text = toDate(xData[i]);
        ctx.fillText(text.toString(), x, DPI_HEIGHT - 10);
      }

      if (isOver(mouse, x, xData.length, DPI_WIDTH)) {
        ctx.save();
        ctx.moveTo(x, PADDING);
        ctx.lineTo(x, DPI_HEIGHT - PADDING);
        ctx.restore();

        tip.show(proxy.mouse.tooltip, {
          title: toDate(xData[i]),
          items: yData.map((col) => ({
            color: data.colors[col[0]],
            name: data.names[col[0]],
            value: col[i + 1],
          })),
        });
      }
    }
    ctx.stroke();
    ctx.closePath();
  }

  function mousemove({ clientX, clientY }) {
    const { left } = canvas.getBoundingClientRect();
    proxy.mouse = {
      x: (clientX - left) * 2,
      tooltip: {
        left: clientX - left,
        top: clientY - top,
      },
    };
  }

  function mouseleave() {
    proxy.mouse = null;
    tip.hide();
  }

  canvas.addEventListener("mousemove", mousemove);
  canvas.addEventListener("mouseleave", mouseleave);

  return {
    init() {
      paint();
    },
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", mousemove);
      canvas.removeEventListener("mouseleave", mouseleave);
    },
  };
}

function yAxis(ctx, yMin, yMax) {
  const step = VIEW_HEIGHT / ROWS_COUNT;
  const textStep = (yMax - yMin) / ROWS_COUNT;

  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.strokeStyle = "lightgray";
  ctx.lineWidth = 0.25;
  ctx.font = "normal 20px Helvetica,sans-serif";

  for (let i = 1; i <= ROWS_COUNT; i++) {
    const y = step * i;
    const text = Math.round(yMax - textStep * i);
    ctx.fillText(text, 10, y + PADDING - 5);
    ctx.moveTo(0, y + PADDING);
    ctx.lineTo(DPI_WIDTH, y + PADDING);
  }
  ctx.stroke();
  ctx.closePath();
}
