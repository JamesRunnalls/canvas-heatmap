import {
  select,
  extent,
  scaleTime,
  scaleLog,
  scaleLinear,
  axisBottom,
  axisLeft,
  symbol,
  symbolTriangle,
  zoomIdentity,
  range,
  zoom as d3zoom,
  timeFormatDefaultLocale,
} from "d3";
import { contours } from "d3-contour";
import {
  verifyString,
  verifyBool,
  verifyNumber,
  verifyColors,
  verifyDiv,
  verifyData,
  verifyFunction,
} from "./verify";
import {
  convertToRGB,
  getFileIndex,
  closest,
  formatDate,
  formatNumber,
  isNumeric,
} from "./functions";
import { canvasGrid, canvasContour } from "./fillcanvas";

const heatmap = (div, data, options = {}) => {
  if (!Array.isArray(data)) data = [data];
  try {
    select("#svg_" + div).remove();
    select("#canvas_" + div).remove();
    select("#tooltip_" + div).remove();
  } catch (e) {}

  try {
    verifyDiv(div);
    verifyData(data);

    options = processOptions(div, data, options);

    const { xDomain, yDomain, zDomain, xFileDomain, yFileDomain } =
      dataExtents(data);

    if (options.zMin === false) options.zMin = zDomain[0];
    if (options.zMax === false) options.zMax = zDomain[1];

    const svg = addSVG(div, options);
    const context = addCanvas(div, options);

    if ("language" in options) setLanguage(options.language);

    var xAxis = addXAxis(svg, xDomain, options);
    var yAxis = addYAxis(svg, yDomain, options);

    if (options.addTitle) addTitle(svg, div, options);
    if (options.backgroundColor) addBackground(svg, options);
    if (options.legendRight) addLegendRight(svg, options);
    if (options.setDownloadGraph)
      options.setDownloadGraph(() => downloadGraph(div, options));
    if (options.setDownloadGraphDiv)
      select("#" + options.setDownloadGraphDiv).on("click", function () {
        downloadGraph(div, options);
      });

    var contour;
    var nullData;
    var prepContours;
    if (options.contour) {
      contour = options.autoDownsample
        ? data.map((d) => autoDownSample(d, options.autoDownsample))
        : data;
      nullData = replaceNull(contour, options.zMax);
      prepContours = prepareContours(contour, nullData, zDomain, options);
    }

    var { zoombox } = addZoom(
      svg,
      data,
      contour,
      prepContours,
      div,
      xAxis,
      yAxis,
      xDomain,
      yDomain,
      zDomain,
      context,
      options
    );

    if (options.tooltip)
      addTooltip(
        svg,
        data,
        div,
        zoombox,
        xAxis,
        yAxis,
        xFileDomain,
        yFileDomain,
        options
      );

    setTimeout(() => {
      context.clearRect(0, 0, options.canvasWidth, options.canvasHeight);
      if (options.contour) {
        canvasContour(
          contour,
          xAxis.ax,
          yAxis.ax,
          context,
          options,
          prepContours
        );
      } else {
        canvasGrid(
          data,
          xAxis.ax,
          yAxis.ax,
          xDomain,
          yDomain,
          context,
          options
        );
      }
    }, 0);
  } catch (e) {
    console.error(e);
  }
};

const prepareContours = (data, nullData, zDomain, options) => {
  var thresholds = range(
    zDomain[0],
    zDomain[1],
    (zDomain[1] - zDomain[0]) / options.thresholdStep
  );
  var step = (zDomain[1] - zDomain[0]) / options.thresholdStep;

  var baseContour = [];
  var mainContour = [];
  var nanContour = [];

  for (var i = 0; i < data.length; i++) {
    let cr = contours()
      .size([data[i].z[0].length, data[i].z.length])
      .smooth(false);
    let c = contours().size([data[i].z[0].length, data[i].z.length]);
    let values = data[i].z.flat();
    let nullValues = nullData[i].z.flat();
    baseContour.push(cr.thresholds(thresholds)(values)[0]);
    mainContour.push(c.thresholds(thresholds)(values));
    nanContour.push(cr.thresholds([options.zMax * 1000])(nullValues)[0]);
  }
  return { baseContour, mainContour, nanContour, step };
};

