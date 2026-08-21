#!/usr/bin/env python3
"""Generates ios/REBOOT.xcodeproj for REBOOT + its two extensions."""

import hashlib
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "ios"
PROJ = ROOT / "REBOOT.xcodeproj"

TARGETS = [
    {
        "name": "REBOOT",
        "dir": "REBOOT",
        "product": "REBOOT.app",
        "bundle": "com.kenatst.reboot",
        "type": "com.apple.product-type.application",
        "entitlements": "REBOOT/REBOOT.entitlements",
        "info": "REBOOT/Info.plist",
        "is_app": True,
    },
    {
        "name": "ShieldConfigurationExtension",
        "dir": "ShieldConfigurationExtension",
        "product": "ShieldConfigurationExtension.appex",
        "bundle": "com.kenatst.reboot.ShieldConfiguration",
        "type": "com.apple.product-type.app-extension",
        "entitlements": "ShieldConfigurationExtension/ShieldConfigurationExtension.entitlements",
        "info": "ShieldConfigurationExtension/Info.plist",
        "is_app": False,
    },
    {
        "name": "DeviceActivityMonitorExtension",
        "dir": "DeviceActivityMonitorExtension",
        "product": "DeviceActivityMonitorExtension.appex",
        "bundle": "com.kenatst.reboot.DeviceActivityMonitor",
        "type": "com.apple.product-type.app-extension",
        "entitlements": "DeviceActivityMonitorExtension/DeviceActivityMonitorExtension.entitlements",
        "info": "DeviceActivityMonitorExtension/Info.plist",
        "is_app": False,
    },
]


def uid(seed: str) -> str:
    return hashlib.md5(seed.encode()).hexdigest()[:24].upper()


