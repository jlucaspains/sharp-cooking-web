import { Recipe } from "../../services/recipe";

export class BackupModel extends Recipe {
  constructor(base: Recipe) {
    super();

    this.ingredients = [];
    this.steps = [];
    this.images = [];
  }

  images?: Array<string>;
}