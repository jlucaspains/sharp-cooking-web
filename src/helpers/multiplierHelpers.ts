import Fraction from "fraction.js";

export function applyMultiplierToString(input: string, multiplier: number, regex: string, useFractionsOverDecimal: boolean): string {
    multiplier = multiplier > 0 ? multiplier : 1;

    if (multiplier == 1) {
        return input;
    }

    const regexp = new RegExp(regex);
    const match = input.match(regexp);

    if (!match || match?.length <= 0 || !match.groups) {
        return input;
    }

    const maybeFraction = new Fraction(match.groups["Quantity"]).mul(multiplier);

    const newValue = useFractionsOverDecimal ? maybeFraction.toFraction(true) : maybeFraction.valueOf().toLocaleString();

    return input.replace(regexp, newValue);
}