import { bind, createNextAnimateFrameEvent, Destroyable, track } from "xbsj-base";
import { CzmPolygonWithHeight } from ".";
import { CzmPolyline } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";

export class TopPolyline extends Destroyable {
    constructor(sceneObject: CzmPolygonWithHeight, czmViewer: ESCesiumViewer) {
        super();

        const topPolyline = this.disposeVar(new CzmPolyline(czmViewer, sceneObject.id));
        topPolyline.arcType = 'GEODESIC';
        topPolyline.loop = true;

        this.dispose(track([topPolyline, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([topPolyline, 'depthTest'], [sceneObject, 'depthTest']));

        {
            const update = () => {
                if (sceneObject.depth === undefined) throw new Error('sceneObject.depth === undefined');

                const polygonShow = (sceneObject.show);
                const polygonOutline = sceneObject.outline;

                topPolyline.show = polygonShow && polygonOutline && sceneObject.visibleAlpha > 0;
                topPolyline.color = sceneObject.outlineColor;
                topPolyline.width = sceneObject.outlineWidth;

                let positions: [number, number, number][] | undefined;
                if (topPolyline.show && sceneObject.positions && sceneObject.positions.length > 1) {
                    const h = sceneObject.positions[0][2];
                    positions = sceneObject.positions.map(e => [e[0], e[1], h]);
                }

                let height: number | undefined;
                if (sceneObject.positions && sceneObject.positions.length > 0) {
                    height = sceneObject.positions[0][2];
                } else {
                    height = undefined;
                }

                if (topPolyline.show && positions) {
                    const eh = (height ?? 0) + sceneObject.depth;
                    topPolyline.positions = positions.map(e => [e[0], e[1], eh]);
                } else {
                    topPolyline.positions = undefined;
                }
            };
            update();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.outlineChanged,
                sceneObject.outlineColorChanged,
                sceneObject.outlineWidthChanged,
                sceneObject.colorChanged,
                sceneObject.positionsChanged,
                sceneObject.visibleAlphaChanged,
            ));
            this.dispose(updateEvent.disposableOn(update));
        }
    }
}
