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
  categoryUuid?: string;
}

export class BackupModel {
  recipes: RecipeBackupModel[] = [];
  categories: Category[] = [];
  version: number = 3;
  deviceId?: string;
  exportedOn?: string;
}