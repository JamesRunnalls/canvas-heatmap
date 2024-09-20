import { getRGBAColor, indexOfClosest, isNumeric } from "./functions";

export const canvasGrid = (
  data,
  scaleX,
  scaleY,
  xDomain,
  yDomain,
  context,
  options
) => {
  if (data.length === 1) {
    putImgDataSingleMatrix(
      data[0],
      scaleX,
      scaleY,
      xDomain,
      yDomain,
      context,
      options
    );
  } else {
    putImgDataMultMatrix(
      data,
      scaleX,
      scaleY,
      xDomain,
      yDomain,
      context,
      options
    );
  }
};

export const canvasContour = (
  data,
  scaleX,
  scaleY,
  context,
  options,
  prepContours
) => {
  const colorScale = (v) => {
    return getRGBAColor(v, options.zMin, options.zMax, options.colors, options.colorCache);
  };

  for (var i = 0; i < data.length; i++) {
    fill(prepContours.baseContour[i], data[i], false);
    prepContours.mainContour[i].forEach((contour, index) => {
      if (index !== 0) fill(contour, data[i], false);
    });
    fill(prepContours.nanContour[i], data[i], [255, 255, 255]);
  }

  function fill(geometry, plotdata, fixedColor) {
    try {
      var color = colorScale(geometry.value + prepContours.step);
      if (fixedColor) color = fixedColor;
      context.fillStyle = `rgb(
        ${color[0]},
        ${color[1]},
        ${color[2]})`;
      geometry.coordinates.forEach((a) => {
        a.forEach((b) => {
          context.beginPath();
          context.moveTo(
            scaleX(getXfromIndex(b[0][0], plotdata, options)),
            scaleY(getYfromIndex(b[0][1], plotdata, options))
          );
          b.forEach((c) => {
            context.lineTo(
              scaleX(getXfromIndex(c[0], plotdata, options)),
              scaleY(getYfromIndex(c[1], plotdata, options))
            );
          });
          context.closePath();
          context.fill();
        });
      });
    } catch (e) {
      console.error("Failed to plot contour");
    }
  }
};

const pixelMapping = (data, scaleX, scaleY, options) => {
  var dataypix = data.y.map((dy) => scaleY(dy));
  var dataxpix = data.x.map((dx) => scaleX(dx));

  var indexypix = [];
  var indexxpix = [];

  // Currently using closest (needs to be improved)
  for (var i = 0; i < options.canvasHeight; i++) {
    indexypix.push(indexOfClosest(i, dataypix));
  }

  for (var j = 0; j < options.canvasWidth; j++) {
    indexxpix.push(indexOfClosest(j, dataxpix));
  }
  return { indexxpix, indexypix };
};

function pixelMappingArray(
  data,
  scaleX,
  scaleY,
  highh,
  lowh,
  highw,
  loww,
  options
) {
  // Currently using closest (needs to be improved)

  var index = [];
  for (var i = 0; i < data.length; i++) {
    let ypix = data[i].y.map((dy) => scaleY(dy));
    let xpix = data[i].x.map((dx) => scaleX(dx));

    let indexxpix = [];
    let xstart = Math.max(...[0, Math.ceil(Math.min(...xpix)), loww]);
    let xend = Math.min(
      ...[options.canvasWidth, Math.floor(Math.max(...xpix)), highw]
    );

    let indexypix = [];
    let ystart = Math.max(...[0, Math.ceil(Math.min(...ypix)), lowh]);
    let yend = Math.min(
      ...[options.canvasHeight, Math.floor(Math.max(...ypix)), highh]
    );

    for (var j = xstart; j < xend; j++) {
      indexxpix.push([j, indexOfClosest(j, xpix)]);
    }

    for (var k = ystart; k < yend; k++) {
      indexypix.push([k, indexOfClosest(k, ypix)]);
    }

    index.push({ indexxpix, indexypix });
  }
  return index;
}

