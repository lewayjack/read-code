export function angleToHumanStr(angle: number, noSeconds = false) {
    const sign = angle < 0 ? '-' : '';
    const absAngle = Math.abs(angle);
    const d = absAngle | 0;
    const ld = (absAngle - d) * 60;
    if (noSeconds) {
        return `${sign}${d}°${ld.toFixed(3)}′`;
    }
    const m = ld | 0;
    const lm = (ld - m) * 60;
    const s = lm.toFixed(3);
    return `${sign}${d}°${m}′${s}″`;
}
