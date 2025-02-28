import { ESJResource } from "earthsdk3";
import { ESSceneObject } from "earthsdk3";
import * as Cesium from 'cesium';

export function getResource(url: ESJResource | string) {
    if (typeof url == 'string') {
        return ESSceneObject.context.getStrFromEnv(url);
    } else {
        return new Cesium.Resource({
            url: ESSceneObject.context.getStrFromEnv(url.url),
            headers: url.headers,
            queryParameters: url.queryParameters,
            templateValues: url.templateValues,
            proxy: url.proxy,
            retryCallback: url.retryCallback,
            retryAttempts: url.retryAttempts,
            request: url.request,
            parseUrl: url.parseUrl,
        });
    }
}
