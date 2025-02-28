import { ESJClockRangeType, ESJClockStepType, ESJResource, ESSceneObject, PickedInfo } from "earthsdk3";
import { CzmClock } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, Listener, Event, react, bind, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, createProcessingFromAsyncFunc, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';

const data = `<?xml version="1.0" encoding="utf-8" ?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document id="root_doc">
<Folder><name>高速公路</name>
  <Placemark>
	<name>卫岗隧道</name>
	<Style><LineStyle><color>ffff0000</color></LineStyle><PolyStyle><fill>0</fill></PolyStyle></Style>
      <LineString><coordinates>118.8385657,32.0429378 118.8338431,32.0439411</coordinates></LineString>
  </Placemark>
  <Placemark>
	<name>南京长江隧道</name>
	<Style><LineStyle><color>ffff0000</color></LineStyle><PolyStyle><fill>0</fill></PolyStyle></Style>
      <LineString><coordinates>118.67057150000001,32.0543862 118.6921381,32.0428005 118.6931683,32.0420084 118.6942853,32.0410913 118.6954844,32.0399309 118.6978042,32.037811</coordinates></LineString>
  </Placemark>
</Folder>
<Folder><name>市级地名</name>
  <Placemark>
	<name>南京市</name>
      <Point><coordinates>118.79126,32.06042</coordinates></Point>
  </Placemark>
  <Placemark>
	<name>马鞍山市</name>
      <Point><coordinates>118.49952,31.69933</coordinates></Point>
  </Placemark>
</Folder>
`

const dataMd = `\
KML文件本质上是一个XML文件，完全遵循XML文件格式。但是，KML文件定义了几个特殊的元素标签，常用标签为：Placemark：标记或路径 Linestring：路劲的坐标点 Point：标记位置的坐标 Coordinates：经纬度坐标
\`\`\`
<?xml version="1.0" encoding="utf-8" ?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document id="root_doc">
<Folder><name>高速公路</name>
  <Placemark>
	<name>卫岗隧道</name>
	<Style><LineStyle><color>ffff0000</color></LineStyle><PolyStyle><fill>0</fill></PolyStyle></Style>
      <LineString><coordinates>118.8385657,32.0429378 118.8338431,32.0439411</coordinates></LineString>
  </Placemark>
  <Placemark>
	<name>南京长江隧道</name>
	<Style><LineStyle><color>ffff0000</color></LineStyle><PolyStyle><fill>0</fill></PolyStyle></Style>
      <LineString><coordinates>118.67057150000001,32.0543862 118.6921381,32.0428005 118.6931683,32.0420084 118.6942853,32.0410913 118.6954844,32.0399309 118.6978042,32.037811</coordinates></LineString>
  </Placemark>
</Folder>
<Folder><name>市级地名</name>
  <Placemark>
	<name>南京市</name>
      <Point><coordinates>118.79126,32.06042</coordinates></Point>
  </Placemark>
  <Placemark>
	<name>马鞍山市</name>
      <Point><coordinates>118.49952,31.69933</coordinates></Point>
  </Placemark>
</Folder>
\`\`\`
`

const defaultLoadFuncStr = `\
async (dataSource, viewer) => {
    viewer.clock.shouldAnimate = false;
    const rider = dataSource.entities.getById("tour");
    await viewer.flyTo(rider)

    viewer.trackedEntity = rider;
    viewer.selectedEntity = viewer.trackedEntity;
    viewer.clock.multiplier = 30;
    viewer.clock.shouldAnimate = true;
}
`;

const defaultLoadFuncStr2 = `\
(dataSource) => {
    var entities = dataSource.entities.values;
 
    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      if (Cesium.defined(entity.billboard)) {
        // entity.label = undefined; // 去掉文字的显示
 
        entity.point = new Cesium.PointGraphics({
            color: Cesium.Color.BLUE,
            pixelSize: 10
        });
      }
    }   
}
`;

const defaultLoadFuncStr3 = `\
(dataSource) => {
    var entities = dataSource.entities.values;

    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      if (Cesium.defined(entity.billboard)) {
        // entity.label = undefined; // 去掉文字的显示

        entity.point = new Cesium.PointGraphics({
            color: Cesium.Color.YELLOW,
            pixelSize: 20
        });
      }
    }   
}
`;

const uri1 = '${xe2-assets-script-dir}/xe2-assets/scene-manager/misc/bikeRide.kml'
const uri2 = '${xe2-assets-script-dir}/xe2-assets/scene-manager/misc/facilities/facilities.kml'
const uri3 = '${xe2-assets-script-dir}/xe2-assets/scene-manager/misc/gdpPerCapita2008.kmz'

