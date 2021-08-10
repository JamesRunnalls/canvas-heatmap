export const convertToRGB = (hex) => {
  function trim(s) {
    return s.charAt(0) === "#" ? s.substring(1, 7) : s;
  }
  var color = [];
  color[0] = parseInt(trim(hex).substring(0, 2), 16);
  color[1] = parseInt(trim(hex).substring(2, 4), 16);
  color[2] = parseInt(trim(hex).substring(4, 6), 16);
  color[3] = 255;
  return color;
};

export const getRGBAColor = (value, min, max, colors) => {
  if (value === null || isNaN(value)) {
    return [255, 255, 255, 0];
  }
  if (value > max) {
    return [0, 0, 0, 0];
  }
  if (value < min) {
    return [0, 0, 0, 0];
  }
  var loc = (value - min) / (max - min);
  if (loc < 0 || loc > 1) {
    return [255, 255, 255, 0];
  } else {
    var index = 0;
    for (var i = 0; i < colors.length - 1; i++) {
      if (loc >= colors[i].point && loc <= colors[i + 1].point) {
        index = i;
        break;
      }
    }
    var color1 = colors[index].rgba;
    var color2 = colors[index + 1].rgba;

    var f =
      (loc - colors[index].point) /
      (colors[index + 1].point - colors[index].point);
    var rgb = [
      color1[0] + (color2[0] - color1[0]) * f,
      color1[1] + (color2[1] - color1[1]) * f,
      color1[2] + (color2[2] - color1[2]) * f,
      255,
    ];

    return rgb;
  }
};

export const closest = (num, arr) => {
  var curr = 0;
  var diff = Math.abs(num - arr[curr]);
  for (var val = 0; val < arr.length; val++) {
    var newdiff = Math.abs(num - arr[val]);
    if (newdiff < diff) {
      diff = newdiff;
      curr = val;
    }
  }
  return curr;
};

export const isNumeric = (n) => {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

export const indexOfClosest = (num, arr) => {
  if (!isNumeric(num)) {
    return false;
  }
  arr = arr.filter((a) => isNumeric(a));
  var index = 0;
  var diff = Math.abs(num - arr[0]);
  for (var val = 0; val < arr.length; val++) {
    var newdiff = Math.abs(num - arr[val]);
    if (newdiff < diff) {
      diff = newdiff;
      index = val;
    }
  }
  return index;
};

export const getFileIndex = (scales, p) => {
  for (var i = 0; i < scales.length; i++) {
    if (p >= Math.min(...scales[i]) && p <= Math.max(...scales[i])) {
      return i;
    }
  }
  return NaN;
};

export const formatDate = (a, lang) => {
  var months = lang.shortMonths
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  return `${hour < 10 ? "0" + hour : hour}:${
    min < 10 ? "0" + min : min
  } ${date} ${month} ${String(year).slice(-2)}`;
};

export const formatNumber = (num) => {
  num = parseFloat(num);
  if (num > 9999 || (num < 0.01 && num > -0.01) || num < -9999) {
    num = num.toExponential(3);
  } else {
    num = Math.round(num * 10000) / 10000;
  }
  return num;
};

export const languageOptions = (name) => {
  var lang = {
    de: {
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
    en: {
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
    fr: {
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
    es: {
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
    return lang[name];
  } else {
    console.error("Language: " + name + " not recognised.");
    return lang["en"];
  }
};
