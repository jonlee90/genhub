/**
 * Default 3D Models for Projects
 *
 * Generates procedural default models based on project type when no user model exists.
 * These models provide a visual placeholder and reference for spatial coordination.
 *
 * IMPORTANT: This file uses dynamic imports to avoid SSR issues with xeokit-sdk
 * NO xeokit imports at module level - all imports are lazy-loaded client-side only
 */

// Use any for Viewer type to avoid importing from xeokit at module level
type Viewer = any;

// Dynamic imports for xeokit to avoid SSR issues
let Mesh: any;
let buildBoxGeometry: any;
let PhongMaterial: any;
let ReadableGeometry: any;

// Flag to track if xeokit has been loaded
let xeokitLoaded = false;

// Lazy load xeokit SDK (client-side only)
async function loadXeokit() {
  if (xeokitLoaded) return;

  if (typeof window === 'undefined') {
    console.warn('[DefaultModels] Cannot load xeokit in SSR environment');
    return;
  }

  try {
    const xeokit = await import('@xeokit/xeokit-sdk');
    Mesh = (xeokit as any).Mesh;
    buildBoxGeometry = (xeokit as any).buildBoxGeometry;
    PhongMaterial = (xeokit as any).PhongMaterial;
    ReadableGeometry = (xeokit as any).ReadableGeometry;
    xeokitLoaded = true;
    console.log('[DefaultModels] Xeokit SDK loaded successfully');
  } catch (error) {
    console.error('[DefaultModels] Failed to load xeokit SDK:', error);
  }
}

console.log('[DefaultModels] Module loaded');

export interface DefaultModelConfig {
  projectType: string;
  modelId: string;
  color?: [number, number, number];
  opacity?: number;
}

/**
 * Load the cafe.xkt model from public/models/
 * This is a real 3D model converted from cafe.ifc
 */
export async function loadCafeModel(viewer: Viewer, config?: Partial<DefaultModelConfig>): Promise<void> {
  console.log('[DefaultModels] Loading cafe.xkt model');

  try {
    // Use XKTLoaderPlugin to load the cafe model
    const { XKTLoaderPlugin } = await import('@xeokit/xeokit-sdk');

    if (!viewer) {
      throw new Error('Viewer not initialized');
    }

    // Create XKT loader plugin
    const xktLoaderPlugin = new XKTLoaderPlugin(viewer);

    console.log('[DefaultModels] XKT plugin created');

    // Load the cafe.xkt file from public directory
    const modelId = config?.modelId || 'default-cafe-model';
    const model = xktLoaderPlugin.load({
      id: modelId,
      src: '/models/cafe.xkt', // Public file
      edges: true,
    });

    // Wait for model to load
    return new Promise((resolve, reject) => {
      model.on('loaded', () => {
        console.log('[DefaultModels] Cafe model loaded successfully');

        // Fit camera to model
        const scene = viewer.scene;
        const aabb = scene.getAABB();
        if (aabb) {
          viewer.cameraFlight.flyTo({
            aabb,
            duration: 1.0,
          });
        }

        resolve();
      });

      model.on('error', (err: any) => {
        console.error('[DefaultModels] Cafe model load error:', err);
        reject(new Error(`Failed to load cafe model: ${err}`));
      });

      // Set timeout for loading
      setTimeout(() => {
        if (model.loaded === false) {
          reject(new Error('Cafe model loading timeout'));
        }
      }, 30000); // 30 second timeout
    });
  } catch (error) {
    console.error('[DefaultModels] Failed to load cafe model:', error);
    throw error;
  }
}

/**
 * Create a default residential house model
 * Simple house shape with walls, roof, and foundation
 */
