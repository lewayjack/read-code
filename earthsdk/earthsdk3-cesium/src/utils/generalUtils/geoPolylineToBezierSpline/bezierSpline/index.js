"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
var spline_1 = __importDefault(require("./lib/spline"));
/**
 * Takes a {@link LineString|line} and returns a curved version
 * by applying a [Bezier spline](http://en.wikipedia.org/wiki/B%C3%A9zier_spline)
 * algorithm.
 *
 * The bezier spline implementation is by [Leszek Rybicki](http://leszek.rybicki.cc/).
 *
 * @name bezierSpline
 * @param {Feature<LineString>} line input LineString
 * @param {Object} [options={}] Optional parameters
 * @param {Object} [options.properties={}] Translate properties to output
 * @param {number} [options.resolution=10000] time in milliseconds between points
 * @param {number} [options.sharpness=0.85] a measure of how curvy the path should be between splines
 * @returns {Feature<LineString>} curved line
 * @example
 * var line = turf.lineString([
 *   [-76.091308, 18.427501],
 *   [-76.695556, 18.729501],
 *   [-76.552734, 19.40443],
 *   [-74.61914, 19.134789],
 *   [-73.652343, 20.07657],
 *   [-73.157958, 20.210656]
 * ]);
 *
 * var curved = turf.bezierSpline(line);
 *
 * //addToMap
 * var addToMap = [line, curved]
 * curved.properties = { stroke: '#0F0' };
 */
function bezier(line, options) {
    if (options === void 0) { options = {}; }
    // Optional params
    var resolution = options.resolution || 10000;
    var sharpness = options.sharpness || 0.85;
    var coords = [];
    var points = invariant_1.getGeom(line).coordinates.map(function (pt) {
        return { x: pt[0], y: pt[1], z: pt[2] };
    });
    var spline = new spline_1.default({
        duration: resolution,
        points: points,
        sharpness: sharpness,
    });
    var pushCoord = function (time) {
        var pos = spline.pos(time);
        if (Math.floor(time / 100) % 2 === 0) {
            coords.push([pos.x, pos.y, pos.z]);
        }
    };
    for (var i = 0; i < spline.duration; i += 10) {
        pushCoord(i);
    }
    pushCoord(spline.duration);
    return helpers_1.lineString(coords, options.properties);
}
exports.default = bezier;
