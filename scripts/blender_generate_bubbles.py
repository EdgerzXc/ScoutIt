"""
ScoutIt Space Intelligence Platform
Blender MCP 3D Property Bubbles Generator (Pure Architecture · Zero Inner Circles)
Connects to Blender 5.2 via MCP socket (localhost:9876) to generate:
- 6 3D Celestial Snow Globe dioramas with pure architecture (NO circular base discs, NO inner spheres)
- GLTF/GLB models in public/models/bubbles/
- Photorealistic Cycles transparent PNG renders in public/images/bubbles/
- Master .blend scene in blender/bubbles/scoutit_property_bubbles.blend
"""

import socket
import json
import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_GLB_DIR = os.path.join(PROJECT_ROOT, "public", "models", "bubbles").replace("\\", "/")
OUTPUT_IMG_DIR = os.path.join(PROJECT_ROOT, "public", "images", "bubbles").replace("\\", "/")
OUTPUT_BLEND_PATH = os.path.join(PROJECT_ROOT, "blender", "bubbles", "scoutit_property_bubbles.blend").replace("\\", "/")

def send_blender_code(code_str, timeout=300.0):
    """Sends python code to Blender MCP server and retrieves response."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    s.connect(('localhost', 9876))
    payload = json.dumps({'type': 'execute_code', 'params': {'code': code_str}}).encode('utf-8')
    s.sendall(payload)
    
    data = b''
    while True:
        try:
            chunk = s.recv(16384)
            if not chunk:
                break
            data += chunk
            try:
                res = json.loads(data.decode('utf-8'))
                s.close()
                return res
            except json.JSONDecodeError:
                continue
        except socket.timeout:
            break
        except Exception as e:
            print(f"Socket error: {e}")
            break
    s.close()
    return None

BLENDER_SCRIPT = f"""
import bpy
import math
import os
import random
import json

# Output directories
glb_dir = "{OUTPUT_GLB_DIR}"
img_dir = "{OUTPUT_IMG_DIR}"
blend_path = "{OUTPUT_BLEND_PATH}"

os.makedirs(glb_dir, exist_ok=True)
os.makedirs(img_dir, exist_ok=True)
os.makedirs(os.path.dirname(blend_path), exist_ok=True)

# ── 1. SETUP CYCLES GPU STUDIO ENVIRONMENT ──
def setup_studio():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    
    # OptiX GPU acceleration
    cprefs = bpy.context.preferences.addons['cycles'].preferences
    cprefs.compute_device_type = 'OPTIX'
    for d in cprefs.devices:
        d.use = (d.type == 'OPTIX')
    scene.cycles.device = 'GPU'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    
    # Setup Camera (Framed closely around pure architecture)
    cam_data = bpy.data.cameras.get("Studio_Cam") or bpy.data.cameras.new("Studio_Cam")
    cam_data.type = 'PERSP'
    cam_data.lens = 56
    cam_obj = bpy.data.objects.get("Studio_Cam")
    if not cam_obj:
        cam_obj = bpy.data.objects.new("Studio_Cam", cam_data)
        scene.collection.objects.link(cam_obj)
    
    cam_obj.location = (2.4, -2.4, 1.8)
    cam_obj.rotation_euler = (math.radians(58), 0, math.radians(45))
    scene.camera = cam_obj
    
    # Setup Studio Lights
    def get_or_create_light(name, light_type, energy, color, location):
        l_data = bpy.data.lights.get(name) or bpy.data.lights.new(name, light_type)
        l_data.energy = energy
        l_data.color = color
        l_obj = bpy.data.objects.get(name)
        if not l_obj:
            l_obj = bpy.data.objects.new(name, l_data)
            scene.collection.objects.link(l_obj)
        l_obj.location = location
        return l_obj

    # Amber Key Light
    get_or_create_light("Light_Key", 'AREA', 450.0, (0.97, 0.78, 0.31), (2.6, -2.0, 3.2))
    # Soft Rim Light
    get_or_create_light("Light_Rim", 'AREA', 220.0, (0.45, 0.62, 0.8), (-2.8, 2.8, 2.0))
    # Warm Bottom Bounce
    get_or_create_light("Light_Bounce", 'POINT', 140.0, (0.91, 0.68, 0.24), (0.0, 0.0, -1.2))

