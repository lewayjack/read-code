
import * as Cesium from 'Cesium';
// import { bd09togcj02, gcj02tobd09, wgs84togcj02, gcj02towgs84 } from './coordTransform';
import * as bd09 from './coordTransform';

// 需要提前引入：http://api.map.baidu.com/api?v=1.5&ak=2b866a6daac9014292432d81fe9b47e3
function BDPixel(x, y) {
    this.x = x || 0;
    this.y = y || 0;
    this["x"] = this.x;
    this["y"] = this.y
}
BDPixel.prototype.equals = function (other) {
    return other && other.x == this.x && other.y == this.y
}

function BDPoint(lng, lat) {
    if (isNaN(lng)) {
        lng = decode64(lng);
        lng = isNaN(lng) ? 0 : lng
    }
    if (typeof lng == 'string')
        lng = parseFloat(lng);
    if (isNaN(lat)) {
        lat = decode64(lat);
        lat = isNaN(lat) ? 0 : lat
    }
    if (typeof lng == 'lat')
        lat = parseFloat(lat);
    this.lng = lng;
    this.lat = lat
}
BDPoint.isInRange = function (pt) {
    return pt && pt["lng"] <= 180 && pt["lng"] >= -180 && pt["lat"] <= 74 && pt["lat"] >= -74
};
BDPoint.prototype.equals = function (other) {
    return other && this["lat"] == other["lat"] && this["lng"] == other["lng"]
};

function BDMercatorProjection() {

}

