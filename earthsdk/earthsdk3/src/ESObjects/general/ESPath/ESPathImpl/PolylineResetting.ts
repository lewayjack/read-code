import { Destroyable } from "xbsj-base";
import { ESPathImpl } from ".";
// TODO(vtxf): PolylineResetting目前存在一个问题，show为false时，就不对postions赋值，这样会导致flyTo不起作用
export class PolylineResetting extends Destroyable {
    constructor(geoPath: ESPathImpl) {
        super();

        // this.dispose(() => {
        //     geoPath.geoPolyline.positions = [];
        // });

        // if (geoPath.leadTime === 0 && geoPath.trailTime === 0) {
        //     geoPath.geoPolyline.positions = geoPath.timePosRots && geoPath.timePosRots.map(e => e[1]);
        //     return;
        // }

        // const updatePolylinePositions = () => {
        //     const trailTime = geoPath.trailTime ?? 0;
        //     const leadTime = geoPath.leadTime ?? Number.MAX_VALUE;
        //     const result = geoPath.subPath((geoPath.currentTime ?? 0) - trailTime, (geoPath.currentTime ?? 0) + leadTime);
        //     if (result) {
        //         geoPath.geoPolyline.positions = result.map(e => e[1]);
        //     }
        // };
        // updatePolylinePositions();
        // this.dispose(geoPath.currentTimeChanged.disposableOn(updatePolylinePositions));
    }
}