const setLanguage = (name) => {
  var lang = {
    DE: {
      decimal: ",",
      thousands: ".",
      grouping: [3],
      currency: ["€", ""],
      dateTime: "%a %b %e %X %Y",
      date: "%d.%m.%Y",
      time: "%H:%M:%S",
      periods: ["AM", "PM"],
      days: [
        "Sonntag",
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag",
      ],
      shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
      months: [
        "Januar",
        "Februar",
        "März",
        "April",
        "Mai",
        "Juni",
        "Juli",
        "August",
        "September",
        "Oktober",
        "November",
        "Dezember",
      ],
      shortMonths: [
        "Jan",
        "Feb",
        "Mär",
        "Apr",
        "Mai",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Okt",
        "Nov",
        "Dez",
      ],
    },
    EN: {
      decimal: ",",
      thousands: ".",
      grouping: [3],
      currency: ["€", ""],
      dateTime: "%a %b %e %X %Y",
      date: "%d.%m.%Y",
      time: "%H:%M:%S",
      periods: ["AM", "PM"],
      days: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      shortDays: ["Sun", "Mon", "Tues", "Weds", "Thurs", "Fri", "Sat"],
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      shortMonths: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
    },
    FR: {
      decimal: ",",
      thousands: ".",
      grouping: [3],
      currency: ["€", ""],
      dateTime: "%a %b %e %X %Y",
      date: "%d.%m.%Y",
      time: "%H:%M:%S",
      periods: ["AM", "PM"],
      days: [
        "Dimanche",
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
        "Samedi",
      ],
      shortDays: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
      months: [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre",
      ],
      shortMonths: [
        "Janv",
        "Févr",
        "Mars",
        "Avr",
        "Mai",
        "Juin",
        "Juil",
        "Août",
        "Sept",
        "Oct",
        "Nov",
        "Déc",
      ],
    },
    ES: {
      decimal: ",",
      thousands: ".",
      grouping: [3],
      currency: ["€", ""],
      dateTime: "%a %b %e %X %Y",
      date: "%d.%m.%Y",
      time: "%H:%M:%S",
      periods: ["AM", "PM"],
      days: [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
      ],
      shortDays: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
      months: [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ],
      shortMonths: [
        "Enero",
        "Feb",
        "Mar",
        "Abr",
        "Mayo",
        "Jun",
        "Jul",
        "Agosto",
        "Sept",
        "Oct",
        "Nov",
        "Dic",
      ],
    },
  };
  if (name in lang) {
    timeFormatDefaultLocale(lang[name]);
  } else {
    console.error("Language: " + name + " not recognised.");
  }
};

const replaceNull = (data, zMax) => {
  var nullData = JSON.parse(JSON.stringify(data));
  for (var i = 0; i < data.length; i++) {
    for (var y = 1; y < data[i].z.length - 1; y++) {
      for (var x = 1; x < data[i].z[y].length - 1; x++) {
        if (data[i].z[y][x] === null || !isNumeric(data[i].z[y][x])) {
          if (data[i].z[y][x] !== null) data[i].z[y][x] = null;
          nullData[i].z[y][x] = zMax * 10;
          nullData[i].z[y][x + 1] = zMax * 10;
          nullData[i].z[y - 1][x + 1] = zMax * 10;
          nullData[i].z[y - 1][x] = zMax * 10;
          nullData[i].z[y - 1][x - 1] = zMax * 10;
          nullData[i].z[y][x - 1] = zMax * 10;
          nullData[i].z[y + 1][x - 1] = zMax * 10;
          nullData[i].z[y + 1][x] = zMax * 10;
          nullData[i].z[y + 1][x + 1] = zMax * 10;
        }
      }
    }
  }
  return nullData;
};