BDMercatorProjection.EARTHRADIUS = 6370996.81;
BDMercatorProjection.MCBAND = [1.289059486E7, 8362377.87, 5591021, 3481989.83, 1678043.12, 0];
BDMercatorProjection.LLBAND = [75, 60, 45, 30, 15, 0];
BDMercatorProjection.MC2LL = [[1.410526172116255E-8, 8.98305509648872E-6, -1.9939833816331, 200.9824383106796, -187.2403703815547, 91.6087516669843, -23.38765649603339, 2.57121317296198, -0.03801003308653, 1.73379812E7], [-7.435856389565537E-9, 8.983055097726239E-6, -0.78625201886289, 96.32687599759846, -1.85204757529826, -59.36935905485877, 47.40033549296737, -16.50741931063887, 2.28786674699375, 1.026014486E7], [-3.030883460898826E-8, 8.98305509983578E-6, 0.30071316287616, 59.74293618442277, 7.357984074871, -25.38371002664745, 13.45380521110908, -3.29883767235584, 0.32710905363475, 6856817.37], [-1.981981304930552E-8, 8.983055099779535E-6, 0.03278182852591, 40.31678527705744, 0.65659298677277, -4.44255534477492, 0.85341911805263, 0.12923347998204, -0.04625736007561, 4482777.06], [3.09191371068437E-9, 8.983055096812155E-6, 6.995724062E-5, 23.10934304144901, -2.3663490511E-4, -0.6321817810242, -0.00663494467273, 0.03430082397953, -0.00466043876332, 2555164.4], [2.890871144776878E-9, 8.983055095805407E-6, -3.068298E-8, 7.47137025468032, -3.53937994E-6, -0.02145144861037, -1.234426596E-5, 1.0322952773E-4, -3.23890364E-6, 826088.5]];
BDMercatorProjection.LL2MC = [[-0.0015702102444, 111320.7020616939, 1704480524535203, -10338987376042340, 26112667856603880, -35149669176653700, 26595700718403920, -10725012454188240, 1800819912950474, 82.5], [8.277824516172526E-4, 111320.7020463578, 6.477955746671607E8, -4.082003173641316E9, 1.077490566351142E10, -1.517187553151559E10, 1.205306533862167E10, -5.124939663577472E9, 9.133119359512032E8, 67.5], [0.00337398766765, 111320.7020202162, 4481351.045890365, -2.339375119931662E7, 7.968221547186455E7, -1.159649932797253E8, 9.723671115602145E7, -4.366194633752821E7, 8477230.501135234, 52.5], [0.00220636496208, 111320.7020209128, 51751.86112841131, 3796837.749470245, 992013.7397791013, -1221952.21711287, 1340652.697009075, -620943.6990984312, 144416.9293806241, 37.5], [-3.441963504368392E-4, 111320.7020576856, 278.2353980772752, 2485758.690035394, 6070.750963243378, 54821.18345352118, 9540.606633304236, -2710.55326746645, 1405.483844121726, 22.5], [-3.218135878613132E-4, 111320.7020701615, 0.00369383431289, 823725.6402795718, 0.46104986909093, 2351.343141331292, 1.58060784298199, 8.77738589078284, 0.37238884252424, 7.45]];
BDMercatorProjection.getDistanceByMC = function (BDPoint1, BDPoint2) {
    if (!BDPoint1 || !BDPoint2)
        return 0;
    var x1, y1, x2, y2;
    BDPoint1 = this.convertMC2LL(BDPoint1);
    if (!BDPoint1)
        return 0;
    x1 = this.toRadians(BDPoint1["lng"]);
    y1 = this.toRadians(BDPoint1["lat"]);
    BDPoint2 = this.convertMC2LL(BDPoint2);
    if (!BDPoint2)
        return 0;
    x2 = this.toRadians(BDPoint2["lng"]);
    y2 = this.toRadians(BDPoint2["lat"]);
    return this.getDistance(x1, x2, y1, y2)
};
BDMercatorProjection.getDistanceByLL = function (BDPoint1, BDPoint2) {
    if (!BDPoint1 || !BDPoint2)
        return 0;
    BDPoint1["lng"] = this.getLoop(BDPoint1["lng"], -180, 180);
    BDPoint1["lat"] = this.getRange(BDPoint1["lat"], -74, 74);
    BDPoint2["lng"] = this.getLoop(BDPoint2["lng"], -180, 180);
    BDPoint2["lat"] = this.getRange(BDPoint2["lat"], -74, 74);
    var x1, x2, y1, y2;
    x1 = this.toRadians(BDPoint1["lng"]);
    y1 = this.toRadians(BDPoint1["lat"]);
    x2 = this.toRadians(BDPoint2["lng"]);
    y2 = this.toRadians(BDPoint2["lat"]);
    return this.getDistance(x1, x2, y1, y2)
};
BDMercatorProjection.convertMC2LL = function (point) {
    var temp, factor;
    temp = new BDPoint(Math.abs(point["lng"]), Math.abs(point["lat"]));
    for (var i = 0; i < this.MCBAND["length"]; i++)
        if (temp["lat"] >= this.MCBAND[i]) {
            factor = this.MC2LL[i];
            break
        }
    var lnglat = this.convertor(point, factor);
    var point = new BDPoint(lnglat["lng"].toFixed(6), lnglat["lat"].toFixed(6));
    return point
};
BDMercatorProjection.convertLL2MC = function (point) {
    var temp, factor;
    point["lng"] = this.getLoop(point["lng"], -180, 180);
    point["lat"] = this.getRange(point["lat"], -74, 74);
    temp = new BDPoint(point["lng"], point["lat"]);
    for (var i = 0; i < this.LLBAND["length"]; i++)
        if (temp["lat"] >= this.LLBAND[i]) {
            factor = this.LL2MC[i];
            break
        }
    if (!factor)
        for (var i = this.LLBAND["length"] - 1; i >= 0; i--)
            if (temp["lat"] <= -this.LLBAND[i]) {
                factor = this.LL2MC[i];
                break
            }
    var mc = this.convertor(point, factor);
    var point = new BDPoint(mc["lng"].toFixed(2), mc["lat"].toFixed(2));
    return point
};
BDMercatorProjection.convertor = function (fromBDPoint, factor) {
    if (!fromBDPoint || !factor)
        return;
    var x = factor[0] + factor[1] * Math.abs(fromBDPoint["lng"]);
    var temp = Math.abs(fromBDPoint["lat"]) / factor[9];
    var y = factor[2] + factor[3] * temp + factor[4] * temp * temp + factor[5] * temp * temp * temp + factor[6] * temp * temp * temp * temp + factor[7] * temp * temp * temp * temp * temp + factor[8] * temp * temp * temp * temp * temp * temp;
    x *= fromBDPoint["lng"] < 0 ? -1 : 1;
    y *= fromBDPoint["lat"] < 0 ? -1 : 1;
    return new BDPoint(x, y)
};
BDMercatorProjection.getDistance = function (x1, x2, y1, y2) {
    return this.EARTHRADIUS * Math.acos(Math.sin(y1) * Math.sin(y2) + Math.cos(y1) * Math.cos(y2) * Math.cos(x2 - x1))
};
BDMercatorProjection.toRadians = function (angdeg) {
    return Math.PI * angdeg / 180
};
BDMercatorProjection.toDegrees = function (angrad) {
    return 180 * angrad / Math.PI
};
BDMercatorProjection.getRange = function (v, a, b) {
    if (a != null)
        v = Math.max(v, a);
    if (b != null)
        v = Math.min(v, b);
    return v
};
BDMercatorProjection.getLoop = function (v, a, b) {
    while (v > b)
        v -= b - a;
    while (v < a)
        v += b - a;
    return v
};

