import * as Cesium from 'cesium';
import { NativePrimitive } from './NativePrimitive';
import { Destroyable } from 'xbsj-base';
import { CzmModelPrimitive } from '../../../../CzmObjects';

export class NativePrimitiveReady extends Destroyable {
    get owner() { return this._owner; }

    updateNodeMatrix(primitive: Cesium.Model) {
        const sceneObject = this.owner.owner.owner.owner;

        // @ts-ignore
        const nodeNames = primitive._nodesByName && Object.keys(primitive._nodesByName) as string[] | undefined;
        if (!nodeNames) return;

        for (const nodeName of nodeNames) {
            const node = primitive.getNode(nodeName);
            if (!node) {
                console.error(`!node ${nodeName}`);
                continue;
            }

            const transformation = sceneObject.nodeTransformations && sceneObject.nodeTransformations[nodeName];
            if (!transformation) {
                if (!Cesium.Matrix4.equals(node.matrix, node.originalMatrix)) {
                    // node.matrix = Cesium.Matrix4.clone(node.originalMatrix, node.matrix);
                    // @ts-ignore
                    node.matrix = undefined;
                }
                continue;
            }

            const {
                translationX, translationY, translationZ, rotationHeading, rotationPitch, rotationRoll, scaleX, scaleY, scaleZ,
            } = transformation;

            if (!Number.isFinite(translationX) ||
                !Number.isFinite(translationY) ||
                !Number.isFinite(translationZ) ||
                !Number.isFinite(rotationHeading) ||
                !Number.isFinite(rotationPitch) ||
                !Number.isFinite(rotationRoll) ||
                !Number.isFinite(scaleX) ||
                !Number.isFinite(scaleY) ||
                !Number.isFinite(scaleZ)) {
                console.error(`transformation数值有误！${JSON.stringify(transformation, undefined, '    ')}`, transformation);
                continue;
            }

            if (scaleX < 0 || scaleY < 0 || scaleZ < 0) {
                console.error(`scaleX < 0 || scaleY < 0 || scaleZ < 0`);
                continue;
            }

            const tr = Cesium.Math.toRadians;
            const trsMatrix = Cesium.Matrix4.fromTranslationQuaternionRotationScale(
                new Cesium.Cartesian3(translationX, translationY, translationZ),
                Cesium.Quaternion.fromHeadingPitchRoll(new Cesium.HeadingPitchRoll(tr(rotationHeading), tr(rotationPitch), tr(rotationRoll))),
                new Cesium.Cartesian3(scaleX, scaleY, scaleZ)
            );
            node.matrix = Cesium.Matrix4.multiply(node.originalMatrix, trsMatrix, node.matrix ?? new Cesium.Matrix4());
        }
    }

    constructor(private _owner: NativePrimitive) {
        super();
    }

    update() {
        const sceneObject = this.owner.owner.owner.owner;
        const { primitive } = this.owner;

        {
            primitive.activeAnimations.animateWhilePaused = sceneObject.activeAnimationsAnimateWhilePaused ?? CzmModelPrimitive.defaults.activeAnimationsAnimateWhilePaused;

            primitive.activeAnimations.removeAll();
            if (sceneObject.activeAnimations) {
                for (let e of sceneObject.activeAnimations) {
                    primitive.activeAnimations.add({
                        name: e.name,
                        index: e.index,
                        startTime: e.startTime,
                        delay: e.delay,
                        stopTime: e.stopTime,
                        removeOnStop: e.removeOnStop,
                        multiplier: e.multiplier,
                        reverse: e.reverse,
                        loop: e.loop,
                        animationTime: e.animationTime,
                    });
                }
            }
        }

        {
            this.updateNodeMatrix(primitive);
        }
    }
}
