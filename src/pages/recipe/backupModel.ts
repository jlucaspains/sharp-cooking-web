import { Recipe } from "../../services/recipe";

export class BackupModel extends Recipe {
  constructor() {
    super();

    this.ingredients = [];
    this.steps = [];
    this.media = [];
  }

  media?: Array<{type: string, url: string}>;
}