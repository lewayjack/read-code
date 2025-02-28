import { ESJResource, ESJVector3D, ESJVector4D } from "earthsdk3"
import { CzmTilingSchemaJsonType } from "./CzmTilingSchemaJsonType"
import { JsonValue } from "xbsj-base";
import { CzmTimeIntervalCollectionJsonType } from "./CzmTimeIntervalJsonType";

export type CzmBingMapsStyle = 'AERIAL' | 'AERIAL_WITH_LABELS' | 'AERIAL_WITH_LABELS_ON_DEMAND' | 'ROAD' | 'ROAD_ON_DEMAND' | 'CANVAS_DARK' | 'CANVAS_LIGHT' | 'CANVAS_GRAY' | 'ORDNANCE_SURVEY' | 'COLLINS_BART';

export type CzmImageryProviderJsonType = {
    type: 'ArcGisMapServerImageryProvider',
    url: string | ESJResource,
    token?: string,
    usePreCachedTilesIfAvailable?: boolean,
    layers?: string,
    enablePickFeatures?: boolean,
    rectangle?: ESJVector4D,
    tilingScheme?: CzmTilingSchemaJsonType;
    ellipsoid?: ESJVector3D;
    credit?: string;
    tileWidth?: number;
    tileHeight?: number;
    maximumLevel?: number;
} | {
    type: 'BingMapsImageryProvider';
    url: string | ESJResource,
    key: string;
    tileProtocol?: string;
    mapStyle?: CzmBingMapsStyle;
    culture?: string;
    ellipsoid?: ESJVector3D;
} | {
    type: 'GoogleEarthEnterpriseImageryProvider';
    url: string | ESJResource,
    metadata: string;
    ellipsoid?: ESJVector3D;
    credit?: string;
} | {
    type: 'GridImageryProvider';
    tilingScheme?: CzmTilingSchemaJsonType;
    ellipsoid?: ESJVector3D;
    cells?: number;
    color?: ESJVector4D;
    glowColor?: ESJVector4D;
    glowWidth?: number;
    backgroundColor?: ESJVector4D;
    tileWidth?: number;
    tileHeight?: number;
    canvasSize?: number;
} | {
    type: 'IonImageryProvider';
    assetId: number;
    accessToken?: string;
    server?: string;
} | {
    type: 'MapboxImageryProvider';
    url?: string;
    mapId: string;
    accessToken: string;
    format?: string;
    ellipsoid?: ESJVector3D;
    minimumLevel?: number;
    maximumLevel?: number;
    rectangle?: ESJVector4D;
    credit?: string;
} | {
    type: 'MapboxStyleImageryProvider';
    url?: string;
    username?: string;
    styleId: string;
    accessToken: string;
    tilesize?: number;
    scaleFactor?: boolean,
    rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
    credit?: string; //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
    ellipsoid?: [x: number, y: number, z: number];
    minimumLevel?: number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
    maximumLevel?: number;

} |
{
    type: 'OpenStreetMapImageryProvider';
    url: string,
    rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
    credit?: string; //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
    ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
    minimumLevel?: number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
    maximumLevel?: number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
    fileExtension?: string;
} |
{
    type: 'SingleTileImageryProvider';
    url: string | ESJResource,
    rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
    credit?: string; //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
    ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
} |
{
    type: 'TileCoordinatesImageryProvider';
    tilingScheme?: CzmTilingSchemaJsonType; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
    ellipsoid?: [x: number, y: number, z: number];//	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
    color: [number, number, number, number];
    tileWidth?: number; //	Number	<optional> 256	Pixel width of image tiles.
    tileHeight?: number; //	Number	<optional> 256	Pixel height of image tiles.

} |
{
    type: 'TileMapServiceImageryProvider';//已完成
    url?: string | ESJResource; //	Resource | String | Promise.<Resource> | Promise.<String>	<optional> '.'	Path to image tiles on server.
    fileExtension?: string; //	String	<optional> 'png'	The file extension for images on the server.
    credit?: string; //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
    minimumLevel?: number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
    maximumLevel?: number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
    rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
    tilingScheme?: CzmTilingSchemaJsonType; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
    ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
    tileWidth?: number; //	Number	<optional> 256	Pixel width of image tiles.
    tileHeight?: number; //	Number	<optional> 256	Pixel height of image tiles.
    flipXY?: boolean; //	Boolean	<optional> Older versions of gdal2tiles.py flipped X and Y values in tilemapresource.xml. Specifying this option will do the same, allowing for loading of these incorrect tilesets.
} |
{
    type: 'UrlTemplateImageryProvider';//已完成
    url: string | ESJResource,
    subdomains?: string | string[];//String | Array.<String>
    credit?: string;//Credit | String
    minimumLevel?: number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
    maximumLevel?: number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
    rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
    tilingScheme?: CzmTilingSchemaJsonType; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
    ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
    tileWidth?: number; //	Number	<optional> 256	Pixel width of image tiles.
    tileHeight?: number; //	Number	<optional> 256	Pixel height of image tiles.
    hasAlphaChannel?: boolean;
    pickFeaturesUrl?: string;//Resource | String
    enablePickFeatures?: boolean;
    urlSchemeZeroPadding?: JsonValue,
    // getFeatureInfoFormats?: Array<Cesium.GetFeatureInfoFormat>;   //TODO2
    customTags?: { [k: string]: string };
} |
{
    type: 'WebMapServiceImageryProvider';
    url: string | ESJResource,
    layers: string;
    parameters?: JsonValue,
    getFeatureInfoParameters?: JsonValue,
    // getFeatureInfoFormats?: Array<Cesium.GetFeatureInfoFormat>, //TODO2
    enablePickFeatures?: boolean,
    rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
    tilingScheme?: CzmTilingSchemaJsonType; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
    ellipsoid?: [x: number, y: number, z: number];//	Ellipsoid	<optional> The ellipsoid. If not specified, the WGS84 ellipsoid is used.
    minimumLevel?: number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider.
    maximumLevel?: number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
    tileWidth?: number; //	Number	<optional> 256	The tile width in pixels.
    tileHeight?: number; //	Number	<optional> 256	The tile height in pixels.
    crs?: string,
    srs?: string,
    credit?: string;//Credit | String
    subdomains?: string | string[]; //	String | Array.<String>	<optional> 'abc'	The subdomains to use for the {s} placeholder in the URL template. If this parameter is a single string, each character in the string is a subdomain. If it is an array, each element in the array is a subdomain.
    // clock: Cesium.Clock; // //	Clock	<optional> A Clock instance that is used when determining the value for the time dimension. Required when `times` is specified.
    times?: CzmTimeIntervalCollectionJsonType;  //	TimeIntervalCollection	<optional> TimeIntervalCollection: string; // with its data property being an object containing time dynamic dimension and their values.
    getFeatureInfoUrl?: string
} |
{
    type: 'WebMapTileServiceImageryProvider';//已完成
    url: string | ESJResource; //	Resource | String			The base URL for the WMTS GetTile operation (for KVP-encoded requests) or the tile-URL template (for RESTful requests). The tile-URL template should contain the following variables: {style}, {TileMatrixSet}, {TileMatrix}, {TileRow}, {TileCol}. The first two are optional if actual values are hardcoded or not required by the server. The {s} keyword may be used to specify subdomains.
    format?: string; //	String	<optional> 'image/jpeg'	The MIME type for images to retrieve from the server.
    layer: string; //	String			The layer name for WMTS requests.
    style: string; //	String			The style name for WMTS requests.
    tileMatrixSetID: string; //	String			The identifier of the TileMatrixSet to use for WMTS requests.
    tileMatrixLabels?: string[]; //	Array	<optional> A list of identifiers in the TileMatrix to use for WMTS requests, one per TileMatrix level.
    // clock: Cesium.Clock, // //	Clock	<optional> A Clock instance that is used when determining the value for the time dimension. Required when `times` is specified.
    times?: CzmTimeIntervalCollectionJsonType; //	TimeIntervalCollection	<optional> TimeIntervalCollection: string; // with its data property being an object containing time dynamic dimension and their values.
    dimensions?: JsonValue; //	Object	<optional> A object containing static dimensions and their values.
    tileWidth?: number; //	Number	<optional> 256	The tile width in pixels.
    tileHeight?: number; //	Number	<optional> 256	The tile height in pixels.
    tilingScheme?: CzmTilingSchemaJsonType; //	TilingScheme	<optional> The tiling scheme corresponding to the organization of the tiles in the TileMatrixSet.
    rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle covered by the layer.
    minimumLevel?: number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider.
    maximumLevel?: number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
    ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	<optional> The ellipsoid. If not specified, the WGS84 ellipsoid is used.
    credit?: string; //	Credit | String	<optional> A credit for the data source, which is displayed on the canvas.
    subdomains?: string | string[]; //	String | Array.<String>	<optional> 'abc'	The subdomains to use for the {s} placeholder in the URL template. If this parameter is a single string, each character in the string is a subdomain. If it is an array, each element in the array is a subdomain.
} | {
    type: 'BDImageryProvider';
    url?: string;
    wgs84?: boolean;
    ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	<optional> The ellipsoid. If not specified, the WGS84 ellipsoid is used.
}
    | {
        type: 'GeHistoryImagery';
        indexTime: string | number
    } | {
        type: 'ArcgisHistoryImagery';
        indexTimeID: string | number
    } | {
        type: "MVTImageryProvider",
        url: string | { [xx: string]: any } | ESJResource,
        accessToken?: string,
        tileSize?: number,
        maximumLevel?: number,
        minimumLevel?: number,
        enablePickFeatures?: boolean,
        rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle covered by the layer.
        style?: { [xx: string]: any }[],
    }
