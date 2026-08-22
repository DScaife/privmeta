export const SUPPORT_URL = "https://buymeacoffee.com/privco";

export const SUPPORT_PROMPTS = [
  {
    threshold: 1,
    description: "Help keep this tool free and open source.",
  },
  {
    threshold: 3,
    description: "Support a free, open-source approach to digital privacy.",
  },
  {
    threshold: 10,
    description: "Your support helps fund continued development and maintenance.",
  },
] as const;

const STORAGE_KEY = "privmeta-support-prompts-v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const MILESTONE_COOLDOWN_MS = DAY_MS;
const RECURRING_COOLDOWN_MS = 30 * DAY_MS;
const SUPPORT_CLICK_COOLDOWN_MS = 90 * DAY_MS;

type SupportPromptState = {
  successfulCleans: number;
  shownMilestones: number;
  lastPromptAt: number | null;
  suppressUntil: number | null;
};

export type SupportPrompt = {
  description: (typeof SUPPORT_PROMPTS)[number]["description"];
};

const initialState = (): SupportPromptState => ({
  successfulCleans: 0,
  shownMilestones: 0,
  lastPromptAt: null,
  suppressUntil: null,
});

const validTimestamp = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;

const parseState = (raw: string | null): SupportPromptState => {
  if (!raw) return initialState();

  try {
    const value = JSON.parse(raw) as Partial<SupportPromptState> | null;
    if (!value || typeof value !== "object") return initialState();

    const successfulCleans =
      typeof value.successfulCleans === "number" && Number.isSafeInteger(value.successfulCleans) && value.successfulCleans >= 0
        ? value.successfulCleans
        : 0;
    const shownMilestones =
      typeof value.shownMilestones === "number" &&
      Number.isInteger(value.shownMilestones) &&
      value.shownMilestones >= 0 &&
      value.shownMilestones <= SUPPORT_PROMPTS.length
        ? value.shownMilestones
        : 0;

    return {
      successfulCleans,
      shownMilestones,
      lastPromptAt: validTimestamp(value.lastPromptAt),
      suppressUntil: validTimestamp(value.suppressUntil),
    };
  } catch {
    return initialState();
  }
};

const readState = (): SupportPromptState | null => {
  if (typeof window === "undefined") return null;

  try {
    return parseState(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

const writeState = (state: SupportPromptState): boolean => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

const cooldownElapsed = (lastPromptAt: number | null, now: number, cooldown: number): boolean =>
  lastPromptAt === null || now - Math.min(lastPromptAt, now) >= cooldown;

export const recordSuccessfulClean = (now = Date.now()): SupportPrompt | null => {
  const state = readState();
  if (!state) return null;

  state.successfulCleans = Math.min(state.successfulCleans + 1, Number.MAX_SAFE_INTEGER);

  let prompt: SupportPrompt | null = null;
  const nextMilestone = SUPPORT_PROMPTS[state.shownMilestones];
  const isSuppressed = state.suppressUntil !== null && state.suppressUntil > now;

  if (!isSuppressed && nextMilestone) {
    const canShow =
      state.successfulCleans >= nextMilestone.threshold &&
      (state.shownMilestones === 0 || cooldownElapsed(state.lastPromptAt, now, MILESTONE_COOLDOWN_MS));

    if (canShow) {
      prompt = { description: nextMilestone.description };
      state.shownMilestones += 1;
      state.lastPromptAt = now;
    }
  } else if (
    !isSuppressed &&
    state.shownMilestones === SUPPORT_PROMPTS.length &&
    cooldownElapsed(state.lastPromptAt, now, RECURRING_COOLDOWN_MS)
  ) {
    prompt = { description: SUPPORT_PROMPTS[SUPPORT_PROMPTS.length - 1].description };
    state.lastPromptAt = now;
  }

  if (!isSuppressed && state.suppressUntil !== null) state.suppressUntil = null;

  // Do not show a prompt unless its state was persisted; otherwise restrictive
  // browsers could show the introductory prompt after every successful clean.
  return writeState(state) ? prompt : null;
};

export const suppressSupportPrompts = (now = Date.now()): void => {
  const state = readState();
  if (!state) return;

  state.suppressUntil = now + SUPPORT_CLICK_COOLDOWN_MS;
  writeState(state);
};
