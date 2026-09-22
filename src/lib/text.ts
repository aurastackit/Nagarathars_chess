/** Title-cases free-text venue/city names typed inconsistently by admins. */
export function capitalizeWords(value: string) {
  return value.replace(/\p{L}[\p{L}'-]*/gu, (word) => {
    if (word.length > 3 && word === word.toUpperCase()) return word; // preserve acronyms
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}
