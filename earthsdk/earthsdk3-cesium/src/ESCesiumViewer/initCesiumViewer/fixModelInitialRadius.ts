import * as Cesium from 'cesium';

// 问题，在XE2中设置像素大小以后，实际上相当于给Model的scale设置了比较大的值
// 当某些原因，比如修改了ImageBaseLighting以后，会调用buildDrawCommands来重新计算initialRadius
// 而此时因为scale比较大，从而modelMatrix含有缩放，Cesium计算initialRadius时有受到modelmatrix影响
// 从而导致initialRadius变得很大，导致计算boundingSphere不对，
// 后续执行飞行时偏差会很大

// ModelSceneGraph.prototype.buildDrawCommands这个函数写法有问题
// v105.2版本上，发现该函数计算initialRadius时会乘上modelMatrix
// 而在后续使用该变量时，会再次乘上modelMatrix，所以Cesium的写法很可能是有问题的
// 这里修正一下，同时还要保证boundingSphere不要有问题


export function fixModelInitialRadius() {
    // @ts-ignore
    const originFunc = Cesium.ModelSceneGraph.prototype.buildDrawCommands;

    // @ts-ignore
    Cesium.ModelSceneGraph.prototype.buildDrawCommands = function (...params: any[]) {
        const model = this._model;
        const originModelMatrix = model.modelMatrix;
        model.modelMatrix = Cesium.Matrix4.IDENTITY;
        const result = originFunc.call(this, ...params);
        model.modelMatrix = originModelMatrix;
        // boundingSphere调用一次，内部会执行updateBoundingSphere，从而重新计算boundingSphere
        // model.boundingSphere;
        return result;
    }
}
