
import { JsonValue } from "xbsj-base";

export type CzmSplitDirectionType = 'LEFT' | 'NONE' | 'RIGHT';

export declare type CzmTimeIntervalCollectionJsonType = {
    type: 'fromIso8601';
    iso8601: string;
    isStartIncluded?: boolean;
    isStopIncluded?: boolean;
    leadingInterval?: boolean;
    trailingInterval?: boolean;
} | {
    type: 'fromIso8601DateArray';
    iso8601Dates?: string[];
    isStartIncluded?: boolean;
    isStopIncluded?: boolean;
    leadingInterval?: boolean;
    trailingInterval?: boolean;
};


export declare type ESTilingSchemaJsonType = {
    type: 'WebMercatorTilingScheme';
    ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	Ellipsoid.WGS84	optional The ellipsoid whose surface is being tiled. Defaults to the WGS84 ellipsoid.
    numberOfLevelZeroTilesX?: number; //	Number	1	optional The number of tiles in the X direction at level zero of the tile tree.
    numberOfLevelZeroTilesY?: number; //	Number	1	optional The number of tiles in the Y direction at level zero of the tile tree.
    rectangleSouthwestInMeters?: [number, number]; //	Cartesian2		optional The southwest corner of the rectangle covered by the tiling scheme, in meters. If this parameter or rectangleNortheastInMeters is not specified, the entire globe is covered in the longitude direction and an equal distance is covered in the latitude direction, resulting in a square projection.
    rectangleNortheastInMeters?: [number, number]; //	Cartesian2		optional The northeast corner of the rectangle covered by the tiling scheme, in meters. If this parameter or rectangleSouthwestInMeters is not specified, the entire globe is covered in the longitude direction and an equal distance is covered in the latitude direction, resulting in a square projection.
} | {
    type: 'GeographicTilingScheme';
    ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	Ellipsoid.WGS84	optionalThe ellipsoid whose surface is being tiled. Defaults to the WGS84 ellipsoid.
    rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	Rectangle.MAX_VALUE	optional The rectangle, in radians, covered by the tiling scheme.
    numberOfLevelZeroTilesX?: number; //	Number	2	optional The number of tiles in the X direction at level zero of the tile tree.
    numberOfLevelZeroTilesY?: number; //	Number	1	optional The number of tiles in the Y direction at level zero of the tile tree.
} | {
    type: 'ToGCJ02WebMercatorTilingScheme';
    ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	Ellipsoid.WGS84	optional The ellipsoid whose surface is being tiled. Defaults to the WGS84 ellipsoid.
    numberOfLevelZeroTilesX?: number; //	Number	1	optional The number of tiles in the X direction at level zero of the tile tree.
    numberOfLevelZeroTilesY?: number; //	Number	1	optional The number of tiles in the Y direction at level zero of the tile tree.
    rectangleSouthwestInMeters?: [number, number]; //	Cartesian2		optional The southwest corner of the rectangle covered by the tiling scheme, in meters. If this parameter or rectangleNortheastInMeters is not specified, the entire globe is covered in the longitude direction and an equal distance is covered in the latitude direction, resulting in a square projection.
    rectangleNortheastInMeters?: [number, number]; //	Cartesian2		optional The northeast corner of the rectangle covered by the tiling scheme, in meters. If this parameter or rectangleSouthwestInMeters is not specified, the entire globe is covered in the longitude direction and an equal distance is covered in the latitude direction, resulting in a square projection.
} | {
    type: 'ToWGS84WebMercatorTilingScheme';
    ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	Ellipsoid.WGS84	optional The ellipsoid whose surface is being tiled. Defaults to the WGS84 ellipsoid.
    numberOfLevelZeroTilesX?: number; //	Number	1	optional The number of tiles in the X direction at level zero of the tile tree.
    numberOfLevelZeroTilesY?: number; //	Number	1	optional The number of tiles in the Y direction at level zero of the tile tree.
    rectangleSouthwestInMeters?: [number, number]; //	Cartesian2		optional The southwest corner of the rectangle covered by the tiling scheme, in meters. If this parameter or rectangleNortheastInMeters is not specified, the entire globe is covered in the longitude direction and an equal distance is covered in the latitude direction, resulting in a square projection.
    rectangleNortheastInMeters?: [number, number]; //	Cartesian2		optional The northeast corner of the rectangle covered by the tiling scheme, in meters. If this parameter or rectangleSouthwestInMeters is not specified, the entire globe is covered in the longitude direction and an equal distance is covered in the latitude direction, resulting in a square projection.
}

