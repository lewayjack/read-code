/**
 * 0到1转为0到255
 * @param rgba 
 * @return [r,g,b,a]
 */
export function toRgbaString(rgba: [number, number, number, number]) {
    return `rgba(${rgba[0] * 255},${rgba[1] * 255},${rgba[2] * 255},${rgba[3]})`;
}