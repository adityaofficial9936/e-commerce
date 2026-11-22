export class SlugUtil {
  /**
   * Converts any string into a clean, URL-safe kebab-case slug
   */
  static slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with -
      .replace(/^-+|-+$/g, '');   // Trim leading/trailing -
  }
}