# ── 2. CREATE SCOUTIT DESIGN DNA SHADER MATERIALS ──
def create_materials():
    materials = {{}}
    
    def make_mat(name, make_nodes_fn):
        mat = bpy.data.materials.get(name)
        if not mat:
            mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()
        make_nodes_fn(mat, nodes, mat.node_tree.links)
        return mat

    # Deep Obsidian Architectural Stone (#121212)
    def fn_obsidian(mat, nodes, links):
        output = nodes.new('ShaderNodeOutputMaterial')
        bsdf = nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.05, 0.05, 0.05, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.28
        bsdf.inputs['Metallic'].default_value = 0.12
        links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials['obsidian'] = make_mat('Mat_Obsidian', fn_obsidian)

    # Dark Architectural Glass
    def fn_dark_glass(mat, nodes, links):
        output = nodes.new('ShaderNodeOutputMaterial')
        bsdf = nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.06, 0.06, 0.06, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.05
        trans_input = bsdf.inputs.get('Transmission Weight') or bsdf.inputs.get('Transmission')
        if trans_input:
            trans_input.default_value = 0.85
        bsdf.inputs['IOR'].default_value = 1.52
        links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials['dark_glass'] = make_mat('Mat_DarkGlass', fn_dark_glass)

    # ScoutIt Amber Gold Metal (#E8AE3C)
    def fn_gold_accent(mat, nodes, links):
        output = nodes.new('ShaderNodeOutputMaterial')
        bsdf = nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.91, 0.68, 0.24, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.95
        bsdf.inputs['Roughness'].default_value = 0.18
        links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials['gold_accent'] = make_mat('Mat_GoldAccent', fn_gold_accent)

    # Warm Radiant Window Glow (Rich Amber Interior Light)
    def fn_gold_glow(mat, nodes, links):
        output = nodes.new('ShaderNodeOutputMaterial')
        emit = nodes.new('ShaderNodeEmission')
        emit.inputs['Color'].default_value = (0.97, 0.76, 0.30, 1.0)
        emit.inputs['Strength'].default_value = 4.5
        links.new(emit.outputs['Emission'], output.inputs['Surface'])
    materials['gold_glow'] = make_mat('Mat_GoldGlow', fn_gold_glow)

    # Reflective Pool Water
    def fn_water(mat, nodes, links):
        output = nodes.new('ShaderNodeOutputMaterial')
        bsdf = nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.02, 0.05, 0.08, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.02
        bsdf.inputs['Metallic'].default_value = 0.90
        links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials['water'] = make_mat('Mat_Water', fn_water)

    return materials

# ── 3. CLEAN SCENE CONTENT EXCEPT STUDIO ──
def clear_diorama_objects():
    for obj in list(bpy.context.scene.objects):
        if not obj.name.startswith("Studio_") and not obj.name.startswith("Light_"):
            bpy.data.objects.remove(obj, do_unlink=True)

# ── 4. CREATE FLOATING COSMIC GOLD DUST PARTICLES ──
def add_cosmic_particles(mats):
    random.seed(42)
    for i in range(18):
        theta = random.uniform(0, 2 * math.pi)
        phi = random.uniform(0.35, math.pi - 0.35)
        r = random.uniform(0.55, 0.90)
        x = r * math.sin(phi) * math.cos(theta)
        y = r * math.sin(phi) * math.sin(theta)
        z = r * math.cos(phi)
        
        pr = random.uniform(0.012, 0.022)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=5, radius=pr, location=(x, y, z))
        mote = bpy.context.active_object
        mote.name = f"Diorama_Mote_{{i}}"
        mote.data.materials.append(mats['gold_glow'])
        bpy.ops.object.shade_smooth()

