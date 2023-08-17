import { css, boundaries, toCoord, line } from "./utils";

const HEIGHT = 40;
const DPI_HEIGHT = HEIGHT * 2;

export function sliderChart(root, data, DPI_WIDTH) {
  const WIDTH = DPI_WIDTH / 2;
  const MIN_WIDTH = WIDTH * 0.05;
  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = DPI_WIDTH;
  canvas.height = DPI_HEIGHT;
  css(canvas, {
    width: `${WIDTH}px`,
    height: `${HEIGHT}px`,
  });

  const $left = root.querySelector("[data-el=left]");
  const $window = root.querySelector("[data-el=window]");
  const $right = root.querySelector("[data-el=right]");

  function mousedown(event) {
     const type = event.target.dataset.type;

  }

  root.addEventListener("mousedown", mousedown);

  const defaultWidth = WIDTH * 0.3;
  setPosition(0, WIDTH - defaultWidth);

  function setPosition(left, right) {
    const w = WIDTH - right - left;

    if (w < MIN_WIDTH) {
      css($window, { width: `${MIN_WIDTH}px` });
      return;
    }

    if (left < 0) {
      css($window, { left: "0px" });
      css($left, { width: "0px" });
      return;
    }

    if (right < 0) {
      css($window, { right: "0px" });
      css($right, { width: "0px" });
      return;
    }

    css($window, { width: `${w}px`, left: `${left}px`, right: `${right}px` });
    css($left, { width: `${left}px` });
    css($right, { width: `${right}px` });
  }

  const [yMin, yMax] = boundaries(data);
  const yRatio = DPI_HEIGHT / (yMax - yMin);
  const xRatio = DPI_WIDTH / (data.columns[0].length - 2);

  const yData = data.columns.filter((col) => data.types[col[0]] === "line");

  yData.map(toCoord(xRatio, yRatio, DPI_HEIGHT, -5)).forEach((coords, idx) => {
    const color = data.colors[yData[idx][0]];
    line(ctx, coords, { color });
  });
}