def collect(target_dir: str):
    swift = []
    resources = []
    base = ROOT / target_dir
    for p in sorted(base.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(base).as_posix()
        name = p.name
        if name == "Info.plist" or name.endswith(".entitlements"):
            continue
        if ".xcassets/" in rel:
            continue
        if p.suffix == ".swift":
            swift.append(rel)
        elif p.suffix in (".ttf", ".txt", ".png", ".json") or name.endswith(".xcassets"):
            resources.append(rel)
    return swift, resources


def build_tree(paths):
    root = {}
    for rel in paths:
        parts = rel.split("/")
        node = root
        for part in parts[:-1]:
            node = node.setdefault(part, {})
        node.setdefault("__files__", []).append(parts[-1])
    return root


def emit_group_entry(gid, name, node, folder_path, lines):
    children = []
    subfolders = {k: v for k, v in node.items() if k != "__files__"}
    for folder in sorted(subfolders):
        child_gid = uid("group:" + folder_path + "/" + folder)
        children.append(child_gid)
        emit_group_entry(child_gid, folder, subfolders[folder], folder_path + "/" + folder, lines)
    for fname in sorted(node.get("__files__", [])):
        children.append(uid("fileref:" + folder_path + "/" + fname))

    lines.append(f"\t\t{gid} /* {name} */ = {{")
    lines.append("\t\t\tisa = PBXGroup;")
    lines.append("\t\t\tchildren = (")
    for child in children:
        lines.append(f"\t\t\t\t{child},")
    lines.append("\t\t\t);")
    if name != os.path.basename(folder_path):
        lines.append(f"\t\t\tname = {name};")
    lines.append(f"\t\t\tpath = {os.path.basename(folder_path)};")
    lines.append("\t\t\tsourceTree = \"<group>\";")
    lines.append("\t\t};")


def emit_top_level_groups(node, folder_path, lines):
    subgroup_ids = []
    root_files = []
    subfolders = {k: v for k, v in node.items() if k != "__files__"}
    for folder in sorted(subfolders):
        gid = uid("group:" + folder_path + "/" + folder)
        subgroup_ids.append(gid)
        emit_group_entry(gid, folder, subfolders[folder], folder_path + "/" + folder, lines)
    for fname in sorted(node.get("__files__", [])):
        root_files.append(uid("fileref:" + folder_path + "/" + fname))
    return subgroup_ids, root_files


def fmt_setting(v):
    if isinstance(v, str):
        return f'"{v}"' if "$" in v or " " in v else v
    return "(" + ", ".join(f'"{x}"' for x in v) + ")"


def main():
    lines = []
    lines.append("// !$*UTF8*$!")
    lines.append("{")
    lines.append("\tarchiveVersion = 1;")
    lines.append("\tclasses = {};")
    lines.append("\tobjectVersion = 56;")
    lines.append("\tobjects = {")
    lines.append("")

    collected = {t["name"]: collect(t["dir"]) for t in TARGETS}

    # ── PBXBuildFile ────────────────────────────────────────────────
    lines.append("\t/* Begin PBXBuildFile section */")
    for t in TARGETS:
        for rel in collected[t["name"]][0]:
            frel = t["dir"] + "/" + rel
            lines.append(f"\t\t{uid('buildfile:' + frel)} /* {os.path.basename(rel)} in Sources */ = {{isa = PBXBuildFile; fileRef = {uid('fileref:' + frel)} /* {os.path.basename(rel)} */; }};")
        for rel in collected[t["name"]][1]:
            frel = t["dir"] + "/" + rel
            lines.append(f"\t\t{uid('buildfile:' + frel)} /* {os.path.basename(rel)} in Resources */ = {{isa = PBXBuildFile; fileRef = {uid('fileref:' + frel)} /* {os.path.basename(rel)} */; }};")
    for t in TARGETS:
        if not t["is_app"]:
            lines.append(f"\t\t{uid('embed:' + t['name'])} /* {t['product']} in Embed Foundation Extensions */ = {{isa = PBXBuildFile; fileRef = {uid('product:' + t['name'])} /* {t['product']} */; settings = {{ATTRIBUTES = (RemoveHeadersOnCopy, ); }}; }};")
    lines.append("\t/* End PBXBuildFile section */")
    lines.append("")

    # ── PBXContainerItemProxy + PBXTargetDependency ─────────────────
    lines.append("\t/* Begin PBXContainerItemProxy section */")
    for t in TARGETS:
        if not t["is_app"]:
            lines.append(f"\t\t{uid('proxy:' + t['name'])} /* PBXContainerItemProxy */ = {{")
            lines.append("\t\t\tisa = PBXContainerItemProxy;")
            lines.append(f"\t\t\tcontainerPortal = {uid('project')} /* Project object */;")
            lines.append("\t\t\tproxyType = 1;")
            lines.append(f"\t\t\tremoteGlobalIDString = {uid('target:' + t['name'])};")
            lines.append(f"\t\t\tremoteInfo = {t['name']};")
            lines.append("\t\t};")
    lines.append("\t/* End PBXContainerItemProxy section */")
    lines.append("")

    lines.append("\t/* Begin PBXTargetDependency section */")
    for t in TARGETS:
        if not t["is_app"]:
            lines.append(f"\t\t{uid('dep:' + t['name'])} /* PBXTargetDependency */ = {{")
            lines.append("\t\t\tisa = PBXTargetDependency;")
            lines.append(f"\t\t\ttarget = {uid('target:' + t['name'])} /* {t['name']} */;")
            lines.append(f"\t\t\ttargetProxy = {uid('proxy:' + t['name'])} /* PBXContainerItemProxy */;")
            lines.append("\t\t};")
    lines.append("\t/* End PBXTargetDependency section */")
    lines.append("")

    # ── PBXFileReference ────────────────────────────────────────────
    lines.append("\t/* Begin PBXFileReference section */")
    for t in TARGETS:
        lines.append(f"\t\t{uid('product:' + t['name'])} /* {t['product']} */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = {t['product']}; sourceTree = BUILT_PRODUCTS_DIR; }};")
        lines.append(f"\t\t{uid('infoplist:' + t['name'])} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = \"<group>\"; }};")
        lines.append(f"\t\t{uid('entitlements:' + t['name'])} /* {os.path.basename(t['entitlements'])} */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = {os.path.basename(t['entitlements'])}; sourceTree = \"<group>\"; }};")
        for rel in collected[t["name"]][0]:
            frel = t["dir"] + "/" + rel
            lines.append(f"\t\t{uid('fileref:' + frel)} /* {os.path.basename(rel)} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {os.path.basename(rel)}; sourceTree = \"<group>\"; }};")
        for rel in collected[t["name"]][1]:
            frel = t["dir"] + "/" + rel
            name = os.path.basename(rel)
            ftype = "folder.assetcatalog" if rel.endswith(".xcassets") else ("file" if name.endswith(".ttf") else ("text" if name.endswith(".txt") else "image.png"))
            lines.append(f"\t\t{uid('fileref:' + frel)} /* {name} */ = {{isa = PBXFileReference; lastKnownFileType = {ftype}; path = {name}; sourceTree = \"<group>\"; }};")
    lines.append("\t/* End PBXFileReference section */")
    lines.append("")

    # ── PBXGroups ───────────────────────────────────────────────────
    lines.append("\t/* Begin PBXGroup section */")
    lines.append(f"\t\t{uid('rootgroup')} = {{")
    lines.append("\t\t\tisa = PBXGroup;")
    lines.append("\t\t\tchildren = (")
    for t in TARGETS:
        lines.append(f"\t\t\t\t{uid('targetgroup:' + t['name'])} /* {t['name']} */,")
    lines.append(f"\t\t\t\t{uid('products')} /* Products */,")
    lines.append("\t\t\t);")
    lines.append("\t\t\tsourceTree = \"<group>\";")
    lines.append("\t\t};")
    lines.append(f"\t\t{uid('products')} /* Products */ = {{")
    lines.append("\t\t\tisa = PBXGroup;")
    lines.append("\t\t\tchildren = (")
    for t in TARGETS:
        lines.append(f"\t\t\t\t{uid('product:' + t['name'])} /* {t['product']} */,")
    lines.append("\t\t\t);")
    lines.append("\t\t\tname = Products;")
    lines.append("\t\t\tsourceTree = \"<group>\";")
    lines.append("\t\t};")

    for t in TARGETS:
        target_dir = t["dir"]
        swift_tree = build_tree(collected[t["name"]][0])
        resource_tree = build_tree(collected[t["name"]][1])
        resource_tree = resource_tree.get("Resources", {})
        swift_group_ids, swift_root_files = emit_top_level_groups(swift_tree, target_dir, lines)
        resource_group_ids, resource_root_files = emit_top_level_groups(resource_tree, target_dir + "/Resources", lines)
        resources_gid = uid("group:" + target_dir + "/Resources")
        if resource_group_ids or resource_root_files:
            lines.append(f"\t\t{resources_gid} /* Resources */ = {{")
            lines.append("\t\t\tisa = PBXGroup;")
            lines.append("\t\t\tchildren = (")
            for child in resource_group_ids + resource_root_files:
                lines.append(f"\t\t\t\t{child},")
            lines.append("\t\t\t);")
            lines.append("\t\t\tname = Resources;")
            lines.append(f"\t\t\tpath = {os.path.basename(target_dir + '/Resources')};")
            lines.append("\t\t\tsourceTree = \"<group>\";")
            lines.append("\t\t};")
        lines.append(f"\t\t{uid('targetgroup:' + t['name'])} /* {t['name']} */ = {{")
        lines.append("\t\t\tisa = PBXGroup;")
        lines.append("\t\t\tchildren = (")
        for gid in swift_group_ids:
            lines.append(f"\t\t\t\t{gid},")
        for fid in swift_root_files:
            lines.append(f"\t\t\t\t{fid},")
        if resource_group_ids or resource_root_files:
            lines.append(f"\t\t\t\t{resources_gid} /* Resources */,")
        lines.append(f"\t\t\t\t{uid('infoplist:' + t['name'])} /* Info.plist */,")
        lines.append(f"\t\t\t\t{uid('entitlements:' + t['name'])} /* {os.path.basename(t['entitlements'])} */,")
        lines.append("\t\t\t);")
        lines.append(f"\t\t\tpath = {t['dir']};")
        lines.append("\t\t\tsourceTree = \"<group>\";")
        lines.append("\t\t};")
    lines.append("\t/* End PBXGroup section */")
    lines.append("")

    # ── Build phases ────────────────────────────────────────────────
    lines.append("\t/* Begin PBXCopyFilesBuildPhase section */")
    lines.append(f"\t\t{uid('embedphase')} /* Embed Foundation Extensions */ = {{")
    lines.append("\t\t\tisa = PBXCopyFilesBuildPhase;")
    lines.append("\t\t\tbuildActionMask = 2147483647;")
    lines.append("\t\t\tdstPath = \"\";")
    lines.append("\t\t\tdstSubfolderSpec = 13;")
    lines.append("\t\t\tfiles = (")
    for t in TARGETS:
        if not t["is_app"]:
            lines.append(f"\t\t\t\t{uid('embed:' + t['name'])} /* {t['product']} in Embed Foundation Extensions */,")
    lines.append("\t\t\t);")
    lines.append("\t\t\tname = \"Embed Foundation Extensions\";")
    lines.append("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
    lines.append("\t\t};")
    lines.append("\t/* End PBXCopyFilesBuildPhase section */")
    lines.append("")

    lines.append("\t/* Begin PBXResourcesBuildPhase section */")
    for t in TARGETS:
        lines.append(f"\t\t{uid('resourcesphase:' + t['name'])} /* Resources */ = {{")
        lines.append("\t\t\tisa = PBXResourcesBuildPhase;")
        lines.append("\t\t\tbuildActionMask = 2147483647;")
        lines.append("\t\t\tfiles = (")
        for rel in collected[t["name"]][1]:
            lines.append(f"\t\t\t\t{uid('buildfile:' + t['dir'] + '/' + rel)} /* {os.path.basename(rel)} in Resources */,")
        lines.append("\t\t\t);")
        lines.append("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
        lines.append("\t\t};")
    lines.append("\t/* End PBXResourcesBuildPhase section */")
    lines.append("")

    lines.append("\t/* Begin PBXSourcesBuildPhase section */")
    for t in TARGETS:
        lines.append(f"\t\t{uid('sourcesphase:' + t['name'])} /* Sources */ = {{")
        lines.append("\t\t\tisa = PBXSourcesBuildPhase;")
        lines.append("\t\t\tbuildActionMask = 2147483647;")
        lines.append("\t\t\tfiles = (")
        for rel in collected[t["name"]][0]:
            lines.append(f"\t\t\t\t{uid('buildfile:' + t['dir'] + '/' + rel)} /* {os.path.basename(rel)} in Sources */,")
        lines.append("\t\t\t);")
        lines.append("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
        lines.append("\t\t};")
    lines.append("\t/* End PBXSourcesBuildPhase section */")
    lines.append("")

    lines.append("\t/* Begin PBXFrameworksBuildPhase section */")
    for t in TARGETS:
        lines.append(f"\t\t{uid('frameworksphase:' + t['name'])} /* Frameworks */ = {{")
        lines.append("\t\t\tisa = PBXFrameworksBuildPhase;")
        lines.append("\t\t\tbuildActionMask = 2147483647;")
        lines.append("\t\t\tfiles = (")
        lines.append("\t\t\t);")
        lines.append("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
        lines.append("\t\t};")
    lines.append("\t/* End PBXFrameworksBuildPhase section */")
    lines.append("")

    # ── Native targets ──────────────────────────────────────────────
    lines.append("\t/* Begin PBXNativeTarget section */")
    for t in TARGETS:
        lines.append(f"\t\t{uid('target:' + t['name'])} /* {t['name']} */ = {{")
        lines.append("\t\t\tisa = PBXNativeTarget;")
        lines.append(f"\t\t\tbuildConfigurationList = {uid('configlist:' + t['name'])} /* Build configuration list for PBXNativeTarget \"{t['name']}\" */;")
        lines.append("\t\t\tbuildPhases = (")
        lines.append(f"\t\t\t\t{uid('sourcesphase:' + t['name'])} /* Sources */,")
        lines.append(f"\t\t\t\t{uid('frameworksphase:' + t['name'])} /* Frameworks */,")
        lines.append(f"\t\t\t\t{uid('resourcesphase:' + t['name'])} /* Resources */,")
        if t["is_app"]:
            lines.append(f"\t\t\t\t{uid('embedphase')} /* Embed Foundation Extensions */,")
        lines.append("\t\t\t);")
        lines.append("\t\t\tbuildRules = (")
        lines.append("\t\t\t);")
        lines.append("\t\t\tdependencies = (")
        for dep in TARGETS:
            if not dep["is_app"] and t["is_app"]:
                lines.append(f"\t\t\t\t{uid('dep:' + dep['name'])} /* PBXTargetDependency */,")
        lines.append("\t\t\t);")
        lines.append(f"\t\t\tname = {t['name']};")
        lines.append(f"\t\t\tproductName = {t['name']};")
        lines.append(f"\t\t\tproductReference = {uid('product:' + t['name'])} /* {t['product']} */;")
        lines.append(f"\t\t\tproductType = \"{t['type']}\";")
        lines.append("\t\t};")
    lines.append("\t/* End PBXNativeTarget section */")
    lines.append("")

    # ── Project ─────────────────────────────────────────────────────
    lines.append("\t/* Begin PBXProject section */")
    lines.append(f"\t\t{uid('project')} /* Project object */ = {{")
    lines.append("\t\t\tisa = PBXProject;")
    lines.append("\t\t\tattributes = {")
    lines.append("\t\t\t\tBuildIndependentTargetsInParallel = 1;")
    lines.append("\t\t\t\tLastSwiftUpdateCheck = 1500;")
    lines.append("\t\t\t\tLastUpgradeCheck = 1500;")
    lines.append("\t\t\t\tTargetAttributes = {")
    for t in TARGETS:
        lines.append(f"\t\t\t\t\t{uid('target:' + t['name'])} = {{")
        lines.append("\t\t\t\t\t\tCreatedOnToolsVersion = 15.0;")
        lines.append("\t\t\t\t\t};")
    lines.append("\t\t\t\t};")
    lines.append("\t\t\t};")
    lines.append(f"\t\t\tbuildConfigurationList = {uid('projectconfiglist')} /* Build configuration list for PBXProject \"REBOOT\" */;")
    lines.append("\t\t\tcompatibilityVersion = \"Xcode 14.0\";")
    lines.append("\t\t\tdevelopmentRegion = en;")
    lines.append("\t\t\thasScannedForEncodings = 0;")
    lines.append("\t\t\tknownRegions = (")
    lines.append("\t\t\t\ten,")
    lines.append("\t\t\t\tBase,")
    lines.append("\t\t\t);")
    lines.append(f"\t\t\tmainGroup = {uid('rootgroup')};")
    lines.append(f"\t\t\tproductRefGroup = {uid('products')} /* Products */;")
    lines.append("\t\t\tprojectDirPath = \"\";")
    lines.append("\t\t\tprojectRoot = \"\";")
    lines.append("\t\t\ttargets = (")
    for t in TARGETS:
        lines.append(f"\t\t\t\t{uid('target:' + t['name'])} /* {t['name']} */,")
    lines.append("\t\t\t);")
    lines.append("\t\t};")
    lines.append("\t/* End PBXProject section */")
    lines.append("")

    # ── Build settings ──────────────────────────────────────────────
    proj_settings = {
        "ALWAYS_SEARCH_USER_PATHS": "NO",
        "CLANG_ANALYZER_NONNULL": "YES",
        "CLANG_ENABLE_MODULES": "YES",
        "CLANG_ENABLE_OBJC_ARC": "YES",
        "CLANG_WARN_BOOL_CONVERSION": "YES",
        "CLANG_WARN_UNREACHABLE_CODE": "YES",
        "DEBUG_INFORMATION_FORMAT": "dwarf",
        "ENABLE_STRICT_OBJC_MSGSEND": "YES",
        "ENABLE_TESTABILITY": "YES",
        "GCC_C_LANGUAGE_STANDARD": "gnu17",
        "GCC_DYNAMIC_NO_PIC": "NO",
        "GCC_NO_COMMON_BLOCKS": "YES",
        "GCC_OPTIMIZATION_LEVEL": "0",
        "GCC_PREPROCESSOR_DEFINITIONS": ("DEBUG=1", "$(inherited)"),
        "IPHONEOS_DEPLOYMENT_TARGET": "17.0",
        "MTL_ENABLE_DEBUG_INFO": "INCLUDE_SOURCE",
        "MTL_FAST_MATH": "YES",
        "ONLY_ACTIVE_ARCH": "YES",
        "SDKROOT": "iphoneos",
        "SWIFT_ACTIVE_COMPILATION_CONDITIONS": ("DEBUG", "$(inherited)"),
        "SWIFT_OPTIMIZATION_LEVEL": "-Onone",
    }
    proj_settings_release = {
        "ALWAYS_SEARCH_USER_PATHS": "NO",
        "CLANG_ANALYZER_NONNULL": "YES",
        "CLANG_ENABLE_MODULES": "YES",
        "CLANG_ENABLE_OBJC_ARC": "YES",
        "CLANG_WARN_BOOL_CONVERSION": "YES",
        "CLANG_WARN_UNREACHABLE_CODE": "YES",
        "DEBUG_INFORMATION_FORMAT": "dwarf-with-dsym",
        "ENABLE_NS_ASSERTIONS": "NO",
        "ENABLE_STRICT_OBJC_MSGSEND": "YES",
        "GCC_C_LANGUAGE_STANDARD": "gnu17",
        "GCC_NO_COMMON_BLOCKS": "YES",
        "IPHONEOS_DEPLOYMENT_TARGET": "17.0",
        "MTL_ENABLE_DEBUG_INFO": "NO",
        "MTL_FAST_MATH": "YES",
        "SDKROOT": "iphoneos",
        "SWIFT_COMPILATION_MODE": "wholemodule",
        "SWIFT_OPTIMIZATION_LEVEL": "-O",
        "VALIDATE_PRODUCT": "YES",
    }
    app_settings = {
        "ASSETCATALOG_COMPILER_APPICON_NAME": "AppIcon",
        "ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME": "AccentColor",
        "CODE_SIGN_ENTITLEMENTS": "REBOOT/REBOOT.entitlements",
        "CODE_SIGN_STYLE": "Automatic",
        "CURRENT_PROJECT_VERSION": "1",
        "ENABLE_PREVIEWS": "YES",
        "GENERATE_INFOPLIST_FILE": "NO",
        "INFOPLIST_FILE": "REBOOT/Info.plist",
        "LD_RUNPATH_SEARCH_PATHS": ("$(inherited)", "@executable_path/Frameworks"),
        "MARKETING_VERSION": "1.0",
        "PRODUCT_BUNDLE_IDENTIFIER": "com.kenatst.reboot",
        "PRODUCT_NAME": "$(TARGET_NAME)",
        "SUPPORTED_PLATFORMS": ("iphoneos", "iphonesimulator"),
        "SWIFT_EMIT_LOC_STRINGS": "YES",
        "SWIFT_VERSION": "5.0",
        "TARGETED_DEVICE_FAMILY": "1",
    }
    extension_settings = {
        "CODE_SIGN_ENTITLEMENTS": None,
        "CODE_SIGN_STYLE": "Automatic",
        "CURRENT_PROJECT_VERSION": "1",
        "GENERATE_INFOPLIST_FILE": "NO",
        "INFOPLIST_FILE": None,
        "LD_RUNPATH_SEARCH_PATHS": ("$(inherited)", "@executable_path/../../Frameworks"),
        "MARKETING_VERSION": "1.0",
        "PRODUCT_BUNDLE_IDENTIFIER": None,
        "PRODUCT_NAME": "$(TARGET_NAME)",
        "SKIP_INSTALL": "YES",
        "SUPPORTED_PLATFORMS": ("iphoneos", "iphonesimulator"),
        "SWIFT_EMIT_LOC_STRINGS": "YES",
        "SWIFT_VERSION": "5.0",
        "TARGETED_DEVICE_FAMILY": "1",
    }

    lines.append("\t/* Begin XCBuildConfiguration section */")
    lines.append(f"\t\t{uid('projcfg_debug')} /* Debug */ = {{")
    lines.append("\t\t\tisa = XCBuildConfiguration;")
    lines.append("\t\t\tbuildSettings = {")
    for k, v in proj_settings.items():
        lines.append(f"\t\t\t\t{k} = {fmt_setting(v)};")
    lines.append("\t\t\t};")
    lines.append("\t\t\tname = Debug;")
    lines.append("\t\t};")
    lines.append(f"\t\t{uid('projcfg_release')} /* Release */ = {{")
    lines.append("\t\t\tisa = XCBuildConfiguration;")
    lines.append("\t\t\tbuildSettings = {")
    for k, v in proj_settings_release.items():
        lines.append(f"\t\t\t\t{k} = {fmt_setting(v)};")
    lines.append("\t\t\t};")
    lines.append("\t\t\tname = Release;")
    lines.append("\t\t};")

    for t in TARGETS:
        base = dict(app_settings) if t["is_app"] else dict(extension_settings)
        if not t["is_app"]:
            base["CODE_SIGN_ENTITLEMENTS"] = t["entitlements"]
            base["INFOPLIST_FILE"] = t["info"]
            base["PRODUCT_BUNDLE_IDENTIFIER"] = t["bundle"]
        for name in ("Debug", "Release"):
            lines.append(f"\t\t{uid('cfg:' + t['name'] + ':' + name)} /* {name} */ = {{")
            lines.append("\t\t\tisa = XCBuildConfiguration;")
            lines.append("\t\t\tbuildSettings = {")
            for k, v in base.items():
                lines.append(f"\t\t\t\t{k} = {fmt_setting(v)};")
            lines.append("\t\t\t};")
            lines.append(f"\t\t\tname = {name};")
            lines.append("\t\t};")
    lines.append("\t/* End XCBuildConfiguration section */")
    lines.append("")

    # ── XCConfigurationList ─────────────────────────────────────────
    lines.append("\t/* Begin XCConfigurationList section */")
    lines.append(f"\t\t{uid('projectconfiglist')} /* Build configuration list for PBXProject \"REBOOT\" */ = {{")
    lines.append("\t\t\tisa = XCConfigurationList;")
    lines.append("\t\t\tbuildConfigurations = (")
    lines.append(f"\t\t\t\t{uid('projcfg_debug')} /* Debug */,")
    lines.append(f"\t\t\t\t{uid('projcfg_release')} /* Release */,")
    lines.append("\t\t\t);")
    lines.append("\t\t\tdefaultConfigurationIsVisible = 0;")
    lines.append("\t\t\tdefaultConfigurationName = Release;")
    lines.append("\t\t};")
    for t in TARGETS:
        lines.append(f"\t\t{uid('configlist:' + t['name'])} /* Build configuration list for PBXNativeTarget \"{t['name']}\" */ = {{")
        lines.append("\t\t\tisa = XCConfigurationList;")
        lines.append("\t\t\tbuildConfigurations = (")
        lines.append(f"\t\t\t\t{uid('cfg:' + t['name'] + ':Debug')} /* Debug */,")
        lines.append(f"\t\t\t\t{uid('cfg:' + t['name'] + ':Release')} /* Release */,")
        lines.append("\t\t\t);")
        lines.append("\t\t\tdefaultConfigurationIsVisible = 0;")
        lines.append("\t\t\tdefaultConfigurationName = Release;")
        lines.append("\t\t};")
    lines.append("\t/* End XCConfigurationList section */")
    lines.append("")

    lines.append("\t};")
    lines.append(f"\trootObject = {uid('project')} /* Project object */;")
    lines.append("}")

    PROJ.mkdir(parents=True, exist_ok=True)
    (PROJ / "project.pbxproj").write_text("\n".join(lines) + "\n")

    scheme_dir = PROJ / "xcshareddata" / "xcschemes"
    scheme_dir.mkdir(parents=True, exist_ok=True)
    app_target = next(t for t in TARGETS if t["is_app"])
    scheme = f"""<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1500"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "{uid('target:' + app_target['name'])}"
               BuildableName = "{app_target['product']}"
               BlueprintName = "{app_target['name']}"
               ReferencedContainer = "container:REBOOT.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES">
      <Testables>
      </Testables>
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{uid('target:' + app_target['name'])}"
            BuildableName = "{app_target['product']}"
            BlueprintName = "{app_target['name']}"
            ReferencedContainer = "container:REBOOT.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{uid('target:' + app_target['name'])}"
            BuildableName = "{app_target['product']}"
            BlueprintName = "{app_target['name']}"
            ReferencedContainer = "container:REBOOT.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
"""
    (scheme_dir / "REBOOT.xcscheme").write_text(scheme)

    total = sum(len(collected[t["name"]][0]) + len(collected[t["name"]][1]) for t in TARGETS)
    print(f"Generated {PROJ}: {len(TARGETS)} targets, {total} files")


if __name__ == "__main__":
    main()
