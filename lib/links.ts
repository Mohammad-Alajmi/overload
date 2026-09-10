/**
 * The add/edit sheet keeps its whole state in the URL. That is what lets
 * "log this day" on a routine page be an ordinary link instead of client state
 * handed across a navigation — and it makes a filtered log shareable.
 */

export function addSetHref(params?: {
  lift?: string;
  routine?: string;
  day?: string;
}): string {
  const search = new URLSearchParams({ add: "1" });
  if (params?.lift) search.set("lift", params.lift);
  if (params?.routine) search.set("routine", params.routine);
  if (params?.day) search.set("day", params.day);
  return `/log?${search.toString()}`;
}

export function editSetHref(id: string): string {
  return `/log?edit=${encodeURIComponent(id)}`;
}

export function liftHref(lift: string): string {
  return `/progression?lift=${encodeURIComponent(lift)}`;
}
