import { select } from "d3";

export const verifyString = (string) => {
  if (string === false) return true;
  return typeof string === "string";
};

export const verifyNumber = (number) => {
  return typeof number === "number" && !isNaN(number);
};

export const verifyNone = (number) => {
  return true;
};

export const verifyBool = (bool) => {
  return typeof bool === "boolean";
};

export const verifyColors = (colors) => {
  return true;
};

export const verifyFunction = (f) => {
  return typeof f === "function";
};

export const verifyDiv = (div) => {
  if (select("#" + div)._groups[0][0] === null) {
    throw new Error(
      "Div with ID: " + div + " not found, graph could not be added."
    );
  }
};

export const verifyData = (data) => {
  for (let i = 0; i < data.length; i++) {
    if (typeof data[i] !== "object" || data[i] === null) {
      throw new Error(
        "Input data in not an object, data input must conform to {x: [], y: [], z: [[]]}."
      );
    }
    if (!("x" in data[i] && "y" in data[i] && "z" in data[i])) {
      throw new Error(
        "Input data is badly formatted, data input must conform to {x: [], y: [], z: [[]]}."
      );
    }
    if (data[i].x.length !== data[i].z[0].length) {
      throw new Error(
        "Input data is badly formatted, x-array length must equal z-array dimension."
      );
    }
    if (data[i].y.length !== data[i].z.length) {
      throw new Error(
        "Input data is badly formatted, y-array length must equal z-array dimension."
      );
    }
  }
};