# ── 5. PURE ARCHITECTURAL DIORAMA BUILDERS (NO CIRCULAR DISCS · NO INNER SPHERES) ──

# 1. RESIDENTIAL: Cantilevered Modern Glass Villa & Swimming Pool
def build_residential_diorama(mats):
    # Rectangular Foundation Terrace Deck (NO circular disc!)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.32))
    deck = bpy.context.active_object
    deck.scale = (1.10, 0.85, 0.05)
    deck.data.materials.append(mats['obsidian'])
    
    # Integrated Plunge Pool
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.32, 0.0, -0.29))
    pool = bpy.context.active_object
    pool.scale = (0.42, 0.55, 0.02)
    pool.data.materials.append(mats['water'])

    # Level 1 Living Pavilion
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.10, 0.02, -0.15))
    p1 = bpy.context.active_object
    p1.scale = (0.85, 0.65, 0.28)
    p1.data.materials.append(mats['dark_glass'])

    # Warm Glowing Living Interior
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.10, 0.02, -0.15))
    h1 = bpy.context.active_object
    h1.scale = (0.68, 0.48, 0.22)
    h1.data.materials.append(mats['gold_glow'])

    # Level 2 Cantilevered Master Suite
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.06, 0.08, 0.12))
    p2 = bpy.context.active_object
    p2.scale = (0.78, 0.58, 0.24)
    p2.data.materials.append(mats['obsidian'])

    # Master Suite Floor-to-Ceiling Glowing Glass Facade (pushed outward:
    # the cantilever overhang is THE residential silhouette vs STR's flat slab)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.40, 0.08, 0.12))
    g2 = bpy.context.active_object
    g2.scale = (0.30, 0.56, 0.20)
    g2.data.materials.append(mats['gold_glow'])

    # L1 Glowing Ribbon Band (bright seam between levels — kills the dark-box read)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.10, 0.02, -0.02))
    lband = bpy.context.active_object
    lband.scale = (0.87, 0.67, 0.05)
    lband.data.materials.append(mats['gold_glow'])

    # Golden Architectural Columns (thickened for presence)
    for cx, cy in [(-0.45, -0.22), (-0.45, 0.30), (0.24, -0.22), (0.24, 0.30)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.026, depth=0.55, vertices=16, location=(cx, cy, -0.12))
        col = bpy.context.active_object
        col.data.materials.append(mats['gold_accent'])

    # Pergola Roof Trellis with Golden Louvres (wider + taller crown)
    for ty in [-0.24, -0.12, 0.0, 0.12, 0.24, 0.36]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.06, ty, 0.30))
        slat = bpy.context.active_object
        slat.scale = (0.95, 0.032, 0.02)
        slat.data.materials.append(mats['gold_accent'])

    # Balcony Glass & Gold Railing
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.44, 0.08, 0.26))
    rail = bpy.context.active_object
    rail.scale = (0.016, 0.54, 0.06)
    rail.data.materials.append(mats['gold_accent'])

    # Interior Warm Light
    l_data = bpy.data.lights.new('Point_Res', 'POINT')
    l_data.energy = 42.0
    l_data.color = (0.97, 0.78, 0.31)
    l_obj = bpy.data.objects.new('Point_Res', l_data)
    bpy.context.scene.collection.objects.link(l_obj)
    l_obj.location = (0.05, 0.05, 0.12)


