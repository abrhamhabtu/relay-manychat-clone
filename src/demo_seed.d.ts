export interface DemoPersona {
  label: string;
  blurb: string;
  name: string;
  handle: string;
  link: string;
  followers: number;
}
/** The demo workspaces: a creator, a local business and a coach. */
export const PERSONAS: Record<string, DemoPersona>;
/** SQL statements that fill an empty Relay database with invented sample data for one demo workspace, dated around `now`. */
export function demoSeed(now: number, persona?: string): string[];
