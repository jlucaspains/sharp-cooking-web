export interface DietTag {
  id: string;
  labelKey: string;
}

export const DIET_TAGS: DietTag[] = [
  { id: "gluten-free", labelKey: "components.dietTags.glutenFree" },
  { id: "vegetarian", labelKey: "components.dietTags.vegetarian" },
  { id: "vegan", labelKey: "components.dietTags.vegan" },
  { id: "dairy-free", labelKey: "components.dietTags.dairyFree" },
];

export const DIET_TAG_IDS = DIET_TAGS.map(tag => tag.id);

// Tags implied by another tag in the catalog, e.g. "vegan" already means
// "vegetarian" and "dairy-free" - redundant to show all three together.
const IMPLIED_TAGS: Record<string, string[]> = {
  "vegan": ["vegetarian", "dairy-free"],
};

/**
 * Filter to catalog tags and collapse tags implied by a more specific tag,
 * for read-only display (e.g. hide "vegetarian" and "dairy-free" when
 * "vegan" is present; drop any stored id no longer in the catalog, such as
 * a tag removed from DIET_TAGS after it was saved on older recipes).
 * Does not affect what is stored or the editable tag toggles.
 */
export function getDisplayTags(tags: string[]): string[] {
  const known = tags.filter(tag => DIET_TAG_IDS.includes(tag));
  const implied = new Set(known.flatMap(tag => IMPLIED_TAGS[tag] ?? []));
  return known.filter(tag => !implied.has(tag));
}
