import { BooleanProperty, DateProperty, EnumProperty, ESJClockRangeType, ESJClockStepType, ESJResource, ESSceneObject, EvalStringProperty, FunctionProperty, GroupProperty, JsonProperty, LongStringProperty, NumberProperty, Property, StringProperty } from "earthsdk3";
import { Listener, Event, extendClassProps, ReactivePropsToNativePropsAndChanged } from "xbsj-base";

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

export class ESKml extends ESSceneObject {
  static readonly type = this.register('ESKml', this, { chsName: 'ESKml', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "Kml数据加载" });
  get typeName() { return 'ESKml'; }
  override get defaultProps() { return ESKml.createDefaultProps(); }

  private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
  get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
  flyTo(duration?: number) { this._flyToEvent.emit(duration); }

  private _resetClockEvent = this.disposeVar(new Event());
  get resetClockEvent() { return this._resetClockEvent; }
  resetClock() { this._resetClockEvent.emit(); }

  constructor(id?: string) {
    super(id);

  }
  static override defaults = {
    ...ESSceneObject.defaults,
    show: true,
    allowPicking: false,
    defaultLoadFuncStr: defaultLoadFuncStr,
    defaultLoadFuncDocStr: defaultLoadFuncDocStr,
    data: data,
    dataMd: dataMd,
    autoResetClock: true,
    clockEnabled: false,
    startTime: () => Date.now(),
    stopTime: () => Date.now() + 24 * 60 * 60 * 1000,
    currentTime: () => Date.now(),
    multiplier: 1,
    clockStep: 'SYSTEM_CLOCK_MULTIPLIER' as ESJClockStepType,
    clockRange: 'UNBOUNDED' as ESJClockRangeType,
    shouldAnimate: false,
    uri: '${xe2-assets-script-dir}/xe2-assets/scene-manager/misc/bikeRide.kml',
  };
  override getESProperties() {
    const properties = { ...super.getESProperties() };
    return {
      ...properties,
      defaultMenu: 'basic',
      basic: [
        ...properties.basic,
        new LongStringProperty('数据', '数据', true, false, [this, 'data'], ESKml.defaults.data),
        new JsonProperty('路径', '路径', true, false, [this, 'uri'], ESKml.defaults.uri),
        // new EvalStringProperty('loadFnStr', 'loadFnStr', true, false, [this, 'loadFuncStr'], ESKml.defaults.defaultLoadFuncStr, ESKml.defaults.defaultLoadFuncDocStr),
        new BooleanProperty('自动设置时钟', '自动设置时钟', false, false, [this, 'autoResetClock'], ESKml.defaults.autoResetClock),
        // new FunctionProperty('重设时钟', '根据当前加载的数据重设始终', [], () => this.resetClock(), []),
        new BooleanProperty('启用', '启用', false, false, [this, 'clockEnabled'], ESKml.defaults.clockEnabled),
        new BooleanProperty('是否启用动画', '是否启用动画', false, false, [this, 'shouldAnimate'], ESKml.defaults.shouldAnimate),
        new DateProperty('开始时间', '开始时间', true, false, [this, 'startTime'], ESKml.defaults.startTime),
        new DateProperty('结束时间', '结束时间', true, false, [this, 'stopTime'], ESKml.defaults.stopTime),
        new DateProperty('当前时间', '当前时间', true, false, [this, 'currentTime'], ESKml.defaults.currentTime),
        new NumberProperty('倍速', '倍速.', false, false, [this, 'multiplier'], ESKml.defaults.multiplier),
        new EnumProperty('clockStep', 'clockStep', false, false, [this, 'clockStep'], [['TICK_DEPENDENT', 'TICK_DEPENDENT'], ['SYSTEM_CLOCK_MULTIPLIER', 'SYSTEM_CLOCK_MULTIPLIER'], ['SYSTEM_CLOCK', 'SYSTEM_CLOCK']], ESKml.defaults.clockStep),
        new EnumProperty('clockRange', 'clockRange', false, false, [this, 'clockRange'], [['UNBOUNDED', 'UNBOUNDED'], ['CLAMPED', 'CLAMPED'], ['LOOP_STOP', 'LOOP_STOP']], ESKml.defaults.clockRange),
      ],
      general: [
        ...properties.general,
        new StringProperty('唯一标识', 'id', false, true, [this, 'id']),
        new StringProperty('名称', 'name', true, false, [this, 'name']),
        new BooleanProperty('是否显示', 'show', false, false, [this, 'show'], true),
        new BooleanProperty('开启碰撞', 'collision', false, false, [this, 'collision'], false),
        new BooleanProperty('允许拾取', 'allowPicking', false, false, [this, 'allowPicking'], false),
        // new FunctionProperty("飞入", "飞入flyTo", ['number'], (duration: number) => this.flyTo(duration ?? 1), [1]),
      ]
    }
  };
  override getProperties(language?: string) {
    return [
      ...super.getProperties(language),
      new GroupProperty('通用', '通用', [
        new BooleanProperty('是否显示', 'A boolean Property specifying the visibility .', false, false, [this, 'show']),
        new BooleanProperty('允许拾取', '是否允许拾取', false, false, [this, 'allowPicking']),
        new FunctionProperty("飞入", "飞入", ['number'], (duration: number) => this.flyTo(duration), [1000]),
        new LongStringProperty('数据', '数据', true, false, [this, 'data'], ESKml.defaults.data, ESKml.defaults.dataMd),
        new JsonProperty('路径', '路径', true, false, [this, 'uri'], ESKml.defaults.uri),
        new EvalStringProperty('loadFnStr', 'loadFnStr', true, false, [this, 'loadFuncStr'], ESKml.defaults.defaultLoadFuncStr, ESKml.defaults.defaultLoadFuncDocStr),
        new BooleanProperty('自动设置时钟', '自动设置时钟', false, false, [this, 'autoResetClock']),
        new FunctionProperty('重设时钟', '根据当前加载的数据重设始终', [], () => this.resetClock(), []),
      ]),
      new GroupProperty('时钟', '时钟', [
        new BooleanProperty('启用', '启用', false, false, [this, 'clockEnabled']),
        new DateProperty('开始时间', '开始时间', true, false, [this, 'startTime'], ESKml.defaults.startTime),
        new DateProperty('结束时间', '结束时间', true, false, [this, 'stopTime'], ESKml.defaults.stopTime),
        new DateProperty('当前时间', '当前时间', true, false, [this, 'currentTime'], ESKml.defaults.currentTime),
        new NumberProperty('倍速', '倍速.', false, false, [this, 'multiplier']),
        new EnumProperty('clockStep', 'clockStep', false, false, [this, 'clockStep'], [['TICK_DEPENDENT', 'TICK_DEPENDENT'], ['SYSTEM_CLOCK_MULTIPLIER', 'SYSTEM_CLOCK_MULTIPLIER'], ['SYSTEM_CLOCK', 'SYSTEM_CLOCK']]),
        new EnumProperty('clockRange', 'clockRange', false, false, [this, 'clockRange'], [['UNBOUNDED', 'UNBOUNDED'], ['CLAMPED', 'CLAMPED'], ['LOOP_STOP', 'LOOP_STOP']]),
        new BooleanProperty('是否启用动画', '是否启用动画', false, false, [this, 'shouldAnimate']),
      ]),
    ]
  }
}

export namespace ESKml {
  export const createDefaultProps = () => ({
    show: true, // boolean} [show=true] A boolean Property specifying the visibility
    uri: "" as string | undefined | ESJResource,
    allowPicking: false,
    loadFuncStr: undefined as string | undefined,
    data: undefined as string | undefined,
    autoResetClock: true,
    clockEnabled: false,
    startTime: undefined as number | undefined,
    stopTime: undefined as number | undefined,
    currentTime: undefined as number | undefined,
    multiplier: 1,
    clockStep: 'SYSTEM_CLOCK_MULTIPLIER',
    clockRange: 'UNBOUNDED',
    shouldAnimate: false,
    clampToGround: false,
    ...ESSceneObject.createDefaultProps(),
  });
}
extendClassProps(ESKml.prototype, ESKml.createDefaultProps);
export interface ESKml extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESKml.createDefaultProps>> { }
