const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
let found;
let selected;
let COLORTHRESHOLD = 190;
const isWhite = (r, g, b) => r > COLORTHRESHOLD && b > COLORTHRESHOLD  && g > COLORTHRESHOLD;
const boundingBoxColor = '#f00';

const comparePixel = (pixel, candidatePixel) => {
  if (isWhite(candidatePixel.r, candidatePixel.g, candidatePixel.b, candidatePixel.a)
      && !isWhite(pixel.r, pixel.g, pixel.b, pixel.a)) {
    return true;
  }
  return false;
};

const remap = (pixels, width, bounds) => {
  let array = [];

  const mappedPixel = (s, j, i) => {
    return {
      r: pixels[s],
      g: pixels[s + 1],
      b: pixels[s + 2],
      a: pixels[s + 3],
      index: s,
      x: j,
      y: i
    };
  };

  if (!selected) {
    // const horizontalCenter = canvas.width;
    // const verticalCenter = canvas.height;
    // const index = horizontalCenter * verticalCenter;

    context.strokeStyle = boundingBoxColor;
    context.strokeRect(canvas.width / 2, canvas.height / 2, 50, 50);
    context.fillStyle = '#000';
  }

  for (let i = bounds.yT; i < bounds.yB; i += 2) {
    for (let j = bounds.xL; j < bounds.xR; j += 2) {
      const w = i * width * 4 + j * 4;
      const pixel = mappedPixel(w, j, i);
      const lastPixel = mappedPixel(w - 7, j, i);
      const nextPixel = mappedPixel(w + 7, j, i);
      const belowPixel = mappedPixel(w + (width * 4), j, i);
      const abovePixel = mappedPixel(w - (width * 4), j, i);

      if (comparePixel(pixel, nextPixel)) {
        array.push(nextPixel);
      }
      if (comparePixel(pixel, belowPixel)) {
        array.push(belowPixel);
      }
      if (comparePixel(pixel, lastPixel)) {
        array.push(lastPixel);
      }
      if (comparePixel(pixel, abovePixel)) {
        array.push(abovePixel);
      }
    }
  }
  return array;
};

const FastTracker = function() {
  FastTracker.base(this, 'constructor');
};

tracking.inherits(FastTracker, tracking.Tracker);

tracking.Fast.THRESHOLD = 10;
FastTracker.prototype.threshold = tracking.Fast.THRESHOLD;

FastTracker.prototype.track = function(pixels, width, height) {
  if (found) {
    const array = remap(pixels, width, found);
    this.emit('track', {
      data: array
    });
  }
};

tracking.ColorTracker.registerColor('white', (r, g, b) => {
  if (isWhite(r, g, b)) {
    return true;
  }
  return false;
});

tracking.ColorTracker.minDimension = 80;
const colorTracker = new tracking.ColorTracker('white');
const tracker = new FastTracker();

const drawBoundaries = (width, height) => {
  context.strokeStyle = '#fdd3c7';
  const x = canvas.width / 2 - width / 2
  const y = canvas.height / 2 - height / 2
  context.strokeRect(x, y, width, height);
}

colorTracker.on('track', function(event) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBoundaries( 300, 400 );
  event.data.forEach(function(rect) {
    found = {
      xL: rect.x - 50,
      xR: rect.x + rect.width + 50,
      yT: rect.y - 50,
      yB: rect.y + rect.height + 50
    };

    context.strokeStyle = boundingBoxColor;
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    context.font = '6px Helvetica';
    context.fillStyle = '#000';
    context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
    context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
  });
});

tracking.track('#video', colorTracker, { camera: true });

tracker.on('track', function(event) {
  const corners = event.data;
  corners.forEach((corner) => {
    context.fillStyle = '#000';
    context.fillRect(corner.x, corner.y, 1, 1);
  });
});

tracking.track('#video', tracker, { camera: true });


