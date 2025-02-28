import * as Cesium from 'cesium';

// const scratchCartesian2 = new Cesium.Cartesian2();
// const scratchCartesian3 = new Cesium.Cartesian3();
const scratchCartesian4 = new Cesium.Cartesian4();
const scratchMatrix4 = new Cesium.Matrix4();

// /**
//  * 获取三维坐标的屏幕位置
//  * @param viewer Cesium.Viewer
//  * @param cartesian 空间直角坐标系下的位置点
//  * @returns [left, top, right, bottom]
//  */
// export function getWinPos(viewer: Cesium.Viewer, cartesian: Cesium.Cartesian3, result?: [number, number, number, number]) {
//     const scene = viewer.scene;
//     const winPos = scene.cartesianToCanvasCoordinates(cartesian, scratchCartesian2);
//     if (winPos) {
//         const h = viewer.canvas.clientHeight;
//         const w = viewer.canvas.clientWidth;
//         const { x, y } = winPos;
//         if (x >= 0 && x < w && y >= 0 && y < h) {
//             // 修复devicePixelRatio变化时，winPos对不上的问题
//             // this._winPos.splice(0, 2, winCart.x, scene.drawingBufferHeight - winCart.y);
//             result = result || [0, 0, 0, 0];
//             result[0] = x;
//             result[1] = y;
//             result[2] = w - x;
//             result[3] = h - y;
//             return result; 
//         }
//     }

//     // [left top right bottom]
//     return undefined;
// }

export type WinPosAndDepth = { left: number, top: number, right: number, bottom: number, depth: number };

export function getDefaultWinPosAndDepth() {
    return { left: 0, top: 0, right: 0, bottom: 0, depth: 0 };
}

export function winPosAndDepthEqual(a: WinPosAndDepth, b: WinPosAndDepth) {
    return a.left === b.left && a.right === b.right && a.bottom === b.bottom && a.top === b.top && a.depth === b.depth;
}

/**
 * 获取三维坐标的屏幕位置
 * @param viewer Cesium.Viewer
 * @param cartesian 空间直角坐标系下的位置点
 * @returns [left, top, right, bottom]
 */
export function getWinPos(viewer: Cesium.Viewer, cartesian: Cesium.Cartesian3, result?: WinPosAndDepth) {
    if (viewer.scene.mode !== Cesium.SceneMode.SCENE3D) {
        return undefined;
    }

    const h = viewer.canvas.clientHeight;
    const w = viewer.canvas.clientWidth;
    const viewMatrix = viewer.camera.viewMatrix;
    const projectMatrix = viewer.camera.frustum.projectionMatrix;
    const vp = Cesium.Matrix4.multiply(projectMatrix, viewMatrix, scratchMatrix4);
    const c4 = Cesium.Matrix4.multiplyByVector(vp, Cesium.Cartesian4.fromElements(cartesian.x, cartesian.y, cartesian.z, 1., scratchCartesian4), scratchCartesian4);
    c4.x /= c4.w;
    c4.y /= c4.w;
    c4.z /= c4.w;
    c4.w = 1.0;

    const left = w * (c4.x * 0.5 + 0.5);
    const bottom = h * (c4.y * 0.5 + 0.5);

    const right = w - left;
    const top = h - bottom;

    const depth = c4.z;

    if (left < 0 || bottom < 0 || right < 0 || top < 0 || depth < 0 || depth > 1) {
        return undefined;
    }


    if (result) {
        result.left = left;
        result.top = top;
        result.right = right;
        result.bottom = bottom;
        result.depth = depth;
    } else {
        result = { left, top, right, bottom, depth };
    }

    return result;
}