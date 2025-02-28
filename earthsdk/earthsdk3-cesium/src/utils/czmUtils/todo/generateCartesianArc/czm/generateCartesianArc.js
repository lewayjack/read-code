// import ArcType from "./ArcType.js";
// import arrayRemoveDuplicates from "./arrayRemoveDuplicates.js";
// import BoundingSphere from "./BoundingSphere.js";
// import Cartesian3 from "./Cartesian3.js";
// import Color from "./Color.js";
// import ComponentDatatype from "./ComponentDatatype.js";
// import defaultValue from "./defaultValue.js";
// import defined from "./defined.js";
// import DeveloperError from "./DeveloperError.js";
// import Ellipsoid from "./Ellipsoid.js";
// import Geometry from "./Geometry.js";
// import GeometryAttribute from "./GeometryAttribute.js";
// import GeometryAttributes from "./GeometryAttributes.js";
// import GeometryType from "./GeometryType.js";
// import IndexDatatype from "./IndexDatatype.js";
// import CesiumMath from "./Math.js";
// import PolylinePipeline from "./PolylinePipeline.js";
// import PrimitiveType from "./PrimitiveType.js";
// import VertexFormat from "./VertexFormat.js";

import * as Cesium from 'cesium';

const ArcType = Cesium.ArcType;
// const arrayRemoveDuplicates = Cesium.arrayRemoveDuplicates;
const BoundingSphere = Cesium.BoundingSphere;
const Cartesian3 = Cesium.Cartesian3;
const Color = Cesium.Color;
const ComponentDatatype = Cesium.ComponentDatatype;
const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;
const DeveloperError = Cesium.DeveloperError;
const Ellipsoid = Cesium.Ellipsoid;
const Geometry = Cesium.Geometry;
const GeometryAttribute = Cesium.GeometryAttribute;
const GeometryAttributes = Cesium.GeometryAttributes;
// const GeometryType = Cesium.GeometryType;
const IndexDatatype = Cesium.IndexDatatype;
const CesiumMath = Cesium.Math;
// const PolylinePipeline = Cesium.PolylinePipeline;
const PrimitiveType = Cesium.PrimitiveType;
const VertexFormat = Cesium.VertexFormat;

import arrayRemoveDuplicates from './arrayRemoveDuplicates';
import PolylinePipeline from './PolylinePipeline';

/**
 * A description of a polyline modeled as a line strip; the first two positions define a line segment,
 * and each additional position defines a line segment from the previous position. The polyline is capable of
 * displaying with a material.
 *
 * @alias PolylineGeometry
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Cartesian3[]} options.positions An array of {@link Cartesian3} defining the positions in the polyline as a line strip.
 * @param {Number} [options.width=1.0] The width in pixels.
 * @param {Color[]} [options.colors] An Array of {@link Color} defining the per vertex or per segment colors.
 * @param {Boolean} [options.colorsPerVertex=false] A boolean that determines whether the colors will be flat across each segment of the line or interpolated across the vertices.
 * @param {ArcType} [options.arcType=ArcType.GEODESIC] The type of line the polyline segments must follow.
 * @param {Number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] The distance, in radians, between each latitude and longitude if options.arcType is not ArcType.NONE. Determines the number of positions in the buffer.
 * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] The vertex attributes to be computed.
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid to be used as a reference.
 *
 * @exception {DeveloperError} At least two positions are required.
 * @exception {DeveloperError} width must be greater than or equal to one.
 * @exception {DeveloperError} colors has an invalid length.
 *
 * @see PolylineGeometry#createGeometry
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Polyline.html|Cesium Sandcastle Polyline Demo}
 *
 * @example
 * // A polyline with two connected line segments
 * const polyline = new Cesium.PolylineGeometry({
 *   positions : Cesium.Cartesian3.fromDegreesArray([
 *     0.0, 0.0,
 *     5.0, 0.0,
 *     5.0, 5.0
 *   ]),
 *   width : 10.0
 * });
 * const geometry = Cesium.PolylineGeometry.createGeometry(polyline);
 */

/**
 * Computes the geometric representation of a polyline, including its vertices, indices, and a bounding sphere.
 *
 * @param {PolylineGeometry} polylineGeometry A description of the polyline.
 * @returns {Geometry|undefined} The computed vertices and indices.
 */
export function generateCartesianArc(polylineGeometry) {
  const arcType = polylineGeometry.arcType;
  const granularity = polylineGeometry.granularity;
  const ellipsoid = polylineGeometry.ellipsoid;

  const removedIndices = [];
  let positions = arrayRemoveDuplicates(
    polylineGeometry.positions,
    Cartesian3.equalsEpsilon,
    false,
    removedIndices
  );

  let positionsLength = positions.length;

  // A width of a pixel or less is not a valid geometry, but in order to support external data
  // that may have errors we treat this as an empty geometry.
  if (positionsLength < 2) {
    return undefined;
  }

  if (arcType === ArcType.GEODESIC || arcType === ArcType.RHUMB) {
    let subdivisionSize;
    let numberOfPointsFunction;
    if (arcType === ArcType.GEODESIC) {
      subdivisionSize = CesiumMath.chordLength(
        granularity,
        ellipsoid.maximumRadius
      );
      numberOfPointsFunction = PolylinePipeline.numberOfPoints;
    } else {
      subdivisionSize = granularity;
      numberOfPointsFunction = PolylinePipeline.numberOfPointsRhumbLine;
    }

    const heights = PolylinePipeline.extractHeights(positions, ellipsoid);

    if (arcType === ArcType.GEODESIC) {
      positions = PolylinePipeline.generateCartesianArc({
        positions: positions,
        minDistance: subdivisionSize,
        ellipsoid: ellipsoid,
        height: heights,
      });
    } else {
      positions = PolylinePipeline.generateCartesianRhumbArc({
        positions: positions,
        granularity: subdivisionSize,
        ellipsoid: ellipsoid,
        height: heights,
      });
    }
  }

  return positions;
};