# 2. COMMERCIAL: Imposing Class-A Corporate Sky Tower
def build_commercial_diorama(mats):
    # Rectangular Corporate Plaza (NO circular disc!)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.35))
    plaza = bpy.context.active_object
    plaza.scale = (0.85, 0.85, 0.06)
    plaza.data.materials.append(mats['obsidian'])

    # Stepped Lower Lobby
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.24))
    lobby = bpy.context.active_object
    lobby.scale = (0.70, 0.70, 0.16)
    lobby.data.materials.append(mats['obsidian'])

    # Lobby Glowing Glass Ribbon
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.22))
    lband = bpy.context.active_object
    lband.scale = (0.72, 0.72, 0.04)
    lband.data.materials.append(mats['gold_glow'])

    # Tower Core Body
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.10))
    tower = bpy.context.active_object
    tower.scale = (0.58, 0.58, 0.65)
    tower.data.materials.append(mats['obsidian'])

    # 5 Glowing Window Ribbon Bands across all 4 sides
    for z in [-0.12, 0.02, 0.16, 0.30, 0.44]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, z))
        band = bpy.context.active_object
        band.scale = (0.60, 0.60, 0.035)
        band.data.materials.append(mats['gold_glow'])

    # Mid-Tower Sky Lobby Atrium
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.16))
    sky_lobby = bpy.context.active_object
    sky_lobby.scale = (0.62, 0.62, 0.09)
    sky_lobby.data.materials.append(mats['dark_glass'])

    # Upper Setback Penthouse
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.48))
    setback = bpy.context.active_object
    setback.scale = (0.42, 0.42, 0.22)
    setback.data.materials.append(mats['obsidian'])

    # Upper Glowing Ribbon
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.48))
    uband = bpy.context.active_object
    uband.scale = (0.44, 0.44, 0.035)
    uband.data.materials.append(mats['gold_glow'])

    # Rooftop Crown Spire & Glowing Beacon
    bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.24, vertices=16, location=(0, 0, 0.70))
    spire = bpy.context.active_object
    spire.data.materials.append(mats['gold_accent'])

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=(0, 0, 0.83))
    beacon = bpy.context.active_object
    beacon.data.materials.append(mats['gold_glow'])

    # Sky Lobby Warm Light
    l_data = bpy.data.lights.new('Point_Com', 'POINT')
    l_data.energy = 44.0
    l_data.color = (0.97, 0.78, 0.31)
    l_obj = bpy.data.objects.new('Point_Com', l_data)
    bpy.context.scene.collection.objects.link(l_obj)
    l_obj.location = (0.0, 0.0, 0.16)


