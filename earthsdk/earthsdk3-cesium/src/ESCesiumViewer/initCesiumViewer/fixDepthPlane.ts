// @ts-nocheck

//import Cesium from 'Cesium';
import * as Cesium from 'cesium';

// vtxf 20181026
// Cesium中如果globe.depthTestAgainstTerrain为false时，会使用DepthPlane来绘制一个深度，这样可以挡住地球背面的物体。
// 然而这个DepthPlane会自动变化，当相机距离地面很近时，会导致地下的物体不可见！
// 更恶心的是会导致pickPosition获取的值忽大忽小；
// 这里的修改原理很简单，就是让深度值后退5000米，
// 这样，pickPosition拾取到DepthPlane的深度值时，其海拔高度就肯定是5000米以下的地方，
// 可以根据这一点来判断是否拾取到了DepthPlane，
// 这里假定人类无法到达海拔5000米以下的环境！
// 唯一修改的语句：
// VS中增加了一句 positionEC.z -= 5000.0;

var DepthPlaneVS = 
`
attribute vec4 position;

out vec4 positionEC;

void main()
{
    positionEC = czm_modelView * position;
    positionEC.z -= 5000.0;
    gl_Position = czm_projection * positionEC;

    czm_vertexLogDepth();
}
`;

var DepthPlaneFS = 
`
in vec4 positionEC;

void main()
{
    // TODO: make arbitrary ellipsoid
    czm_ellipsoid ellipsoid = czm_getWgs84EllipsoidEC();

    vec3 direction = normalize(positionEC.xyz);
    czm_ray ray = czm_ray(vec3(0.0), direction);

    czm_raySegment intersection = czm_rayEllipsoidIntersectionInterval(ray, ellipsoid);
    if (!czm_isEmpty(intersection))
    {
        out_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    }
    else
    {
        discard;
    }

    czm_writeLogDepth();
}
`;


export function fixDepthPlane() {
    if (!Cesium.DepthPlane.xbsjFixed) {
        Cesium.DepthPlane.xbsjFixed = true;
    
        var originUpdate = Cesium.DepthPlane.prototype.update;
        
        Cesium.DepthPlane.prototype.update = function () {
            originUpdate.bind(this)(...arguments);
        
            // arguments变量，1.49版本有两个 frameState、useLogDepth，1.50版本只有 frameState。
            var frameState = arguments[0];
            var useLogDepth = arguments[1];
        
            // var context = frameState.context;
            // var ellipsoid = frameState.mapProjection.ellipsoid;
            // var useLogDepth = useLogDepth || frameState.useLogDepth; // Cesium 1.50后，用arguments[1]
        
            // if (!Cesium.defined(this._sp2) || this._useLogDepth !== useLogDepth) {
            //     this._useLogDepth = useLogDepth;
            
            //     var vs = new Cesium.ShaderSource({
            //         sources : [DepthPlaneVS]
            //     });
            //     var fs = new Cesium.ShaderSource({
            //         sources : [DepthPlaneFS]
            //     });
            //     if (useLogDepth) {
            //         var extension =
            //             '#ifdef GL_EXT_frag_depth \n' +
            //             '#extension GL_EXT_frag_depth : enable \n' +
            //             '#endif \n\n';
            
            //         fs.sources.push(extension);
            //         fs.defines.push('LOG_DEPTH');
            //         vs.defines.push('LOG_DEPTH');
            //         vs.defines.push('DISABLE_GL_POSITION_LOG_DEPTH');
            //     }
            
            //     this._sp2 = Cesium.ShaderProgram.replaceCache({
            //         shaderProgram : this._sp2,
            //         context : context,
            //         vertexShaderSource : vs,
            //         fragmentShaderSource : fs,
            //         attributeLocations : {
            //             position : 0
            //         }
            //     });
            
            //     this._command.shaderProgram = this._sp2;
            // }
            if (!this.hasXbsjIndexBuffer && this._va) {
                this.hasXbsjIndexBuffer = true;
    
                var context = frameState.context;
                var geometry = new Cesium.Geometry({
                    attributes : {
                        position : new Cesium.GeometryAttribute({
                            componentDatatype : Cesium.ComponentDatatype.FLOAT,
                            componentsPerAttribute : 3,
                            values : new Float32Array(15), // 最后三个值始终为0
                        })
                    },
                    indices : [0, 1, 4, 1, 3, 4, 3, 2, 4, 2, 0, 4], // 修改索引
                    primitiveType : Cesium.PrimitiveType.TRIANGLES
                });
    
                this._va = Cesium.VertexArray.fromGeometry({
                    context : context,
                    geometry : geometry,
                    attributeLocations : {
                        position : 0
                    },
                    bufferUsage : Cesium.BufferUsage.DYNAMIC_DRAW
                });
    
                this._command.vertexArray = this._va;
            }
        }
    }    
}
