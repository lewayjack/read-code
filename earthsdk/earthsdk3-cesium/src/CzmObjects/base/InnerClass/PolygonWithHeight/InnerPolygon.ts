import { createNextAnimateFrameEvent, Destroyable, track } from "xbsj-base";
import { CzmPolygonWithHeight } from ".";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmPolygonPrimitiveWithHeight } from "./CzmPolygonPrimitiveWithHeight";

export class InnerPolygon extends Destroyable {
    private _czmInnerPolygonPrimitive;
    get czmInnerPolygonPrimitive() { return this._czmInnerPolygonPrimitive }

    constructor(sceneObject: CzmPolygonWithHeight, czmViewer: ESCesiumViewer, depthEnabled: boolean, ground: boolean) {
        super();
        this._czmInnerPolygonPrimitive = this.disposeVar(new CzmPolygonPrimitiveWithHeight(czmViewer, sceneObject.id));
        const czmInnerPolygonPrimitive = this._czmInnerPolygonPrimitive;

        {
            const update = () => {
                const polygonShow = (sceneObject.show);
                const fill = (sceneObject.fill);

                czmInnerPolygonPrimitive.show = polygonShow && fill && sceneObject.visibleAlpha > 0;

                if (sceneObject.positions && sceneObject.positions.length > 0 && !ground) {
                    czmInnerPolygonPrimitive.height = sceneObject.positions[0][2];
                } else {
                    czmInnerPolygonPrimitive.height = undefined;
                }

                czmInnerPolygonPrimitive.polygonHierarchy = czmInnerPolygonPrimitive.show ? { positions: sceneObject.positions || [] } : { positions: [] };
                czmInnerPolygonPrimitive.material = {
                    type: 'Color',
                    color: sceneObject.color || [1, 1, 1, 0.5],
                };

                if (depthEnabled) {
                    if (sceneObject.depth === undefined) throw new Error('sceneObject.depth === undefined');
                    czmInnerPolygonPrimitive.extrudedHeight = (czmInnerPolygonPrimitive.height ?? 0) + sceneObject.depth;
                }

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


        this.dispose(track([czmInnerPolygonPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
    }
}