# 3. RESTAURANTS: 2-Story Contemporary Bistro & Patio
def build_restaurants_diorama(mats):
    # Rectangular Stone Terrace Deck (NO circular disc!)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.32))
    terrace = bpy.context.active_object
    terrace.scale = (1.05, 0.80, 0.06)
    terrace.data.materials.append(mats['obsidian'])

    # Main Bistro Building
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.14, 0.0, -0.16))
    bistro = bpy.context.active_object
    bistro.scale = (0.72, 0.52, 0.26)
    bistro.data.materials.append(mats['obsidian'])

    # Storefront Glowing Glass Windows (oversized: must read at 150px bubble size)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.12, 0.0, -0.16))
    windows = bpy.context.active_object
    windows.scale = (0.26, 0.52, 0.22)
    windows.data.materials.append(mats['gold_glow'])

    # Second Floor Mezzanine Dining Lounge
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.18, 0.0, 0.06))
    mezz = bpy.context.active_object
    mezz.scale = (0.58, 0.42, 0.20)
    mezz.data.materials.append(mats['obsidian'])

    # Mezzanine Glowing Glass Ribbon (oversized)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.02, 0.0, 0.06))
    mglass = bpy.context.active_object
    mglass.scale = (0.24, 0.42, 0.16)
    mglass.data.materials.append(mats['gold_glow'])

    # Sweeping Gold Bistro Canopy (widened — signature silhouette)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.16, 0.0, -0.02))
    awning = bpy.context.active_object
    awning.scale = (0.44, 0.60, 0.024)
    awning.data.materials.append(mats['gold_accent'])

    # Canopy Support Columns
    for cy in [-0.25, 0.25]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.30, vertices=16, location=(0.32, cy, -0.16))
        col = bpy.context.active_object
        col.data.materials.append(mats['gold_accent'])

    # Alfresco Dining Tables on lit patio pads (pads glow through at small sizes)
    for tx, ty in [(0.38, -0.16), (0.38, 0.16)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.012, vertices=16, location=(tx, ty, -0.285))
        pad = bpy.context.active_object
        pad.data.materials.append(mats['gold_glow'])

        bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.06, vertices=16, location=(tx, ty, -0.26))
        tbl = bpy.context.active_object
        tbl.data.materials.append(mats['obsidian'])

        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=(tx, ty, -0.20))
        candle = bpy.context.active_object
        candle.data.materials.append(mats['gold_glow'])

    # Patio Dining Parasol Umbrella (hero silhouette piece — doubled presence)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.44, vertices=12, location=(0.48, 0.0, -0.08))
    pole = bpy.context.active_object
    pole.data.materials.append(mats['gold_accent'])

    bpy.ops.mesh.primitive_cone_add(radius1=0.30, radius2=0.01, depth=0.10, location=(0.48, 0.0, 0.06))
    umbrella = bpy.context.active_object
    umbrella.data.materials.append(mats['gold_accent'])

    # Umbrella crown beacon (reads as F&B warmth at any size)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.03, location=(0.48, 0.0, 0.12))
    crown = bpy.context.active_object
    crown.data.materials.append(mats['gold_glow'])

    # Bistro Interior Light
    l_data = bpy.data.lights.new('Point_Fnb', 'POINT')
    l_data.energy = 44.0
    l_data.color = (0.97, 0.78, 0.31)
    l_obj = bpy.data.objects.new('Point_Fnb', l_data)
    bpy.context.scene.collection.objects.link(l_obj)
    l_obj.location = (0.05, 0.0, -0.10)


# 4. VENUES: Cultural Gala Arts Pavilion & Grand Stage
def build_venues_diorama(mats):
    # Rectangular Grand Exhibition Plaza (NO circular disc!)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.32))
    plaza = bpy.context.active_object
    plaza.scale = (1.05, 0.85, 0.06)
    plaza.data.materials.append(mats['obsidian'])

    # Gala Concert Hall Main Structure
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.12, 0.0, -0.12))
    hall = bpy.context.active_object
    hall.scale = (0.75, 0.70, 0.36)
    hall.data.materials.append(mats['obsidian'])

    # Glass Grand Atrium Entrance
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.18, 0.0, -0.12))
    atrium = bpy.context.active_object
    atrium.scale = (0.30, 0.60, 0.30)
    atrium.data.materials.append(mats['dark_glass'])

    # Radiant Performance Stage Platform Inside Atrium
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.18, 0.0, -0.24))
    stage = bpy.context.active_object
    stage.scale = (0.24, 0.48, 0.06)
    stage.data.materials.append(mats['gold_glow'])

    # Sweeping Architectural Entrance Canopy Roof
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.22, 0.0, 0.04))
    canopy = bpy.context.active_object
    canopy.scale = (0.40, 0.68, 0.026)
    canopy.data.materials.append(mats['gold_accent'])

    # Grand Entrance Portico Columns
    for col_y in [-0.26, -0.09, 0.09, 0.26]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=0.34, vertices=16, location=(0.38, col_y, -0.12))
        p_col = bpy.context.active_object
        p_col.data.materials.append(mats['gold_accent'])

    # Upward Stage Beacon Beams
    for sx in [-0.20, 0.20]:
        bpy.ops.mesh.primitive_cone_add(radius1=0.02, radius2=0.10, depth=0.55, location=(sx, 0.0, 0.35))
        beam = bpy.context.active_object
        beam.data.materials.append(mats['gold_glow'])

    # Stage Uplight
    l_data = bpy.data.lights.new('Point_Ven', 'POINT')
    l_data.energy = 46.0
    l_data.color = (0.97, 0.78, 0.31)
    l_obj = bpy.data.objects.new('Point_Ven', l_data)
    bpy.context.scene.collection.objects.link(l_obj)
    l_obj.location = (0.18, 0.0, -0.10)


