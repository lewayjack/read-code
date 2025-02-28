import { lbhToXyz, xyzToLbh } from 'earthsdk3';
import Spline from './lib/spline';

export function bezierSpline3D(positions: [number, number, number][], options: { resolution?: number; sharpness?: number }) {
    if (options === void 0) { options = {}; }
    // Optional params
    var resolution = options.resolution || 1000;
    var sharpness = options.sharpness || 0.85;
    const coords: [number, number, number][] = [];
    // var points = invariant_1.getGeom(line).coordinates.map(function (pt) {
    //     return { x: pt[0], y: pt[1], z: pt[2] };
    // });
    const points = positions.map(e => {
        const [x, y, z] = lbhToXyz(e);
        return { x, y, z };
    });

    var spline = new Spline({
        duration: resolution,
        points: points,
        sharpness: sharpness,
    });
    var pushCoord = function (time: number) {
        var pos = spline.pos(time);
        const lbh = xyzToLbh([pos.x, pos.y, pos.z]);
        coords.push(lbh);

        // if (Math.floor(time / 100) % 2 === 0) {
        //     const position = xyzToLbh([pos.x, pos.y, pos.z]);
        //     position && coords.push(position);
        //     // coords.push([pos.x, pos.y, pos.z]);
        // }
    };
    for (var i = 0; i < spline.duration; i += 10) {
        pushCoord(i);
    }
    pushCoord(spline.duration);
    // return helpers_1.lineString(coords, options.properties);
    return coords;
}
