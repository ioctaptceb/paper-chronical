const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const FastTracker = function() {
  FastTracker.base(this, 'constructor');
};
tracking.inherits(FastTracker, tracking.Tracker);

let found;
tracking.Fast.THRESHOLD = 10;
FastTracker.prototype.threshold = tracking.Fast.THRESHOLD;

FastTracker.prototype.track = function(pixels, width, height) {
  const remap = (pixels, width, height) => {
    let array = [];
    for (let i = 0; i < height; i += 1) {
      for (let j = 0; j < width; j += 1) {
        const w = i * width * 4 + j * 4;
        const colorObject = {
          r: pixels[w],
          g: pixels[w + 1],
          b: pixels[w + 2],
          a: pixels[w + 3],
          index: w,
          x: j,
          y: i
        };
        array.push(colorObject);
      }
    }
    return array;
  };

  const array = remap(pixels, width, height);

  const simplifiedArray = array.filter((pixel) => {
    if (pixel.r < 150 && pixel.b > 150 && notOutOfBounds(found, pixel.x, pixel.y)) {
      return true;
    }
    return false
  });

  const cornerData = simplifiedArray.reduce((o, pixel) => {
    const isMax = (coord) => !o.arr.filter((prevPoint) =>
      prevPoint[coord] <= pixel[coord]).length;
    const isMin = (coord) => !o.arr.filter((prevPoint) =>
      prevPoint[coord] >= pixel[coord]).length;
    if (isMin('x') || isMax('x') || isMin('y') || isMax('y')) {
      o.arr.push({x: pixel.x, y:pixel.y});
    }
    if (o.lastPixel && o.lastPixel.x > pixel.x && o.lastPixel.y < pixel.y ||
        o.lastPixel && o.lastPixel.x < pixel.x && o.lastPixel.y > pixel.y ) {
      o.arr.push({x: o.lastPixel.x, y: o.lastPixel.y});
    }
    o.lastPixel = pixel
    return o;
  }, {arr: []});

  const fullColorData = simplifiedArray.reduce((a, pixel) => {
    return a.concat([pixel.x, pixel.y]);
  }, []);

  this.emit('track', {
    data: cornerData.arr,
  });
};

const colorTracker = new tracking.ColorTracker('cyan');
const tracker = new FastTracker();

function notOutOfBounds(bounds, cornerX, cornerY) {
  if (!bounds) return false;
  const isContainedX = bounds.xL < cornerX && cornerX < bounds.xR;
  const isContainedY = bounds.yT < cornerY && cornerY< bounds.yB;
  if (isContainedX && isContainedY) {
    return true;
  }
  return false
}
colorTracker.on('track', function(event) {
  event.data.forEach(function(rect, anything, anythingelse) {
    if (rect.color === 'custom') {
      rect.color = tracker.customColor;
    }

    found = {
      xL: rect.x - 50,
      xR: rect.x + rect.width + 50,
      yT: rect.y - 50,
      yB: rect.y + rect.height + 50
    };

    context.strokeStyle = rect.color;
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    context.font = '11px Helvetica';
    context.fillStyle = "#fff";
    context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
    context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
  });
});

tracking.track('#video', colorTracker, { camera: true });

tracker.on('track', function(event) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  const corners = event.data;
  corners.forEach((corner) => {
    context.fillStyle = '#000';
    context.fillRect(corner.x, corner.y, 2, 2);
  });
});

tracking.track('#video', tracker, { camera: true });


// GUI Controllers

gui.add(tracker, 'threshold', 1, 100).onChange(function(value) {
  tracking.Fast.THRESHOLD = value;
});