const processOptions = (div, data, userOptions) => {
  var defaultOptions = [
    { name: "language", default: false, verify: verifyString },
    { name: "xLabel", default: false, verify: verifyString },
    { name: "yLabel", default: false, verify: verifyString },
    { name: "zLabel", default: false, verify: verifyString },
    { name: "xUnit", default: false, verify: verifyString },
    { name: "yUnit", default: false, verify: verifyString },
    { name: "zUnit", default: false, verify: verifyString },
    { name: "xLog", default: false, verify: verifyBool },
    { name: "yLog", default: false, verify: verifyBool },
    { name: "tooltip", default: true, verify: verifyBool },
    { name: "title", default: false, verify: verifyString },
    { name: "zMin", default: false, verify: verifyNumber },
    { name: "zMax", default: false, verify: verifyNumber },
    { name: "fontSize", default: 12, verify: verifyNumber },
    { name: "contour", default: false, verify: verifyBool },
    { name: "yReverse", default: false, verify: verifyBool },
    { name: "xReverse", default: false, verify: verifyBool },
    { name: "marginTop", default: 10, verify: verifyNumber },
    { name: "marginLeft", default: 46, verify: verifyNumber },
    { name: "marginBottom", default: 46, verify: verifyNumber },
    { name: "marginRight", default: 70, verify: verifyNumber },
    { name: "legendRight", default: true, verify: verifyBool },
    { name: "thresholdStep", default: 20, verify: verifyNumber },
    { name: "backgroundColor", default: false, verify: verifyString },
    { name: "autoDownsample", default: false, verify: verifyNumber },
    { name: "setDownloadGraph", default: false, verify: verifyFunction },
    { name: "setDownloadGraphDiv", default: false, verify: verifyString },
    { name: "hover", default: false, verify: verifyFunction },

    {
      name: "colors",
      default: [
        { color: "#0000ff", point: 0 },
        { color: "#ff0000", point: 1 },
      ],
      verify: verifyColors,
    },
    {
      name: "width",
      default: select("#" + div)
        .node()
        .getBoundingClientRect().width,
      verify: verifyNumber,
    },
    {
      name: "height",
      default:
        select("#" + div)
          .node()
          .getBoundingClientRect().height - 5,
      verify: verifyNumber,
    },
  ];

  var options = {};
  for (let i = 0; i < defaultOptions.length; i++) {
    if (defaultOptions[i].name in userOptions) {
      if (userOptions[defaultOptions[i].name] === undefined) {
        options[defaultOptions[i].name] = defaultOptions[i].default;
      } else if (
        defaultOptions[i].verify(userOptions[defaultOptions[i].name])
      ) {
        options[defaultOptions[i].name] = userOptions[defaultOptions[i].name];
      } else {
        console.error(
          `${userOptions[defaultOptions[i].name]} is not a valid input for ${
            defaultOptions[i].name
          }`
        );
        options[defaultOptions[i].name] = defaultOptions[i].default;
      }
    } else {
      options[defaultOptions[i].name] = defaultOptions[i].default;
    }
  }

  if (!("marginLeft" in userOptions))
    options.marginLeft = options.fontSize * 3 + 10;
  if (!("marginRight" in userOptions)) {
    if (options.legendRight) {
      options.marginRight = options.fontSize * 5 + 10;
    } else {
      options.marginRight = 10;
    }
  }
  if (!("marginBottom" in userOptions))
    options.marginBottom = options.fontSize * 3 + 10;
  if (!("marginTop" in userOptions)) {
    if (options.title) {
      options.marginTop = options.fontSize + 2;
    } else {
      options.marginTop = 10;
    }
  }

  options.xTime = false;
  options.yTime = false;
  if (data[0].x[0] instanceof Date) options.xTime = true;
  if (data[0].y[0] instanceof Date) options.yTime = true;

  options.colors = options.colors.map((c) => {
    c.rgba = convertToRGB(c.color);
    return c;
  });

  options.canvasWidth = Math.floor(
    options.width - options.marginLeft - options.marginRight
  );
  options.canvasHeight = Math.floor(
    options.height - options.marginTop - options.marginBottom
  );
  return options;
};

