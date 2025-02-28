import { createNextAnimateFrameEvent, Destroyable, track } from "xbsj-base";
import { CzmPolygonGroundPrimitiveWithHeight } from "./CzmPolygonGroundPrimitiveWithHeight";
import { CzmPolygonWithHeight } from ".";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";

export class GroundInnerPolygon extends Destroyable {
    private _groundPolygonPrimitive;
    get groundPolygonPrimitive() { return this._groundPolygonPrimitive }

    constructor(sceneObject: CzmPolygonWithHeight, czmViewer: ESCesiumViewer) {
        super();
        this._groundPolygonPrimitive = this.disposeVar(new CzmPolygonGroundPrimitiveWithHeight(czmViewer, sceneObject.id));
        const groundPolygonPrimitive = this._groundPolygonPrimitive;
        {
            const update = () => {
                const polygonShow = (sceneObject.show);
                const fill = (sceneObject.fill);

                groundPolygonPrimitive.show = polygonShow && fill && sceneObject.visibleAlpha > 0;

                groundPolygonPrimitive.polygonHierarchy = groundPolygonPrimitive.show ? { positions: sceneObject.positions || [] } : { positions: [] };
                groundPolygonPrimitive.material = {
                    type: 'Color',
                    color: sceneObject.color || [1, 1, 1, 0.5],
                };
            };

            update();

            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.fillChanged,
                sceneObject.outlineChanged,
                sceneObject.outlineColorChanged,
                sceneObject.outlineWidthChanged,
                sceneObject.colorChanged,
                sceneObject.positionsChanged,
                sceneObject.depthChanged,
                sceneObject.visibleAlphaChanged,
            ));
            this.dispose(updateEvent.disposableOn(update));
        }
        this.dispose(track([groundPolygonPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
    }
}
