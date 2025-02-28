import XbsjPolylineGeometry from './XbsjPolylineGeometry';
import * as Cesium from 'cesium';
// import { getTypeParameterOwner } from 'typescript';

var ellipsoidGeodesic;
function getEllipsoidGeodesic() {
    if (typeof ellipsoidGeodesic === 'undefined') {
        ellipsoidGeodesic = new Cesium.EllipsoidGeodesic();
    }

    return ellipsoidGeodesic;
}

function heightFunction(ratio, distance) {
    var hr = distance / 30000000;
    hr = Math.min(1.0, hr);
    hr = 1.0 - Math.pow(1.0 - hr, 2.0);
    return Math.sin(Math.PI * ratio) * 1000000 * hr;
}

function createTransmitPolyline(startPosition, endPosition, minDistance, heightRatio = 1.0) {
    var ellipsoidGeodesic = getEllipsoidGeodesic();

    var rawPositions = Cesium.Cartesian3.fromDegreesArray([startPosition[0], startPosition[1], endPosition[0], endPosition[1]]);

    var heights = [0, 0];
    if (startPosition.length >= 3 && endPosition.length >= 3) {
        heights = [startPosition[2], endPosition[2]];
    }

    var positions = Cesium.PolylinePipeline.generateCartesianArc({
        positions: rawPositions,
        height: heights,
        minDistance,
    });

    var start = Cesium.Cartographic.fromDegrees(startPosition[0], startPosition[1]);
    var end = Cesium.Cartographic.fromDegrees(endPosition[0], endPosition[1]);
    ellipsoidGeodesic.setEndPoints(start, end);

    var distance = ellipsoidGeodesic.surfaceDistance;

    var length = positions.length;
    positions.forEach(function (position, index) {
        // 确保0-1之间
        // var ratio = index / length; 
        var ratio = index / (length - 1);
        var h = heightFunction(ratio, distance * heightRatio);
        var cart = Cesium.Cartographic.fromCartesian(position);
        cart.height += h;
        Cesium.Cartesian3.fromRadians(cart.longitude, cart.latitude, cart.height, Cesium.Ellipsoid.WGS84, positions[index]);
    });

    return positions;
}

//TODO: 暂时注释，因为似乎没用到
// Cesium.xbsjCreateTransmitPolyline = createTransmitPolyline;