const defaultLoadFuncDocStr = `\
${uri1}

该路径可以使用下面回调函数
\`\`\`
${defaultLoadFuncStr}
\`\`\`

${uri2}

该路径可以使用下面回调函数
\`\`\`
${defaultLoadFuncStr2}
\`\`\`

${uri3}

该路径可以使用下面回调函数
\`\`\`
${defaultLoadFuncStr3}
\`\`\`
`

function parseXML(xmlStr: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, "application/xml");
  return doc
}

export class CzmKml extends Destroyable {
  private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
  get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
  flyTo(duration?: number) { this._flyToEvent.emit(duration); }

  private _loadFuncReact = this.disposeVar(react<((dataSource: Cesium.KmlDataSource, viewer?: Cesium.Viewer) => void) | undefined>(undefined));
  get loadFun() { return this._loadFuncReact.value; }
  set loadFun(value: ((dataSource: Cesium.KmlDataSource, viewer?: Cesium.Viewer) => void) | undefined) { this._loadFuncReact.value = value; }
  get loadFunChanged() { return this._loadFuncReact.changed; }

  private _clock;
  get clock() { return this._clock }

  private _resetClockEvent = this.disposeVar(new Event());
  get resetClockEvent() { return this._resetClockEvent; }
  resetClock() { this._resetClockEvent.emit(); }

  private _dataSource = this.dv(react<Cesium.KmlDataSource | undefined>(undefined));
  get dataSource() { return this._dataSource.value; }

  constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
    super();
    this._clock = this.disposeVar(new CzmClock(czmViewer));

    this.dispose(bind([this.clock, 'startTime'], [this, 'startTime']));
    this.dispose(bind([this.clock, 'stopTime'], [this, 'stopTime']));
    this.dispose(bind([this.clock, 'currentTime'], [this, 'currentTime']));
    this.dispose(bind([this.clock, 'multiplier'], [this, 'multiplier']));
    this.dispose(bind([this.clock, 'clockStep'], [this, 'clockStep']));
    this.dispose(bind([this.clock, 'clockRange'], [this, 'clockRange']));
    this.dispose(bind([this.clock, 'shouldAnimate'], [this, 'shouldAnimate']));
    this.dispose(bind([this.clock, 'enabled'], [this, 'clockEnabled']));

    const viewer = czmViewer.viewer;
    if (!viewer) {
      console.warn(`viewer is undefined!`);
      return;
    }

    let vessel: HTMLDivElement
    vessel = document.createElement('div')
    viewer.container.appendChild(vessel)
    vessel.style.pointerEvents = 'none'
    vessel.style.position = 'absolute'
    vessel.style.top = '0',
      vessel.style.left = '0'
    vessel.style.width = '100%'
    vessel.style.height = '100%'

    this.d(() => {
      viewer.container.removeChild(vessel)
    })

    this.d(this.flyToEvent.don((duration) => {
      if (!czmViewer.actived) return;
      if (!this.dataSource) return;
      if (duration !== undefined) {
        viewer.flyTo(this.dataSource, { duration: duration / 1000 });
      } else {
        viewer.flyTo(this.dataSource)
      }
    }));

    const resetPrimitive = () => {
      if (this.dataSource) {
        viewer.dataSources.remove(this.dataSource);
        this._dataSource.value = undefined;
      }
    };
    this.d(() => resetPrimitive());

    const resetClock = () => {
      if (!this.dataSource) {
        console.warn(`resetClock warn: dataSource is undefined!`)
        return;
      }
      const { dataSource } = this;
      if (!dataSource.clock) return;

      this.startTime = Cesium.JulianDate.toDate(dataSource.clock.startTime).getTime();
      this.stopTime = Cesium.JulianDate.toDate(dataSource.clock.stopTime).getTime();
      this.currentTime = Cesium.JulianDate.toDate(dataSource.clock.currentTime).getTime();
      this.multiplier = dataSource.clock.multiplier;
      this.clockStep = CzmClock.getClockStep(dataSource.clock.clockStep);
      this.clockRange = CzmClock.getClockRange(dataSource.clock.clockRange);
    };
    this.d(this.resetClockEvent.don(resetClock));

    const updateShow = () => {
      if (!this.dataSource) return;
      this.dataSource.show = this.show ?? CzmKml.defaults.show;
      vessel.style.display = (this.show ?? CzmKml.defaults.show) ? 'block' : 'none'
    };
    updateShow();
    this.d(this.showChanged.don(updateShow));