const putImgDataSingleMatrix = (
  arr,
  scaleX,
  scaleY,
  xDomain,
  yDomain,
  context,
  options
) => {
  const colorScale = (v) => {
    return getRGBAColor(v, options.zMin, options.zMax, options.colors, options.colorCache);
  };
  var { indexxpix, indexypix } = pixelMapping(arr, scaleX, scaleY, options);
  var imgData = context.createImageData(
    options.canvasWidth,
    options.canvasHeight
  );
  var highh, lowh, highw, loww;
  if (options.yReverse) {
    highh = Math.min(options.canvasHeight, Math.floor(scaleY(yDomain[1])));
    lowh = Math.max(0, Math.floor(scaleY(yDomain[0])));
  } else {
    highh = Math.min(options.canvasHeight, Math.floor(scaleY(yDomain[0])));
    lowh = Math.max(0, Math.floor(scaleY(yDomain[1])));
  }
  if (options.xReverse) {
    highw = Math.min(options.canvasWidth, Math.floor(scaleX(xDomain[0])));
    loww = Math.max(0, Math.floor(scaleX(xDomain[1])));
  } else {
    highw = Math.min(options.canvasWidth, Math.floor(scaleX(xDomain[1])));
    loww = Math.max(0, Math.floor(scaleX(xDomain[0])));
  }
  var i, j, l, rgbacolor;
  for (j = lowh; j < highh; j++) {
    for (l = loww; l < highw; l++) {
      if (isNumeric(indexypix[j]) && isNumeric(indexxpix[l])) {
        rgbacolor = colorScale(arr.z[indexypix[j]][indexxpix[l]]);
        i = (options.canvasWidth * j + l) * 4;
        imgData.data[i + 0] = rgbacolor[0];
        imgData.data[i + 1] = rgbacolor[1];
        imgData.data[i + 2] = rgbacolor[2];
        imgData.data[i + 3] = rgbacolor[3];
      }
    }
  }
  context.putImageData(imgData, 1, 0);
};

const putImgDataMultMatrix = (
  arr,
  scaleX,
  scaleY,
  xDomain,
  yDomain,
  context,
  options
) => {
  const colorScale = (v) => {
    return getRGBAColor(v, options.zMin, options.zMax, options.colors, options.colorCache);
  };
  var imgData = context.createImageData(
    options.canvasWidth,
    options.canvasHeight
  );
  var highh, lowh, highw, loww;
  if (options.yReverse) {
    highh = Math.min(options.canvasHeight, Math.floor(scaleY(yDomain[1])));
    lowh = Math.max(0, Math.floor(scaleY(yDomain[0])));
  } else {
    highh = Math.min(options.canvasHeight, Math.floor(scaleY(yDomain[0])));
    lowh = Math.max(0, Math.floor(scaleY(yDomain[1])));
  }
  if (options.xReverse) {
    highw = Math.min(options.canvasWidth, Math.floor(scaleX(xDomain[0])));
    loww = Math.max(0, Math.floor(scaleX(xDomain[1])));
  } else {
    highw = Math.min(options.canvasWidth, Math.floor(scaleX(xDomain[1])));
    loww = Math.max(0, Math.floor(scaleX(xDomain[0])));
  }
  var index = pixelMappingArray(
    arr,
    scaleX,
    scaleY,
    highh,
    lowh,
    highw,
    loww,
    options
  );
  var rgbacolor, l;
  for (var i = 0; i < index.length; i++) {
    for (var j = 0; j < index[i].indexypix.length; j++) {
      for (var k = 0; k < index[i].indexxpix.length; k++) {
        if ((index[i].indexypix[j], index[i].indexxpix[k])) {
          rgbacolor = colorScale(
            arr[i].z[index[i].indexypix[j][1]][index[i].indexxpix[k][1]]
          );
          l =
            (options.canvasWidth * index[i].indexypix[j][0] +
              index[i].indexxpix[k][0]) *
            4;
          imgData.data[l + 0] = rgbacolor[0];
          imgData.data[l + 1] = rgbacolor[1];
          imgData.data[l + 2] = rgbacolor[2];
          imgData.data[l + 3] = rgbacolor[3];
        }
      }
    }
  }
  context.putImageData(imgData, 1, 0);
};

const getXfromIndex = (index, plotdata, options) => {
  if (index <= plotdata.x.length - 1) {
    if (options.xTime) {
      return new Date(
        (plotdata.x[Math.ceil(index)].getTime() -
          plotdata.x[Math.floor(index)].getTime()) *
          (index - Math.floor(index)) +
          plotdata.x[Math.floor(index)].getTime()
      );
    } else {
      return (
        (plotdata.x[Math.ceil(index)] - plotdata.x[Math.floor(index)]) *
          (index - Math.floor(index)) +
        plotdata.x[Math.floor(index)]
      );
    }
  } else {
    return plotdata.x[plotdata.x.length - 1];
  }
};

const getYfromIndex = (index, plotdata, options) => {
  if (index <= plotdata.y.length - 1) {
    if (options.yTime) {
      return new Date(
        (plotdata.y[Math.ceil(index)].getTime() -
          plotdata.y[Math.floor(index)].getTime()) *
          (index - Math.floor(index)) +
          plotdata.y[Math.floor(index)].getTime()
      );
    } else {
      return (
        (plotdata.y[Math.ceil(index)] - plotdata.y[Math.floor(index)]) *
          (index - Math.floor(index)) +
        plotdata.y[Math.floor(index)]
      );
    }
  } else {
    return plotdata.y[plotdata.y.length - 1];
  }
};