function createODLineApperance(color = [0.8, 0.8, 0.0, 1.0], brightening = true, depthTest = true, getTextureFunc) {
    var polylineAppearance;
    const fabric = getTextureFunc ? {
        type: 'Image',
        uniforms: {
            color: new Cesium.Color(...color),
            // image,
        }
    } : {
        type: 'Color',
        uniforms: {
            color: new Cesium.Color(...color),
        }
    };

    if (!brightening) {
        // 原来的Appearance
        polylineAppearance = new Cesium.PolylineMaterialAppearance({
            material: new Cesium.Material({
                fabric,
                translucent: true
            })
        });

        polylineAppearance.getRenderState = function () {
            const rs = Cesium.Appearance.prototype.getRenderState.call(this);
            rs.depthTest = {
                enabled: depthTest,
            }
            rs.depthMask = false;
            return rs;
        }

        if (polylineAppearance.material.type === 'Image') {
            polylineAppearance.material._uniforms['image_1'] = getTextureFunc;
        }
    } else {
        // 为了颜色叠加发白，改写的Appearance
        polylineAppearance = new Cesium.PolylineMaterialAppearance({
            material: new Cesium.Material({
                fabric,
                translucent: false // 这个设置为false以后，就不会将DrawCommand加入透明渲染阶段；Appearance本身也有translucent这个属性，但是修改不起作用！
            }),
            translucent: false,
        });
        // 不能再创建时设置，否则会被覆盖！只能再创建完了以后再改写Appearance的属性！
        polylineAppearance.renderState.blending = Cesium.BlendingState.ADDITIVE_BLEND;
        polylineAppearance.renderState.depthMask = false;
        polylineAppearance.renderState.depthTest = {
            enabled: true,
        } // depthTest不设置为false，很容易导致线条自身遮挡而不绘制，结果颜色就没有叠加的效果。

        polylineAppearance.getRenderState = function () {
            const rs = Cesium.Appearance.prototype.getRenderState.call(this);
            rs.depthTest = {
                enabled: depthTest,
            }
            rs.depthMask = false;
            return rs;
        }

        if (polylineAppearance.material.type === 'Image') {
            polylineAppearance.material._uniforms['image_1'] = getTextureFunc;
        }
    }

    var renamedVS = Cesium.ShaderSource.replaceMain(polylineAppearance._vertexShaderSource, 'czm_twp_main');
    var twpMain =
        'out vec4 v_twp; \n' +
        'out vec4 v_color; \n' +
        'out vec4 v_bgColor; \n' +
        'out float v_expand; \n' +
        'void main() \n' +
        '{ \n' +
        '    czm_twp_main(); \n' +
        '    v_twp = czm_batchTable_twp(batchId); \n' +
        '    v_color = czm_batchTable_color(batchId); \n' +
        '    v_bgColor = czm_batchTable_bgColor(batchId); \n' +
        '    v_expand = expandAndWidth.x; \n' +
        '}';

    polylineAppearance._vertexShaderSource = renamedVS + '\n' + twpMain;

    var renamedFS = Cesium.ShaderSource.replaceMain(polylineAppearance._fragmentShaderSource, 'czm_twp2_main');

    var twp2Main = getTextureFunc ?
        'in vec4 v_twp; \n' +
        'in vec4 v_color; \n' +
        'in vec4 v_bgColor; \n' +
        'in float v_expand; \n' +
        'void main() \n' +
        '{ \n' +
        '    czm_twp2_main(); \n' +
        '    float bidirectional = v_twp.z;' +
        '    float forwardDir = sign(.5 - bidirectional);' +
        '    float t = (.5 - forwardDir * .5) + forwardDir * v_twp.x;' +
        '    float repeat = v_twp.y;' + // 作为repeat次数
        '    float tt = v_expand * 0.5 + 0.5;' +
        '    out_FragColor = texture(image_1, vec2(fract((v_st.s - t)*repeat*forwardDir), tt)); ' +
        '    out_FragColor *= color_0;' + // 让appearance中的color起作用
        '    out_FragColor *= v_color;' +
        '}' : 'in vec4 v_twp; \n' +
        'in vec4 v_color; \n' +
        'in vec4 v_bgColor; \n' +
        'void main() \n' +
        '{ \n' +
        '    czm_twp2_main(); \n' +
        '    float t = v_twp.x;' +
        '    float bidirectional = v_twp.z;' +
        '    t *= 1.03;' +
        '    float alpha0 = smoothstep(t - 0.03, t, v_st.s) * step(v_st.s, t); ' +
        '    float mt = 1. - t;' +
        '    float alpha1 = smoothstep(mt + 0.03, mt, v_st.s) * step(mt, v_st.s); ' +
        '    float a0 = step(abs(bidirectional - 0.0) - 0.001, 0.);' +
        '    float a1 = step(abs(bidirectional - 1.0) - 0.001, 0.);' +
        '    float db = step(abs(bidirectional - 2.0) - 0.001, 0.);' +
        '    float alpha = alpha0 * (a0 + db) + alpha1 * (a1 + db);' +
        '    alpha = clamp(alpha, 0., 1.);' +
        '    out_FragColor.rgb *= (v_color.rgb * alpha + v_bgColor.rgb * (1. - alpha));' +
        '    out_FragColor.a *= (v_color.a * alpha + v_bgColor.a * (1. - alpha));' +
        '}';

    polylineAppearance._fragmentShaderSource = renamedFS + '\n' + twp2Main;

    return polylineAppearance;
}


function createODLineGeometryInstance(owner, positions, width, arcType, color, bgColor, twp) {
    const geometry = XbsjPolylineGeometry.createGeometry(new XbsjPolylineGeometry({
        positions: positions,
        width: width,
        vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
        arcType,
    }));

    if (!geometry) {
        return undefined;
    }

    if (!bgColor) {
        bgColor = Cesium.Color.clone(color || Cesium.Color.WHITE);
        bgColor.alpha = 0.2;
    }

    var gi = new Cesium.GeometryInstance({
        geometry,
        id: owner,
        attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(color || Cesium.Color.WHITE),
            bgColor: Cesium.ColorGeometryInstanceAttribute.fromColor(bgColor),
            twp: new Cesium.GeometryInstanceAttribute({
                componentDatatype: Cesium.ComponentDatatype.FLOAT,
                componentsPerAttribute: 4,
                normalize: false,
                // value : [0.0, 5.0, 1.0, 1.0]
                value: twp,
            })
        },
    });

    return gi;
}

const scratchTWP = new Cesium.Cartesian4(0.0, 0.0, 0.0, 0.0);
const scratchColor = new Cesium.Cartesian4(0.0, 0.0, 0.0, 0.0);

const scratchResult = {
    timeRatio: 0,
    repeat: 1,
    color: [1, 1, 1, 1],
    bgColor: [1, 1, 1, 1],
    bidirectional: 0,
};

/**
 * OD线回调函数，用来指定OD线的进度
 * @callback XbsjODLinesPostionCallback
 * @exports XbsjODLinesPostionCallback
 *
 * @param {number} instanceIndex OD线的索引
 * @param {Cesium.FrameState} frameState 传递的是viewer.scene.frameState
 * @returns {number} 返回OD线的进度位置
 *
 * @example
 * function (instanceIndex, frameState) {
 *     var st = routePaths[instanceIndex].startTime;
 *     var dr = routePaths[instanceIndex].duration;
 *     var diff = time > st ? time - st : time + timeDuration - st;
 *     var timeRatio = Math.min(diff / dr, 1.0);
 *     return timeRatio;
 * }
 */