    const data = this.dv(react<string | Document | undefined>(undefined));
    {
      const update = () => {
        const getData = () => {
          if (!this.uri) return;
          if (this.uri && typeof this.uri != 'string') {
            Cesium.Resource.fetchXML({
              url: this.uri.url,
              headers: this.uri.headers,
              queryParameters: this.uri.queryParameters,
              templateValues: this.uri.templateValues,
              proxy: this.uri.proxy,
              retryCallback: this.uri.retryCallback,
              retryAttempts: this.uri.retryAttempts,
              request: this.uri.request
            })?.then(res => {
              return res
            })
          } else {
            return ESSceneObject.context.getStrFromEnv(this.uri)
          }
        }
        data.value = (this.data && parseXML(this.data)) ?? getData();
      };
      update();
      const event = this.dv(createNextAnimateFrameEvent(
        this.uriChanged,
        this.dataChanged,
      ));
      this.d(event.don(update));
    }

    {
      const processing = this.dv(createProcessingFromAsyncFunc(async cancelsManager => {
        resetPrimitive()

        if (!data.value) return;

        let dataSource: Cesium.KmlDataSource | undefined = undefined;
        try {
          dataSource = await Cesium.KmlDataSource.load(data.value, {
            camera: viewer.scene.camera,
            canvas: viewer.scene.canvas,
            screenOverlayContainer: vessel,
            clampToGround: this.clampToGround,
          });
        } catch (error) {
          dataSource = undefined;
          console.error(`kml加载报错：${error}`);
          console.error(error);
        }

        if (!dataSource) return;
        dataSource.entities.values.forEach(element => {
          //@ts-ignore
          Cesium.Entity.prototype && (dataSource.ESSceneObjectID = id);
        });
        cancelsManager.check();
        viewer.dataSources.add(dataSource);
        this._dataSource.value = dataSource;

        updateShow();
        if (this.autoResetClock ?? CzmKml.defaults.autoResetClock) {
          resetClock();
        }
        if (!this.loadFun) return;
        try {
          this.loadFun(dataSource, viewer);
        } catch (error) {
          console.error(error);
        }
      }));

      const update = () => {
        processing.isRunning && processing.cancel();
        processing.restart();
      };
      update();
      const event = this.dv(createNextAnimateFrameEvent(
        data.changed,
        this.loadFunChanged,
        this.clampToGroundChanged
      ))
      this.d(event.don(update))
    }
    {
      const update = () => {
        if (this.loadFuncStr) {
          try {
            const func = Function(`"use strict";return (${this.loadFuncStr})`)();
            this.loadFun = func;
          } catch (error) {
            console.error(error);
            this.loadFun = undefined;
          }
        } else {
          this.loadFun = undefined;
        }
      };
      update();
      this.d(this.loadFuncStrChanged.don(update));
    }
  }
  static defaults = {
    show: true,
    allowPicking: true,
    defaultLoadFuncStr: defaultLoadFuncStr,
    defaultLoadFuncDocStr: defaultLoadFuncDocStr,
    data: data,
    dataMd: dataMd,
    autoResetClock: true,
    clockEnabled: false,
    startTime: CzmClock.defaults.startTime,
    stopTime: CzmClock.defaults.stopTime,
    currentTime: CzmClock.defaults.currentTime,
    multiplier: CzmClock.defaults.multiplier,
    clockStep: CzmClock.defaults.clockStep,
    clockRange: CzmClock.defaults.clockRange,
    shouldAnimate: CzmClock.defaults.shouldAnimate,
    uri: '${xe2-assets-script-dir}/xe2-assets/scene-manager/misc/bikeRide.kml',
    clampToGround: false,
  };
}

export namespace CzmKml {
  export const createDefaultProps = () => ({
    show: true, // boolean} [show=true] A boolean Property specifying the visibility
    uri: undefined as string | undefined | ESJResource,
    allowPicking: undefined as boolean | undefined,
    loadFuncStr: undefined as string | undefined,
    data: undefined as string | undefined,
    autoResetClock: undefined as boolean | undefined,
    clockEnabled: undefined as boolean | undefined,
    startTime: undefined as number | undefined,
    stopTime: undefined as number | undefined,
    currentTime: undefined as number | undefined,
    multiplier: undefined as number | undefined,
    clockStep: undefined as ESJClockStepType | undefined,
    clockRange: undefined as ESJClockRangeType | undefined,
    shouldAnimate: undefined as boolean | undefined,
    clampToGround: undefined as boolean | undefined,
  });
}
extendClassProps(CzmKml.prototype, CzmKml.createDefaultProps);
export interface CzmKml extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmKml.createDefaultProps>> { }