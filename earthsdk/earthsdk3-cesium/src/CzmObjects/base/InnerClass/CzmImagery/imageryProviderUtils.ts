import * as Cesium from 'cesium';
import { BDImageryProvider } from './extends/BDImageryProvider';
import { XbsjTileserHisImageryProvider } from './tileser';
import { XbsjTileserArcgisHisImageryProvider } from './arcgis';
import MVTImageryProvider from './extends/MVTImageryProvider';
import { CzmImageryProviderJsonType, CzmTimeIntervalCollectionJsonType } from '../../../../ESJTypesCzm';
import { ESJResource, ESSceneObject } from 'earthsdk3';
import { ESCesiumViewer } from '../../../../ESCesiumViewer';
import { createTilingSchema, getResource, toColor, toEllipsoid, toRectangle } from '../../../../utils';

export function needRecreate(oldImageryProviderJson: CzmImageryProviderJsonType | undefined, newImageryProviderJson: CzmImageryProviderJsonType | undefined) {
    return true;

    // if (oldImageryProviderJson.type !== newImageryProviderJson.type) {
    //     return true;
    // } else {
    //     // TODO
    //     return true;
    // }
}

function dataCallback(interval: Cesium.TimeInterval, index: number) {
    let time;
    if (index === 0) {
        // leading
        time = Cesium.JulianDate.toIso8601(interval.stop);
    } else {
        time = Cesium.JulianDate.toIso8601(interval.start);
    }

    return {
        Time: time,
    };
}

function createTimesForWMTSImageryProvider(timeJson: CzmTimeIntervalCollectionJsonType) {
    if (timeJson.type === 'fromIso8601') {
        return Cesium.TimeIntervalCollection.fromIso8601({
            iso8601: timeJson.iso8601,
            isStartIncluded: timeJson.isStartIncluded,
            isStopIncluded: timeJson.isStopIncluded,
            leadingInterval: timeJson.leadingInterval,
            trailingInterval: timeJson.trailingInterval,
            dataCallback,
        });
    }
}

const { getStrFromEnv } = ESSceneObject.context;

function getCustomTagsFromJson(value: { [k: string]: string }) {
    const kvs = Object.entries(value).map(([k, v]) => {
        try {
            const vf = v && Function(`"use strict";return (${v})`)();
            return [k, vf] as [string, string];
        } catch (error) {
            console.error(`getCustomTagsFromJson error: ${error}`, error);
            return undefined;
        }
    }).filter(e => !!e) as [string, string][];
    return Object.fromEntries(kvs);
}