# 5. STR: Tropical Island Overwater Villa Sanctuary
def build_str_diorama(mats):
    # Rectangular Azure Lagoon Water Base (NO circular disc!)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.33))
    lagoon = bpy.context.active_object
    lagoon.scale = (1.08, 0.82, 0.05)
    lagoon.data.materials.append(mats['water'])

    # Overwater Teak Boardwalk Deck
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.06, 0.0, -0.28))
    deck = bpy.context.active_object
    deck.scale = (0.88, 0.68, 0.05)
    deck.data.materials.append(mats['obsidian'])

    # Open-Plan Luxury Villa Suite
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.16, 0.0, -0.11))
    villa = bpy.context.active_object
    villa.scale = (0.62, 0.48, 0.30)
    villa.data.materials.append(mats['dark_glass'])

    # Warm Glowing Bedroom Sanctuary Interior
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.16, 0.0, -0.11))
    vlight = bpy.context.active_object
    vlight.scale = (0.48, 0.36, 0.22)
    vlight.data.materials.append(mats['gold_glow'])

    # Slatted Cedar Louvred Roof
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.14, 0.0, 0.06))
    roof = bpy.context.active_object
    roof.scale = (0.76, 0.58, 0.035)
    roof.data.materials.append(mats['gold_accent'])

    # Slender Timber Support Posts
    for px, py in [(-0.44, -0.22), (-0.44, 0.22), (0.14, -0.22), (0.14, 0.22)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.42, vertices=16, location=(px, py, -0.10))
        post = bpy.context.active_object
        post.data.materials.append(mats['gold_accent'])

    # Sunken Infinity Plunge Pool
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.28, 0.0, -0.27))
    plunge = bpy.context.active_object
    plunge.scale = (0.34, 0.42, 0.035)
    plunge.data.materials.append(mats['water'])

    # Deck Pathway Lanterns
    for lx, ly in [(0.28, -0.24), (0.28, 0.24)]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.03, location=(lx, ly, -0.23))
        lantern = bpy.context.active_object
        lantern.data.materials.append(mats['gold_glow'])

    # Villa Interior Light
    l_data = bpy.data.lights.new('Point_Str', 'POINT')
    l_data.energy = 40.0
    l_data.color = (0.97, 0.78, 0.31)
    l_obj = bpy.data.objects.new('Point_Str', l_data)
    bpy.context.scene.collection.objects.link(l_obj)
    l_obj.location = (-0.14, 0.0, -0.08)


# 6. HOSPITALITY: Sovereign 5-Star Hotel Resort Tower
def build_hospitality_diorama(mats):
    # Rectangular Resort Terrace (NO circular disc!)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.32))
    podium = bpy.context.active_object
    podium.scale = (1.05, 0.80, 0.06)
    podium.data.materials.append(mats['obsidian'])

    # Front Reflecting Pool
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.26, -0.28))
    pool = bpy.context.active_object
    pool.scale = (0.95, 0.28, 0.02)
    pool.data.materials.append(mats['water'])

    # Main Hotel Building
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.05, -0.04))
    hotel = bpy.context.active_object
    hotel.scale = (0.72, 0.50, 0.55)
    hotel.data.materials.append(mats['obsidian'])

    # 4 Tiered Balcony Ribbon Bands with Subtle Warm Amber Glow
    for z in [-0.20, -0.07, 0.06, 0.19]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.05, z))
        band = bpy.context.active_object
        band.scale = (0.75, 0.52, 0.03)
        band.data.materials.append(mats['gold_glow'])

    # Grand Double-Height Colonnade Portico
    for col_x in [-0.22, -0.07, 0.07, 0.22]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=0.26, vertices=16, location=(col_x, 0.22, -0.18))
        p_col = bpy.context.active_object
        p_col.data.materials.append(mats['gold_accent'])

    # Entrance Canopy
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.22, -0.05))
    canopy = bpy.context.active_object
    canopy.scale = (0.48, 0.20, 0.024)
    canopy.data.materials.append(mats['gold_accent'])

    # Crown Rooftop Sky Lounge Observatory
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.05, 0.27))
    lounge = bpy.context.active_object
    lounge.scale = (0.36, 0.26, 0.12)
    lounge.data.materials.append(mats['dark_glass'])

    # Golden Observatory Perimeter Trim
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.05, 0.33))
    trim = bpy.context.active_object
    trim.scale = (0.38, 0.28, 0.016)
    trim.data.materials.append(mats['gold_accent'])

    # Grand Entrance Portico Light
    l_data = bpy.data.lights.new('Point_Hos', 'POINT')
    l_data.energy = 44.0
    l_data.color = (0.97, 0.78, 0.31)
    l_obj = bpy.data.objects.new('Point_Hos', l_data)
    bpy.context.scene.collection.objects.link(l_obj)
    l_obj.location = (0.0, 0.10, -0.12)


