import { describe, bench, it, expect } from "vitest";

const CASES = [
  {
    text: "test=example",
    start: 5,
    end: 12,
    expected: "example",
  },
  {
    text: "test=",
    start: 5,
    end: 5,
    expected: "",
  },
  {
    text: "test= example ",
    start: 5,
    end: 14,
    expected: "example",
  },
  {
    text: "test=example ",
    start: 5,
    end: 13,
    expected: "example",
  },
  {
    text: "test= example",
    start: 5,
    end: 13,
    expected: "example",
  },
  {
    text: "test= \t ",
    start: 5,
    end: 8,
    expected: "",
  },
];

function valueSliceDoThenWhile(str: string, min: number, max: number) {
  let start = min;
  let end = max;

  do {
    const code = str.charCodeAt(start);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
  } while (++start < end);

  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
    end--;
  }

  return str.slice(start, end);
}

function valueSliceDoThenWhileEmptyString(
  str: string,
  min: number,
  max: number,
) {
  let start = min;
  let end = max;

  do {
    const code = str.charCodeAt(start);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
  } while (++start < end);

  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
    end--;
  }

  return start === end ? "" : str.slice(start, end);
}

function valueSliceDoThenWhileExitEarly(str: string, min: number, max: number) {
  if (min === max) return "";
  let start = min;
  let end = max;

  do {
    const code = str.charCodeAt(start);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
  } while (++start < end);

  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
    end--;
  }

  return str.slice(start, end);
}

function valueSliceTwoWhile(str: string, min: number, max: number) {
  let start = min;
  let end = max;

  while (start < end) {
    const code = str.charCodeAt(start);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
    start++;
  }

  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
    end--;
  }

  return str.slice(start, end);
}

function valueSliceTwoWhileExitEarly(str: string, min: number, max: number) {
  if (min === max) return "";
  let start = min;
  let end = max;

  while (start < end) {
    const code = str.charCodeAt(start);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
    start++;
  }

  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
    end--;
  }

  return str.slice(start, end);
}

function valueSliceTwoDoWhile(str: string, min: number, max: number) {
  let start = min;
  let end = max;

  do {
    const code = str.charCodeAt(start);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
  } while (++start < end);

  do {
    const code = str.charCodeAt(end - 1);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
  } while (--end > start);

  return str.slice(start, end);
}

function valueSliceTwoDoWhileExitEarly(str: string, min: number, max: number) {
  if (min === max) return "";
  let start = min;
  let end = max;

  do {
    const code = str.charCodeAt(start);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
  } while (++start < end);

  do {
    const code = str.charCodeAt(end - 1);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
  } while (--end > start);

  return str.slice(start, end);
}

function valueSliceThenTrim(str: string, min: number, max: number) {
  return str.slice(min, max).trim();
}

describe.each(CASES)("valueSlice $text", ({ text, start, end, expected }) => {
  bench("two while", () => {
    valueSliceTwoWhile(text, start, end);
  });

  bench("two while (exit early)", () => {
    valueSliceTwoWhileExitEarly(text, start, end);
  });

  bench("two do...while", () => {
    valueSliceTwoDoWhile(text, start, end);
  });

  bench("two do...while (exit early)", () => {
    valueSliceTwoDoWhileExitEarly(text, start, end);
  });

  bench("do...while then while", () => {
    valueSliceDoThenWhile(text, start, end);
  });

  bench("do...while then while (exit early)", () => {
    valueSliceDoThenWhileExitEarly(text, start, end);
  });

  bench("do...while then while (empty string check)", () => {
    valueSliceDoThenWhileEmptyString(text, start, end);
  });

  bench("slice then trim", () => {
    valueSliceThenTrim(text, start, end);
  });
});