const getDomain = (domain) => {
  var minarr = domain.map((d) => d[0]);
  var maxarr = domain.map((d) => d[1]);
  var min = extent(minarr)[0];
  var max = extent(maxarr)[1];
  return [min, max];
};

const dataExtents = (data) => {
  var xDomain, yDomain, zDomain;
  var xFileDomain = [];
  var yFileDomain = [];
  var zFileDomain = [];
  for (var h = 0; h < data.length; h++) {
    let xext = extent(data[h].x);
    let yext = extent(data[h].y);
    if (
      !xFileDomain.map((x) => x[0]).includes(xext[0]) &&
      !xFileDomain.map((x) => x[1]).includes(xext[1])
    ) {
      xFileDomain.push(xext);
    }
    if (
      !yFileDomain.map((y) => y[0]).includes(yext[0]) &&
      !yFileDomain.map((y) => y[1]).includes(yext[1])
    ) {
      yFileDomain.push(yext);
    }

    zFileDomain.push(
      extent(
        [].concat.apply([], data[h].z).filter((f) => {
          return !isNaN(parseFloat(f)) && isFinite(f);
        })
      )
    );
  }
  xDomain = getDomain(xFileDomain);
  yDomain = getDomain(yFileDomain);
  zDomain = getDomain(zFileDomain);
  return { xDomain, yDomain, zDomain, xFileDomain, yFileDomain, zFileDomain };
};

const addSVG = (div, options) => {
  return select("#" + div)
    .append("svg")
    .attr("id", "svg_" + div)
    .attr("width", options.width)
    .attr("height", options.height)
    .append("g")
    .attr(
      "transform",
      "translate(" + options.marginLeft + "," + options.marginTop + ")"
    );
};

const addCanvas = (div, options) => {
  var left = "0px";
  if (options.contour) left = "1px";
  const canvas = select("#" + div)
    .append("canvas")
    .attr("width", options.canvasWidth)
    .attr("height", options.canvasHeight)
    .style("margin-left", options.marginLeft + "px")
    .style("margin-top", options.marginTop + "px")
    .style("pointer-events", "none")
    .style("z-index", 0)
    .style("position", "absolute")
    .style("left", left)
    .style("cursor", "grab")
    .attr("id", "canvas_" + div)
    .attr("class", "canvas-plot");
  return canvas.node().getContext("2d");
};

const addXAxis = (svg, xDomain, options) => {
  var ax;
  var xrange = [0, options.canvasWidth];
  var xAxisLabel =
    "" +
    (options.xLabel ? options.xLabel : "") +
    (options.xUnit ? " (" + options.xUnit + ")" : "");
  if (options.xReverse) xrange = [options.canvasWidth, 0];
  if (options.xTime) {
    xAxisLabel = "";
    ax = scaleTime().range(xrange).domain(xDomain);
  } else if (options.xLog) {
    ax = scaleLog().range(xrange).domain(xDomain);
  } else {
    ax = scaleLinear().range(xrange).domain(xDomain);
  }
  var ref = ax.copy();
  var base = ax.copy();
  var axis = axisBottom(ax).ticks(5);

  var g = svg
    .append("g")
    .attr("class", "x axis")
    .attr("id", "axis--x")
    .attr("transform", "translate(0," + options.canvasHeight + ")")
    .style("font-size", `${options.fontSize}px`)
    .call(axis);

  if (xAxisLabel !== "") {
    svg
      .append("text")
      .attr(
        "transform",
        "translate(" +
          options.canvasWidth / 2 +
          " ," +
          (options.canvasHeight + options.marginBottom / 1.5) +
          ")"
      )
      .attr("x", 6)
      .attr("dx", `${options.fontSize}px`)
      .style("font-size", `${options.fontSize}px`)
      .style("text-anchor", "end")
      .text(xAxisLabel);

    /*gX.selectAll("text").attr("transform", function (d) {
      return (
        "rotate(-45)translate(-" +
        this.getBBox().width * (3 / 4) +
        ",-" +
        this.getBBox().height * (3 / 4) +
        ")"
      );
    });*/
  }

  return { ax, ref, base, axis, g };
};

