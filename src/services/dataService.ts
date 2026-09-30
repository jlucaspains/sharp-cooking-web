import { Dexie, Table } from "dexie";
import { BackupModel, RecipeBackupModel } from "../pages/recipe/backupModel"
import { Recipe, RecipeImage, RecipeMedia, RecipeNutrition } from "./recipe";
import { Setting } from "./setting";
import { Category } from "./category";
import { getThumbnail } from "../helpers/videoHelpers";

export interface RecipeSyncState {
    uuid: string;
    remoteEtag: string;
}

class RecipeDatabase extends Dexie {
    public recipes!: Table<Recipe, number>;
    public recipeImages!: Table<RecipeImage, number>;
    public recipeMedia!: Table<RecipeMedia, number>;
    public settings!: Table<Setting, string>;
    public categories!: Table<Category, number>;
    public recipeSyncState!: Table<RecipeSyncState, string>;

    public constructor() {
        super("RecipeDatabase");
        this.version(2).stores({
            recipes: "++id,title,score,changedOn",
            recipeImages: "++id,recipeId",
            settings: "name"
        });
        this.version(3).stores({
            recipes: "++id,title,score,changedOn",
            recipeImages: "++id,recipeId",
            settings: "name"
        }).upgrade((transaction) => {
            transaction.table("recipeImages").toCollection().modify((image: RecipeImage) => {
                if (image.image) {
                    image.url = image.image;
                }
                image.image = null;
            });
        });
        this.version(4).stores({
            recipes: "++id,title,score,changedOn",
            recipeImages: "++id,recipeId",
            recipeMedia: "++id,recipeId",
            settings: "name"
        }).upgrade(async (transaction) => {
            const imagesTable = transaction.table("recipeImages");
            const mediaTable = transaction.table("recipeMedia");

            // copy images from recipeImages to recipeMedia
            await imagesTable.each(async (image: RecipeImage) => {
                await mediaTable.add(new RecipeMedia(image.recipeId, "img", image.url));
            });

            // only delete recipeImages if the number of images is 
            // the same as the number of items in recipeMedia
            const imagesCount = await imagesTable.count();
            const mediaCount = await mediaTable.count();
            if (mediaCount == imagesCount) {
                await imagesTable.clear();
            }
        });
        this.version(5).stores({
            recipes: "++id,title,score,changedOn",
            recipeImages: "++id,recipeId",
            recipeMedia: "++id,recipeId",
            settings: "name"
        }).upgrade(async (transaction) => {
            transaction.table("recipes").toCollection().modify((recipe: Recipe) => {
                recipe.nutrition = new RecipeNutrition(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            });
        });
        this.version(6).stores({
            recipes: "++id,title,score,changedOn,categoryId",
            recipeImages: "++id,recipeId",
            recipeMedia: "++id,recipeId",
            settings: "name",
            categories: "++id,name"
        }).upgrade(async (transaction) => {
            transaction.table("recipes").toCollection().modify((recipe: Recipe) => {
                recipe.categoryId = 0;
            });
        });
        this.version(7).stores({
            recipes: "++id,title,score,changedOn,categoryId",
            recipeImages: "++id,recipeId",
            recipeMedia: "++id,recipeId",
            settings: "name",
            categories: "++id,name"
        }).upgrade(async (transaction) => {
            transaction.table("recipes").toCollection().modify((recipe: Recipe) => {
                recipe.tags = [];
            });
        });
        this.version(8).stores({
            recipes: "++id,title,score,changedOn,categoryId,uuid",
            recipeImages: "++id,recipeId",
            recipeMedia: "++id,recipeId",
            settings: "name",
            categories: "++id,name,uuid"
        }).upgrade(async (transaction) => {
            const now = new Date().toISOString();
            transaction.table("recipes").toCollection().modify((recipe: Recipe) => {
                recipe.uuid = recipe.uuid || crypto.randomUUID();
            });
            transaction.table("categories").toCollection().modify((category: Category) => {
                category.uuid = category.uuid || crypto.randomUUID();
                category.changedOn = category.changedOn || now;
            });
        });
        this.version(9).stores({
            recipes: "++id,title,score,changedOn,categoryId,uuid",
            recipeImages: "++id,recipeId",
            recipeMedia: "++id,recipeId",
            settings: "name",
            categories: "++id,name,uuid",
            // Caches the remote OneDrive etag last seen per recipe (by uuid), so cloud sync
            // can tell which /recipes/<uuid>.json files changed remotely without downloading
            // every one of them. Purely additive - empty until sync populates it.
            recipeSyncState: "uuid"
        });
    }
}

const db = new RecipeDatabase();

export async function getRecipe(id: number): Promise<Recipe | undefined> {
    const result = await db.recipes.get(id);

    if (result?.deletedOn) {
        return undefined;
    }

    if (result && !result.nutrition) {
        result.nutrition = new RecipeNutrition(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    if (result && !result.tags) {
        result.tags = [];
    }

    return result;
}

export async function getRecipeByName(name: string): Promise<Recipe | undefined> {
    const result = await db.recipes.where("title").equals(name).filter(recipe => !recipe.deletedOn).first();

    if (result && !result.nutrition) {
        result.nutrition = new RecipeNutrition(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    if (result && !result.tags) {
        result.tags = [];
    }

    return result;
}

export async function getRecipes(): Promise<Recipe[]> {
    return await db.recipes.filter(recipe => !recipe.deletedOn).toArray();
}

export async function getRecipesByCategory(categoryId: number): Promise<Recipe[]> {
    return await db.recipes.where("categoryId").equals(categoryId).filter(recipe => !recipe.deletedOn).toArray();
}

export async function getRecipeMediaList(id: number): Promise<RecipeMedia[]> {
    const result = await db.recipeMedia.where("recipeId").equals(id).toArray();

    return result;
}

export async function getRecipeMedia(id: number): Promise<RecipeMedia | undefined> {
    return await db.recipeMedia
        .where("recipeId").equals(id)
        .first();
}

export async function getRecipeMediaUrl(id: number): Promise<string | undefined> {
    const media = await getRecipeMedia(id);

    let result = media?.url;
    if (media?.type == "vid")
    {
        result = getThumbnail(media.url);
    }

    return result;
}

export async function saveRecipe(recipe: Recipe): Promise<number> {
    recipe.uuid = recipe.uuid || crypto.randomUUID();
    recipe.changedOn = new Date().toISOString();
    const result = await db.recipes.put(recipe);

    return result;
}

export async function initialize(recipes: Array<Recipe>) {
    const count = await db.recipes.count();

    if (count > 0) {
        return;
    }

    for (const recipe of recipes) {
        const id = await getNextRecipeId();
        recipe.id = id;
        recipe.changedOn = new Date().toISOString();
        recipe.multiplier = 1;
        recipe.nutrition = new RecipeNutrition(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

        await saveRecipe(recipe);
        await saveRecipeMedia({ recipeId: id, type: "img", url: "/bread.jpg" })
    }
}

export async function saveRecipeMedia(recipeMedia: RecipeMedia) {
    await db.recipeMedia.put(recipeMedia);
}

export async function deleteRecipe(id: number) {
    const images = await db.recipeMedia.where("recipeId").equals(id).toArray();

    for (const item of images) {
        db.recipeMedia.delete(item.id || 0);
    }

    await db.recipes.update(id, { deletedOn: new Date().toISOString() });
}

export async function purgeDeletedRecords(retentionDays: number = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffIso = cutoff.toISOString();

    await db.recipes.filter(recipe => !!recipe.deletedOn && recipe.deletedOn < cutoffIso).delete();
    await db.categories.filter(category => !!category.deletedOn && category.deletedOn < cutoffIso).delete();
}

export async function deleteRecipeMedia(id: number) {
    await db.recipeMedia.delete(id);
}

export async function getNextRecipeId(): Promise<number> {
    const item = await db.recipes.orderBy("id").reverse().first();

    const result = item?.id ? item.id + 1 : 1;

    return result;
}

export async function saveSetting(name: string, value: string): Promise<void> {
    await db.settings.put({ name: name, value: value });
}

export async function getSetting(name: string, defaultValue: string): Promise<string> {
    const setting = await db.settings.get(name);
    const result = setting ? setting.value : defaultValue;

    return result;
}

export async function prepareBackup(): Promise<BackupModel> {
    const allRecipes = await db.recipes.filter(recipe => !recipe.deletedOn).toArray();
    const allMedia = await db.recipeMedia.toArray();
    const allCategories = await db.categories.filter(category => !category.deletedOn).toArray();

    const result = new BackupModel();
    for (const recipe of allRecipes) {
        const category = allCategories.find(item => item.id == recipe.categoryId);
        const model = getBackupModel(recipe, category, allMedia);

        result.recipes.push(model);
    }

    result.categories = allCategories;

    return result;
}

export async function prepareRecipeBackup(id: number): Promise<BackupModel> {
    const recipe = await db.recipes.get(id);
    const allMedia = await db.recipeMedia.where("recipeId").equals(id).toArray();
    const category = await db.categories.get(recipe?.categoryId || 0);

    const result = new BackupModel();

    if (!recipe) {
        return result;
    }

    const model = getBackupModel(recipe, category, allMedia);
    result.recipes.push(model);

    if (category) {
        result.categories.push(category);
    }

    return result;
}

function getBackupModel(recipe: Recipe, category: Category | undefined, allMedia: RecipeMedia[]): RecipeBackupModel {
    const model = new RecipeBackupModel();
    model.id = recipe.id;
    model.title = recipe.title;
    model.ingredients = recipe.ingredients;
    model.multiplier = recipe.multiplier;
    model.notes = recipe.notes;
    model.score = recipe.score;
    model.changedOn = recipe.changedOn;
    model.source = recipe.source;
    model.steps = recipe.steps;
    model.nutrition = recipe.nutrition;
    model.language = recipe.language;
    model.media = allMedia
        .filter(item => item.recipeId == model.id)
        .map(item => {
            return {
                type: item.type, url: item.url
            };
        });
    model.categoryId = recipe.categoryId;
    model.categoryUuid = category?.uuid;
    model.category = category?.name;
    model.tags = recipe.tags ?? [];
    model.uuid = recipe.uuid;
    model.deletedOn = recipe.deletedOn;

    return model;
}

export async function saveCategory(category: Category): Promise<number> {
    category.uuid = category.uuid || crypto.randomUUID();
    category.changedOn = new Date().toISOString();
    const result = await db.categories.put(category);
    return result;
}

export async function getCategories(): Promise<Array<Category>> {
    const categories = await db.categories.filter(category => !category.deletedOn).toArray();
    const result = [] as Array<Category>;
    for (const category of categories) {
        const resultItem = {
            id: category.id, name: category.name
        } as Category;

        const recipes = db.recipes.where("categoryId").equals(category.id).filter(recipe => !recipe.deletedOn);
        const count = await recipes.count();
        const recipe = await recipes.first();

        resultItem.recipeCount = count;

        if (category.image) {
            resultItem.image = category.image;
        } else if (recipe) {
            const media = await getRecipeMedia(recipe.id || 0);
            resultItem.image = media?.url;
        }

        if (recipe) {
            result.push(resultItem);
        }
    }
    const allRecipesCount = await db.recipes.filter(recipe => !recipe.deletedOn).count();
    const allCategoryFirst = await getSetting("AllCategoryFirst", "false");
    const allCategory = { id: 0, name: "All", image: undefined, recipeCount: allRecipesCount };
    
    if (allCategoryFirst === "true") {
        result.unshift(allCategory);
    } else {
        result.push(allCategory);
    }
    
    return result;
}

export async function getAllCategories(): Promise<Array<Category>> {
    return await db.categories.filter(category => !category.deletedOn).toArray();
}

export async function getCategoryById(id: number): Promise<Category> {
    const category = await db.categories.get(id);

    if (category == null || category.deletedOn) {
        throw new Error("Category not found");
    }

    return category;
}

export async function deleteCategory(id: number) {
    const now = new Date().toISOString();
    await db.categories.update(id, { deletedOn: now });

    await db.recipes.where("categoryId").equals(id).modify((recipe: Recipe) => {
        recipe.categoryId = 0;
        recipe.changedOn = now;
    });
}

export async function getAllRecipesForSync(): Promise<Recipe[]> {
    return await db.recipes.toArray();
}

export async function getAllCategoriesForSync(): Promise<Category[]> {
    return await db.categories.toArray();
}

// Builds the sync payload for a single recipe (including soft-delete tombstones - unlike
// prepareBackup() which is for the human-facing "Take Backup" download). Media is omitted for
// a deleted recipe - no point re-uploading photos for a tombstone.
export async function prepareRecipeSyncPayload(recipeId: number): Promise<RecipeBackupModel | null> {
    const recipe = await db.recipes.get(recipeId);

    if (!recipe) {
        return null;
    }

    const category = recipe.categoryId ? await db.categories.get(recipe.categoryId) : undefined;
    const allMedia = recipe.deletedOn ? [] : await db.recipeMedia.where("recipeId").equals(recipeId).toArray();

    return getBackupModel(recipe, category, allMedia);
}

// Builds the shared categories sync payload (all categories, including tombstones, plus
// device/export metadata) - recipes stay empty, they sync as individual files instead.
export async function prepareCategoriesSyncPayload(deviceId: string): Promise<BackupModel> {
    const result = new BackupModel();
    result.categories = await db.categories.toArray();
    result.deviceId = deviceId;
    result.exportedOn = new Date().toISOString();

    return result;
}

// Per-recipe cache of the last remote OneDrive etag seen for that recipe's sync file, so a
// sync can tell which files changed remotely without downloading every one of them.
export async function getRecipeSyncEtag(uuid: string): Promise<string | undefined> {
    const state = await db.recipeSyncState.get(uuid);
    return state?.remoteEtag;
}

export async function setRecipeSyncEtag(uuid: string, remoteEtag: string): Promise<void> {
    await db.recipeSyncState.put({ uuid, remoteEtag });
}

// Applies a category coming from a remote sync snapshot. `localId` should be the existing
// local numeric id when this uuid already exists on this device, or undefined for a brand
// new category so Dexie assigns a fresh local id.
export async function applySyncedCategory(category: Category, localId: number | undefined): Promise<number> {
    const toWrite = { ...category, id: localId } as Category;
    return await db.categories.put(toWrite);
}

// Applies a recipe (with its media) coming from a remote sync snapshot. `localId` mirrors
// applySyncedCategory. `localCategoryId` is the already-resolved local category id matching
// the recipe's categoryUuid (0 if unresolved/uncategorized).
export async function applySyncedRecipe(recipe: RecipeBackupModel, localId: number | undefined, localCategoryId: number): Promise<number> {
    const toWrite: Recipe = {
        id: localId,
        uuid: recipe.uuid,
        title: recipe.title,
        score: recipe.score,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        notes: recipe.notes,
        multiplier: recipe.multiplier,
        changedOn: recipe.changedOn,
        deletedOn: recipe.deletedOn,
        source: recipe.source,
        nutrition: recipe.nutrition,
        language: recipe.language,
        categoryId: localCategoryId,
        tags: recipe.tags ?? [],
    };

    const newId = await db.recipes.put(toWrite);

    await db.recipeMedia.where("recipeId").equals(newId).delete();
    for (const item of recipe.media ?? []) {
        await db.recipeMedia.add(new RecipeMedia(newId, item.type, item.url));
    }

    return newId;
}
