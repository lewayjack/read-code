import { bind, createNextAnimateFrameEvent, Destroyable, track } from "xbsj-base";
import { CzmPolygonWithHeight } from ".";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmPolylines } from "../../../../CzmObjects";

export class AroundPolyline extends Destroyable {
    constructor(sceneObject: CzmPolygonWithHeight, czmViewer: ESCesiumViewer) {
        super();

        const aroundPolyline = this.disposeVar(new CzmPolylines(czmViewer,sceneObject.id));
        aroundPolyline.arcType = 'GEODESIC';

        this.dispose(track([aroundPolyline, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([aroundPolyline, 'depthTest'], [sceneObject, 'depthTest']));

        {
            const update = () => {
                if (sceneObject.depth === undefined) throw new Error('sceneObject.depth === undefined');

                const polygonShow = (sceneObject.show);
                const polygonOutline = sceneObject.outline;

                aroundPolyline.show = polygonShow && polygonOutline && sceneObject.visibleAlpha > 0;
                aroundPolyline.color = sceneObject.outlineColor;
                aroundPolyline.width = sceneObject.outlineWidth;

                let positions: [number, number, number][] | undefined;
                if (aroundPolyline.show && sceneObject.positions && sceneObject.positions.length > 1) {
                    const h = sceneObject.positions[0][2];
                    positions = sceneObject.positions.map(e => [e[0], e[1], h]);
                }

                let height: number | undefined;
                if (sceneObject.positions && sceneObject.positions.length > 0) {
                    height = sceneObject.positions[0][2];
                } else {
                    height = undefined;
                }

                if (aroundPolyline.show && positions) {
                    const h = height;
                    const eh = (height ?? 0) + sceneObject.depth;
                    aroundPolyline.positions = positions.map(e => [[e[0], e[1], h], [e[0], e[1], eh]]) as [number, number, number][][];
                } else {
                    aroundPolyline.positions = undefined;
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
