import argparse
import bpy
import bmesh
import sys
from pathlib import Path


def parse_args():
    argv = sys.argv
    if "--" in argv:
      argv = argv[argv.index("--") + 1 :]
    else:
      argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--target-tris", type=int, default=3000)
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_fbx(path: str):
    bpy.ops.import_scene.fbx(filepath=path)


def triangle_count(mesh_obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = mesh_obj.evaluated_get(depsgraph)
    mesh = eval_obj.to_mesh()
    try:
        mesh.calc_loop_triangles()
        return len(mesh.loop_triangles)
    finally:
        eval_obj.to_mesh_clear()


def total_triangles(meshes):
    return sum(triangle_count(obj) for obj in meshes)


def apply_decimate(mesh_obj, ratio):
    mod = mesh_obj.modifiers.new(name="TempleDecimate", type="DECIMATE")
    mod.decimate_type = "COLLAPSE"
    mod.ratio = ratio
    mod.use_collapse_triangulate = True
    mod.use_symmetry = False
    bpy.context.view_layer.objects.active = mesh_obj
    mesh_obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mesh_obj.select_set(False)


def optimize_meshes(meshes, target_tris):
    current = total_triangles(meshes)
    if current <= target_tris:
        return current, current
    ratio = min(0.98, max(0.03, target_tris / max(1, current) * 0.92))
    for obj in meshes:
        apply_decimate(obj, ratio)
    final = total_triangles(meshes)
    if final > target_tris:
        ratio2 = min(0.98, max(0.01, target_tris / max(1, final) * 0.96))
        for obj in meshes:
            apply_decimate(obj, ratio2)
        final = total_triangles(meshes)
    return current, final


def export_glb(path: str):
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_materials="EXPORT",
        export_animations=True,
        export_skins=True,
        export_yup=True,
        export_apply=False,
    )


def main():
    args = parse_args()
    clear_scene()
    import_fbx(args.input)
    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("No mesh objects imported")
    current, final = optimize_meshes(meshes, args.target_tris)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    export_glb(str(out))
    print(f"input={args.input}")
    print(f"output={args.output}")
    print(f"triangles_before={current}")
    print(f"triangles_after={final}")


if __name__ == "__main__":
    main()