const addYAxis = (svg, yDomain, options) => {
  var ax;
  var yrange = [options.canvasHeight, 0];
  var yAxisLabel =
    "" +
    (options.yLabel ? options.yLabel : "") +
    (options.yUnit ? " (" + options.yUnit + ")" : "");
  if (options.yReverse) yrange = [0, options.canvasHeight];
  if (options.yTime) {
    yAxisLabel = "";
    ax = scaleTime().range(yrange).domain(yDomain);
  } else if (options.yLog) {
    ax = scaleLog().range(yrange).domain(yDomain);
  } else {
    ax = scaleLinear().range(yrange).domain(yDomain);
  }
  var ref = ax.copy();
  var base = ax.copy();
  var axis = axisLeft(ax).ticks(5);

  var g = svg
    .append("g")
    .attr("class", "y axis")
    .attr("id", "axis--y")
    .style("font-size", `${options.fontSize}px`)
    .call(axis);

  if (yAxisLabel !== "") {
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - options.marginLeft)
      .attr("x", 0 - options.canvasHeight / 2)
      .attr("dy", `${options.fontSize}px`)
      .style("font-size", `${options.fontSize}px`)
      .style("text-anchor", "middle")
      .text(yAxisLabel);
  }
  return { ax, ref, base, axis, g };
};

const addTitle = (svg, div, options) => {
  svg
    .append("text")
    .attr("x", options.canvasWidth / 2)
    .attr("y", 2 - options.marginTop / 2)
    .attr("id", "title_" + div)
    .attr("text-anchor", "middle")
    .style("font-size", `${options.fontSize}px`)
    .style("text-decoration", "underline")
    .style("opacity", "0")
    .text(options.title);
};

const addBackground = (svg, options) => {
  svg
    .append("rect")
    .attr("x", 1)
    .attr("width", options.canvasWidth)
    .attr("height", options.canvasHeight)
    .attr("fill", options.backgroundColor);
};

const addLegendRight = (svg, options) => {
  var defs = svg.append("defs");
  var ndp = 100;
  if (options.zMax - options.zMin < 0.1) ndp = 1000;
  if (options.zMax - options.zMin < 0.01) ndp = 10000;
  var t1 = Math.round(options.zMax * ndp) / ndp,
    t5 = Math.round(options.zMin * ndp) / ndp,
    t3 = Math.round(((t1 + t5) / 2) * ndp) / ndp,
    t2 = Math.round(((t1 + t3) / 2) * ndp) / ndp,
    t4 = Math.round(((t3 + t5) / 2) * ndp) / ndp;

  var svgGradient = defs
    .append("linearGradient")
    .attr("id", "svgGradient")
    .attr("x1", "0")
    .attr("x2", "0")
    .attr("y1", "0")
    .attr("y2", "1");

  for (var g = options.colors.length - 1; g > -1; g--) {
    svgGradient
      .append("stop")
      .attr("class", "end")
      .attr("offset", 1 - options.colors[g].point)
      .attr("stop-color", options.colors[g].color)
      .attr("stop-opacity", 1);
  }

  svg
    .append("g")
    .append("rect")
    .attr("width", options.marginRight / 6)
    .attr("height", options.canvasHeight)
    .attr("x", options.canvasWidth + options.marginRight / 6)
    .attr("y", 0)
    .attr("fill", "url(#svgGradient)");

  svg
    .append("text")
    .attr("x", options.canvasWidth + 2 + options.marginRight / 3)
    .attr("y", 10)
    .style("font-size", `${options.fontSize}px`)
    .text(t1);

  svg
    .append("text")
    .attr("x", options.canvasWidth + 2 + options.marginRight / 3)
    .attr("y", options.canvasHeight * 0.25 + 3)
    .style("font-size", `${options.fontSize}px`)
    .text(t2);

  svg
    .append("text")
    .attr("x", options.canvasWidth + 2 + options.marginRight / 3)
    .attr("y", options.canvasHeight * 0.75 + 3)
    .style("font-size", `${options.fontSize}px`)
    .text(t4);

  svg
    .append("text")
    .attr("x", options.canvasWidth + 2 + options.marginRight / 3)
    .attr("y", options.canvasHeight)
    .style("font-size", `${options.fontSize}px`)
    .text(t5);

  if (options.zLabel) {
    var zAxisLabel =
      options.zLabel + (options.zUnit ? " (" + options.zUnit + ")" : "");
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", options.canvasWidth + options.marginRight - 5)
      .attr("x", 0 - options.canvasHeight / 2)
      .attr("dz", "1em")
      .style("text-anchor", "middle")
      .style("font-size", `${options.fontSize}px`)
      .text(zAxisLabel);
  }
};

