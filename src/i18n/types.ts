export type Vars = Record<string, string | number>;

/** Untyped lookup handed to function entries, so they can compose other strings. */
export type LooseT = (key: string, vars?: Vars) => string;

/** A translation: plain text with {{placeholders}}, or a function for plurals and composition. */
export type Entry = string | ((vars: Vars, t: LooseT) => string);

export type Lang = 'en' | 'ms';
export type LangPref = Lang | 'system';