# ── 6. MAIN EXECUTION LOOP PER CATEGORY ──
CATEGORIES = [
    ("residential", build_residential_diorama),
    ("commercial", build_commercial_diorama),
    ("restaurants", build_restaurants_diorama),
    ("venues", build_venues_diorama),
    ("str", build_str_diorama),
    ("hospitality", build_hospitality_diorama),
]

setup_studio()
mats = create_materials()

results = {{}}

for cat_name, builder_fn in CATEGORIES:
    print(f"Building 3D Property Bubble: {{cat_name}}...")
    clear_diorama_objects()
    
    # 1. Build Category Specific Pure Architecture (NO CIRCLES!)
    builder_fn(mats)
    
    # 2. Add Floating Cosmic Particles Around Building
    add_cosmic_particles(mats)
    
    # 3. Render High-Res Transparent Cycles PNG
    img_out = os.path.join(img_dir, f"bubble_{{cat_name}}.png")
    bpy.context.scene.render.filepath = img_out
    bpy.ops.render.render(write_still=True)
    
    # 4. Export GLTF / GLB 2.0 Binary
    glb_out = os.path.join(glb_dir, f"{{cat_name}}_bubble.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_out,
        export_format='GLB',
        use_selection=False,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False
    )
    
    results[cat_name] = {{
        "glb": glb_out,
        "image": img_out,
        "size_kb": os.path.getsize(glb_out) // 1024
    }}

# Save Master .blend Scene
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"Master blend file saved at {{blend_path}}")

print("SUCCESS_RESULTS_JSON:" + json.dumps(results))
"""

def main():
    print("=" * 60)
    print("SCOUTIT SPACE INTELLIGENCE PLATFORM")
    print("Connecting to Blender 5.2 via MCP socket (localhost:9876)...")
    print("=" * 60)

    res = send_blender_code(BLENDER_SCRIPT, timeout=300.0)
    if not res:
        print("ERROR: Failed to receive response from Blender MCP.")
        sys.exit(1)

    if res.get("status") == "error":
        print("ERROR in Blender execution:")
        print(res.get("message"))
        sys.exit(1)

    output = res.get("result", {}).get("result", "")
    print("Blender Output:")
    print(output)

    if "SUCCESS_RESULTS_JSON:" in output:
        json_str = output.split("SUCCESS_RESULTS_JSON:")[1].strip()
        data = json.loads(json_str)
        print("\nGenerated 3D Property Bubbles Summary:")
        for cat, info in data.items():
            print(f"  [+] {cat.upper():12} -> GLB: {info['glb']} ({info['size_kb']} KB), Image: {info['image']}")
        print(f"\nMaster .blend saved: {OUTPUT_BLEND_PATH}")

if __name__ == "__main__":
    main()