BDMercatorProjection.prototype.lngLatToMercator = function (point) {
    return BDMercatorProjection.convertLL2MC(point)
};

BDMercatorProjection.prototype.lngLatToPoint = function (point) {
    var mercator = BDMercatorProjection.convertLL2MC(point);
    return new BDPixel(mercator["lng"], mercator["lat"])
};
BDMercatorProjection.prototype.mercatorToLngLat = function (point) {
    return BDMercatorProjection.convertMC2LL(point)
};
BDMercatorProjection.prototype.PointToLngLat = function (point) {
    var mercator = new BDPoint(point.x, point.y);
    return BDMercatorProjection.convertMC2LL(mercator)
};
BDMercatorProjection.prototype.PointToPixel = function (point, zoom, mapCenter, mapSize, curCity) {
    if (!point)
        return;
    point = this.lngLatToMercator(point, curCity);
    var zoomUnits = this.getZoomUnits(zoom);
    var x = Math.round((point["lng"] - mapCenter["lng"]) / zoomUnits + mapSize[Twidth] / 2);
    var y = Math.round((mapCenter["lat"] - point["lat"]) / zoomUnits + mapSize[Theight] / 2);
    return new BDPixel(x, y)
};
BDMercatorProjection.prototype.PixelToPoint = function (pixel, zoom, mapCenter, mapSize, curCity) {
    if (!pixel)
        return;
    var zoomUnits = this.getZoomUnits(zoom);
    var lng = mapCenter["lng"] + zoomUnits * (pixel.x - mapSize[Twidth] / 2);
    var lat = mapCenter["lat"] - zoomUnits * (pixel.y - mapSize[Theight] / 2);
    var point = new BDPoint(lng, lat);
    return this.mercatorToLngLat(point, curCity)
};
BDMercatorProjection.prototype.getZoomUnits = function (zoom) {
    return Math.pow(2, 18 - zoom)
}



