export function rectangleIsGlobal(rectangle: [number, number, number, number]) {
    if (Math.abs(rectangle[0]) == 180 && Math.abs(rectangle[1]) == 90 && Math.abs(rectangle[2]) == 180 && Math.abs(rectangle[3]) == 90) {
        return true;
    }
    return false;
}