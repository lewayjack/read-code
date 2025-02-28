import { GeoBoundingSphereType, getGeoBoundingSphereFromPositions } from "earthsdk3";
import { getReactFuncs, react, ReactParamsType } from "xbsj-base";

export function createGeoBoudingSphereReactFromPositions(positionsReact: ReactParamsType<[number, number, number][] | undefined>) {
    const [gf, sf, changed] = getReactFuncs<[number, number, number][] | undefined>(positionsReact);

    const geoBoudingSphereReact = react<GeoBoundingSphereType | undefined>(undefined);

    const update = () => {
        let bs: GeoBoundingSphereType | undefined;
        const positions = gf();
        do {
            if (!positions) break;
            const bs2 = getGeoBoundingSphereFromPositions(positions);
            if (!bs2) break;
            bs = bs2;
        } while (false);
        geoBoudingSphereReact.value = bs;
    };
    update();
    geoBoudingSphereReact.dispose(changed.disposableOn(update));

    return geoBoudingSphereReact;
}
