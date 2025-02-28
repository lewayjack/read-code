import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable, track } from "xbsj-base";
import { GeoClassificationPolygon } from "./GeoClassificationPolygon";
import { CzmClassificationPolygonPrimitive } from "./CzmClassificationPolygonPrimitive";

export class CzmClassificationPolygon extends Destroyable {
    private _czmClassificationPolygonPrimitive;

    constructor(sceneObject: GeoClassificationPolygon, czmViewer: ESCesiumViewer) {
        super();
        this._czmClassificationPolygonPrimitive = this.disposeVar(new CzmClassificationPolygonPrimitive(czmViewer, sceneObject.id));
        const czmClassificationPolygonPrimitive = this._czmClassificationPolygonPrimitive;

        {
            const update = () => {
                const polygonShow = (sceneObject.show);
                const fill = (sceneObject.fill);

                czmClassificationPolygonPrimitive.show = polygonShow && fill;

                if (sceneObject.positions && sceneObject.positions.length > 0) {
                    czmClassificationPolygonPrimitive.height = sceneObject.positions[0][2];
                } else {
                    czmClassificationPolygonPrimitive.height = undefined;
                }

                czmClassificationPolygonPrimitive.polygonHierarchy = czmClassificationPolygonPrimitive.show ? { positions: sceneObject.positions || [] } : { positions: [] };
                czmClassificationPolygonPrimitive.color = sceneObject.color;

                // if (depthEnabled) {
                if (sceneObject.depth === undefined) throw new Error('sceneObject.depth === undefined');
                czmClassificationPolygonPrimitive.extrudedHeight = (czmClassificationPolygonPrimitive.height ?? 0) + sceneObject.depth;
                // }

                czmClassificationPolygonPrimitive.classificationType = sceneObject.classificationType;
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
                sceneObject.classificationTypeChanged,
            ));
            this.dispose(updateEvent.disposableOn(update));
        }

        this.dispose(sceneObject.flyToEvent.disposableOn(duration => {
            czmClassificationPolygonPrimitive.flyTo(duration);
        }));
        this.dispose(track([czmClassificationPolygonPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
    }
}
