# 操作日誌

> 格式：`## [YYYY-MM-DD] 操作類型 | 標題`
> 最新記錄在最上方。

---

## [2026-11-13] ingest | World Archery 官方器材頁面（5 篇）
- 來源：
  1. https://www.worldarchery.sport/sport/equipment（器材總覽）
  2. https://www.worldarchery.sport/sport/equipment/recurve（反曲弓）
  3. https://www.worldarchery.sport/sport/equipment/compound（複合弓）
  4. https://www.worldarchery.sport/sport/equipment/barebow（裸弓）
  5. https://www.worldarchery.sport/sport/disciplines/para-archery（殘障射箭）
- 新增頁面：6 頁
  - `wiki/equipment/弓具/器材總覽.md`
  - `wiki/equipment/弓具/反曲弓.md`
  - `wiki/equipment/弓具/複合弓.md`
  - `wiki/equipment/弓具/裸弓.md`
  - `wiki/competitions/殘障射箭.md`
  - `wiki/concepts/射手悖論.md`
- 更新頁面：1 頁（`wiki/index.md`）
- 關鍵發現：
  - 三大弓種規格數據已完整收錄（磅數、箭速、材質、競賽資格）
  - 裸弓弦行（String Walking）技術為獨特的本能瞄準核心，值得後續深入
  - 殘障射箭分級系統完整（PI1/PI2/W1/VI1/VI2），視覺障礙組尚未納入帕運
  - 射手悖論與脊值關係已建立獨立概念頁

---

## [2026-11-13] init | 知識庫初始化
- 建立目錄結構（raw/, wiki/ 及各子目錄）
- 建立 AGENTS.md — AI Agent 操作規範
- 建立 wiki/index.md — 總索引初稿
- 建立 wiki/log.md — 本操作日誌
- 建立 wiki/overview.md — 知識庫全景概述初稿
- 新增頁面：1 頁（overview.md）
- 下一步：開始 ingest 第一份射箭素材
