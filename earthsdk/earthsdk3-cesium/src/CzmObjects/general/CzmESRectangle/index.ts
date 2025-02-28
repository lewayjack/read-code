import { ESRectangle } from "earthsdk3";
import { CzmESVisualObject, CzmRectangle } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { CzmMaterialJsonType } from "../../../ESJTypesCzm";
import { flyWithPositions } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";

export class CzmESRectangle extends CzmESVisualObject<ESRectangle> {
    static readonly type = this.register("ESCesiumViewer", ESRectangle.type, this);
    private _czmESRectangle;
    get czmESRectangle() { return this._czmESRectangle; }

    constructor(sceneObject: ESRectangle, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmESRectangle = this.disposeVar(new CzmRectangle(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmESRectangle = this._czmESRectangle;
        this.dispose(track([czmESRectangle, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmESRectangle, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(track([czmESRectangle, 'ground'], [sceneObject, 'fillGround']));
        this.dispose(track([czmESRectangle, 'strokeGround'], [sceneObject, 'strokeGround']));
        this.dispose(track([czmESRectangle, 'outlineTranslucent'], [sceneObject, 'outlineTranslucent']));
        this.dispose(track([czmESRectangle, 'height'], [sceneObject, 'height']));
        this.dispose(track([czmESRectangle, 'extrudedHeight'], [sceneObject, 'extrudedHeight']));
        this.dispose(bind([czmESRectangle, 'rectangle'], [sceneObject, 'rectangle']));
        this.dispose(bind([czmESRectangle, 'stRotation'], [sceneObject, 'stRotation']));
        this.dispose(bind([czmESRectangle, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(bind([czmESRectangle, 'editing'], [sceneObject, 'editing']));
        this.dispose(bind([czmESRectangle, 'pointEditing'], [sceneObject, 'pointEditing']));


        this.dispose(track([czmESRectangle, 'outline'], [sceneObject, 'stroked']));
        this.dispose(track([czmESRectangle, 'outlineColor'], [sceneObject, 'strokeColor']));

        {
            const updateProp = () => {
                if (sceneObject.filled) {
                    czmESRectangle.material = { type: 'Color', color: sceneObject.fillColor } as CzmMaterialJsonType;
                } else {
                    czmESRectangle.material = { type: 'Color', color: [1, 1, 1, 0] } as CzmMaterialJsonType

                }
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.fillStyleChanged,
                sceneObject.filledChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmESRectangle } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmESRectangle.rectangle) {
                const position = [
                    [czmESRectangle.rectangle[0], czmESRectangle.rectangle[1], czmESRectangle.height],
                    [czmESRectangle.rectangle[2], czmESRectangle.rectangle[3], czmESRectangle.height],
                    [czmESRectangle.rectangle[0], czmESRectangle.rectangle[1], czmESRectangle.extrudedHeight],
                    [czmESRectangle.rectangle[2], czmESRectangle.rectangle[3], czmESRectangle.extrudedHeight],
                ] as [number, number, number][]
                flyWithPositions(czmViewer, sceneObject, id, position, duration);
                return true
            }
            return false
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmESRectangle } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (czmESRectangle.rectangle) {
                const position = [
                    [czmESRectangle.rectangle[0], czmESRectangle.rectangle[1], czmESRectangle.height],
                    [czmESRectangle.rectangle[2], czmESRectangle.rectangle[3], czmESRectangle.height],
                    [czmESRectangle.rectangle[0], czmESRectangle.rectangle[1], czmESRectangle.extrudedHeight],
                    [czmESRectangle.rectangle[2], czmESRectangle.rectangle[3], czmESRectangle.extrudedHeight],
                ] as [number, number, number][]
                flyWithPositions(czmViewer, sceneObject, id, position, duration);
                return true
            }
            return false
        }
    }
}
