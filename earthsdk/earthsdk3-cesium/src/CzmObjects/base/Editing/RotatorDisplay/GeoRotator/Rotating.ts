import * as Cesium from 'cesium';
import { RotatorStartInfoType } from './RotatorStartInfoType';
import { GeoRotator } from '.';
import { RotatorRunning } from './RotatorRunning';
import { RotatorPlaneType } from './RotatorPlaneType';
import { HasOwner } from 'xbsj-base';

function computeAngle(startDir: Cesium.Cartesian3, stopDir: Cesium.Cartesian3, normalDir: Cesium.Cartesian3) {
    const testNormalDir = Cesium.Cartesian3.cross(stopDir, startDir, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(testNormalDir, testNormalDir);
    const dot = Cesium.Cartesian3.dot(testNormalDir, normalDir);
    let angle = Math.acos(Cesium.Cartesian3.dot(startDir, stopDir)) * 180 / Math.PI;
    angle = dot > 0 ? angle : -angle; // 弧度
    return angle;
}

export class Rotating extends HasOwner<RotatorRunning> {
    get startInfo() { return this._startInfo; }
    get planeType() { return this.startInfo.currentPlaneType as Exclude<RotatorPlaneType, 'none'>; }
    get czmGeoRotator() { return this.owner.owner; }
    get plane() { return this.czmGeoRotator.getPlane(this.planeType); }
    get circle() { return this.czmGeoRotator.circles[this.planeType].circle; }

    constructor(owner: RotatorRunning, private _startInfo: RotatorStartInfoType) {
        super(owner);
        console.log('Rotating creating...')

        const { startInfo } = this;
        const { czmViewer } = this.owner.owner;

        // console.log(`incrementDisabledInputStack`);
        // czmViewer.incrementDisabledInputStack();
        // this.dispose(() => {
        //     // console.log(`decrementDisabledInputStack`);
        //     czmViewer.decrementDisabledInputStack();
        // });
        czmViewer.incrementDisabledInputStack();
        this.dispose(() => czmViewer.decrementDisabledInputStack());

        this.dispose(czmViewer.pointerMoveEvent.disposableOn(pointerEvent => {
            // if (startInfo.pointerId !== pointerEvent.pointerId) return;
            if (startInfo) {
                this.move(pointerEvent.pointerEvent as PointerEvent, startInfo);
            }
        }));

        this.owner.owner.movingPlaneType = startInfo.currentPlaneType;
        this.dispose(() => this.owner.owner.movingPlaneType = 'none');

        this.dispose(() => {
            this.circle.circleStartRotation = 0;
            this.circle.circleEndRotation = 0;
        });
    }

    move(pointerEvent: PointerEvent, startInfo: RotatorStartInfoType) {
        const { offsetX, offsetY } = pointerEvent;
        const windowPos = [offsetX, offsetY] as [number, number];

        const { currentPlaneType } = startInfo;
        if (currentPlaneType === 'none') return;

        const plane = this.czmGeoRotator.getPlane(currentPlaneType);
        if (!startInfo.currentV) return;
        const v = plane.pick(windowPos);
        if (!v) return;
        if (!this.czmGeoRotator.cartesian) return;
        const startDir = Cesium.Cartesian3.subtract(startInfo.currentV, this.czmGeoRotator.cartesian, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(startDir, startDir);
        const stopDir = Cesium.Cartesian3.subtract(v, this.czmGeoRotator.cartesian, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(stopDir, stopDir);
        if (!plane.normal || !plane.origin) return;
        const angle = computeAngle(startDir, stopDir, plane.normal);
        const startAngle = computeAngle(plane.origin, startDir, plane.normal);
        const stopAngle = computeAngle(plane.origin, stopDir, plane.normal);
        {
            const r = [...this.czmGeoRotator.selfRotation] as [number, number, number];
            r[GeoRotator.rotationNum[currentPlaneType]] = startInfo.startRotation + angle;
            this.czmGeoRotator.selfRotation = r;
            this.circle.circleStartRotation = startAngle;
            this.circle.circleEndRotation = stopAngle;
        }
    }
}
