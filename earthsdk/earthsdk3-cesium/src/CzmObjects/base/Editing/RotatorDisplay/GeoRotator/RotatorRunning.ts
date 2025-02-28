import * as Cesium from 'cesium';
import { HasOwner, Listener, ObjResetting } from 'xbsj-base';
import { GeoRotator } from '.';
import { Rotating } from './Rotating';
import { RotatorStartInfoType } from './RotatorStartInfoType';
import { RotatorPlaneType } from './RotatorPlaneType';
import { getSceneScaleForScreenPixelSize } from '../../../../../utils';

export class RotatorRunning extends HasOwner<GeoRotator> {
    private _rotatingResetting = this.disposeVar(new ObjResetting<Rotating, Listener<[startInfo: RotatorStartInfoType | undefined]>>((startInfo) => {
        if (startInfo === undefined) return undefined;
        return new Rotating(this, startInfo);
    }, false));
    get rotatingResetting() { return this._rotatingResetting; }

    constructor(owner: GeoRotator) {
        super(owner);
        const { czmViewer } = this.owner;

        let lastStartInfo = undefined as RotatorStartInfoType | undefined;

        // this.dispose(czmViewer.interaction.keyDownEvent.disposableOn(keyboardEvent => {
        //     // 如果是ESC键，那么enabled设置成false
        //     if (keyboardEvent.key !== 'Escape') return;
        //     this.owner.sceneObject.enabled = false;
        // }));

        this.dispose(czmViewer.dblclickEvent.disposableOn(pointerEvent => {
            do {
                const startInfo = this.getStartInfo(pointerEvent.pointerEvent as PointerEvent);
                if (!startInfo) break;
                if (startInfo.currentPlaneType === 'none') break;
                const { currentPlaneType } = startInfo;
                const rotation = [...this.owner.selfRotation] as [number, number, number];
                rotation[GeoRotator.rotationNum[currentPlaneType]] = 0;
                this.owner.selfRotation = rotation;
                return;
            } while (false);

            this.owner.enabled = false;
        }));

        this.dispose(czmViewer.pointerDownEvent.disposableOn(pointerEvent => {
            if (!lastStartInfo) return;
            if (lastStartInfo.currentPlaneType === 'none') return;
            this.rotatingResetting.reset(lastStartInfo);
            lastStartInfo = undefined;
        }));

        this.dispose(() => this.owner.hoveredPlaneType = 'none');

        this.dispose(czmViewer.pointerMoveEvent.disposableOn(pointerEvent => {
            const startInfo = this.getStartInfo(pointerEvent.pointerEvent as PointerEvent);
            lastStartInfo = startInfo;

            if (!startInfo) return;

            if (this._rotatingResetting.obj) return;
            this.owner.hoveredPlaneType = startInfo.currentPlaneType;
        }));

        this.dispose(czmViewer.pointerUpEvent.disposableOn(pointerEvent => {
            if (!this.rotatingResetting.obj) return;
            this.rotatingResetting.reset(undefined);
        }));
    }

    pickPlane(
        startInfo: RotatorStartInfoType,
        scene: Cesium.Scene,
        type: Exclude<RotatorPlaneType, 'none'>,
        windowPos: [number, number],
        sceneScale: number,
    ) {
        const rotatorCartesian = this.owner.cartesian;
        if (!rotatorCartesian) return;

        const { selfRotation } = this.owner;

        // 先拾取headingPlane
        const v = this.owner.getPlane(type).pick(windowPos);
        if (!v) return;
        const d = Cesium.Cartesian3.distance(rotatorCartesian, v);

        const baseDistance = sceneScale / 4;
        const halfRange = baseDistance * 3 / 128;
        const inRange = d >= baseDistance - halfRange && d <= baseDistance + halfRange;
        if (!inRange) return;
        const d2c = Cesium.Cartesian3.distance(scene.camera.positionWC, v);
        if (startInfo.currentD2c <= d2c) return;
        startInfo.currentPlaneType = type;
        startInfo.currentD2c = d2c;
        startInfo.currentV = v;
        startInfo.startRotation = selfRotation[GeoRotator.rotationNum[type]];
    };

    getStartInfo(pointerEvent: PointerEvent) {
        const { czmViewer } = this.owner;
        const scene = czmViewer.viewer?.scene as Cesium.Scene;

        if (!this.owner.position) return;

        if (!this.owner.cartesian) return;
        const sceneScale = getSceneScaleForScreenPixelSize(scene, this.owner.cartesian, this.owner.pixelSize);
        if (!sceneScale) return;

        const { offsetX, offsetY } = pointerEvent;
        const windowPos = [offsetX, offsetY] as [number, number];
        const pointerId = pointerEvent.pointerId;
        const startInfo: RotatorStartInfoType = {
            currentPlaneType: 'none',
            currentD2c: Number.POSITIVE_INFINITY,
            currentV: undefined,
            startRotation: 0,
            pointerId,
        };

        this.pickPlane(startInfo, scene, 'heading', windowPos, sceneScale);
        this.pickPlane(startInfo, scene, 'pitch', windowPos, sceneScale);
        this.pickPlane(startInfo, scene, 'roll', windowPos, sceneScale);

        return startInfo;
    }
}