// 'wms' | 'tms' | 'wmts' | 'xyz'

export type ESImageryLayerOptionsType =

    {
        type: 'tms';//已完成
        // url?: string; //	Resource | String | Promise.<Resource> | Promise.<String>	<optional> '.'	Path to image tiles on server.
        fileExtension?: string; //	String	<optional> 'png'	The file extension for images on the server.
        credit?: string; //	Credit | String	<optional> ''	A credit for the data source, which is displayed on the canvas.
        // minimumLevel?: number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
        // maximumLevel?: number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
        // rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
        tilingScheme?: ESTilingSchemaJsonType; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
        ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
        tileWidth?: number; //	Number	<optional> 256	Pixel width of image tiles.
        tileHeight?: number; //	Number	<optional> 256	Pixel height of image tiles.
        flipXY?: boolean; //	Boolean	<optional> Older versions of gdal2tiles.py flipped X and Y values in tilemapresource.xml. Specifying this option will do the same, allowing for loading of these incorrect tilesets.
    } |
    {
        type: 'xyz';//已完成
        // url: string;//Resource | String
        subdomains?: string | string[];//String | Array.<String>
        credit?: string;//Credit | String
        // minimumLevel?: number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider. Take care when specifying this that the number of tiles at the minimum level is small, such as four or less. A larger number is likely to result in rendering problems.
        // maximumLevel?: number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
        // rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
        tilingScheme?: ESTilingSchemaJsonType; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
        ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	<optional> The ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
        tileWidth?: number; //	Number	<optional> 256	Pixel width of image tiles.
        tileHeight?: number; //	Number	<optional> 256	Pixel height of image tiles.
        hasAlphaChannel?: boolean;
        pickFeaturesUrl?: string;//Resource | String
        enablePickFeatures?: boolean;
        urlSchemeZeroPadding?: JsonValue,
        customTags?: { [k: string]: string };
    } |
    {
        type: 'wms';
        // url: string;
        layers: string;
        parameters?: JsonValue,
        getFeatureInfoParameters?: JsonValue,
        enablePickFeatures?: boolean,
        // rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle, in radians, covered by the image.
        tilingScheme?: ESTilingSchemaJsonType; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
        ellipsoid?: [x: number, y: number, z: number];//	Ellipsoid	<optional> The ellipsoid. If not specified, the WGS84 ellipsoid is used.
        // minimumLevel?: number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider.
        // maximumLevel?: number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
        tileWidth?: number; //	Number	<optional> 256	The tile width in pixels.
        tileHeight?: number; //	Number	<optional> 256	The tile height in pixels.
        crs?: string,
        srs?: string,
        credit?: string;//Credit | String
        subdomains?: string | string[]; //	String | Array.<String>	<optional> 'abc'	The subdomains to use for the {s} placeholder in the URL template. If this parameter is a single string, each character in the string is a subdomain. If it is an array, each element in the array is a subdomain.
        times?: CzmTimeIntervalCollectionJsonType;  //	TimeIntervalCollection	<optional> TimeIntervalCollection: string; // with its data property being an object containing time dynamic dimension and their values.
        getFeatureInfoUrl?: string
    } | {
        type: 'wmts';//已完成
        // url: string; //	Resource | String			The base URL for the WMTS GetTile operation (for KVP-encoded requests) or the tile-URL template (for RESTful requests). The tile-URL template should contain the following variables: {style}, {TileMatrixSet}, {TileMatrix}, {TileRow}, {TileCol}. The first two are optional if actual values are hardcoded or not required by the server. The {s} keyword may be used to specify subdomains.
        format?: string; //	String	<optional> 'image/jpeg'	The MIME type for images to retrieve from the server.
        layer: string; //	String			The layer name for WMTS requests.
        style: string; //	String			The style name for WMTS requests.
        tileMatrixSetID: string; //	String			The identifier of the TileMatrixSet to use for WMTS requests.
        tileMatrixLabels?: string[]; //	Array	<optional> A list of identifiers in the TileMatrix to use for WMTS requests, one per TileMatrix level.
        times?: CzmTimeIntervalCollectionJsonType; //	TimeIntervalCollection	<optional> TimeIntervalCollection: string; // with its data property being an object containing time dynamic dimension and their values.
        dimensions?: JsonValue; //	Object	<optional> A object containing static dimensions and their values.
        tileWidth?: number; //	Number	<optional> 256	The tile width in pixels.
        tileHeight?: number; //	Number	<optional> 256	The tile height in pixels.
        tilingScheme?: ESTilingSchemaJsonType; //	TilingScheme	<optional> The tiling scheme corresponding to the organization of the tiles in the TileMatrixSet.
        // rectangle?: [west: number, south: number, east: number, north: number]; //	Rectangle	<optional> Rectangle.MAX_VALUE	The rectangle covered by the layer.
        // minimumLevel?: number; //	Number	<optional> 0	The minimum level-of-detail supported by the imagery provider.
        // maximumLevel?: number; //	Number	<optional> The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
        ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	<optional> The ellipsoid. If not specified, the WGS84 ellipsoid is used.
        credit?: string; //	Credit | String	<optional> A credit for the data source, which is displayed on the canvas.
        subdomains?: string | string[]; //	String | Array.<String>	<optional> 'abc'	The subdomains to use for the {s} placeholder in the URL template. If this parameter is a single string, each character in the string is a subdomain. If it is an array, each element in the array is a subdomain.
    } | {
        // type: 'IonImageryProvider';
        type: 'ion';
        // assetId: number,
        accessToken?: string,
        server?: string
    }



