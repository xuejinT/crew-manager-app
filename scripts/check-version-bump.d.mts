/*
 * The gate itself is plain JS, because CI runs it with bare `node` and no build
 * step — a TypeScript source would need compiling, and a gate that depends on
 * the toolchain it guards is one dependency failure away from silently not
 * running. This declaration is what lets `test/version-bump.test.ts` import it
 * under `strict` without `allowJs` loosening the rest of the project.
 */
export type Verdict = {
  /** Whether the pull request may proceed. */
  ok: boolean
  /** One clause naming why, for the log line and the error message. */
  reason: string
  /** The changed paths that actually ship inside the installed app. */
  watched: string[]
}

export declare const OVERRIDE_LABEL: string

/** `[major, minor, patch]`, or null for anything that is not a plain `x.y.z`. */
export declare function parseVersion(value: unknown): [number, number, number] | null

/** Strictly newer, comparing each component numerically. */
export declare function isNewer(head: unknown, base: unknown): boolean

/** The subset of `changedPaths` that ships inside the installed app. */
export declare function watchedChanges(paths: string[]): string[]

export declare function decide(input: {
  changedPaths: string[]
  baseVersion: unknown
  headVersion: unknown
  labels?: string[]
}): Verdict
