import { bind, getReactFuncs, ReactParamsType } from "xbsj-base";

/**
 * 把朝北的坐标架转成朝东的
 * @param northRotationReact 
 * @param eastRotationReact 
 * @returns 
 */
export function bindNorthRotation(
    northRotationReact: ReactParamsType<[number, number, number] | undefined>,
    eastRotationReact: ReactParamsType<[number, number, number] | undefined>,
) {
    const [getValue] = getReactFuncs<[number, number, number] | undefined>(eastRotationReact);
    return bind(northRotationReact, eastRotationReact, (b: [number, number, number] | undefined) => {
        const [h, p, r] = b ?? [0, 0, 0];
        return [h + 90, p, r] as [number, number, number] | undefined;
    }, (a: [number, number, number] | undefined) => {
        const [h, p, r] = a ?? [0, 0, 0];
        if (!getValue() && h === -90 && p === 0 && r === 0) {
            return undefined;
        }
        return [h - 90, p, r] as [number, number, number] | undefined;
    });
}