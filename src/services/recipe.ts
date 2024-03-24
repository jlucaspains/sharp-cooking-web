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
    steps!: string[];
    notes!: string;
    multiplier: number = 1;
    changedOn!: string;
    source!: string;
    nutrition!: RecipeNutrition;
}

export class RecipeImage {
    constructor(public recipeId: number, public image: null | string, public url: string) { }

    id?: number;
}

export class RecipeMedia {
    constructor(public recipeId: number, public type: string, public url: string) { }

    id?: number;
}

export class RecipeNutrition {
    constructor(public servingSize: number, public calories: number, public totalFat: number, public saturatedFat: number,
        public unsaturatedFat: number, public transFat: number, public carbohydrates: number,
        public sugar: number, public cholesterol: number, public sodium: number,
        public protein: number, public fiber: number) { }
}