/**
 * 创建OD线
 * @exports xbsjCreateODLinesPrimitive
 * @param {*} routePaths 用来存储OD线的数据点，有两种形式：
 * @param {XbsjODLinesPostionCallback} postionCallback 用来实时修改OD线的进度位置
 * @param {boolean} translucentPass 是否在透明通道渲染，透明通道渲染的颜色不能叠加，会比较暗。但是不会有深度监测问题。
 * @returns {Cesium.Primitive} 返回创建好的od线
 * @example
 * // routePaths数据的两种存储形式如下：
 *  {
 *      positions: [], // [经度，纬度，高度] 经纬度单位是弧度
 *      color: [1, 1, 0, 1]
 *      width: 2.0, // 宽度
 *  }
 * 
 *  {
 *      startPos: [], // [经度，纬度，高度] 经纬度单位是弧度
 *      endPos: [1, 1, 0, 1],
 *      heightRatio: 1.0, // 曲率控制，默认1.0，越大曲线抬得越高
 *      width: 2.0, // 宽度
 *  }
 */
function xbsjCreateODLinesPrimitive(routePaths, color, arcType, postionCallback, brightening = true, depthTest = true, getTextureFunc, id) {
    var geometryInstances = [];
    try {
        routePaths.forEach(function (route, index) {
            var positions = route.positions && route.positions.map(e => Cesium.Cartesian3.fromDegrees(...e)) || createTransmitPolyline(route.startPos, route.endPos, undefined, (typeof route.heightRatio === 'undefined' ? 1 : route.heightRatio));

            const r = postionCallback(index, undefined, scratchResult);
            const { timeRatio, repeat, color, bidirectional, bgColor } = r;

            const czmColor = new Cesium.Color(...color);
            const czmBgColor = new Cesium.Color(...bgColor);
            const twp = [timeRatio, repeat, bidirectional, 0];
            var gi = createODLineGeometryInstance(index, positions, route.width, arcType, czmColor, czmBgColor, twp);
            if (!gi) throw new Error(`cannot get geoemetry instance!`);
            geometryInstances.push(gi);
        });
    } catch (error) {
        return undefined;
    }

    var odLinesPrimitive = new Cesium.Primitive({
        geometryInstances: geometryInstances,
        appearance: createODLineApperance(color, brightening, depthTest, getTextureFunc),
        asynchronous: false,
    });

    Cesium.Primitive.prototype && (odLinesPrimitive.ESSceneObjectID = id);

    odLinesPrimitive.update = function (frameState) {
        const primitive = this;

        if (typeof primitive._batchTable !== 'undefined') {
            var twpAttributeIndex = primitive._batchTableAttributeIndices['twp'];
            var colorAttributeIndex = primitive._batchTableAttributeIndices['color'];
            var bgColorAttributeIndex = primitive._batchTableAttributeIndices['bgColor'];

            var ni = primitive._batchTable._numberOfInstances;
            for (var i = 0; i < ni; ++i) {
                var instanceIndex = i;
                // scratchTWP.x = postionCallback(instanceIndex, frameState);

                scratchResult.timeRatio = 0.0;
                scratchResult.repeat = 1.0;
                // Cesium.Cartesian4.fromElements(1.0, 1.0, 1.0, 1.0, scratchResult.color);
                scratchResult.color.splice(0, 4, 1, 1, 1);
                const r = postionCallback(instanceIndex, frameState, scratchResult);
                const { timeRatio, repeat, color, bidirectional, bgColor } = r;

                scratchTWP.x = timeRatio;
                scratchTWP.y = repeat; // 纹理的重复次数，指对有image时才有效 vtxf
                scratchTWP.z = typeof bidirectional !== 'number' ? 0 : bidirectional; // 纹理的重复次数，指对有image时才有效 vtxf
                // scratchTWP.z = 2; // 纹理的重复次数，指对有image时才有效 vtxf
                primitive._batchTable.setBatchedAttribute(instanceIndex, twpAttributeIndex, scratchTWP);

                scratchColor.x = 255 * color[0];
                scratchColor.y = 255 * color[1];
                scratchColor.z = 255 * color[2];
                scratchColor.w = 255 * color[3];
                primitive._batchTable.setBatchedAttribute(instanceIndex, colorAttributeIndex, scratchColor);

                // if (!bgColor) {
                //     bgColor = [...color];
                //     bgColor[3] = 0.2;
                // }
                scratchColor.x = 255 * bgColor[0];
                scratchColor.y = 255 * bgColor[1];
                scratchColor.z = 255 * bgColor[2];
                scratchColor.w = 255 * bgColor[3];
                primitive._batchTable.setBatchedAttribute(instanceIndex, bgColorAttributeIndex, scratchColor);
            }
        }

        // Cesium.Primitive.prototype.update.bind(primitive)(frameState);
        Cesium.Primitive.prototype.update.call(primitive, frameState);
    }

    return odLinesPrimitive;
}

export default xbsjCreateODLinesPrimitive;
