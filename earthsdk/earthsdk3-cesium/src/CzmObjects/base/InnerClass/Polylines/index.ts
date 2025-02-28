import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, reactArray, ReactivePropsToNativePropsAndChanged, reactPositionsSet, SceneObjectKey, track } from "xbsj-base";
import { CzmPolylinesPrimitive } from "./CzmPolylinesPrimitive";
import { CzmPolylinesGroundPrimitive } from "./CzmPolylinesGroundPrimitive";
export * from './CzmPolylinesGroundPrimitive';
export * from './CzmPolylinesPrimitive';
export class CzmPolylines extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        // 初始化
        const czmPolylinesPrimitive = this.ad(new CzmPolylinesPrimitive(czmViewer, id));
        const czmPolylinesGroundPrimitive = this.ad(new CzmPolylinesGroundPrimitive(czmViewer, id));

        this.dispose(track([czmPolylinesPrimitive, 'allowPicking'], [this, 'allowPicking']));
        this.dispose(track([czmPolylinesGroundPrimitive, 'allowPicking'], [this, 'allowPicking']));
        {
            const createPolylines = () => {
                const polylinesGround = this.ground ?? false;
                const polylinesShow = this.show ?? true;
                czmPolylinesPrimitive.show = (polylinesShow && !polylinesGround);
                czmPolylinesGroundPrimitive.show = (polylinesShow && polylinesGround);

                czmPolylinesPrimitive.positions = czmPolylinesGroundPrimitive.positions = getPositions(this);
                czmPolylinesPrimitive.arcType = czmPolylinesGroundPrimitive.arcType = this.arcType as 'NONE' | 'GEODESIC' | 'RHUMB';
                czmPolylinesPrimitive.width = czmPolylinesGroundPrimitive.width = this.width ?? 1;
                czmPolylinesPrimitive.hasDash = czmPolylinesGroundPrimitive.hasDash = this.hasDash;
                czmPolylinesPrimitive.hasArrow = czmPolylinesGroundPrimitive.hasArrow = this.hasArrow;
                czmPolylinesPrimitive.color = czmPolylinesGroundPrimitive.color = this.color;
                czmPolylinesPrimitive.gapColor = czmPolylinesGroundPrimitive.gapColor = this.gapColor;
                czmPolylinesPrimitive.dashLength = czmPolylinesGroundPrimitive.dashLength = this.dashLength;
                czmPolylinesPrimitive.dashPattern = czmPolylinesGroundPrimitive.dashPattern = this.dashPattern;
                czmPolylinesPrimitive.depthTest = czmPolylinesGroundPrimitive.depthTest = this.depthTest ?? false;
                czmPolylinesPrimitive.allowPicking = czmPolylinesGroundPrimitive.allowPicking = this.allowPicking ?? false;
            }
            createPolylines()
            const createNextFrameEvent = this.disposeVar(createNextAnimateFrameEvent(
                this.showChanged,
                this.groundChanged,
                this.positionsChanged,
                this.arcTypeChanged,
                this.widthChanged,
                this.hasDashChanged,
                this.hasArrowChanged,
                this.colorChanged,
                this.gapColorChanged,
                this.dashLengthChanged,
                this.dashPatternChanged,
                this.depthTestChanged,
                this.allowPickingChanged,
            ));
            this.dispose(createNextFrameEvent.disposableOn(() => {
                createPolylines();
            }));
            this.dispose(this.flyToEvent.disposableOn(duration => {
                if (!this.ground) {
                    czmPolylinesPrimitive.flyTo(duration);
                } else {
                    czmPolylinesGroundPrimitive.flyTo(duration);
                }
            }));
        }
    }
}

export namespace CzmPolylines {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: false,
        positions: reactPositionsSet(undefined), // 必须是3的倍数！A Property specifying the array of Cartesian3 positions that define the line strip.
        width: 1, // undfined时为1.0，A numeric Property specifying the width in pixels.
        ground: false,
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
        hasDash: false,
        gapColor: reactArray<[number, number, number, number]>([0, 0, 0, 0]), // default [0, 0, 0, 0]
        dashLength: 16, // default 16
        dashPattern: 255, // default 255
        hasArrow: false,
        arcType: 'GEODESIC',
        depthTest: false,
        loop: false,
    });
}
extendClassProps(CzmPolylines.prototype, CzmPolylines.createDefaultProps);
export interface CzmPolylines extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolylines.createDefaultProps>> { }
function getPositions(sceneObject: CzmPolylines) {
    const loop = sceneObject.loop;
    if (loop && sceneObject.positions && sceneObject.positions.length > 0) {
        const tempPositions = [] as [number, number, number][][];
        sceneObject.positions.forEach(item => {
            tempPositions.push([...item, item[0]]);
        })
        return tempPositions;
    } else {
        return sceneObject.positions;
    }
}
