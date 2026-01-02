// TypeScript declarations for @xeokit/xeokit-sdk
// Debug: Type definitions for xeokit 3D viewer integration

declare module '@xeokit/xeokit-sdk' {
  // Debug: Core Viewer class
  export class Viewer {
    constructor(config: ViewerConfig);
    scene: Scene;
    camera: Camera;
    cameraControl: CameraControl;
    cameraFlight: CameraFlightAnimation;
    destroy(): void;
  }

  // Debug: Viewer configuration
  export interface ViewerConfig {
    canvasId?: string;
    canvasElement?: HTMLCanvasElement;
    transparent?: boolean;
    backgroundColor?: number[];
    antialias?: boolean;
    gammaInput?: boolean;
    gammaOutput?: boolean;
    units?: string;
    scale?: number;
    origin?: number[];
    saoEnabled?: boolean;
    pbrEnabled?: boolean;
  }

  // Debug: Scene class
  export class Scene {
    canvas: {
      canvas: HTMLCanvasElement;
      boundary: number[];
      getSnapshot(params?: { format?: string; width?: number; height?: number }): string;
    };
    input: Input;
    models: { [key: string]: any };
    modelIds: string[];
    getAABB(aabb?: number[]): number[];
    setObjectsVisible(objectIds: string[], visible: boolean): void;
    setObjectsSelected(objectIds: string[], selected: boolean): void;
    setObjectsHighlighted(objectIds: string[], highlighted: boolean): void;
    setObjectsXRayed(objectIds: string[], xrayed: boolean): void;
    pick(params: { canvasPos: number[]; pickSurface?: boolean }): PickResult | null;
  }

  // Debug: Camera class
  export class Camera {
    eye: number[];
    look: number[];
    up: number[];
    projection: string;
    ortho: {
      scale: number;
    };
    perspective: {
      fov: number;
    };
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
  }

  // Debug: Camera control
  export class CameraControl {
    navMode: string;
    followPointer: boolean;
    doublePickFlyTo: boolean;
    panRightClick: boolean;
    active: boolean;
    keyboardLayout?: string;
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
  }

  // Debug: Camera flight animation
  export class CameraFlightAnimation {
    flyTo(params: CameraFlightParams, callback?: Function): void;
    jumpTo(params: CameraFlightParams): void;
    stop(): void;
  }

  // Debug: Camera flight parameters
  export interface CameraFlightParams {
    eye?: number[];
    look?: number[];
    up?: number[];
    aabb?: number[];
    duration?: number;
    orthoScale?: number;
    projection?: string;
  }

  // Debug: Input handling
  export class Input {
    on(event: string, callback: Function): string;
    off(handle: string): void;
  }

  // Debug: Pick result
  export interface PickResult {
    entity: Entity | null;
    primitive: string;
    primIndex: number;
    indices: number[];
    localPos: number[];
    worldPos: number[];
    viewPos: number[];
    bary: number[];
    worldNormal: number[];
    uv: number[];
    canvasPos: number[];
  }

  // Debug: Entity (3D object)
  export class Entity {
    id: string;
    type: string;
    model: any;
    parent: Entity | null;
    numChildren: number;
    children: Entity[];
    selected: boolean;
    highlighted: boolean;
    xrayed: boolean;
    visible: boolean;
    culled: boolean;
    pickable: boolean;
    colorize: number[];
    opacity: number;
    aabb: number[];
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
  }

  // Debug: XKT model loader
  export class XKTLoaderPlugin {
    constructor(viewer: Viewer, config?: XKTLoaderConfig);
    load(params: XKTLoadParams): any;
    destroy(): void;
  }

  // Debug: XKT loader configuration
  export interface XKTLoaderConfig {
    dataSource?: any;
    objectDefaults?: {
      IfcSpace?: { visible?: boolean; pickable?: boolean };
      IfcWall?: { colorize?: number[] };
      [key: string]: any;
    };
    includeTypes?: string[];
    excludeTypes?: string[];
    excludeUnclassifiedObjects?: boolean;
    globalizeObjectIds?: boolean;
    reuseGeometries?: boolean;
  }

  // Debug: XKT load parameters
  export interface XKTLoadParams {
    id: string;
    src?: string;
    xkt?: ArrayBuffer;
    metaModelSrc?: string;
    metaModelData?: any;
    edges?: boolean;
    excludeTypes?: string[];
    includeTypes?: string[];
    rotation?: number[];
    scale?: number[];
    origin?: number[];
    matrix?: number[];
    backfaces?: boolean;
    dtxEnabled?: boolean;
  }

