import { ACCEPTED_FILE_TYPES } from "./constants";

export const getFileExtensions = () =>
  Array.from(new Set(Object.values(ACCEPTED_FILE_TYPES).flatMap(({ extensions }) => extensions))).join(", ");