export const optionsStr =
    `
# 声明文件
### options 类型
\`\`\`javascript
   export type ESImageryLayerOptionsType =
    {
        "type": "tms";
        "fileExtension"?: string; 
        "credit"?: string;
        "tilingScheme"?: ESTilingSchemaJsonType; 
        "ellipsoid"?: [x: number, y: number, z: number]; 
        "tileWidth"?: number; 
        "tileHeight"?: number; 
        "flipXY"?: boolean; 
    } |
    {
        type: 'xyz';
        subdomains?: string | string[];
        credit?: string;
        tilingScheme?: ESTilingSchemaJsonType;
        ellipsoid?: [x: number, y: number, z: number]; 
        tileWidth?: number; 
        tileHeight?: number; 
        hasAlphaChannel?: boolean;
        pickFeaturesUrl?: string;
        enablePickFeatures?: boolean;
        urlSchemeZeroPadding?: JsonValue,
        customTags?: { [k: string]: string };
    } |
    {
        type: 'wms';
        layers: string;
        parameters?: JsonValue,
        getFeatureInfoParameters?: JsonValue,
        enablePickFeatures?: boolean,
        tilingScheme?: ESTilingSchemaJsonType; 
        ellipsoid?: [x: number, y: number, z: number];
        tileWidth?: number; 
        tileHeight?: number; 
        crs?: string,
        srs?: string,
        credit?: string;
        subdomains?: string | string[]; 
        times?: CzmTimeIntervalCollectionJsonType; 
        getFeatureInfoUrl?: string
    } |
    {
        type: 'wmts';
        format?: string; 
        layer: string;
        style: string; 
        tileMatrixSetID: string;
        tileMatrixLabels?: string[];
        times?: CzmTimeIntervalCollectionJsonType;
        dimensions?: JsonValue;
        tileWidth?: number;
        tileHeight?: number;
        tilingScheme?: ESTilingSchemaJsonType;
        ellipsoid?: [x: number, y: number, z: number]; 
        credit?: string; 
        subdomains?: string | string[]; 
    } |
    {
        type: 'ion';
        accessToken?: string,
        server?: string
    }
\`\`\`

### tilingSchema类型
\`\`\`javascript
    export type ESTilingSchemaJsonType = {
        "type": "WebMercatorTilingScheme";
        "ellipsoid"?: [x: number, y: number, z: number];
        "numberOfLevelZeroTilesX"?: number; .
        "numberOfLevelZeroTilesY"?: number;
        "rectangleSouthwestInMeters"?: [number, number];
        "rectangleNortheastInMeters"?: [number, number];
    } | {
        "type": "GeographicTilingScheme";
        "ellipsoid"?: [x: number, y: number, z: number];
        "rectangle"?: [west: number, south: number, east: number, north: number];
        "numberOfLevelZeroTilesX"?: number;
        "numberOfLevelZeroTilesY"?: number;
    }
\`\`\`

### times类型
\`\`\`javascript
export type CzmTimeIntervalCollectionJsonType = {
    type: 'fromIso8601';
    iso8601: string;
    isStartIncluded?: boolean;
    isStopIncluded?: boolean;
    leadingInterval?: boolean;
    trailingInterval?: boolean;
} | {
    type: 'fromIso8601DateArray';
    iso8601Dates?: string[];
    isStartIncluded?: boolean;
    isStopIncluded?: boolean;
    leadingInterval?: boolean;
    trailingInterval?: boolean;
};

\`\`\`
`
