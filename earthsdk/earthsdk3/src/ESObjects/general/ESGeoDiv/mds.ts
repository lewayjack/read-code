import { ESViewer } from "../../../ESViewer";
import { ESGeoDiv } from "./index";

const defaulInstanceClassStr = `class MyDiv {
  // container是Poi的div
  // geoCustomDivPoi指向当前的GeoCustomDivPoi场景对象
  // viewer指定当前的视口
  constructor(container, eSGeoDiv, viewer) {       
      this._container = container;
      this._div = document.createElement('div');
      this._container.appendChild(this._div);

      this._div.style.width = '300px';
      this._div.style.height = '50px';
      this._div.style.background = 'rgba(120, 120, 0, 0.7)';
      this._div.style.color = 'white';
      this._div.style.fontSize = '30px';
      this._div.style.lineHeight = '50px';
      this._div.style.border = '1px solid white';
      this._div.innerText = 'Hello world!';
  }

  // 随机背景颜色，仅用于测试外部强制更新，此函数非必需
  update() {
      const r = (255 * Math.random()) | 0;
      const g = (255 * Math.random()) | 0;
      const b = (255 * Math.random()) | 0;
      this._div.style.background = \`rgba(\${r}, \${g}, \${b}, 0.8)\`;
  }

  // 销毁函数，注意此函数必需，否则会报错！
  destroy() {
      this._container.removeChild(this._div);
  }
}`;

const instanceClassStrReadMe = `\
示例代码：  
\`\`\`
${defaulInstanceClassStr}
\`\`\`
`;

const defaultInnerHTML = `\
<div style="width: 300px; height: 50px; background: rgba(120, 120, 0, 0.7); color: white; font-size: 30px; line-height: 50px; border: 1px solid white;">Hello world!</div>
`;

const innerHTMLReadMe = `\
示例代码：  
\`\`\`
${defaultInnerHTML}
\`\`\`
`;


//示例集合
const echartsFunStrMd = `
示例1:柱状图
\`\`\`
function init() {
    var option = {
        xAxis: {
          type: 'category',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            data: [
              120,
              {
                value: 200,
                itemStyle: {
                  color: '#a90000'
                }
              },
              150,
              80,
              70,
              110,
              130
            ],
            type: 'bar'
          }
        ]
      }
    return option
}
\`\`\`
示例2:折线图
\`\`\`
function init() {
    var option  = {
        title: {
          text: 'Stacked Line'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['Email', 'Union Ads', 'Video Ads', 'Direct', 'Search Engine']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'Email',
            type: 'line',
            stack: 'Total',
            data: [120, 132, 101, 134, 90, 230, 210]
          },
          {
            name: 'Union Ads',
            type: 'line',
            stack: 'Total',
            data: [220, 182, 191, 234, 290, 330, 310]
          },
          {
            name: 'Video Ads',
            type: 'line',
            stack: 'Total',
            data: [150, 232, 201, 154, 190, 330, 410]
          },
          {
            name: 'Direct',
            type: 'line',
            stack: 'Total',
            data: [320, 332, 301, 334, 390, 330, 320]
          },
          {
            name: 'Search Engine',
            type: 'line',
            stack: 'Total',
            data: [820, 932, 901, 934, 1290, 1330, 1320]
          }
        ]
      }
    return option
}
\`\`\`
示例3:饼图
\`\`\`
function init() {
    var option = {
        title: {
          text: 'Referer of a Website',
          subtext: 'Fake Data',
          left: 'center'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: 'Access From',
            type: 'pie',
            radius: '50%',
            data: [
              { value: 1048, name: 'Search Engine' },
              { value: 735, name: 'Direct' },
              { value: 580, name: 'Email' },
              { value: 484, name: 'Union Ads' },
              { value: 300, name: 'Video Ads' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
    return option
}
\`\`\`


`;


export {
    defaulInstanceClassStr, instanceClassStrReadMe, defaultInnerHTML, innerHTMLReadMe, echartsFunStrMd
}


export type ESGeoDivInstanceClass<DivClass extends { destroy(): undefined } = { destroy(): undefined }> = (new (container: HTMLDivElement, eSGeoDiv: ESGeoDiv, viewer: ESViewer) => DivClass);
