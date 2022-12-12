export class Ingredient {
    constructor(public quantity: string, public uom: string, public content: string) { }
}

export class Step {
    constructor(public time: number, public content: string) { }
}

export class Recipe {
    id?: number;
    title!: string;
    score!: number;
    ingredients!: string[];
    // parsedIngredients?: Ingredient[];
    steps!: string[];
    // parsedSteps?: Step[];
    notes!: string;
    multiplier: number = 1;
    changedOn!: string;
    source!: string;
}

export class RecipeImage {
    constructor(public recipeId: number, public image: string) { }

    id?: number;
}