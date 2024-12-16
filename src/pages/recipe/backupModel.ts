import { Category } from "../../services/category";
import { Recipe } from "../../services/recipe";

export class RecipeBackupModel extends Recipe {
  constructor() {
    super();

    this.ingredients = [];
    this.steps = [];
    this.media = [];
  }

  media?: Array<{type: string, url: string}>;
  category?: string;
}

export class BackupModel {
  recipes: RecipeBackupModel[] = [];
  categories: Category[] = [];
  version: number = 2;
}