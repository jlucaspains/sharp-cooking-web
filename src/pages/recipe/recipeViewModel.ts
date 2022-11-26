import { Recipe } from "../../services/recipe";

export class RecipeViewModel extends Recipe {
  constructor() {
    super();

    this.ingredients = [];
    this.steps = [];
  }

  image?: string;
  imageAvailable: boolean = false;
  hasNotes: boolean = false;
}