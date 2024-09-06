import { t } from "i18next";
import { Recipe } from "../services/recipe";

export function recipeAsText(item: Recipe) {
    return `${item.title}

${t("pages.recipe.id.index.ingredients")}:
${item.ingredients.join("\r\n")}

${t("pages.recipe.id.index.instructions")}:
${item.steps.join("\r\n")}`;
}