const addTooltip = (
  svg,
  data,
  div,
  zoombox,
  xAxis,
  yAxis,
  xFileDomain,
  yFileDomain,
  options
) => {
  var tooltip = select("#" + div)
    .append("div")
    .style("opacity", 0)
    .attr("id", "tooltip_" + div)
    .attr("class", "tooltip");

  // Add axis locators
  var symbolGenerator = symbol().type(symbolTriangle).size(25);
  svg
    .append("g")
    .attr("transform", "rotate(90)")
    .append("g")
    .style("opacity", 0)
    .attr("id", "zpointer_" + div)
    .attr(
      "transform",
      "translate(" +
        options.canvasHeight +
        ",-" +
        (options.canvasWidth - 16 + options.marginRight / 3) +
        ")"
    )
    .append("path")
    .attr("d", symbolGenerator());

  zoombox.on("mousemove", (event) => {
    try {
      var hoverX = xAxis.ax.invert(
        event.layerX - options.marginLeft || event.offsetX - options.marginLeft
      );
      var hoverY = yAxis.ax.invert(
        event.layerY - options.marginTop || event.offsetY - options.marginTop
      );

      var idx = Math.max(
        getFileIndex(xFileDomain, hoverX),
        getFileIndex(yFileDomain, hoverY)
      );
      var process = data[idx];

      var yi = closest(hoverY, process.y);
      var xi = closest(hoverX, process.x);

      var xval, yval;
      var xu = "";
      var yu = "";
      var zu = "";
      var zval = process.z[yi][xi];

      if (options.xTime) {
        xval = formatDate(process.x[xi], "HH:mm dd MMM yy");
      } else {
        xval = formatNumber(process.x[xi]);
        if (typeof options.xUnit === "string") xu = options.xUnit;
      }

      if (options.yTime) {
        yval = formatDate(process.y[yi], "HH:mm dd MMM yy");
      } else {
        yval = formatNumber(process.y[yi]);
        if (typeof options.yUnit === "string") yu = options.yUnit;
      }

      if (typeof options.zUnit === "string") zu = options.zUnit;

      var html =
        "<table><tbody>" +
        `<tr><td>x:</td><td>${xval} ${xu}</td></tr>` +
        `<tr><td>y:</td><td>${yval} ${yu}</td></tr>` +
        `<tr><td>z:</td><td>${formatNumber(zval)} ${zu}</td></tr>` +
        "</tbody></table>";

      tooltip
        .html(html)
        .style("left", xAxis.ax(process.x[xi]) + options.marginLeft + 10 + "px")
        .style("top", yAxis.ax(process.y[yi]) + options.marginTop - 20 + "px")
        .style("opacity", 1);
      select("#zpointer_" + div)
        .attr(
          "transform",
          "translate(" +
            ((zval - options.zMax) / (options.zMin - options.zMax)) *
              options.canvasHeight +
            ",-" +
            (options.canvasWidth - 16 + options.marginRight / 3) +
            ")"
        )
        .style("opacity", 1);
      if (options.hover) options.hover({ mousex: xi, mousey: yi, idx });
    } catch (e) {
      tooltip.style("opacity", 0);
      select("#zpointer_" + div).style("opacity", 0);
      if (options.hover) options.hover({ mousex: false, mousey: false });
    }
  });

  zoombox.on("mouseout", () => {
    tooltip.style("opacity", 0);
    select("#zpointer_" + div).style("opacity", 0);
    if (options.hover) options.hover({ mousex: false, mousey: false });
  });
};

