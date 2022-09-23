export class Recipe {
    id?: number;
    title!: string;
    score!: number;
    ingredients!: string[];
    steps!: string[];
    notes!: string;
    multiplier: number = 1;
    changedOn!: string;
    source!: string;
}

export class RecipeImage {
    constructor(public recipeId: number, public image: string) { }

    id?: number;
}