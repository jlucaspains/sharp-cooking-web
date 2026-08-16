export interface DietTag {
  id: string;
  labelKey: string;
}

export const DIET_TAGS: DietTag[] = [
  { id: "gluten-free", labelKey: "components.dietTags.glutenFree" },
  { id: "low-fodmap", labelKey: "components.dietTags.lowFodmap" },
  { id: "vegetarian", labelKey: "components.dietTags.vegetarian" },
  { id: "vegan", labelKey: "components.dietTags.vegan" },
  { id: "dairy-free", labelKey: "components.dietTags.dairyFree" },
];

export const DIET_TAG_IDS = DIET_TAGS.map(tag => tag.id);
