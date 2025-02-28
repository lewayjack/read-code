import * as Cesium from 'cesium';

const scratchBS = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 0); // 0.5 -> 0 这样距离计算才准确，然后修复坐标架太近时自动缩小的问题

/**
 * 指定一个position，获取一个1米宽的实际物体需要放大多少倍，才能覆盖pixelSize大小的屏幕。
 * 返回值要么大于0，要么为undefeind，只有这两种情况！
 * 如果返回值为undefined，表示计算结果有问题，不能使用！
 * @param scene 
 * @param position 
 * @param pixelSize 
 * @returns 
 */
export function getSceneScaleForScreenPixelSize(scene: Cesium.Scene, position: Cesium.Cartesian3, pixelSize: number) {
    var bs = scratchBS;
    Cesium.Cartesian3.clone(position, bs.center);
    const ps = scene.camera.getPixelSize(bs, scene.drawingBufferWidth, scene.drawingBufferHeight);

    if (ps <= 0) { // 修复Plane.transform内部normalized异常，原因是ps有时会是0，可能是不在视域范围内，会计算成0
        return undefined;
    }

    const scale = pixelSize * ps; // 屏幕上始终保持300像素的尺寸

    if (Number.isFinite(scale) && scale > 0) {
        return scale;
    } else {
        return undefined;
    }
}
