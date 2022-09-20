export function getImpliedTimeFromString(input: string, timeIdentifierRegex: string | RegExp) {
    console.log("parsing " + input);
    console.log("regex " + timeIdentifierRegex);
    const regex = new RegExp(timeIdentifierRegex);
    const match = input.match(timeIdentifierRegex)

    console.log("match? " + match);

    if (!match || match?.length <= 0 || !match.groups)
        return 0;

    const minutes = parseInt(match.groups["Minutes"] ?? "0");
    const hours = parseInt(match.groups["Hours"] ?? "0");
    const days = parseInt(match.groups["Days"] ?? "0");

    console.log("minutes " + minutes);
    console.log("hours " + hours);
    console.log("days " + days);

    return (minutes * 60 * 1000)
        + (hours * 60 * 60 * 1000)
        + (days * 24 * 60 * 60 * 1000);
}