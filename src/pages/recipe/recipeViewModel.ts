import { Recipe } from "../../services/recipe";

export class RecipeViewModel extends Recipe {
    image?: string;
    imageAvailable: boolean = false;
  }