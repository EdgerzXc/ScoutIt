/*
 * The space around the Orbit Earth.
 *
 * A starfield plus a set of orbital paths, with Earth at the centre — the
 * ScoutIt system observing outward rather than a planet floating in a void.
 *
 * Restraint is the whole brief: the planet stays the subject. Stars are
 * small and mostly dim, the orbital paths are hairlines, and the only bright
 * marks are the few bodies riding them. Nothing here competes with the gold
 * on the globe itself.
 *
 * Built as plain Three.js objects so the caller can drop them into globe.gl's
 * existing scene rather than standing up a second renderer.
 */

const GLOBE_RADIUS = 100;

/* Rings sit outside the atmosphere (radius ~108) and inside the camera's
   resting distance at altitude 2.8 (380), so they read as orbits around the
   planet rather than as a halo on it or debris behind the camera. */
const ORBITS = [
  { radius: 168, tilt: 0.24, spin: 0.00022, bodies: 1 },
  { radius: 236, tilt: -0.41, spin: -0.00015, bodies: 2 },
  { radius: 318, tilt: 0.58, spin: 0.00009, bodies: 1 },
];

const STAR_COUNT = 1400;
const STAR_MIN_R = 900;
const STAR_MAX_R = 2400;

/** Deterministic pseudo-random, so the sky never reshuffles between loads. */
function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function buildStarfield(THREE) {
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);

  for (let i = 0; i < STAR_COUNT; i += 1) {
    const r = STAR_MIN_R + rnd(i * 3 + 1) * (STAR_MAX_R - STAR_MIN_R);
    const theta = rnd(i * 3 + 2) * Math.PI * 2;
    const phi = Math.acos(2 * rnd(i * 3 + 3) - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    /* Mostly dim, a few warm. A uniformly bright sky reads as noise and
       flattens the planet against it. */
    const kind = rnd(i * 3 + 4);
    if (kind > 0.88) {
      colors[i * 3] = 0.95;
      colors[i * 3 + 1] = 0.78;
      colors[i * 3 + 2] = 0.42;
    } else if (kind > 0.55) {
      colors[i * 3] = 0.82;
      colors[i * 3 + 1] = 0.79;
      colors[i * 3 + 2] = 0.72;
    } else {
      colors[i * 3] = 0.36;
      colors[i * 3 + 1] = 0.35;
      colors[i * 3 + 2] = 0.33;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    // Fixed screen size: attenuated stars swell into blobs as the camera
    // pulls back and stop reading as stars.
    sizeAttenuation: false,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.renderOrder = -1;
  return { points, geometry, material };
}

function buildOrbitRing(THREE, spec) {
  const SEGMENTS = 256;
  const positions = new Float32Array((SEGMENTS + 1) * 3);

  for (let i = 0; i <= SEGMENTS; i += 1) {
    const a = (i / SEGMENTS) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * spec.radius;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(a) * spec.radius;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0xd4af37,
    transparent: true,
    // A hairline. Anything more and the rings become the subject.
    opacity: 0.14,
    depthWrite: false,
  });

  const line = new THREE.Line(geometry, material);

  const group = new THREE.Group();
  group.add(line);
  group.rotation.x = spec.tilt;
  group.rotation.z = spec.tilt * 0.35;

  /* The bodies riding the path. These are the only bright marks out here,
     which is what makes the rings read as orbits rather than decoration. */
  const bodyGeo = new THREE.SphereGeometry(2.6, 12, 10);
  const bodyMat = new THREE.MeshBasicMaterial({
    color: 0xf2d675,
    transparent: true,
    opacity: 0.9,
  });

  const bodies = [];
  for (let i = 0; i < spec.bodies; i += 1) {
    const mesh = new THREE.Mesh(bodyGeo, bodyMat);
    const a = (i / spec.bodies) * Math.PI * 2 + spec.radius;
    mesh.position.set(Math.cos(a) * spec.radius, 0, Math.sin(a) * spec.radius);
    group.add(mesh);
    bodies.push(mesh);
  }

  return { group, geometry, material, bodyGeo, bodyMat, spin: spec.spin };
}

/**
 * Adds the starfield and orbital paths to an existing Three.js scene.
 *
 * @param {object} THREE   the three module
 * @param {object} scene   globe.gl's scene
 * @param {object} camera  globe.gl's camera — checked (not currently raised)
 *                         so the outer stars stay inside the far plane
 * @returns {{ tick: (t: number) => void, dispose: () => void }}
 */
export function addSolarSystem(THREE, scene, camera) {
  const disposables = [];
  const rings = [];

  /* Measured: globe.gl already ships a far plane of 125000, so this guard is
     a no-op today and the stars at 2400 are safely inside it. Kept because
     the sky silently vanishing is an expensive thing to re-diagnose if that
     default ever tightens. */
  if (camera && camera.far < STAR_MAX_R * 1.3) {
    camera.far = STAR_MAX_R * 1.3;
    camera.updateProjectionMatrix();
  }

  const stars = buildStarfield(THREE);
  scene.add(stars.points);
  disposables.push(stars.geometry, stars.material);

  for (const spec of ORBITS) {
    const ring = buildOrbitRing(THREE, spec);
    scene.add(ring.group);
    rings.push(ring);
    disposables.push(ring.geometry, ring.material, ring.bodyGeo, ring.bodyMat);
  }

  return {
    /* Orbital drift. Slow enough to be motion you notice only on a second
       look, per the layer's "quiet, expensive" brief. */
    tick() {
      for (const ring of rings) {
        ring.group.rotation.y += ring.spin;
      }
    },
    dispose() {
      scene.remove(stars.points);
      for (const ring of rings) scene.remove(ring.group);
      for (const d of disposables) {
        if (d && typeof d.dispose === "function") d.dispose();
      }
    },
  };
}

export const SOLAR_SYSTEM_GEOMETRY = { GLOBE_RADIUS, ORBITS, STAR_COUNT };
