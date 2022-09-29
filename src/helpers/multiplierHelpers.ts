export function applyMultiplierToString(input: string, multiplier: number, useFractionsOverDecimal: boolean, regex: string | RegExp): string {
    multiplier = multiplier > 0 ? multiplier : 1;

    const regexp = new RegExp(regex);
    const match = input.match(regex);

    if (!match || match?.length <= 0 || !match.groups) {
        return input;
    }

    const newValue = applyMultiplier(match.groups["CompositeFraction"],
        match.groups["Fraction"], match.groups["Regular"], multiplier, useFractionsOverDecimal);

    return input.replace(regexp, newValue);
}

function applyMultiplier(compositeFractionGroup: string, fractionGroup: string, regularGroup: string, multiplier: number, useFractionsOverDecimal: boolean): string {
    let originalFraction = "";
    let parsedMatch = 0;

    if (compositeFractionGroup) {
        originalFraction = compositeFractionGroup;
        const parts = compositeFractionGroup.split(' ');
        const first = parts[0];
        const second = parts[1];

        const fractionParts = second.split('/');

        const firstNumber = parseFloat(first);
        const fracNumerator = parseFloat(fractionParts[0]);
        const fracDecimal = parseFloat(fractionParts[1]);

        if (fracNumerator === 0 || fracDecimal === 0 || firstNumber === 0)
            return first;

        parsedMatch = firstNumber + (fracNumerator / fracDecimal);
    } else if (fractionGroup) {
        originalFraction = fractionGroup;

        const parts = fractionGroup.split('/');
        const fracNumerator = parseFloat(parts[0]);
        const fracDecimal = parseFloat(parts[1]);

        if (fracNumerator === 0 || fracDecimal === 0)
            return "0";

        parsedMatch = fracNumerator / fracDecimal;
    } else {
        parsedMatch = parseFloat(regularGroup);

        if (parsedMatch === 0)
            return "0";
    }

    const newIngredientValue = parsedMatch * multiplier;

    if (!useFractionsOverDecimal)
        return newIngredientValue.toString();

    // HACK: we don't want to convert a fraction to number and back if it is not necessary
    if (multiplier == 1 && originalFraction)
        return originalFraction;

    const whole = Math.floor(newIngredientValue);

    if (whole === newIngredientValue) {
        return newIngredientValue.toString();
    }

    const { numerator, denominator } = getFraction(newIngredientValue - whole);
    return whole == 0 ? `${numerator}/${denominator}` : `${whole} ${numerator}/${denominator}`;
}

function getFraction(value: number): { numerator: number, denominator: number } {
    return { numerator: value, denominator: value };
}
