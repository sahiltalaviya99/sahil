/**
 * Marching squares — isolines through a scalar field.
 *
 * This is what turns the noise field into contours instead of a blur: for a
 * given threshold, walk every cell of the grid, classify its four corners as
 * above or below, and emit the line segments where the surface crosses. Do it
 * at several thresholds and you get a topographic map.
 *
 * Two things separate this from the naive version:
 *
 *  - **Corner crossings are interpolated, not snapped to cell edges.** Snapping
 *    gives you staircases at any grid resolution you can afford to compute;
 *    a linear interpolation along the edge gives smooth curves from a coarse
 *    grid, which is the entire reason the technique is worth using.
 *  - **The two ambiguous cases are resolved by the cell centre.** Cases 5 and
 *    10 have two opposite corners above the threshold and can be joined either
 *    way. Picking arbitrarily produces contours that cross each other and lines
 *    that dead-end mid-field; averaging the four corners picks the topology the
 *    surface actually has.
 *
 * Pure and DOM-free, like every engine in this repo, so it can be bundled with
 * esbuild and asserted against in Node.
 */

/** Fraction along an edge where the threshold is crossed. */
const cross = (v0: number, v1: number, threshold: number): number => {
  const d = v1 - v0;
  // Equal corners means the crossing is undefined rather than at an end — the
  // midpoint is the only choice that doesn't bias the contour toward a corner.
  if (d === 0) return 0.5;
  return (threshold - v0) / d;
};

/**
 * Segments where `field` crosses `threshold`, as a flat [x0,y0,x1,y1,…] list in
 * sample-grid coordinates (0…cols-1, 0…rows-1).
 *
 * `field` is row-major: index = y * cols + x.
 */
export const contourSegments = (
  field: ArrayLike<number>,
  cols: number,
  rows: number,
  threshold: number,
): number[] => {
  const out: number[] = [];
  if (cols < 2 || rows < 2) return out;

  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const i = y * cols + x;
      const a = field[i]; // top-left
      const b = field[i + 1]; // top-right
      const c = field[i + cols + 1]; // bottom-right
      const d = field[i + cols]; // bottom-left

      let code = 0;
      if (a > threshold) code |= 1;
      if (b > threshold) code |= 2;
      if (c > threshold) code |= 4;
      if (d > threshold) code |= 8;

      if (code === 0 || code === 15) continue;

      // Crossing points on each of the four edges, computed lazily-ish. Both
      // cells sharing an edge derive its point from the same two corner values,
      // so the endpoints match exactly and the contour never gaps.
      const topX = x + cross(a, b, threshold);
      const rightY = y + cross(b, c, threshold);
      const bottomX = x + cross(d, c, threshold);
      const leftY = y + cross(a, d, threshold);

      const top = () => out.push(topX, y);
      const right = () => out.push(x + 1, rightY);
      const bottom = () => out.push(bottomX, y + 1);
      const left = () => out.push(x, leftY);

      const leftTop = () => {
        left();
        top();
      };
      const topRight = () => {
        top();
        right();
      };
      const rightBottom = () => {
        right();
        bottom();
      };
      const leftBottom = () => {
        left();
        bottom();
      };

      switch (code) {
        case 1:
        case 14:
          leftTop();
          break;
        case 2:
        case 13:
          topRight();
          break;
        case 3:
        case 12:
          left();
          right();
          break;
        case 4:
        case 11:
          rightBottom();
          break;
        case 6:
        case 9:
          top();
          bottom();
          break;
        case 7:
        case 8:
          leftBottom();
          break;

        // Saddles. The centre tells us whether the two above-corners are joined
        // through the middle of the cell or pinched apart by it.
        case 5: {
          if ((a + b + c + d) / 4 > threshold) {
            topRight();
            leftBottom();
          } else {
            leftTop();
            rightBottom();
          }
          break;
        }
        case 10: {
          if ((a + b + c + d) / 4 > threshold) {
            leftTop();
            rightBottom();
          } else {
            topRight();
            leftBottom();
          }
          break;
        }
      }
    }
  }

  return out;
};
