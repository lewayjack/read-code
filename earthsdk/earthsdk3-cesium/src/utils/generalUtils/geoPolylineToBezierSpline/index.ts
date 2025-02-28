import { bezierSpline3D } from './bezierSpline/czmBezierSpline';

export function geoPolylineToBezierSpline(positions: [number, number, number][], resolution?: number, sharpness?: number) {
    // properties	Object	{}	Translate properties to output
    // resolution	number	10000	time in milliseconds between points
    // sharpness	number	0.85	a measure of how curvy the path should be between splines
    // const line = lineString(positions, {
    //     // properties: { heights: positions.map(e => e[2]), },
    // });
    // const curved = bezierSpline(line, {
    //     resolution: resolution,
    //     sharpness: sharpness,
    // });
    // console.log(curved);
    // return curved.geometry.coordinates as [number, number, number][];

    return bezierSpline3D(positions, {
        resolution: resolution,
        sharpness: sharpness,
    });
}
