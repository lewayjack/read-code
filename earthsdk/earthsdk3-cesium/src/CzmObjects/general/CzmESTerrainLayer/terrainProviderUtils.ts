import * as Cesium from 'cesium';
import { ESSceneObject } from "earthsdk3";
import { CzmTerrainProviderJsonType } from '../../../ESJTypesCzm/czmObject/CzmTerrainProviderJsonType';
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import { createTilingSchema, getResource, toEllipsoid } from '../.././../utils';

const { getStrFromEnv } = ESSceneObject.context;

export function getFinalTerrainProviderUrl(url: string) {
    let finalUrl;
    if (url.startsWith('ion://')) {
        const idStr = url.substring('ion://'.length);
        const id = +idStr;
        if (Number.isFinite(id)) {
            finalUrl = Cesium.IonResource.fromAssetId(id);
        }
    } else {
        finalUrl = getStrFromEnv(url);
    }

    return finalUrl;
}
export function getFinalTerrainProviderUrlString(url: string) {
    let finalUrl;
    if (url.startsWith('ion://')) {
        const idStr = url.substring('ion://'.length);
        const id = +idStr;
        if (Number.isFinite(id)) {
            finalUrl = `Cesium.IonResource.fromAssetId(${id})`;
        }
    } else {
        finalUrl = `'${getStrFromEnv(url)}'`;
    }

    return finalUrl;
}

export async function createTerrainProviderFromJson(terrainProviderJson: CzmTerrainProviderJsonType, czmViewer: ESCesiumViewer): Promise<Cesium.TerrainProvider | undefined> {
    if (terrainProviderJson.type === 'EllipsoidTerrainProvider') {
        return new Cesium.EllipsoidTerrainProvider({
            ellipsoid: terrainProviderJson.ellipsoid && toEllipsoid(terrainProviderJson.ellipsoid),
            tilingScheme: terrainProviderJson.tilingScheme && createTilingSchema(terrainProviderJson.tilingScheme),
        });
    } else if (terrainProviderJson.type === 'CesiumTerrainProvider') {
        const url = getFinalTerrainProviderUrl(typeof terrainProviderJson.url === 'string' ? terrainProviderJson.url : terrainProviderJson.url.url);
        if (!url) {
            return undefined;
        }
        return await Cesium.CesiumTerrainProvider.fromUrl(
            typeof url == 'string' ? getResource(terrainProviderJson.url) : url,
            {
                requestVertexNormals: terrainProviderJson.requestVertexNormals,
                requestWaterMask: terrainProviderJson.requestWaterMask,
                requestMetadata: terrainProviderJson.requestMetadata,
                ellipsoid: terrainProviderJson.ellipsoid && toEllipsoid(terrainProviderJson.ellipsoid),
                credit: terrainProviderJson.credit,
            }
        );
    } else if (terrainProviderJson.type === 'GoogleEarthEnterpriseTerrainProvider') {
        const geeMetadata = await Cesium.GoogleEarthEnterpriseMetadata.fromUrl(getStrFromEnv(terrainProviderJson.url));
        return await Cesium.GoogleEarthEnterpriseTerrainProvider.fromMetadata(
            geeMetadata,
            {
                ellipsoid: terrainProviderJson.ellipsoid && toEllipsoid(terrainProviderJson.ellipsoid),
                credit: terrainProviderJson.credit,
            }
        );
    } else if (terrainProviderJson.type === 'ArcGISTiledElevationTerrainProvider') {
        return await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(getResource(terrainProviderJson.url), {
            // Cesium105.2自己的声明文件有问题 vtxf 20230525
            // @ts-ignore
            token: terrainProviderJson.token,
            ellipsoid: terrainProviderJson.ellipsoid && toEllipsoid(terrainProviderJson.ellipsoid),
        });
    } else if (terrainProviderJson.type === 'CustomHeightmapTerrainProvider') {
        // @ts-ignore
        return new Cesium.CustomHeightmapTerrainProvider({
            // 编译报错！！！  Property 'availability' is missing in type 'CustomHeightmapTerrainProvider' but required in type 'TerrainProvider'.
            tilingScheme: terrainProviderJson.tilingScheme && createTilingSchema(terrainProviderJson.tilingScheme),
            width: terrainProviderJson.width,
            height: terrainProviderJson.height,
            ellipsoid: terrainProviderJson.ellipsoid && toEllipsoid(terrainProviderJson.ellipsoid),
            credit: terrainProviderJson.credit,
            callback: terrainProviderJson.callback && Function('"use strict";return (' + terrainProviderJson.callback + ')')()
        });
    } else if (terrainProviderJson.type === 'VRTheWorldTerrainProvider') {
        return await Cesium.VRTheWorldTerrainProvider.fromUrl(
            getResource(terrainProviderJson.url),
            {
                ellipsoid: terrainProviderJson.ellipsoid && toEllipsoid(terrainProviderJson.ellipsoid),
                credit: terrainProviderJson.credit,
            }
        );
    }
}
