export function humanFileSize(size: number, locale: Array<string> = []) {
    let i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1000));
    const value = (size / Math.pow(1000, i));
    const uom = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'][i];

    const sizeFormatter = new Intl.NumberFormat(locale, {
        style: 'unit', unit: uom, notation: "compact", unitDisplay: "narrow"
    });
    return sizeFormatter.format(value);
}