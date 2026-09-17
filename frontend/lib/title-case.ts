/** Capitalize the first letter of each word while typing (after spaces). */
export function toTitleCaseInput(value: string): string {
  return value.replace(/(^|\s)([a-zA-Z])/g, (_, space: string, letter: string) => {
    return `${space}${letter.toUpperCase()}`;
  });
}