export async function createResidentialHouseModel(viewer: Viewer, config?: Partial<DefaultModelConfig>): Promise<void> {
  console.log('[DefaultModels] Creating default residential house model');

  // Ensure xeokit SDK is loaded
  await loadXeokit();

  if (!xeokitLoaded) {
    console.error('[DefaultModels] Cannot create model - xeokit SDK not loaded');
    return;
  }

  const modelId = config?.modelId || 'default-residential-house';
  const buildableModel = viewer.scene.models[modelId];

  // Remove existing model if it exists
  if (buildableModel) {
    buildableModel.destroy();
  }

  try {
    // Create buildable mesh for procedural geometry (dynamically loaded)

    // House dimensions (in meters)
    const foundationHeight = 0.5;
    const wallHeight = 3.0;
    const roofHeight = 2.0;
    const houseWidth = 10.0;
    const houseDepth = 12.0;

    // Materials
    const foundationMaterial = new PhongMaterial(viewer.scene, {
      diffuse: [0.5, 0.5, 0.5],
      ambient: [0.3, 0.3, 0.3],
      specular: [0.1, 0.1, 0.1],
      shininess: 10,
    });

    const wallMaterial = new PhongMaterial(viewer.scene, {
      diffuse: [0.9, 0.9, 0.85], // Off-white walls
      ambient: [0.5, 0.5, 0.5],
      specular: [0.2, 0.2, 0.2],
      shininess: 30,
    });

    const roofMaterial = new PhongMaterial(viewer.scene, {
      diffuse: [0.3, 0.2, 0.2], // Dark brown roof
      ambient: [0.2, 0.15, 0.15],
      specular: [0.1, 0.1, 0.1],
      shininess: 20,
    });

    // Foundation (concrete slab)
    const foundationGeometry = buildBoxGeometry({
      center: [0, foundationHeight / 2, 0],
      xSize: houseWidth,
      ySize: foundationHeight,
      zSize: houseDepth,
    });

    const foundationMesh = new Mesh(viewer.scene, {
      id: `${modelId}-foundation`,
      geometry: new ReadableGeometry(viewer.scene, foundationGeometry),
      material: foundationMaterial,
      isObject: true, // Register in scene.objects
    });

    console.log('[DefaultModels] Created foundation mesh:', foundationMesh.id);

    // Walls (4 walls forming a box)
    const wallThickness = 0.2;
    const wallY = foundationHeight + (wallHeight / 2);

    // Front wall
    const frontWallGeometry = buildBoxGeometry({
      center: [0, wallY, -houseDepth / 2],
      xSize: houseWidth,
      ySize: wallHeight,
      zSize: wallThickness,
    });

    const frontWallMesh = new Mesh(viewer.scene, {
      id: `${modelId}-wall-front`,
      geometry: new ReadableGeometry(viewer.scene, frontWallGeometry),
      material: wallMaterial,
      isObject: true, // Register in scene.objects
    });

    console.log('[DefaultModels] Created front wall mesh:', frontWallMesh.id);

    // Back wall
    const backWallGeometry = buildBoxGeometry({
      center: [0, wallY, houseDepth / 2],
      xSize: houseWidth,
      ySize: wallHeight,
      zSize: wallThickness,
    });

    const backWallMesh = new Mesh(viewer.scene, {
      id: `${modelId}-wall-back`,
      geometry: new ReadableGeometry(viewer.scene, backWallGeometry),
      material: wallMaterial,
      isObject: true, // Register in scene.objects
    });

    console.log('[DefaultModels] Created back wall mesh:', backWallMesh.id);

    // Left wall
    const leftWallGeometry = buildBoxGeometry({
      center: [-houseWidth / 2, wallY, 0],
      xSize: wallThickness,
      ySize: wallHeight,
      zSize: houseDepth,
    });

    const leftWallMesh = new Mesh(viewer.scene, {
      id: `${modelId}-wall-left`,
      geometry: new ReadableGeometry(viewer.scene, leftWallGeometry),
      material: wallMaterial,
      isObject: true, // Register in scene.objects
    });

    console.log('[DefaultModels] Created left wall mesh:', leftWallMesh.id);

    // Right wall
    const rightWallGeometry = buildBoxGeometry({
      center: [houseWidth / 2, wallY, 0],
      xSize: wallThickness,
      ySize: wallHeight,
      zSize: houseDepth,
    });

    const rightWallMesh = new Mesh(viewer.scene, {
      id: `${modelId}-wall-right`,
      geometry: new ReadableGeometry(viewer.scene, rightWallGeometry),
      material: wallMaterial,
      isObject: true, // Register in scene.objects
    });

    console.log('[DefaultModels] Created right wall mesh:', rightWallMesh.id);

    // Simple gabled roof (two slopes)
    const roofY = foundationHeight + wallHeight + (roofHeight / 2);

    // Left roof slope
    const leftRoofGeometry = buildBoxGeometry({
      center: [-houseWidth / 4, roofY, 0],
      xSize: houseWidth / 2 + 0.5,
      ySize: 0.1, // Thin roof
      zSize: houseDepth + 0.5,
    });

    const leftRoofMesh = new Mesh(viewer.scene, {
      id: `${modelId}-roof-left`,
      geometry: new ReadableGeometry(viewer.scene, leftRoofGeometry),
      material: roofMaterial,
      isObject: true, // Register in scene.objects
      rotation: [0, 0, 25], // Sloped
      position: [-1, roofY + 0.5, 0],
    });

    console.log('[DefaultModels] Created left roof mesh:', leftRoofMesh.id);

    // Right roof slope
    const rightRoofGeometry = buildBoxGeometry({
      center: [houseWidth / 4, roofY, 0],
      xSize: houseWidth / 2 + 0.5,
      ySize: 0.1,
      zSize: houseDepth + 0.5,
    });

    const rightRoofMesh = new Mesh(viewer.scene, {
      id: `${modelId}-roof-right`,
      geometry: new ReadableGeometry(viewer.scene, rightRoofGeometry),
      material: roofMaterial,
      isObject: true, // Register in scene.objects
      rotation: [0, 0, -25], // Sloped opposite direction
      position: [1, roofY + 0.5, 0],
    });

    console.log('[DefaultModels] Created right roof mesh:', rightRoofMesh.id);

    // Verify meshes were created and are accessible in scene.objects
    const objectCount = Object.keys(viewer.scene.objects || {}).length;
    const objectIds = Object.keys(viewer.scene.objects || {});
    const sceneAABB = viewer.scene.aabb;

    console.log('[DefaultModels] Object verification:', {
      objectCount,
      objectIds,
      expectedObjectIds: [
        `${modelId}-foundation`,
        `${modelId}-wall-front`,
        `${modelId}-wall-back`,
        `${modelId}-wall-left`,
        `${modelId}-wall-right`,
        `${modelId}-roof-left`,
        `${modelId}-roof-right`,
      ],
      sceneAABB,
    });

    // Check if each expected mesh exists in scene.objects
    const expectedMeshes = [
      foundationMesh,
      frontWallMesh,
      backWallMesh,
      leftWallMesh,
      rightWallMesh,
      leftRoofMesh,
      rightRoofMesh,
    ];

    expectedMeshes.forEach((mesh, index) => {
      const inScene = viewer.scene.objects && viewer.scene.objects[mesh.id] !== undefined;
      console.log(`[DefaultModels] Mesh ${index + 1}:`, {
        id: mesh.id,
        visible: mesh.visible,
        isObject: mesh.isObject,
        inSceneObjects: inScene,
      });
    });

    console.log('[DefaultModels] Default residential house created', {
      totalObjectsInScene: objectCount,
      createdMeshes: expectedMeshes.length,
      sceneHasObjects: objectCount > 0,
    });

    // Fit camera to view the house
    if (sceneAABB && objectCount > 0) {
      viewer.cameraFlight.flyTo({
        aabb: sceneAABB,
        duration: 0.5,
      });
      console.log('[DefaultModels] Camera fitted to view house');
    } else {
      console.warn('[DefaultModels] Cannot fit camera - no objects or invalid AABB', {
        objectCount,
        sceneAABB,
      });
    }

  } catch (error) {
    console.error('[DefaultModels] Failed to create default residential house:', error);
  }
}