function BDTilingScheme(options) {
    options = options || {};
    this._ellipsoid = Cesium.defaultValue(options.ellipsoid, Cesium.Ellipsoid.WGS84);

    var _wgs84 = true;
    if (Cesium.defined(options.wgs84))
        _wgs84 = options.wgs84;

    this._projection = new Cesium.WebMercatorProjection(this._ellipsoid);

    var bdproj = new BDMercatorProjection();

    //经纬度转本地 
    this._projection.project = function (carto) {
        var p = {};
        if (_wgs84) {
            p = bd09.wgs84togcj02(Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude));
            p = bd09.gcj02tobd09(p[0], p[1]);
        } else {
            p = bd09.gcj02tobd09(Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude));
        }

        //因为百度地图是循环的，这里需要限定p
        p[0] = Math.min(p[0], 180.0);
        p[0] = Math.max(p[0], -180);
        p[1] = Math.min(p[1], 74.000022);
        p[1] = Math.max(p[1], -71.988531);

        //p[0] = (p[0] + 180) % 360 - 180; 

        p = bdproj.lngLatToPoint(new BDPoint(p[0], p[1]));

        return new Cesium.Cartesian2(p.x, p.y);
    };

    //本地转 经纬度
    this._projection.unproject = function (coord) {
        var p = bdproj.mercatorToLngLat(new BDPoint(coord.x, coord.y));

        //限定p的范围
        p[0] = (p[0] + 180) % 360 - 180;
        //  p[1] = (p[1] + 90) % 180 - 90;

        if (_wgs84) {
            p = bd09.bd09togcj02(p.lng, p.lat);
            p = bd09.gcj02towgs84(p[0], p[1]);
        } else {
            p = bd09.bd09togcj02(p.lng, p.lat);
        }
        return new Cesium.Cartographic(Cesium.Math.toRadians(p[0]), Cesium.Math.toRadians(p[1]));
    };

    this._rectangleSouthwestInMeters = new Cesium.Cartesian2(-20037726.37, -11708041.66);
    this._rectangleNortheastInMeters = new Cesium.Cartesian2(20037726.37, 12474104.17);
    var southwest = this._projection.unproject(this._rectangleSouthwestInMeters);
    var northeast = this._projection.unproject(this._rectangleNortheastInMeters);
    this._rectangle = new Cesium.Rectangle(southwest.longitude, southwest.latitude, northeast.longitude, northeast.latitude);
    //百度都是从第3级开始，而且序号是相对 0,0点来计算的
    this.levelWidth = [];
    for (var i = 0; i < 19; i++) {
        this.levelWidth[i] = Math.pow(2, 18 - i) * 256;
    }
};

Object.defineProperties(BDTilingScheme.prototype, {
    ellipsoid: {
        get: function () {
            return this._ellipsoid;
        }
    },
    rectangle: {
        get: function () {
            return this._rectangle;
        }
    },
    projection: {
        get: function () {
            return this._projection;
        }
    }
});

/**
 * 根据级别返回再这个级别上的 x 方向块个数
 *
 * @param {Number} level The level-of-detail.
 * @returns {Number} The number of tiles in the X direction at the given level.
 */
BDTilingScheme.prototype.getNumberOfXTilesAtLevel = function (level) {
    //这个仅仅用来计算精度的，所以保持和墨卡托一致
    return (1 << level) * 0.7;
};

/**
 * 根据级别返回再这个级别上的 y 方向块个数
 *
 * @param {Number} level The level-of-detail.
 * @returns {Number} The number of tiles in the Y direction at the given level.
 */
BDTilingScheme.prototype.getNumberOfYTilesAtLevel = function (level) {
    //这个仅仅用来计算精度的，所以保持和墨卡托一致
    return 1 << level;
};

/**
 * Transforms a rectangle specified in geodetic radians to the native coordinate system
 * of this tiling scheme.
 *
 把经纬度范围（弧度表示）转换为 本地坐标系统的 矩形范围  这个只和project有关系，所以和 web墨卡托的方式一致
 * @param {Rectangle} rectangle The rectangle to transform.
 * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Rectangle} The specified 'result', or a new object containing the native rectangle if 'result'
 *          is undefined.
 */
