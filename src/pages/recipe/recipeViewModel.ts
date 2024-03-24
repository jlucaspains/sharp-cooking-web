import { Recipe } from "../../services/recipe";

export class RecipeViewModel extends Recipe {
  constructor() {
    super();

    this.ingredients = [];
    this.steps = [];
    this.nutrition = {
      servingSize: 0,
      totalFat: 0,
      saturatedFat: 0,
      sodium: 0,
      protein: 0,
      cholesterol: 0,
      calories: 0,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      transFat: 0,
      unsaturatedFat: 0
    };
  }

  image?: string;
  imageAvailable: boolean = false;
  hasNotes: boolean = false;
}