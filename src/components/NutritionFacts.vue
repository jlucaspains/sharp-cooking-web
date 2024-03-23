<script setup lang="ts">
import { ref, computed } from "vue";
import { useTranslation } from "i18next-vue";

const { t } = useTranslation();

interface Dictionary<T> {
  [Key: string]: T;
}

const props = defineProps<{
  nutrition: Dictionary<number>,
  servingPerContainer: number,
  itemName: string
}>();

const ingredientStatement = ref("");
const serving = ref(1);
const settings = {
  width: "300px", useFdaRounding: true
};

const calories = computed(() => {
  let n = 'calories';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const totalFat = computed(() => {
  let n = 'totalFat';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const saturatedFat = computed(() => {
  let n = 'saturatedFat';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const transFat = computed(() => {
  let n = 'transFat';

  return {
    value: unitValue(n),
  };
});

const polyunsaturatedFat = computed(() => {
  let n = 'polyunsaturatedFat';

  return {
    value: unitValue(n),
  };
});

const monounsaturatedFat = computed(() => {
  let n = 'monounsaturatedFat';

  return {
    value: unitValue(n),
  };
});

const unsaturatedFat = computed(() => {
  let n = 'monounsaturatedFat';

  return {
    value: unitValue(n),
  };
});

const cholesterol = computed(() => {
  let n = 'cholesterol';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const sodium = computed(() => {
  let n = 'sodium';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const carbohydrates = computed(() => {
  let n = 'carbohydrates';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const fiber = computed(() => {
  let n = 'fiber';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const sugar = computed(() => {
  let n = 'sugar';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const addedSugar = computed(() => {
  let n = 'addedSugar';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const protein = computed(() => {
  let n = 'protein';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const vitaminA = computed(() => {
  let n = 'vitaminA';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const vitaminC = computed(() => {
  let n = 'vitaminC';

  return {
    value: unitValue(n),
    dv: percentDailyValue(n),
  };
});

const vitaminD = computed(() => {
  let n = 'vitaminD';

  return {
    value: unitValue(n) as number,
    dv: percentDailyValue(n),
  };
});

const calcium = computed(() => {
  let n = 'calcium';

  return {
    value: unitValue(n) as number,
    dv: percentDailyValue(n),
  };
});

const iron = computed(() => {
  let n = 'iron';

  return {
    value: unitValue(n) as number,
    dv: percentDailyValue(n),
  };
});

const potassium = computed(() => {
  let n = 'potassium';

  return {
    value: unitValue(n) as number,
    dv: percentDailyValue(n),
  };
});

const rdiValues: Dictionary<number> = {
  "totalFat": 78,
  "saturatedFat": 20,
  "cholesterol": 300,
  "sodium": 2300,
  "carbohydrates": 275,
  "fiber": 28,
  "addedSugar": 50,
  "protein": 50,
  "vitaminD": 20,
  "calcium": 1300,
  "iron": 18,
  "potassium": 4700,
  "vitaminA": 5000,
  "vitaminC": 60,
  "kilojoules": 8400,
  "calories": 2000,
  "sugar": 100
};

function percentDailyValue(nutrient: string) {
  let rawValue = props.nutrition[nutrient];
  let rdi = 0;
  rdi = rdiValues[nutrient];

  let dv = rawValue / rdi * 100;

  switch (nutrient) {
    case 'cholesterol':
      if (unitValue(nutrient) === '< 5') {
        dv = 0;
      } else {
        dv = roundToSpecificDecimalPlace(unitValue(nutrient) as number / rdi * 100, 0);
      }

      break;

    case 'sodium':
      dv = roundToSpecificDecimalPlace(dv, 0);
      break;

    case 'carbohydrates':
    case 'fiber':
    case 'sugar':
    case 'addedSugar':
    case 'protein':
      if (unitValue(nutrient) === '< 1') {
        dv = 0;
      } else {
        dv = roundToSpecificDecimalPlace(unitValue(nutrient) as number / rdi * 100, 0);
      }

      break;

    case 'vitaminA':
    case 'vitaminC':
    case 'vitaminD':
    case 'potassium':
    case 'calcium':
    case 'iron':
      dv = multiplier(rawValue) / rdi * 100;

      // <1% express as 0
      if (dv < 1) {
        dv = 0;
      }

      // =1%-2% express as 2%
      if (dv >= 1 && dv <= 2) {
        dv = 2;
      }

      // <=10% round to nearest 2%
      if (dv <= 10) {
        dv = roundToNearestNum(dv, 2);
      }

      // >10%-50% round to nearest 5%
      if (dv > 10 && dv <= 50) {
        dv = roundToNearestNum(dv, 5);
      }

      // >50% round to nearest 10%
      if (dv > 50) {
        dv = roundToNearestNum(dv, 10);
      }

      break;

    default:
      dv = roundToSpecificDecimalPlace(unitValue(nutrient) as number / rdi * 100, 0);
  }

  return dv;
}

function unitValue(nutrient: string): number | string {
  let nutrientValue = props.nutrition[nutrient];

  switch (nutrient) {
    case 'calories':
      return roundCalories(multiplier(nutrientValue));

    // Fats
    case 'totalFat':
    case 'transFat':
    case 'monounsaturatedFat':
    case 'polyunsaturatedFat':
    case 'saturatedFat':
      return roundFats(multiplier(nutrientValue));

    case 'sodium':
      return roundSodium(multiplier(nutrientValue));

    case 'cholesterol':
      return roundCholesterol(multiplier(nutrientValue));

    case 'potassium':
    case 'calcium':
      return roundCalciumPotassium(multiplier(nutrientValue));

    // Vitamins and Minerals
    case 'vitaminA':
    case 'vitaminC':
      return roundVitaminsMinerals(multiplier(nutrientValue));

    case 'vitaminD':
    case 'iron':
      return roundVitaminDIron(multiplier(nutrientValue));

    // Essentials
    case 'carbohydrates':
    case 'fiber':
    case 'sugar':
    case 'addedSugar':
    case 'protein':
      return roundEssentials(multiplier(nutrientValue));
  }

  return 0;
}

function multiplier(value: number) {
  return byServing(value);
}

function byServing(value: number) {
  return value * serving.value;
}

function byWeight(value: number) {
  return serving.value * (value / serving.value);
}

function roundCalories(value: number) {
  if (!settings.useFdaRounding) {
    return roundToSpecificDecimalPlace(value, 0);
  }

  if (value < 5) {
    return 0;
  } else if (value <= 50) {
    // 50 cal - express to nearest 5 cal increment
    return roundToNearestNum(value, 5);
  }
  // > 50 cal - express to nearest 10 cal increment
  return roundToNearestNum(value, 10);
}

function roundFats(value: number) {
  if (!settings.useFdaRounding) {
    return roundToSpecificDecimalPlace(value, 0);
  }

  if (value < 0.5) {
    return 0;
  } else if (value < 5) {
    // < 5 g - express to nearest .5g increment
    return roundToNearestNum(value, 0.5);
  }
  // >= 5 g - express to nearest 1 g increment
  return roundToNearestNum(value, 1);
}

function roundCholesterol(value: number) {
  if (!settings.useFdaRounding) {
    return roundToSpecificDecimalPlace(value, 0);
  }

  if (value < 2) {
    return 0;
  } else if (value <= 5) {
    return '< 5';
  }
  // > 5 mg - express to nearest 5 mg increment
  return roundToNearestNum(value, 5);
}

function roundSodium(value: number) {
  if (!settings.useFdaRounding) {
    return roundToSpecificDecimalPlace(value, 0);
  }

  if (value < 5) {
    return 0;
  } else if (value <= 140) {
    // 5 - 140 mg - express to nearest 5 mg increment
    return roundToNearestNum(value, 5);
  }
  // >= 5 g - express to nearest 10 g increment
  return roundToNearestNum(value, 10);
}

function roundPotassium(value: number) {
  if (!settings.useFdaRounding) {
    return roundToSpecificDecimalPlace(value, 0);
  }

  if (value < 5) {
    return 0;
  } else if (value <= 140) {
    // 5 - 140 mg - express to nearest 5 mg increment
    return roundToNearestNum(value, 5);
  } else {
    // >= 5 g - express to nearest 10 g increment
    return roundToNearestNum(value, 10);
  }
}

// Total Carb, Fiber, Sugar, Sugar Alcohol and Protein
function roundEssentials(value: number) {
  if (!settings.useFdaRounding) {
    return roundToSpecificDecimalPlace(value, 0);
  }

  if (value < 0.5) {
    return 0;
  } else if (value < 1) {
    // < 1 g - express as "Contains less than 1g" or "less than 1g"
    return '< 1';
  }
  // > 1 mg - express to nearest 1 g increment
  return roundToNearestNum(value, 1);
}

// Vitaminins and Minerals
function roundVitaminsMinerals(value: number) {
  if (!settings.useFdaRounding) {
    return roundToSpecificDecimalPlace(value, 1);
  }

  if (value > 0) {
    if (value < 10) {
      // < 10 - round to nearest even number
      return roundToNearestNum(value, 2);
    } else if (value < 50) {
      // between 10 and 50, round to the nearest 5 increment
      return roundToNearestNum(value, 5);
    }
    // else, round to the nearest 10 increment
    return roundToNearestNum(value, 10);
  }
  return 0;
};

// 2018 Rounding rule for Vitamin D and Iron
function roundVitaminDIron(value: number) {
  if (!settings.useFdaRounding) {
    return roundToSpecificDecimalPlace(value, 1);
  }
  // round to the nearest 0.1 increment
  return roundToNearestNum(value, 0.1);
};

// 2018 Rounding rule for Calcium and Potassium
function roundCalciumPotassium(value: number) {
  if (!settings.useFdaRounding) {
    return roundToSpecificDecimalPlace(value, 1);
  }

  // round to the nearest 10 increment
  return roundToNearestNum(value, 10);
};

function roundToNearestNum(value: number, nearest: number) {
  if (!settings.useFdaRounding) {
    return roundToSpecificDecimalPlace(value, 0);
  }

  return nearest < 0 ? Math.round(value * nearest) / nearest : Math.round(value / nearest) * nearest;
};

function roundToSpecificDecimalPlace(value: number, decimals: number) {
  return Number(Math.round(Number(value.toString() + 'e' + decimals.toString())) + 'e-' + decimals);
}
</script>

<template>
  <div itemtype="http://schema.org/NutritionInformation" style="background:white; color:black;" class="nf"
    :class="{ us: true }" :style="{ width: settings.width }">
    <div class="nf-title">{{ t('pages.recipe.id.nutrition.title') }}
    </div>
    <div class="nf-line">
      <div class="nf-serving">
        <div class="nf-serving-per-container" v-if="servingPerContainer > 0">
          {{ servingPerContainer }} <span>{{ t('pages.recipe.id.nutrition.servingsPerRecipe') }}</span>
        </div>
        <div class="nf-item-name read-only">
          <span class="text-serving-size">{{ t('pages.recipe.id.nutrition.servingSize') }}
          </span>
          <span class="text-serving-item">
            {{ serving + ' ' + (props.itemName ? props.itemName : "") }}
          </span>
        </div>
      </div>
    </div>
    <div class="nf-bar2"></div>
    <div class="nf-amount-per-serving">{{ t('pages.recipe.id.nutrition.amountPerServing') }}</div>
    <div class="nf-calories" v-if="calories.value">
      <span>{{ t('pages.recipe.id.nutrition.calories') }}</span>
      <span class="nf-pr" itemprop="calories">{{ calories.value }}</span>
    </div>
    <div class="nf-bar1"></div>
    <div class="nf-line nf-text-right">
      <span class="nf-highlight nf-percent-dv">% <span>{{ t('pages.recipe.id.nutrition.dailyValue') }}</span>*</span>
    </div>
    <div class="nf-line" v-if="totalFat.value">
      <span class="nf-highlight nf-pr" aria-hidden="true">{{ totalFat.dv }}%</span>
      <span class="nf-highlight">{{ t('pages.recipe.id.nutrition.totalFat') }} </span>
      <span itemprop="fatContent">
        {{ totalFat.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.gramsAcronym') }}</span><span
          class="sr-only">{{ t('pages.recipe.id.nutrition.grams') }}</span>
      </span>
    </div>
    <div class="nf-line nf-indent" v-if="saturatedFat.value">
      <span class="nf-highlight nf-pr" aria-hidden="true">{{ saturatedFat.dv }}%</span>
      <span>{{ t('pages.recipe.id.nutrition.saturatedFat') }} </span>
      <span itemprop="saturatedFatContent">
        {{ saturatedFat.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.gramsAcronym') }}</span><span
          class="sr-only">{{ t('pages.recipe.id.nutrition.grams') }}</span>
      </span>
    </div>
    <div class="nf-line nf-indent" v-if="transFat.value">
      <span><em>{{ t('pages.recipe.id.nutrition.trans') }}</em> {{ t('pages.recipe.id.nutrition.fat') }} </span>
      <span itemprop="transFatContent">
        {{ transFat.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.gramsAcronym') }}</span><span
          class="sr-only">{{ t('pages.recipe.id.nutrition.grams') }}</span>
      </span>
    </div>
    <div class="nf-line nf-indent" v-if="unsaturatedFat.value">
      <span>{{ t('pages.recipe.id.nutrition.unsaturatedFat') }}</span>
      <span itemprop="unsaturatedFatContent">
        {{ unsaturatedFat.value }}<span aria-hidden="true">g</span><span class="sr-only">{{
      t('pages.recipe.id.nutrition.grams') }}</span>
      </span>
    </div>
    <div class="nf-line nf-indent" v-if="polyunsaturatedFat.value">
      <span>Polyunsaturated Fat </span>
      <span itemprop="unsaturatedFatContent">
        {{ polyunsaturatedFat.value }}<span aria-hidden="true">g</span><span class="sr-only"> grams</span>
      </span>
    </div>
    <div class="nf-line nf-indent" v-if="monounsaturatedFat.value">
      <span>Monounsaturated Fat </span>
      <span itemprop="unsaturatedFatContent">
        {{ monounsaturatedFat.value }}<span aria-hidden="true">g</span><span class="sr-only"> grams</span>
      </span>
    </div>
    <div class="nf-line" v-if="cholesterol.value">
      <span class="nf-highlight nf-pr" aria-hidden="true">{{ cholesterol.dv }}%</span>
      <span class="nf-highlight">{{ t('pages.recipe.id.nutrition.cholesterol') }} </span>
      <span itemprop="cholesterolContent">
        {{ cholesterol.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.miligramsAcronym')
          }}</span><span class="sr-only">{{ t('pages.recipe.id.nutrition.miligrams') }}</span>
      </span>
    </div>
    <div class="nf-line" v-if="sodium.value">
      <span class="nf-highlight nf-pr" aria-hidden="true">{{ sodium.dv }}%</span>
      <span class="nf-highlight">{{ t('pages.recipe.id.nutrition.sodium') }} </span>
      <span itemprop="sodiumContent">
        {{ sodium.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.miligramsAcronym') }}</span><span
          class="sr-only">{{ t('pages.recipe.id.nutrition.miligrams') }}</span>
      </span>
    </div>
    <div class="nf-line" v-if="carbohydrates.value">
      <span class="nf-highlight nf-pr" aria-hidden="true">{{ carbohydrates.dv
        }}%</span>
      <span class="nf-highlight">{{ t('pages.recipe.id.nutrition.totalCarbohydrates') }} </span>
      <span itemprop="carbohydrateContent">
        {{ carbohydrates.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.gramsAcronym') }}</span><span
          class="sr-only">{{ t('pages.recipe.id.nutrition.grams') }}</span>
      </span>
    </div>
    <div class="nf-line nf-indent" v-if="fiber.value">
      <span class="nf-highlight nf-pr" aria-hidden="true">{{ fiber.dv }}%</span>
      <span>{{ t('pages.recipe.id.nutrition.dietaryFiber') }} </span>
      <span itemprop="fiberContent">
        {{ fiber.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.gramsAcronym') }}</span><span
          class="sr-only">{{ t('pages.recipe.id.nutrition.grams') }}</span>
      </span>
    </div>
    <div class="nf-line nf-indent" v-if="sugar.value">
      <span class="nf-highlight nf-pr" aria-hidden="true">{{ sugar.dv }}%</span>
      <span>{{ t('pages.recipe.id.nutrition.sugars') }} </span>
      <span itemprop="sugarContent">
        {{ sugar.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.gramsAcronym') }}</span><span
          class="sr-only">{{ t('pages.recipe.id.nutrition.grams') }}</span>
      </span>
    </div>
    <div class="nf-line nf-indent2" v-if="addedSugar.value">
      <span class="nf-highlight nf-pr" aria-hidden="true">{{ addedSugar.dv }}%</span>
      <span>
        <span>{{ t('pages.recipe.id.nutrition.includes') }} </span>
        <span itemprop="">{{ addedSugar.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.gramsAcronym')
            }}</span><span class="sr-only">{{ t('pages.recipe.id.nutrition.grams') }}</span>
        </span>
        <span> {{ t('pages.recipe.id.nutrition.addedSugars') }}</span>
      </span>
    </div>
    <div class="nf-line" v-if="protein.value">
      <span class="nf-highlight">{{ t('pages.recipe.id.nutrition.protein') }} </span>
      <span itemprop="proteinContent">
        {{ protein.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.gramsAcronym') }}</span><span
          class="sr-only">{{ t('pages.recipe.id.nutrition.grams') }}</span>
      </span>
    </div>
    <div class="nf-bar2"></div>
    <div class="nf-vitamins">
      <div class="nf-vitamins">
        <div class="nf-vitamin-column" v-if="vitaminA.value">
          <span>Vitamin A</span> {{ vitaminA.value }}<span aria-hidden="true">IU</span>
          <span class="sr-only"> International Unit</span>
          <span class="nf-pr" aria-hidden="true">{{ vitaminA.dv }}%</span>
        </div>
        <div class="nf-vitamin-column" v-if="vitaminC.value">
          <span>Vitamin C</span> {{ vitaminC.value }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.miligramsAcronym') }}</span>
          <span class="sr-only">{{ t('pages.recipe.id.nutrition.miligrams') }}</span>
          <span class="nf-pr" aria-hidden="true">{{ vitaminC.dv }}%</span>
        </div>
        <div class="nf-vitamin-column" v-if="vitaminD.value">
          <span>Vitamin D</span> {{ roundToSpecificDecimalPlace(vitaminD.value, 1) }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.microgramAcronym') }}</span>
          <span class="sr-only">{{ t('pages.recipe.id.nutrition.micrograms') }}</span>
          <span class="nf-pr" aria-hidden="true">{{ vitaminD.dv }}%</span>
        </div>
        <div class="nf-vitamin-column" v-if="calcium.value">
          <span>Calcium</span> {{ roundToSpecificDecimalPlace(calcium.value, 1) }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.miligramsAcronym') }}</span>
          <span class="sr-only">{{ t('pages.recipe.id.nutrition.miligrams') }}</span>
          <span class="nf-pr" aria-hidden="true">{{ calcium.dv }}%</span>
        </div>
        <div class="nf-vitamin-column" v-if="iron.value">
          <span>Iron</span> {{ roundToSpecificDecimalPlace(iron.value, 1) }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.miligramsAcronym') }}</span>
          <span class="sr-only">{{ t('pages.recipe.id.nutrition.miligrams') }}</span>
          <span class="nf-pr" aria-hidden="true">{{ iron.dv }}%</span>
        </div>
        <div class="nf-vitamin-column" v-if="potassium.value">
          <span>Potassium</span> {{ roundToSpecificDecimalPlace(potassium.value, 1)
          }}<span aria-hidden="true">{{ t('pages.recipe.id.nutrition.miligramsAcronym') }}</span>
          <span class="sr-only">{{ t('pages.recipe.id.nutrition.miligrams') }}</span>
          <span class="nf-pr" aria-hidden="true">{{ potassium.dv }}%</span>
        </div>
      </div>
    </div>
    <div class="nf-bar2"></div>
    <div class="nf-footnote">
      <span>
        {{ t('pages.recipe.id.nutrition.footNote') }}
      </span>
      <div class="nf-ingredient-statement" v-if="ingredientStatement">
        <strong>{{ t('pages.recipe.id.nutrition.ingredient') }}</strong>
        <div v-html="ingredientStatement"></div>
      </div>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css?family=Archivo+Black');

.nf {
  border: 1px solid #000;
  padding: 6px;
  box-sizing: border-box;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  line-height: 14px;
  text-align: left;

  &-title,
  &-serving-unit-qty,
  &-highlight,
  &-serving,
  &-amount-per-serving,
  &-calories {
    font-family: 'Archivo Black', sans-serif;
  }

  &-title {
    font-size: 2.15em;
    line-height: 1.15em;
    margin-top: -6px;
  }

  &-serving-per-container {
    font-family: Arial, Helvetica, sans-serif;
    margin-bottom: 2px;
  }

  &-serving {
    font-size: 1.2em;
    line-height: normal;
    padding: 2px 0;
    clear: both;
    overflow: auto;
  }

  &-serving-size {
    margin-left: 105px;
    text-align: right;
  }

  &-amount-per-serving {
    font-size: .94em;
  }

  &-arrow-up,
  &-arrow-down {
    width: 0;
    height: 0;
    border-style: solid;
  }

  &-arrows {
    float: left;
    padding: 6px 5px 0 0;
  }

  &-arrow-up {
    cursor: pointer;
    margin-bottom: 4px;
    border-width: 0 5px 6px 5px;
    border-color: transparent transparent #333 transparent;
  }

  &-arrow-down {
    cursor: pointer;
    margin-top: 4px;
    border-width: 6px 5px 0 5px;
    border-color: #333 transparent transparent transparent;
  }

  &-modifier-field {
    width: 30px;
    text-align: center;
    line-height: normal;
    border: 1px solid #666;
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 1em;
    float: left;
    padding: 2px 0;
    margin-top: 3px;
  }

  &-item-name {
    display: table;
    margin-left: 42px;
    min-height: 25px;

    &.read-only {
      margin-left: 0;
      width: 100%;
      min-height: 0;

      .text-serving-size {
        float: left;
      }

      .text-serving-item {
        float: right;
        max-width: 160px;
        text-align: right;
      }
    }

    >div {
      display: table-cell;
      vertical-align: middle;
      min-height: 24px;
    }
  }

  &-serving-unit-qty {
    display: inline-block;
  }

  &-calories {
    font-size: 2em;
    line-height: 1em;
  }

  &-percent-dv {
    font-size: .84em;
  }

  &-vitamin-column {
    font-size: .94em;
    padding: 1px 0;
    border-bottom: 1px solid #000;
  }

  &-ingredient-statement,
  &-disclaimer {
    padding-top: 8px;
  }

  &-footnote {
    padding-top: 4px;
    margin-left: 5px;
    font-size: .85em;
    line-height: 1em;
  }

  &-footnote:before {
    content: "*";
    float: left;
    margin-left: -5px;
  }

  &-text-right {
    text-align: right;
  }

  &-line {
    border-top: 1px solid #000;
    padding-top: 1px;
    padding-bottom: 1px;
    font-size: .94em;
  }

  &-indent2 {
    margin-left: 28px;
  }

  &-indent {
    padding-left: 16px;
  }

  &-pr {
    float: right;
  }

  &-bar1 {
    height: 5px;
  }

  &-bar2 {
    height: 10px;
  }

  &-bar1,
  &-bar2 {
    background-color: #000;
  }

  &.uk .nf-title {
    font-family: Arial, Helvetica, sans-serif;
    font-weight: bold;
    padding-top: 8px;
    padding-bottom: 6px;
  }

  &.uk .nf-modifier-field {
    width: 20px;
    padding: 3px;
    text-align: center;
    float: none;
    margin-top: 0;
    margin-right: 3px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    border-top: 4px solid #000;

    tr th,
    tbody tr td {
      border-bottom: 1px solid #000;
      padding-top: 4px;
      padding-bottom: 4px;
    }

    tfoot tr td {
      padding-top: 4px;
      font-size: 90%;
    }
  }
}

.clear {

  &:before,
  &:after {
    content: " ";
    display: table;
  }

  &:after {
    clear: both;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  border: 0;
}

.pull-right {
  float: right;
}
</style>