import { createNextAnimateFrameEvent, Destroyable } from "xbsj-base";
import { ESCesiumViewer } from "../index";
import { Clouds } from "./Clouds";
import { DepthOfField } from "./DepthOfField";
import { Fog } from "./Fog";
import { Rain } from "./Rain";
import { Snow } from "./Snow";

export class EnvManager extends Destroyable {
    rain: Rain;
    cloud: Clouds;
    snow: Snow;
    fog: Fog;
    depthOfField: DepthOfField;

    constructor(czmViewer: ESCesiumViewer) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) throw new Error('Cesium.Viewer不存在!');

        const rain = this.dv(new Rain(czmViewer));
        const cloud = this.dv(new Clouds(czmViewer));
        const snow = this.dv(new Snow(czmViewer));
        const fog = this.dv(new Fog(czmViewer));
        const depthOfField = this.dv(new DepthOfField(czmViewer));
        this.rain = rain;
        this.cloud = cloud;
        this.snow = snow;
        this.fog = fog;
        this.depthOfField = depthOfField;

        {
            const { scene } = viewer;
            const update = () => {

                scene.sun.show = czmViewer.sun ?? ESCesiumViewer.defaults.sun;//太阳
                scene.globe.enableLighting = czmViewer.sun ?? ESCesiumViewer.defaults.sun;//全球光照
                // scene.skyAtmosphere.show = czmViewer.atmosphere;//TODO:大气效果和全球光照晨昏线效果冲突，后续需要解决

                if (czmViewer.rain > 0 && czmViewer.rain <= 1) {
                    rain.show = true;
                } else {
                    rain.show = false;
                }

                if (czmViewer.cloud > 0 && czmViewer.cloud <= 1) {
                    cloud.show = true;
                } else {
                    cloud.show = false;
                }

                if (czmViewer.snow > 0 && czmViewer.snow <= 1) {
                    snow.show = true;
                    snow.alpha = czmViewer.snow;
                } else {
                    snow.show = false;
                }

                if (czmViewer.fog > 0 && czmViewer.fog <= 1) {
                    fog.show = true;
                } else {
                    fog.show = false;
                }

                if (czmViewer.depthOfField > 0 && czmViewer.depthOfField <= 1) {
                    depthOfField.show = true;
                } else {
                    depthOfField.show = false;
                }

            };
            update();
            const event = this.dv(createNextAnimateFrameEvent(
                czmViewer.sunChanged,
                czmViewer.rainChanged,
                czmViewer.cloudChanged,
                czmViewer.snowChanged,
                czmViewer.fogChanged,
                czmViewer.depthOfFieldChanged,
                czmViewer.atmosphereChanged
            ));
            this.d(event.don(update));
        }
    }
}
