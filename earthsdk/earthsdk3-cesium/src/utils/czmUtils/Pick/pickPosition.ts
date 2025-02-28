import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { getDomEventCurrentTargetPos } from "xbsj-base";
import { fromCartographic, toCartesian } from "../czmConverts";
import { pickVirtualEarth } from "./pickVirtualEarth";


export async function pickPosition(czmViewer: ESCesiumViewer, pointerEvent: PointerEvent, virtualHeight: number | undefined, result?: [number, number, number]) {
    const scene = czmViewer.viewer?.scene;
    if (!scene) throw new Error(`!scene`);

    const screenPosition = getDomEventCurrentTargetPos(pointerEvent);
    const screenPositionCartesian = toCartesian(screenPosition);

    if (virtualHeight === undefined) {
        const result = czmViewer.quickPickPosition(screenPosition);
        if (!result) return undefined;
        return await result;
    } else {
        const cartographic = pickVirtualEarth(scene, screenPositionCartesian, virtualHeight);
        if (!cartographic) return undefined;
        return fromCartographic(cartographic);
    }
}
