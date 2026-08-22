import { expect, test } from "@playwright/test";
import { classifyExifValidationSummary, technicalValuesEqual } from "./harness";

test("normalizes ExifTool duration representations across versions", () => {
  expect(technicalValuesEqual("00:00:13.346000000", 13.346, "Duration", "mkv")).toBe(true);
  expect(technicalValuesEqual("00:00:30.543000000", 30.543, "Duration", "webm")).toBe(true);
  expect(technicalValuesEqual("01:02:03.5", 3723.5, "Duration", "mkv")).toBe(true);
  expect(technicalValuesEqual("00:00:13.346", 14, "Duration", "mkv")).toBe(false);
});

test("keeps warnings-only ExifTool validation results non-fatal", () => {
  expect(classifyExifValidationSummary("OK")).toBe("ok");
  expect(classifyExifValidationSummary("6 Warnings")).toBe("warning");
  expect(classifyExifValidationSummary("1 Warning")).toBe("warning");
  expect(classifyExifValidationSummary("1 Error, 2 Warnings")).toBe("error");
  expect(classifyExifValidationSummary("Invalid validation response")).toBe("error");
});
