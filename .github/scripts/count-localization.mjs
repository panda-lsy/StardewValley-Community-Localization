#!/usr/bin/env node
/**
 * 统计本地化条目数量
 * 生成统计报告并输出到控制台
 */

import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "../..");

async function countJsonFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let count = 0;
    let files = [];

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".json") && entry.name !== "example-modpack.json" && entry.name !== "example-collection.json") {
        count++;
        files.push(entry.name);
      }
    }

    return { count, files };
  } catch (error) {
    return { count: 0, files: [] };
  }
}

async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function collectStats() {
  const stats = {
    mods: { curseforge: 0, nexusmods: 0, uniqueid: 0, total: 0 },
    modpacks: 0,
    collections: 0,
    total: 0,
    contributors: new Set(),
    lastUpdated: new Date().toISOString()
  };

  const details = {
    mods: [],
    modpacks: [],
    collections: []
  };

  // 统计 Mods
  const modsDir = join(ROOT_DIR, "Mods");
  const platforms = ["Curseforge", "NexusMods", "UniqueID"];

  for (const platform of platforms) {
    const platformDir = join(modsDir, platform);
    const { count, files } = await countJsonFiles(platformDir);
    stats.mods[platform.toLowerCase()] = count;
    stats.mods.total += count;

    // 读取详细信息
    for (const file of files) {
      const data = await readJsonFile(join(platformDir, file));
      if (data) {
        details.mods.push({
          platform: platform.toLowerCase(),
          id: data.id,
          name: data.name?.["zh-CN"] || data.name?.source || "Unknown",
          contributor: data.meta?.contributor || "unknown",
          updatedAt: data.meta?.updatedAt
        });
        if (data.meta?.contributor) {
          stats.contributors.add(data.meta.contributor);
        }
      }
    }
  }

  // 统计 Modpacks
  const modpacksDir = join(ROOT_DIR, "Modpacks");
  const { count: modpackCount, files: modpackFiles } = await countJsonFiles(modpacksDir);
  stats.modpacks = modpackCount;

  for (const file of modpackFiles) {
    const data = await readJsonFile(join(modpacksDir, file));
    if (data) {
      details.modpacks.push({
        platform: data.platform?.toLowerCase() || "unknown",
        id: data.id,
        name: data.name?.["zh-CN"] || data.name?.source || "Unknown",
        contributor: data.meta?.contributor || "unknown",
        updatedAt: data.meta?.updatedAt
      });
      if (data.meta?.contributor) {
        stats.contributors.add(data.meta.contributor);
      }
    }
  }

  // 统计 Collections
  const collectionsDir = join(ROOT_DIR, "Collections");
  const { count: collectionCount, files: collectionFiles } = await countJsonFiles(collectionsDir);
  stats.collections = collectionCount;

  for (const file of collectionFiles) {
    const data = await readJsonFile(join(collectionsDir, file));
    if (data) {
      details.collections.push({
        platform: data.platform?.toLowerCase() || "unknown",
        id: data.id,
        name: data.name?.["zh-CN"] || data.name?.source || "Unknown",
        contributor: data.meta?.contributor || "unknown",
        updatedAt: data.meta?.updatedAt
      });
      if (data.meta?.contributor) {
        stats.contributors.add(data.meta.contributor);
      }
    }
  }

  // 计算总数
  stats.total = stats.mods.total + stats.modpacks + stats.collections;

  return { stats, details };
}

async function main() {
  console.log("📊 正在统计本地化条目...\n");

  const { stats, details } = await collectStats();

  // 输出统计结果
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║           星露谷社区本地化项目统计报告                  ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log(`║  Mods:        ${stats.mods.total.toString().padEnd(39)} ║`);
  console.log(`║    ├─ Curseforge: ${stats.mods.curseforge.toString().padEnd(35)} ║`);
  console.log(`║    ├─ NexusMods:  ${stats.mods.nexusmods.toString().padEnd(35)} ║`);
  console.log(`║    └─ UniqueID:   ${stats.mods.uniqueid.toString().padEnd(35)} ║`);
  console.log(`║  Modpacks:    ${stats.modpacks.toString().padEnd(39)} ║`);
  console.log(`║  Collections: ${stats.collections.toString().padEnd(39)} ║`);
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log(`║  总计:        ${stats.total.toString().padEnd(39)} ║`);
  console.log(`║  贡献者:      ${stats.contributors.size.toString().padEnd(39)} ║`);
  console.log("╚════════════════════════════════════════════════════════╝");

  console.log("\n📁 详细信息:");
  console.log("\nMods:");
  details.mods.forEach(m => console.log(`  - [${m.platform}] ${m.name} (by ${m.contributor})`));

  console.log("\nModpacks:");
  details.modpacks.forEach(m => console.log(`  - [${m.platform}] ${m.name} (by ${m.contributor})`));

  console.log("\nCollections:");
  details.collections.forEach(c => console.log(`  - [${c.platform}] ${c.name} (by ${c.contributor})`));

  // 输出JSON格式供API使用
  // 转换贡献者 Set 为数组
  const contributorsList = Array.from(stats.contributors).sort();

  console.log("\n📦 JSON 输出:");
  console.log(JSON.stringify({
    mods: stats.mods.total,
    modpacks: stats.modpacks,
    collections: stats.collections,
    total: stats.total,
    contributors: contributorsList,
    contributorCount: contributorsList.length,
    breakdown: {
      mods: stats.mods,
      modpacks: stats.modpacks,
      collections: stats.collections
    },
    details,
    generatedAt: stats.lastUpdated
  }, null, 2));

  // 保存到文件
  const statsFile = join(ROOT_DIR, "stats.json");
  await fs.writeFile(statsFile, JSON.stringify({
    mods: stats.mods.total,
    modpacks: stats.modpacks,
    collections: stats.collections,
    total: stats.total,
    contributors: contributorsList,
    contributorCount: contributorsList.length,
    breakdown: {
      mods: stats.mods,
      modpacks: stats.modpacks,
      collections: stats.collections
    },
    generatedAt: stats.lastUpdated
  }, null, 2));

  console.log(`\n✅ 统计结果已保存到: ${statsFile}`);
}

main().catch(console.error);
