export function areaToHumanStr(d: number) {
    if (Math.abs(d) < 1000000) {
        return `${d.toFixed(2)} m²`;
    } else {
        return `${(d / 1000000).toFixed(2)} km²`;
    }
}