BDTilingScheme.prototype.rectangleToNativeRectangle = function (rectangle, result) {
    var projection = this._projection;
    var southwest = projection.project(Cesium.Rectangle.southwest(rectangle));
    var northeast = projection.project(Cesium.Rectangle.northeast(rectangle));

    if (!Cesium.defined(result)) {
        return new Cesium.Rectangle(southwest.x, southwest.y, northeast.x, northeast.y);
    }
    result.west = southwest.x;
    result.south = southwest.y;
    result.east = northeast.x;
    result.north = northeast.y;
    return result;
};

/**
 * Converts tile x, y coordinates and level to a rectangle expressed in the native coordinates
 * of the tiling scheme.
 *
 根据x，y，z 索引转换本地坐标系统矩形范围 这块要修改
 * @param {Number} x The integer x coordinate of the tile.
 * @param {Number} y The integer y coordinate of the tile.
 * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
 * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
 *          if 'result' is undefined.
 */
BDTilingScheme.prototype.tileXYToNativeRectangle = function (x, y, level, result) {
    var xTileWidth = this.levelWidth[level];
    var west = x * xTileWidth; // west = Math.max(west, -20037726.37);
    var east = (x + 1) * xTileWidth; //east = Math.min(east,  20037726.37);

    //注意必须保证 y 是 从上往下排列的，所以这里y取负数
    y = -y;

    var north = (y + 1) * xTileWidth;
    var south = y * xTileWidth;

    if (!Cesium.defined(result)) {
        return new Cesium.Rectangle(west, south, east, north);
    }
    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
};

/**
 * Converts tile x, y coordinates and level to a cartographic rectangle in radians.
 *
 根据x，y，level转经纬度范围矩形 不需要修改
 * @param {Number} x The integer x coordinate of the tile.
 * @param {Number} y The integer y coordinate of the tile.
 * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
 * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
 *          if 'result' is undefined.
 */
BDTilingScheme.prototype.tileXYToRectangle = function (x, y, level, result) {
    var nativeRectangle = this.tileXYToNativeRectangle(x, y, level, result);

    var projection = this._projection;
    var southwest = projection.unproject(new Cesium.Cartesian2(nativeRectangle.west, nativeRectangle.south));
    var northeast = projection.unproject(new Cesium.Cartesian2(nativeRectangle.east, nativeRectangle.north));

    nativeRectangle.west = southwest.longitude;
    nativeRectangle.south = southwest.latitude;
    nativeRectangle.east = northeast.longitude;
    nativeRectangle.north = northeast.latitude;
    return nativeRectangle;
};

/**
 * Calculates the tile x, y coordinates of the tile containing
 * a given cartographic position.

 给i当一个坐标点，计算它的 x，y，level索引
 *
 * @param {Cartographic} position The position.
 * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
 * @param {Cartesian2} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Cartesian2} The specified 'result', or a new object containing the tile x, y coordinates
 *          if 'result' is undefined.
 */
BDTilingScheme.prototype.positionToTileXY = function (position, level, result) {
    var rectangle = this._rectangle;
    if (!Cesium.Rectangle.contains(rectangle, position)) {
        // outside the bounds of the tiling scheme
        return undefined;
    }

    var projection = this._projection;
    var webMercatorPosition = projection.project(position);


    if (!Cesium.defined(webMercatorPosition)) {
        return undefined;
    }
    var tileWidth = this.levelWidth[level];

    var xTileCoordinate = Math.floor(webMercatorPosition.x / tileWidth);

    //注意必须保证 y 是 从上往下排列的，所以这里y取负数
    var yTileCoordinate = -Math.floor(webMercatorPosition.y / tileWidth);

    if (!Cesium.defined(result)) {
        return new Cesium.Cartesian2(xTileCoordinate, yTileCoordinate);
    }

    result.x = xTileCoordinate;
    result.y = yTileCoordinate;
    return result;
};