const addZoom = (
  svg,
  data,
  contour,
  prepContours,
  div,
  xAxis,
  yAxis,
  xDomain,
  yDomain,
  zDomain,
  context,
  options
) => {
  var zoom = d3zoom()
    .extent([
      [0, 0],
      [options.canvasWidth, options.canvasHeight],
    ])
    .on("zoom", normalzoom);

  var zoomx = d3zoom()
    .extent([
      [0, 0],
      [options.canvasWidth, options.canvasHeight],
    ])
    .on("zoom", normalzoomx);

  var zoomy = d3zoom()
    .extent([
      [0, 0],
      [options.canvasWidth, options.canvasHeight],
    ])
    .on("zoom", normalzoomy);

  var zoombox = svg
    .append("rect")
    .attr("id", "zoombox_" + div)
    .attr("width", options.canvasWidth)
    .attr("height", options.canvasHeight)
    .style("fill", "none")
    .style("cursor", "pointer")
    .attr("pointer-events", "all")
    .call(zoom);

  var zoomboxx = svg
    .append("rect")
    .attr("id", "zoomboxx_" + div)
    .attr("width", options.canvasWidth)
    .attr("height", options.marginBottom)
    .style("fill", "none")
    .style("cursor", "col-resize")
    .attr("pointer-events", "all")
    .attr("y", options.canvasHeight)
    .call(zoomx);

  var zoomboxy = svg
    .append("rect")
    .attr("id", "zoomboxy_" + div)
    .attr("width", options.marginLeft)
    .attr("height", options.canvasHeight)
    .style("fill", "none")
    .style("cursor", "row-resize")
    .attr("pointer-events", "all")
    .attr("x", -options.marginLeft)
    .call(zoomy);

  function normalzoom(event) {
    let t = event.transform;
    if (t !== zoomIdentity) {
      xAxis.ax = t.rescaleX(xAxis.ref);
      xAxis.axis.scale(xAxis.ax);
      xAxis.g.call(xAxis.axis);
      yAxis.ax = t.rescaleY(yAxis.ref);
      yAxis.axis.scale(yAxis.ax);
      yAxis.g.call(yAxis.axis);
      context.clearRect(0, 0, options.canvasWidth, options.canvasHeight);
      if (options.contour) {
        canvasContour(
          contour,
          xAxis.ax,
          yAxis.ax,
          context,
          options,
          prepContours
        );
      } else {
        canvasGrid(
          data,
          xAxis.ax,
          yAxis.ax,
          xDomain,
          yDomain,
          context,
          options
        );
      }
      xAxis.ref = xAxis.ax;
      yAxis.ref = yAxis.ax;
      zoombox.call(zoom.transform, zoomIdentity);
    }
  }

  function normalzoomx(event) {
    let t = event.transform;
    if (t !== zoomIdentity) {
      xAxis.ax = t.rescaleX(xAxis.ref);
      xAxis.axis.scale(xAxis.ax);
      xAxis.g.call(xAxis.axis);
      context.clearRect(0, 0, options.canvasWidth, options.canvasHeight);
      if (options.contour) {
        canvasContour(
          contour,
          xAxis.ax,
          yAxis.ax,
          context,
          options,
          prepContours
        );
      } else {
        canvasGrid(
          data,
          xAxis.ax,
          yAxis.ax,
          xDomain,
          yDomain,
          context,
          options
        );
      }
      xAxis.ref = xAxis.ax;
      zoomboxx.call(zoom.transform, zoomIdentity);
    }
  }

  function normalzoomy(event) {
    let t = event.transform;
    if (t !== zoomIdentity) {
      yAxis.ax = t.rescaleY(yAxis.ref);
      yAxis.axis.scale(yAxis.ax);
      yAxis.g.call(yAxis.axis);
      context.clearRect(0, 0, options.canvasWidth, options.canvasHeight);
      if (options.contour) {
        canvasContour(
          contour,
          xAxis.ax,
          yAxis.ax,
          context,
          options,
          prepContours
        );
      } else {
        canvasGrid(
          data,
          xAxis.ax,
          yAxis.ax,
          xDomain,
          yDomain,
          context,
          options
        );
      }
      yAxis.ref = yAxis.ax;
      zoomboxy.call(zoom.transform, zoomIdentity);
    }
  }

  zoombox.on("dblclick.zoom", null).on("dblclick", () => {
    xAxis.ax = xAxis.base;
    yAxis.ax = yAxis.base;
    xAxis.ref = xAxis.base;
    yAxis.ref = yAxis.base;
    yAxis.axis.scale(yAxis.base);
    yAxis.g.call(yAxis.axis);
    xAxis.axis.scale(xAxis.base);
    xAxis.g.call(xAxis.axis);
    context.clearRect(0, 0, options.canvasWidth, options.canvasHeight);
    if (options.contour) {
      canvasContour(
        contour,
        xAxis.ax,
        yAxis.ax,
        context,
        options,
        prepContours
      );
    } else {
      canvasGrid(data, xAxis.ax, yAxis.ax, xDomain, yDomain, context, options);
    }
  });
  zoomboxx.on("dblclick.zoom", null);
  zoomboxy.on("dblclick.zoom", null);
  return { zoombox };
};