/**
 * Create default model based on project type
 */
export async function createDefaultModel(viewer: Viewer, projectType: string, config?: Partial<DefaultModelConfig>): Promise<void> {
  console.log('[DefaultModels] Creating default model for project type:', projectType);

  switch (projectType) {
    case 'residential':
      await createResidentialHouseModel(viewer, config);
      break;

    case 'cafe':
      // Load cafe.xkt model for cafe projects
      console.log('[DefaultModels] Loading cafe.xkt model for cafe project');
      try {
        await loadCafeModel(viewer, { ...config, modelId: 'default-cafe-model' });
      } catch (error) {
        console.error('[DefaultModels] Failed to load cafe model, falling back to residential:', error);
        await createResidentialHouseModel(viewer, { ...config, modelId: 'default-cafe-fallback' });
      }
      break;

    case 'restaurant':
      // Use residential model as placeholder for restaurant
      console.log('[DefaultModels] Using residential model as placeholder for restaurant');
      await createResidentialHouseModel(viewer, { ...config, modelId: 'default-restaurant-layout' });
      break;

    case 'commercial_office':
      // Use residential model as placeholder for office
      console.log('[DefaultModels] Using residential model as placeholder for commercial office');
      await createResidentialHouseModel(viewer, { ...config, modelId: 'default-office-building' });
      break;

    case 'restaurant_cafe':
      // Load cafe.xkt model for restaurant/cafe projects
      console.log('[DefaultModels] Loading cafe.xkt model for restaurant/cafe project');
      try {
        await loadCafeModel(viewer, { ...config, modelId: 'default-restaurant-cafe-model' });
      } catch (error) {
        console.error('[DefaultModels] Failed to load cafe model, falling back to residential:', error);
        await createResidentialHouseModel(viewer, { ...config, modelId: 'default-restaurant-cafe-fallback' });
      }
      break;

    case 'industrial':
      // Use residential model as placeholder for industrial
      console.log('[DefaultModels] Using residential model as placeholder for industrial');
      await createResidentialHouseModel(viewer, { ...config, modelId: 'default-industrial-facility' });
      break;

    default:
      console.warn('[DefaultModels] Unknown project type:', projectType);
  }
}