///////////////////////////////////////////
function BDImageryProvider(options) {
    this._url = options.url || "http://online2.map.bdimg.com/onlinelabel/?qt=tile&styles=pl&x={x}&y={y}&z={z}"
    this._tileWidth = 256;
    this._tileHeight = 256;
    this._maximumLevel = 18;

    this._tilingScheme = new BDTilingScheme(options);

    this._credit = undefined;
    this._rectangle = this._tilingScheme.rectangle;
    this._ready = true;
}

function buildImageUrl(imageryProvider, x, y, level) {
    var url = imageryProvider._url;
    url = url
        .replace('{x}', x)
        .replace('{y}', -y)
        .replace('{z}', level);
    return url;
}
Object.defineProperties(BDImageryProvider.prototype, {
    url: {
        get: function () {
            return this._url;
        }
    },
    token: {
        get: function () {
            return this._token;
        }
    },
    proxy: {
        get: function () {
            return this._proxy;
        }
    },
    tileWidth: {
        get: function () {
            //>>includeStart('debug', pragmas.debug);
            if (!this._ready) {
                throw new DeveloperError('tileWidth must not be called before the imagery provider is ready.');
            }
            //>>includeEnd('debug');
            return this._tileWidth;
        }
    },
    tileHeight: {
        get: function () {
            //>>includeStart('debug', pragmas.debug);
            if (!this._ready) {
                throw new DeveloperError('tileHeight must not be called before the imagery provider is ready.');
            }
            //>>includeEnd('debug');
            return this._tileHeight;
        }
    },
    maximumLevel: {
        get: function () {
            //>>includeStart('debug', pragmas.debug);
            if (!this._ready) {
                throw new DeveloperError('maximumLevel must not be called before the imagery provider is ready.');
            }
            //>>includeEnd('debug');
            return this._maximumLevel;
        }
    },
    minimumLevel: {
        get: function () {
            //>>includeStart('debug', pragmas.debug);
            if (!this._ready) {
                throw new DeveloperError('minimumLevel must not be called before the imagery provider is ready.');
            }
            //>>includeEnd('debug');
            return 3;
        }
    },
    tilingScheme: {
        get: function () {
            //>>includeStart('debug', pragmas.debug);
            if (!this._ready) {
                throw new DeveloperError('tilingScheme must not be called before the imagery provider is ready.');
            }
            //>>includeEnd('debug');
            return this._tilingScheme;
        }
    },
    rectangle: {
        get: function () {
            //>>includeStart('debug', pragmas.debug);
            if (!this._ready) {
                throw new DeveloperError('rectangle must not be called before the imagery provider is ready.');
            }
            //>>includeEnd('debug');
            return this._rectangle;
        }
    },
    tileDiscardPolicy: {
        get: function () {
            //>>includeStart('debug', pragmas.debug);
            if (!this._ready) {
                throw new DeveloperError('tileDiscardPolicy must not be called before the imagery provider is ready.');
            }
            //>>includeEnd('debug');
            return this._tileDiscardPolicy;
        }
    },
    errorEvent: {
        get: function () {
            return this._errorEvent;
        }
    },
    ready: {
        get: function () {
            return this._ready;
        }
    },
    readyPromise: {
        get: function () {
            return this._readyPromise.promise;
        }
    },
    credit: {
        get: function () {
            return this._credit;
        }
    },
    usingPrecachedTiles: {
        get: function () {
            return this._useTiles;
        }
    },
    hasAlphaChannel: {
        get: function () {
            return true;
        }
    },
    layers: {
        get: function () {
            return this._layers;
        }
    }
});
BDImageryProvider.prototype.getTileCredits = function (x, y, level) {
    return undefined;
};
BDImageryProvider.prototype.requestImage = function (x, y, level) {
    if (!this._ready) {
        throw new DeveloperError('requestImage must not be called before the imagery provider is ready.');
    }
    var url = buildImageUrl(this, x, y, level);
    return Cesium.ImageryProvider.loadImage(this, url);
};

export { BDImageryProvider };