const downloadGraph = (div, options) => {
  var title = select("#title_" + div);
  title.style("opacity", "1");
  var s = new XMLSerializer();
  var str = s.serializeToString(document.getElementById("svg_" + div));

  var canvasout = document.createElement("canvas"),
    contextout = canvasout.getContext("2d");

  canvasout.width = options.width;
  canvasout.height = options.height;

  var image = new Image();
  image.onerror = function () {
    alert("Appologies .png download failed. Please download as .svg.");
  };
  image.onload = function () {
    contextout.drawImage(image, 0, 0);
    contextout.drawImage(
      document.getElementById("canvas_" + div),
      options.marginLeft,
      options.marginTop
    );
    var a = document.createElement("a");
    a.download = "heatmap_" + div + ".png";
    a.href = canvasout.toDataURL("image/png");
    a.click();
  };
  image.src = "data:image/svg+xml;charset=utf8," + encodeURIComponent(str);
  title.style("opacity", "0");
};

const autoDownSample = (arr, ads) => {
  var l1 = arr.z.length;
  var l2 = arr.z[0].length;
  if (l1 <= ads && l2 <= ads) {
    return arr;
  } else {
    var d1 = Math.max(1, Math.floor(l1 / ads));
    var d2 = Math.max(1, Math.floor(l2 / ads));
    var z_ds = [];
    var y_ds = [];
    for (let i = 0; i < l1; i = i + d1) {
      let zz_ds = [];
      var x_ds = [];
      for (let j = 0; j < l2; j = j + d2) {
        zz_ds.push(arr.z[i][j]);
        x_ds.push(arr.x[j]);
      }
      y_ds.push(arr.y[i]);
      z_ds.push(zz_ds);
    }
    return { x: x_ds, y: y_ds, z: z_ds };
  }
};

export default heatmap;