/**
 * Remove default model from scene
 */
export function removeDefaultModel(viewer: Viewer, modelId: string = 'default-residential-house'): void {
  console.log('[DefaultModels] Removing default model:', modelId);

  try {
    // Check if this is an XKT-loaded model (cafe models)
    const isCafeModel = modelId.includes('cafe') || modelId.includes('restaurant');

    if (isCafeModel) {
      // Remove XKT-loaded model by destroying the model object
      const model = viewer.scene.models?.[modelId];
      if (model) {
        model.destroy();
        console.log('[DefaultModels] Removed XKT model:', modelId);
      }
    } else {
      // Remove procedurally-created model (residential, etc.)
      const objectIds = [
        `${modelId}-foundation`,
        `${modelId}-wall-front`,
        `${modelId}-wall-back`,
        `${modelId}-wall-left`,
        `${modelId}-wall-right`,
        `${modelId}-roof-left`,
        `${modelId}-roof-right`,
      ];

      objectIds.forEach((objectId) => {
        const object = viewer.scene.objects?.[objectId];
        if (object) {
          object.destroy();
          console.log('[DefaultModels] Removed object:', objectId);
        }
      });
    }

    console.log('[DefaultModels] Default model removed successfully');
  } catch (error) {
    console.error('[DefaultModels] Failed to remove default model:', error);
  }
}
