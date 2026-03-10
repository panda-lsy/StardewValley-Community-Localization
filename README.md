# 星露谷物语社区资源本地化仓库

用于存储星露谷物语社区资源的本地化覆盖信息。SVL 可接入，其他工具也可复用。

## 目录结构

```text
README.md
Mods/
  Curseforge/
    <ModID>.json
  NexusMods/
    <ModID>.json
Modpacks/
  <ModpackID>.json
Collections/
  <CollectionID>.json
schemas/
  mod.schema.json
  modpack.schema.json
  collection.schema.json
```

## 数据用途

- `Mods/*/*.json`:
  - Mod 下载页显示名称与简要描述（覆盖平台原始数据）
  - 人工维护前置依赖（是否可选）
  - 人工维护硬冲突
  - 人工维护功能性重复
- `Modpacks/*.json`:
  - Modpack 下载页显示名称与简要描述（覆盖平台原始数据）
- `Collections/*.json`:
  - 预留给后续 Collection 场景

## 提交流程

1. 在官网贡献页填写条目并点击提交。
2. 页面会创建一个包含 JSON payload 的 GitHub Issue。
3. GitHub Actions 自动解析 payload，写入目标路径并自动创建 PR。
4. 维护者审阅并合并 PR。

## 约定

- 文件名使用对应平台 ID（纯数字或原始字符串）。
- `schemaVersion` 当前固定为 `1`。
- `name.zh-CN` 与 `description.zh-CN` 为覆盖字段。
- 若字段缺失，接入方应回退到平台原始数据。