export async function createImageryProviderFromJson(imageryProviderJson: CzmImageryProviderJsonType, czmViewer: ESCesiumViewer): Promise<Cesium.ImageryProvider | undefined> {
    if (imageryProviderJson.type === 'WebMapTileServiceImageryProvider') {
        const imageryProvider = new Cesium.WebMapTileServiceImageryProvider({
            url: getResource(imageryProviderJson.url), //	Resource | String			The base URL for the WMTS GetTile operation (for KVP-encoded requests) or the tile-URL template (for RESTful requests). The tile-URL template should contain the following variables: {style}, {TileMatrixSet}, {TileMatrix}, {TileRow}, {TileCol}. The first two are optional if actual values are hardcoded or not required by the server. The {s} keyword may be used to specify subdomains.
            format: imageryProviderJson.format ?? 'image/jpeg', //	String	<optional> 'image/jpeg'	The MIME type for images to retrieve from the server.
            layer: imageryProviderJson.layer, //	String			The layer name for WMTS requests.
            style: imageryProviderJson.style, //	String			The style name for WMTS requests.
            tileMatrixSetID: imageryProviderJson.tileMatrixSetID, //	String			The identifier of the TileMatrixSet to use for WMTS requests.
            tileMatrixLabels: imageryProviderJson.tileMatrixLabels, //	Array	<optional> A list of identifiers in the TileMatrix to use for WMTS requests, one per TileMatrix level.
            clock: imageryProviderJson.times && czmViewer.viewer?.clock, // TODO 暂时使用Cesium系统的clock！以后或许需要改造成独立的clock！视国恒的情况而定！ //	Clock	<optional> A Clock instance that is used when determining the value for the time dimension. Required when `times` is specified.
            times: imageryProviderJson.times && createTimesForWMTSImageryProvider(imageryProviderJson.times), //	TimeIntervalCollection	<optional> TimeIntervalCollection: string, // with its data property being an object containing time dynamic dimension and their values.
            dimensions: imageryProviderJson.dimensions, //	Object	<optional> A object containing static dimensions and their values.
            tileWidth: imageryProviderJson.tileWidth ?? 256, //	Number	<optional> 256	The tile width in pixels.
            tileHeight: imageryProviderJson.tileHeight ?? 256, //	Number	<optional> 256	The tile height in pixels.
            tilingScheme: imageryProviderJson.tilingScheme && createTilingSchema(imageryProviderJson.tilingScheme), //	TilingScheme	<optional> The tiling scheme corresponding to the organization of the tiles in the TileMatrixSet.
            rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle), //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle covered by the layer.
            minimumLevel: imageryProviderJson.minimumLevel ?? 0, //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider.
            maximumLevel: imageryProviderJson.maximumLevel, //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid), //	Ellipsoid	<optional> The ellipsoid. If not specified, the WGS84 ellipsoid is used.
            credit: imageryProviderJson.credit, //	Credit | String	<optional> A credit for the data source, which is displayed on the canvas.
            subdomains: imageryProviderJson.subdomains, //	String | Array.<String>	<optional> 'abc'	The subdomains to use for the {s} placeholder in the URL template. If this parameter is a single string, each character in the string is a subdomain. If it is an array, each element in the array is a subdomain.
        });

        return imageryProvider;
    } else if (imageryProviderJson.type === 'TileMapServiceImageryProvider') {
        if (!imageryProviderJson.url) {
            return undefined;
        }

        return await Cesium.TileMapServiceImageryProvider.fromUrl(
            getResource(imageryProviderJson.url),
            {
                fileExtension: imageryProviderJson.fileExtension, // string; //	String	<optional> 'png'	The file extension for images on the server.
                credit: imageryProviderJson.credit, // string; //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
                minimumLevel: imageryProviderJson.minimumLevel, // number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
                maximumLevel: imageryProviderJson.maximumLevel, // number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
                rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle), // string; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
                tilingScheme: imageryProviderJson.tilingScheme && createTilingSchema(imageryProviderJson.tilingScheme), // string; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
                ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid), // string; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
                tileWidth: imageryProviderJson.tileWidth, // string; //	Number	<optional> 256	Pixel width of image tiles.
                tileHeight: imageryProviderJson.tileHeight, // string; //	Number	<optional> 256	Pixel height of image tiles.
                flipXY: imageryProviderJson.flipXY, // string; //	Boolean	<optional> Older versions of gdal2tiles.py flipped X and Y values in tilemapresource.xml. Specifying this option will do the same, allowing for loading of these incorrect tilesets.
            }
        )
        // const imageryProvider = new Cesium.TileMapServiceImageryProvider({
        //     url: imageryProviderJson.url && getStrFromEnv(imageryProviderJson.url), //	Resource | String | Promise.<Resource> | Promise.<String>	<optional> '.'	Path to image tiles on server.
        //     fileExtension: imageryProviderJson.fileExtension, // string; //	String	<optional> 'png'	The file extension for images on the server.
        //     credit: imageryProviderJson.credit, // string; //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
        //     minimumLevel: imageryProviderJson.minimumLevel, // number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
        //     maximumLevel: imageryProviderJson.maximumLevel, // number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
        //     rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle), // string; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
        //     tilingScheme: imageryProviderJson.tilingScheme && createTilingSchema(imageryProviderJson.tilingScheme), // string; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
        //     ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid), // string; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
        //     tileWidth: imageryProviderJson.tileWidth, // string; //	Number	<optional> 256	Pixel width of image tiles.
        //     tileHeight: imageryProviderJson.tileHeight, // string; //	Number	<optional> 256	Pixel height of image tiles.
        //     flipXY: imageryProviderJson.flipXY, // string; //	Boolean	<optional> Older versions of gdal2tiles.py flipped X and Y values in tilemapresource.xml. Specifying this option will do the same, allowing for loading of these incorrect tilesets.
        // });
        // return imageryProvider;
    } else if (imageryProviderJson.type === 'UrlTemplateImageryProvider') {
        const customTags = imageryProviderJson.customTags && getCustomTagsFromJson(imageryProviderJson.customTags);
        console.log(getResource(imageryProviderJson.url), "111");

        const imageryProvider = new Cesium.UrlTemplateImageryProvider({
            url: getResource(imageryProviderJson.url),
            credit: imageryProviderJson.credit, // string; //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
            minimumLevel: imageryProviderJson.minimumLevel, // number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
            maximumLevel: imageryProviderJson.maximumLevel, // number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
            rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle), // string; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
            tilingScheme: imageryProviderJson.tilingScheme && createTilingSchema(imageryProviderJson.tilingScheme), // string; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid), // string; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
            tileWidth: imageryProviderJson.tileWidth, // string; //	Number	<optional> 256	Pixel width of image tiles.
            tileHeight: imageryProviderJson.tileHeight,
            subdomains: imageryProviderJson.subdomains,
            hasAlphaChannel: imageryProviderJson.hasAlphaChannel,
            pickFeaturesUrl: imageryProviderJson.pickFeaturesUrl,//Resource | String
            enablePickFeatures: imageryProviderJson.enablePickFeatures,
            urlSchemeZeroPadding: imageryProviderJson.urlSchemeZeroPadding,
            // customTags: imageryProviderJson.customTags
            customTags,
            //TODO2
            // getFeatureInfoFormats: Array<any>;//	Array.<GetFeatureInfoFormat>
        })
        return imageryProvider;
    } else if (imageryProviderJson.type === "GridImageryProvider") {
        const imageryProvider = new Cesium.GridImageryProvider({
            tilingScheme: imageryProviderJson.tilingScheme && createTilingSchema(imageryProviderJson.tilingScheme), // string; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid), // string; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
            tileWidth: imageryProviderJson.tileWidth, // string; //	Number	<optional> 256	Pixel width of image tiles.
            tileHeight: imageryProviderJson.tileHeight,
            cells: imageryProviderJson.cells,
            color: imageryProviderJson.color && toColor(imageryProviderJson.color),
            glowColor: imageryProviderJson.glowColor && toColor(imageryProviderJson.glowColor),
            backgroundColor: imageryProviderJson.backgroundColor && toColor(imageryProviderJson.backgroundColor),
            canvasSize: imageryProviderJson.canvasSize,
            glowWidth: imageryProviderJson.glowWidth,
        })
        return imageryProvider;
    } else if (imageryProviderJson.type === 'ArcGisMapServerImageryProvider') {
        if (!imageryProviderJson.url) return undefined;
        return await Cesium.ArcGisMapServerImageryProvider.fromUrl(
            getResource(imageryProviderJson.url),
            {
                // @ts-ignore
                token: imageryProviderJson.token,
                // tileDiscardPolicy: imageryProviderJson.tileDiscardPolicy,//new Cesium.TileDiscardPolicy()  //TODO2
                usePreCachedTilesIfAvailable: imageryProviderJson.usePreCachedTilesIfAvailable,
                layers: imageryProviderJson.layers,
                enablePickFeatures: imageryProviderJson.enablePickFeatures,
                rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle), // string; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
                tilingScheme: imageryProviderJson.tilingScheme && createTilingSchema(imageryProviderJson.tilingScheme), // string; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
                ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid), // string; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
                credit: imageryProviderJson.credit,//	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
                tileWidth: imageryProviderJson.tileWidth,
                tileHeight: imageryProviderJson.tileHeight,
                maximumLevel: imageryProviderJson.maximumLevel
            }
        )

        // return new Cesium.ArcGisMapServerImageryProvider({
        //     url: getStrFromEnv(imageryProviderJson.url),
        //     token: imageryProviderJson.token,
        //     // tileDiscardPolicy: imageryProviderJson.tileDiscardPolicy,//new Cesium.TileDiscardPolicy()  //TODO2
        //     usePreCachedTilesIfAvailable: imageryProviderJson.usePreCachedTilesIfAvailable,
        //     layers: imageryProviderJson.layers,
        //     enablePickFeatures: imageryProviderJson.enablePickFeatures,
        //     rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle), // string; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
        //     tilingScheme: imageryProviderJson.tilingScheme && createTilingSchema(imageryProviderJson.tilingScheme), // string; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
        //     ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid), // string; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
        //     credit: imageryProviderJson.credit,//	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
        //     tileWidth: imageryProviderJson.tileWidth,
        //     tileHeight: imageryProviderJson.tileHeight,
        //     maximumLevel: imageryProviderJson.maximumLevel
        // })
    } else if (imageryProviderJson.type === 'BingMapsImageryProvider') {
        if (!imageryProviderJson.url) return undefined;
        return await Cesium.BingMapsImageryProvider.fromUrl(
            getResource(imageryProviderJson.url),
            {
                key: imageryProviderJson.key,
                tileProtocol: imageryProviderJson.tileProtocol,
                mapStyle: imageryProviderJson.mapStyle && Cesium.BingMapsStyle[imageryProviderJson.mapStyle],
                culture: imageryProviderJson.culture,
                // tileDiscardPolicy: imageryProviderJson.tileDiscardPolicy,//TODO2
                ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid)
            }
        );

        // return new Cesium.BingMapsImageryProvider({
        //     url: getStrFromEnv(imageryProviderJson.url),
        //     key: imageryProviderJson.key,
        //     tileProtocol: imageryProviderJson.tileProtocol,
        //     mapStyle: imageryProviderJson.mapStyle && Cesium.BingMapsStyle[imageryProviderJson.mapStyle],
        //     culture: imageryProviderJson.culture,
        //     // tileDiscardPolicy: imageryProviderJson.tileDiscardPolicy,//TODO2
        //     ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid)
        // })

    } else if (imageryProviderJson.type === 'GoogleEarthEnterpriseImageryProvider') {
        if (!imageryProviderJson.url) return undefined;
        const geeMetadata = await Cesium.GoogleEarthEnterpriseMetadata.fromUrl(getResource(imageryProviderJson.url));

        return await Cesium.GoogleEarthEnterpriseImageryProvider.fromMetadata(geeMetadata, {
            // tileDiscardPolicy: imageryProviderJson.tileDiscardPolicy,//TODO2
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid),
            credit: imageryProviderJson.credit
        });

        // return new Cesium.GoogleEarthEnterpriseImageryProvider({
        //     url: getStrFromEnv(imageryProviderJson.url),
        //     metadata: new Cesium.GoogleEarthEnterpriseMetadata(imageryProviderJson.metadata),
        //     // tileDiscardPolicy: imageryProviderJson.tileDiscardPolicy,//TODO2
        //     ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid),
        //     credit: imageryProviderJson.credit
        // })

    } else if (imageryProviderJson.type === 'IonImageryProvider') {

        return await Cesium.IonImageryProvider.fromAssetId(
            imageryProviderJson.assetId,
            {
                accessToken: imageryProviderJson.accessToken,
                server: imageryProviderJson.server
            }
        )

    } else if (imageryProviderJson.type === 'MapboxImageryProvider') {

        return new Cesium.MapboxImageryProvider({
            url: imageryProviderJson.url && getStrFromEnv(imageryProviderJson.url),
            mapId: imageryProviderJson.mapId,
            accessToken: imageryProviderJson.accessToken,
            format: imageryProviderJson.format,
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid),//	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
            minimumLevel: imageryProviderJson.minimumLevel, //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
            maximumLevel: imageryProviderJson.maximumLevel,
            rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle), //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
            credit: imageryProviderJson.credit
        })


    } else if (imageryProviderJson.type === 'MapboxStyleImageryProvider') {

        return new Cesium.MapboxStyleImageryProvider({
            url: imageryProviderJson.url && getStrFromEnv(imageryProviderJson.url),
            username: imageryProviderJson.username,
            styleId: imageryProviderJson.styleId,
            accessToken: imageryProviderJson.accessToken,
            tilesize: imageryProviderJson.tilesize,
            scaleFactor: imageryProviderJson.scaleFactor,
            rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle),//	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
            credit: imageryProviderJson.credit, //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid), //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
            minimumLevel: imageryProviderJson.minimumLevel, //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
            maximumLevel: imageryProviderJson.maximumLevel,
        })


    } else if (imageryProviderJson.type === 'OpenStreetMapImageryProvider') {

        return new Cesium.OpenStreetMapImageryProvider({
            url: getStrFromEnv(imageryProviderJson.url),
            rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle), //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
            credit: imageryProviderJson.credit, //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid),//	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
            minimumLevel: imageryProviderJson.minimumLevel,//	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
            maximumLevel: imageryProviderJson.maximumLevel, //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
            fileExtension: imageryProviderJson.fileExtension

        })


    } else if (imageryProviderJson.type === 'SingleTileImageryProvider') {
        return new Cesium.SingleTileImageryProvider({
            url: getResource(imageryProviderJson.url),
            rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle),  // rectangle: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
            credit: imageryProviderJson.credit, // credit: string; //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid),// ellipsoid: [x: number, y: number, z: number];
        })



    } else if (imageryProviderJson.type === 'TileCoordinatesImageryProvider') {

        return new Cesium.TileCoordinatesImageryProvider({
            tilingScheme: imageryProviderJson.tilingScheme && createTilingSchema(imageryProviderJson.tilingScheme),//	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid),//	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
            color: imageryProviderJson.color && toColor(imageryProviderJson.color),
            tileWidth: imageryProviderJson.tileWidth, //	Number	<optional> 256	Pixel width of image tiles.
            tileHeight: imageryProviderJson.tileHeight
        })



    } else if (imageryProviderJson.type === 'WebMapServiceImageryProvider') {


        return new Cesium.WebMapServiceImageryProvider({

            url: getResource(imageryProviderJson.url),
            layers: imageryProviderJson.layers,
            enablePickFeatures: imageryProviderJson.enablePickFeatures,
            rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle), //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle covered by the layer.
            tilingScheme: imageryProviderJson.tilingScheme && createTilingSchema(imageryProviderJson.tilingScheme), //	TilingScheme	<optional> The tiling scheme corresponding to the organization of the tiles in the TileMatrixSet.
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid),//	Ellipsoid	<optional> The ellipsoid. If not specified, the WGS84 ellipsoid is used.
            minimumLevel: imageryProviderJson.minimumLevel, //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider.
            maximumLevel: imageryProviderJson.maximumLevel, //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
            tileWidth: imageryProviderJson.tileWidth, //	Number	<optional> 256	The tile width in pixels.
            tileHeight: imageryProviderJson.tileHeight,//	Number	<optional> 256	The tile height in pixels.
            crs: imageryProviderJson.crs,
            srs: imageryProviderJson.srs,
            credit: imageryProviderJson.credit,//Credit | String
            subdomains: imageryProviderJson.subdomains, //	String | Array.<String>	<optional> 'abc'	The subdomains to use for the {s} placeholder in the URL template. If this parameter is a single string, each character in the string is a subdomain. If it is an array, each element in the array is a subdomain.
            clock: imageryProviderJson.times && czmViewer.viewer?.clock, // TODO 暂时使用Cesium系统的clock！以后或许需要改造成独立的clock！视国恒的情况而定！ //	Clock	<optional> A Clock instance that is used when determining the value for the time dimension. Required when `times` is specified.
            times: imageryProviderJson.times && createTimesForWMTSImageryProvider(imageryProviderJson.times), //	TimeIntervalCollection	<optional> TimeIntervalCollection: string, // with its data property being an object containing time dynamic dimension and their values.
            //TODO2
            // getFeatureInfoUrl: imageryProviderJson.getFeatureInfoUrl,//不存在？

            // getFeatureInfoFormats: imageryProviderJson.getFeatureInfoFormats,   //TODO2

            parameters: imageryProviderJson.parameters,
            getFeatureInfoParameters: imageryProviderJson.getFeatureInfoParameters,
        })
    } else if (imageryProviderJson.type === 'BDImageryProvider') {
        return new BDImageryProvider({
            url: imageryProviderJson.url && getStrFromEnv(imageryProviderJson.url),
            ellipsoid: imageryProviderJson.ellipsoid && toEllipsoid(imageryProviderJson.ellipsoid),
            wgs84: imageryProviderJson.wgs84,
        });
    } else if (imageryProviderJson.type === 'GeHistoryImagery') {
        // @ts-ignore
        return new XbsjTileserHisImageryProvider({
            indexTime: imageryProviderJson.indexTime
        });
    } else if (imageryProviderJson.type === 'ArcgisHistoryImagery') {
        // @ts-ignore
        return new XbsjTileserArcgisHisImageryProvider({
            indexTimeID: imageryProviderJson.indexTimeID
        });
    } else if (imageryProviderJson.type === 'MVTImageryProvider') {
        if (!imageryProviderJson.url) return;
        //@ts-ignore
        return await MVTImageryProvider.fromUrl(imageryProviderJson.url, {
            maximumLevel: imageryProviderJson.maximumLevel,
            minimumLevel: imageryProviderJson.minimumLevel,
            tileSize: imageryProviderJson.tileSize,
            accessToken: imageryProviderJson.accessToken,
            enablePickFeatures: imageryProviderJson.enablePickFeatures,
            rectangle: imageryProviderJson.rectangle && toRectangle(imageryProviderJson.rectangle), //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle covered by the layer.
            layerStyle: imageryProviderJson.style,
        })
    }
}

export function updateImageryProviderFromJson(imageryProvider: Cesium.ImageryProvider, imageryProviderJson: CzmImageryProviderJsonType) {
    if (imageryProviderJson.type === 'WebMapTileServiceImageryProvider') {
        if (imageryProvider instanceof Cesium.WebMapTileServiceImageryProvider) {
            // imageryProvider.
        }
    }
}