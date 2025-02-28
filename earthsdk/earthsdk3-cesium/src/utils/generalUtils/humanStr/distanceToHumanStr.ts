export function distanceToHumanStr(d: number) {
    if (Math.abs(d) < 1000) {
        return `${d.toFixed(2)} m`;
    } else {
        return `${(d / 1000).toFixed(2)} km`;
    }
}
