export function cn(
  ...args: (string | "" | 0 | false | null | undefined)[]
): string {
  return args.filter((a) => a).join(" ");
}