  // Debug: Annotations plugin
  export class AnnotationsPlugin {
    constructor(viewer: Viewer, config?: any);
    createAnnotation(params: AnnotationParams): Annotation;
    destroyAnnotation(id: string): void;
    destroy(): void;
  }

  // Debug: Annotation parameters
  export interface AnnotationParams {
    id: string;
    entity?: Entity;
    worldPos: number[];
    occludable?: boolean;
    markerShown?: boolean;
    labelShown?: boolean;
    markerHTML?: string;
    labelHTML?: string;
    values?: { [key: string]: any };
  }

  // Debug: Annotation
  export class Annotation {
    id: string;
    worldPos: number[];
    entity: Entity | null;
    labelShown: boolean;
    markerShown: boolean;
    destroy(): void;
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
  }

  // Debug: BCF viewpoints plugin
  export class BCFViewpointsPlugin {
    constructor(viewer: Viewer, config?: any);
    getViewpoint(params?: any): any;
    setViewpoint(bcfViewpoint: any, params?: any): void;
    destroy(): void;
  }

  // Debug: NavCube plugin
  export class NavCubePlugin {
    constructor(viewer: Viewer, config?: NavCubeConfig);
    setVisible(visible: boolean): void;
    destroy(): void;
  }

  // Debug: NavCube configuration
  export interface NavCubeConfig {
    canvasId?: string;
    visible?: boolean;
    cameraFly?: boolean;
    cameraFitFOV?: number;
    cameraFlyDuration?: number;
    color?: string;
    hoverColor?: string;
    textColor?: string;
  }

  // Debug: Section planes plugin
  export class SectionPlanesPlugin {
    constructor(viewer: Viewer, config?: any);
    createSectionPlane(params: SectionPlaneParams): SectionPlane;
    destroy(): void;
  }

  // Debug: Section plane parameters
  export interface SectionPlaneParams {
    id?: string;
    pos?: number[];
    dir?: number[];
    active?: boolean;
  }

  // Debug: Section plane
  export class SectionPlane {
    id: string;
    pos: number[];
    dir: number[];
    active: boolean;
    destroy(): void;
  }

  // Debug: Distance measurements plugin
  export class DistanceMeasurementsPlugin {
    constructor(viewer: Viewer, config?: any);
    createMeasurement(params: MeasurementParams): Measurement;
    destroy(): void;
  }

  // Debug: Measurement parameters
  export interface MeasurementParams {
    id?: string;
    origin: {
      entity?: Entity;
      worldPos: number[];
    };
    target: {
      entity?: Entity;
      worldPos: number[];
    };
    visible?: boolean;
    originVisible?: boolean;
    targetVisible?: boolean;
    wireVisible?: boolean;
    axisVisible?: boolean;
    labelsVisible?: boolean;
  }

  // Debug: Measurement
  export class Measurement {
    id: string;
    length: number;
    destroy(): void;
  }

  // Debug: Utils
  export const utils: {
    math: {
      vec3: (values?: number[]) => number[];
      vec4: (values?: number[]) => number[];
      mat4: () => number[];
      identityMat4: (mat?: number[]) => number[];
      transformPoint3: (mat: number[], pos: number[], dest?: number[]) => number[];
      transformVec3: (mat: number[], vec: number[], dest?: number[]) => number[];
      lenVec3: (vec: number[]) => number[];
      normalizeVec3: (vec: number[], dest?: number[]) => number[];
      subVec3: (a: number[], b: number[], dest?: number[]) => number[];
      addVec3: (a: number[], b: number[], dest?: number[]) => number[];
      mulVec3Scalar: (vec: number[], scalar: number, dest?: number[]) => number[];
      dotVec3: (a: number[], b: number[]) => number;
      cross3Vec3: (a: number[], b: number[], dest?: number[]) => number[];
      AABB3: () => AABB3;
      getAABB3Center: (aabb: number[], dest?: number[]) => number[];
      collapseAABB3: (aabb?: number[]) => number[];
      expandAABB3: (aabb: number[], point: number[]) => number[];
      expandAABB3Points3: (aabb: number[], points: number[][]) => number[];
    };
  };

  // Debug: AABB3 helper
  export interface AABB3 {
    min: number[];
    max: number[];
  }
}
