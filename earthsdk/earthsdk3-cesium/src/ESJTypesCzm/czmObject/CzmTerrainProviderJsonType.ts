import { ESJResource } from "earthsdk3";
import { CzmTilingSchemaJsonType } from "./CzmTilingSchemaJsonType";

export type CzmTerrainProviderJsonType =
    {

        type: 'ArcGISTiledElevationTerrainProvider';//ysp(todo)
        url: string | ESJResource	//Resource | String | Promise.< Resource > | Promise.< String > The URL of the ArcGIS ImageServer service.
        token?: string//String	optionalThe authorization token to use to connect to the service.
        ellipsoid?: [x: number, y: number, z: number] 	//Ellipsoid	optionalThe ellipsoid.If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
    } |
    {
        type: 'CesiumTerrainProvider';
        url: string | ESJResource; //	Resource | String | Promise.<Resource> | Promise.<String>		The URL of the Cesium terrain server.
        requestVertexNormals?: boolean; //	Boolean	false	optionalFlag that indicates if the client should request additional lighting information from the server, in the form of per vertex normals if available.
        requestWaterMask?: boolean; //	Boolean	false	optionalFlag that indicates if the client should request per tile water masks from the server, if available.
        requestMetadata?: boolean; //	Boolean	true	optionalFlag that indicates if the client should request per tile metadata from the server, if available.
        ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid		optionalThe ellipsoid. If not specified, the WGS84 ellipsoid is used.
        credit?: string; //	Credit | String		optionalA credit for the data source, which is displayed on the canvas.
    } |
    {
        type: 'CustomHeightmapTerrainProvider';//ysp(todo) // callback 解决
        callback: string,	//CustomHeightmapTerrainProvider.GeometryCallback	The callback function for requesting tile geometry.
        width: number,	//Number	The number of columns per heightmap tile.
        height: number	//Number	The number of rows per heightmap tile.
        tilingScheme?: CzmTilingSchemaJsonType; //	TilingScheme	<optional> The tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a WebMercatorTilingScheme is used.
        ellipsoid?: [x: number, y: number, z: number]; 	//Ellipsoid	optionalThe ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
        credit?: string	//Credit | String	optionalA credit for the data source, which is displayed on the canvas.
    } |
    {
        type: 'EllipsoidTerrainProvider';
        tilingScheme?: CzmTilingSchemaJsonType; //	TilingScheme	optionalThe tiling scheme specifying how the ellipsoidal surface is broken into tiles. If this parameter is not provided, a GeographicTilingScheme is used.
        ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	optionalThe ellipsoid. If the tilingScheme is specified, this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither parameter is specified, the WGS84 ellipsoid is used.
    } |
    {
        type: 'GoogleEarthEnterpriseTerrainProvider';
        url: string; //	Resource | String	The url of the Google Earth Enterprise server hosting the imagery.
        metadata: string; // metadata  已解决 //	GoogleEarthEnterpriseMetadata	A metadata object that can be used to share metadata requests with a GoogleEarthEnterpriseImageryProvider.
        ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	optionalThe ellipsoid. If not specified, the WGS84 ellipsoid is used.
        credit?: string; //	Credit | String	optionalA credit for the data source, which is displayed on the canvas.
    } |
    {
        type: 'VRTheWorldTerrainProvider';//ysp(todo)
        url: string | ESJResource,	//Resource | String		The URL of the VR-TheWorld TileMap.
        ellipsoid?: [x: number, y: number, z: number]; //	Ellipsoid	optionalThe ellipsoid. If not specified, the WGS84 ellipsoid is used.
        credit?: string; //	Credit | String	optionalA credit for the data source, which is displayed on the canvas.
    };
