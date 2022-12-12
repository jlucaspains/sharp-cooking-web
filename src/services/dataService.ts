import { Dexie, Table } from "dexie";
import { BackupModel } from "../pages/recipe/backupModel"
import { Ingredient, Recipe, RecipeImage } from "./recipe";
import { Setting } from "./setting";

class RecipeDatabase extends Dexie {
    public recipes!: Table<Recipe, number>;
    public recipeImages!: Table<RecipeImage, number>;
    public settings!: Table<Setting, string>;

    public constructor() {
        super("RecipeDatabase");
        this.version(2).stores({
            recipes: "++id,title,score,changedOn",
            recipeImages: "++id,recipeId",
            settings: "name"
        });
        // this.version(3).stores({
        //     recipes: "++id,title,score,changedOn",
        //     recipeImages: "++id,recipeId",
        //     settings: "name"
        // }).upgrade((transaction) => {
        //     transaction.table("recipes").toCollection().modify((recipe: Recipe) => {
        //         recipe.parsedIngredients = recipe.ingredients.map(ingredient => {
        //             return new Ingredient("0", "", ingredient);
        //         })
        //     });
        // });
    }
}

const db = new RecipeDatabase();

export async function getRecipe(id: number): Promise<Recipe | undefined> {
    console.time(`getRecipe_${id}`);

    const result = await db.recipes.get(id);

    console.timeEnd(`getRecipe_${id}`);

    return result;
}

export async function getRecipes(): Promise<Recipe[]> {
    console.time("getRecipes");

    const result = await db.recipes.toArray();

    console.timeEnd("getRecipes");

    return result;
}

export async function getRecipeImages(id: number): Promise<RecipeImage[]> {
    console.time(`getRecipeImages_${id}`);

    const result = await db.recipeImages.where("recipeId").equals(id).toArray();

    console.timeEnd(`getRecipeImages_${id}`);

    return result;
}

export async function getRecipeImage(id: number): Promise<RecipeImage | undefined> {
    console.time(`getRecipeImage_${id}`);

    const result = await db.recipeImages.where("recipeId").equals(id).first();

    console.timeEnd(`getRecipeImage_${id}`);

    return result;
}

export async function saveRecipe(recipe: Recipe) {
    console.time("saveRecipe");

    await db.recipes.put(recipe);

    console.timeEnd("saveRecipe");
}

export async function initialize() {
    const count = await db.recipes.count();

    if (count > 0) {
        return;
    }

    const id = await getNextRecipeId();
    const recipes = [
        {
            id: id,
            title: "Sourdough Bread",
            score: 5,
            changedOn: new Date().toISOString(),
            source: "Breadtopia",
            ingredients: [
                "142g whole wheat flour",
                "312g white bread flour",
                "7.1g salt",
                "354g purified water",
                "80g starter"
            ],
            steps: [
                "Mix together the dry ingredients",
                "Dissolve the starter into water",
                "Add wet into dry ingredients and stir until incorporated",
                "Cover with plastic or airtight lid and reserve for 15 minutes",
                "Perform the first set of folds and reserve for another 15 minutes",
                "Perform the second set of folds and reserve for another 15 minutes",
                "Perform the third set of folds and make a window pane test. If gluten is not developed yet, repeat this step",
                "Ferment for 10-14 hours at room temperature (68 - 72F)",
                "Shape and proof for about 2 hours",
                "Bake in covered dutch oven ou La Cloche at 420F for 30 minutes",
                "Uncover and bake for another 14 minutes",
                "Let it cool completely on rack before carving"
            ],
            notes: "May replace whole wheat flour with rye for added taste",
            multiplier: 1,
            image: "/bread.jpg"
        }
    ];

    for (const recipe of recipes) {
        await saveRecipe(recipe);
        await saveRecipeImage({recipeId: id, image: "/bread.jpg"})
    }
}

export async function saveRecipeImage(recipeImage: RecipeImage) {
    console.time("saveRecipeImage");

    await db.recipeImages.put(recipeImage);

    console.timeEnd("saveRecipeImage");
}

export async function deleteRecipe(id: number) {
    console.time("deleteRecipe");
    
    const images = await db.recipeImages.where("recipeId").equals(id).toArray();

    for (const item of images) {
        db.recipeImages.delete(item.id || 0);
    }

    await db.recipes.delete(id);

    console.timeEnd("deleteRecipe");
}

export async function getNextRecipeId(): Promise<number> {
    console.time("getNextRecipeId");
    
    const item = await db.recipes.orderBy("id").reverse().first();

    const result = item?.id ? item.id + 1 : 1; 

    console.timeEnd("getNextRecipeId");

    return result;
}

export async function saveSetting(name: string, value: string): Promise<void> {
    console.time("saveSetting");
    
    await db.settings.put({ name: name, value: value });

    console.timeEnd("saveSetting");
}

export async function getSetting(name: string, defaultValue: string): Promise<string> {
    console.time("getSetting");
    
    const setting = await db.settings.get(name);
    const result = setting ? setting.value : defaultValue;

    console.timeEnd("getSetting");

    return result;
}

export async function prepareBackup(): Promise<Array<BackupModel>> {
    console.time("prepareBackup");

    const allRecipes = await db.recipes.toArray();
    const allImages = await db.recipeImages.toArray();

    const result = [];
    for (const recipe of allRecipes) {
        const model = recipe as BackupModel;
        model.images = allImages.filter(item => item.recipeId == model.id).map(item => item.image);
        result.push(model);
    }

    console.timeEnd("prepareBackup");

    return result;
}


export async function prepareRecipeBackup(id: number): Promise<Array<BackupModel>> {
    console.time("prepareRecipeBackup");

    const recipe = await db.recipes.get(id);
    const allImages = await db.recipeImages.where("recipeId").equals(id).toArray();

    const result = [];
    const model = recipe as BackupModel;
    model.images = allImages.map(item => item.image);
    result.push(model);

    console.timeEnd("prepareRecipeBackup");

    return result;
}