(function () {
  "use strict";

  const indexPath = "wiki/index.md";
  const knownCategories = new Map([
    ["wiki/equipment", "器材"],
    ["wiki/techniques", "技術動作"],
    ["wiki/styles", "射箭風格"],
    ["wiki/biomechanics", "生物力學"],
    ["wiki/mental", "心理訓練"],
    ["wiki/athletes", "選手"],
    ["wiki/competitions", "賽事與規則"],
    ["wiki/history", "歷史與文化"],
    ["wiki/concepts", "跨領域概念"]
  ]);
  const pageCache = new Map();
  const content = document.getElementById("content");
  const navigation = document.getElementById("navigation");
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menu-toggle");
  let pageEntries = [];
  let searchTimer;
  let searchGeneration = 0;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function normalizePagePath(path) {
    return path.replace(/^\.?\//, "").replace(/\.md$/i, "").replace(/\/+$/, "");
  }

  function pageUrl(path) {
    return "?page=" + encodeURIComponent(normalizePagePath(path));
  }

  function fetchMarkdown(path) {
    const normalized = normalizePagePath(path);
    if (!pageCache.has(normalized)) {
      const request = fetch("./" + normalized.split("/").map(encodeURIComponent).join("/") + ".md")
        .then(function (response) {
          if (!response.ok) {
            const error = new Error("無法讀取 " + normalized + "（HTTP " + response.status + "）");
            error.status = response.status;
            throw error;
          }
          return response.text();
        });
      pageCache.set(normalized, request);
    }
    return pageCache.get(normalized);
  }

  function extractFrontmatter(markdown) {
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    const metadata = {};
    if (!match) {
      return { metadata: metadata, body: markdown };
    }

    match[1].split(/\r?\n/).forEach(function (line) {
      const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (field) {
        metadata[field[1]] = field[2].replace(/^["']|["']$/g, "");
      }
    });
    return { metadata: metadata, body: markdown.slice(match[0].length) };
  }

  function wikiLinkTarget(target) {
    const parts = target.split("|");
    const pathAndHeading = parts[0].trim();
    const path = normalizePagePath(pathAndHeading.split("#")[0]);
    const label = (parts[1] || pathAndHeading.split("#")[0].split("/").filter(Boolean).pop() || pathAndHeading).trim();
    return { path: path, label: label };
  }

  function convertWikiLinks(markdown) {
    return markdown.replace(/\[\[([^\]]+)\]\]/g, function (_match, rawTarget) {
      const target = wikiLinkTarget(rawTarget);
      if (!target.path) {
        return escapeHtml(target.label);
      }
      const href = pageUrl(target.path);
      return '<a data-wiki-path="' + escapeHtml(target.path) + '" href="' + escapeHtml(href) + '">' + escapeHtml(target.label) + "</a>";
    });
  }

  function renderMarkdown(markdown) {
    if (!window.marked || !window.DOMPurify) {
      throw new Error("Markdown 顯示元件載入失敗，請確認網路連線後重新整理。");
    }
    const source = convertWikiLinks(markdown);
    const html = window.marked.parse(source, { gfm: true, breaks: false });
    return window.DOMPurify.sanitize(html, {
      ADD_ATTR: ["data-wiki-path"],
      FORBID_TAGS: ["style", "iframe", "object", "embed"],
      FORBID_ATTR: ["style"]
    });
  }

  function findPageEntries(markdown) {
    const entries = [];
    let group = "知識庫";
    markdown.split(/\r?\n/).forEach(function (line) {
      const heading = line.match(/^##\s+(.+?)\s*$/);
      if (heading) {
        group = heading[1].replace(/[*_`]/g, "").trim();
      }
      const linkMatch = line.match(/\[\[(wiki\/[^|\]]+)(?:\|([^\]]+))?\]\](?:\s*[—–-]\s*(.*))?/);
      if (linkMatch) {
        const path = normalizePagePath(linkMatch[1].trim());
        entries.push({
          path: path,
          title: (linkMatch[2] || linkMatch[1].split("/").filter(Boolean).pop()).trim(),
          description: (linkMatch[3] || "").trim(),
          group: group
        });
      }
    });
    return entries;
  }

  function renderNavigation(activePath) {
    const groups = new Map();
    pageEntries.forEach(function (entry) {
      if (!groups.has(entry.group)) {
        groups.set(entry.group, []);
      }
      groups.get(entry.group).push(entry);
    });

    navigation.innerHTML = Array.from(groups.entries()).map(function (group) {
      const links = group[1].map(function (entry) {
        const active = entry.path === activePath ? ' aria-current="page"' : "";
        return '<a class="nav-link" href="' + escapeHtml(pageUrl(entry.path)) + '"' + active + ">" +
          escapeHtml(entry.title) + "</a>";
      }).join("");
      return '<section class="nav-group"><h2 class="nav-heading">' + escapeHtml(group[0]) +
        "</h2>" + links + "</section>";
    }).join("");
  }

  function getPageTitle(metadata, markdown, fallback) {
    if (metadata.title) {
      return metadata.title;
    }
    const heading = markdown.match(/^#\s+(.+?)\s*$/m);
    return heading ? heading[1].replace(/\s*\([^)]*\)\s*$/, "").trim() : fallback;
  }

  function setActiveNavigation(path) {
    navigation.querySelectorAll(".nav-link").forEach(function (link) {
      if (link.getAttribute("href") === pageUrl(path)) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function isCategoryPath(path) {
    return knownCategories.has(path) || pageEntries.some(function (entry) {
      return entry.path.startsWith(path + "/");
    });
  }

  async function markMissingWikiLinks(container) {
    const paths = Array.from(new Set(Array.from(container.querySelectorAll("[data-wiki-path]"))
      .map(function (link) { return link.getAttribute("data-wiki-path"); })));

    await Promise.all(paths.map(async function (path) {
      if (isCategoryPath(path)) {
        return;
      }
      try {
        await fetchMarkdown(path);
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
        container.querySelectorAll("[data-wiki-path]").forEach(function (link) {
          if (link.getAttribute("data-wiki-path") === path) {
            link.classList.add("wiki-link-missing");
            link.setAttribute("aria-label", link.textContent + "（頁面尚未建立）");
            link.removeAttribute("data-wiki-path");
            link.removeAttribute("href");
          }
        });
      }
    }));

    container.querySelectorAll(".article a[href]").forEach(function (link) {
      if (/^https?:\/\//i.test(link.getAttribute("href"))) {
        link.classList.add("external-link");
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  function renderHeader(title, metadata, path) {
    const group = pageEntries.find(function (entry) { return entry.path === path; });
    const tags = metadata.tags
      ? metadata.tags.replace(/^\[|\]$/g, "").split(",").map(function (tag) {
        return tag.trim().replace(/^["']|["']$/g, "");
      }).filter(Boolean)
      : [];
    const category = metadata.category || (group && group.group) || "射箭知識";
    return '<p class="page-kicker">' + escapeHtml(category) + " / ARCHERY WIKI</p>" +
      '<h1 class="page-title">' + escapeHtml(title) + "</h1>" +
      (tags.length ? '<div class="page-meta">' + tags.map(function (tag) {
        return '<span class="meta-chip">' + escapeHtml(tag) + "</span>";
      }).join("") + "</div>" : "");
  }

  function renderIndexCards() {
    const groups = new Map();
    pageEntries.forEach(function (entry) {
      if (!groups.has(entry.group)) {
        groups.set(entry.group, []);
      }
      groups.get(entry.group).push(entry);
    });
    return Array.from(groups.entries()).map(function (group) {
      return '<section class="page-index"><h2>' + escapeHtml(group[0]) + "</h2>" +
        group[1].map(function (entry) {
          return '<a class="index-card" href="' + escapeHtml(pageUrl(entry.path)) + '">' +
            "<span><strong>" + escapeHtml(entry.title) + "</strong>" +
            (entry.description ? "<small>" + escapeHtml(entry.description) + "</small>" : "") +
            '</span><span class="index-arrow" aria-hidden="true">↗</span></a>';
        }).join("") + "</section>";
    }).join("");
  }

  function renderCategory(path) {
    const entries = pageEntries.filter(function (entry) {
      return entry.path.startsWith(path + "/");
    });
    if (!entries.length && !knownCategories.has(path)) {
      return false;
    }
    const category = knownCategories.get(path) || path.split("/").filter(Boolean).pop();
    content.innerHTML = '<header><p class="page-kicker">CATEGORY / ARCHERY WIKI</p>' +
      '<h1 class="page-title">' + escapeHtml(category) + "</h1>" +
      '<p class="page-subtitle">瀏覽此分類中收錄的射箭知識條目。</p></header>' +
      '<div class="article">' + (entries.length ? entries.map(function (entry) {
        return '<a class="index-card" href="' + escapeHtml(pageUrl(entry.path)) + '">' +
          "<span><strong>" + escapeHtml(entry.title) + "</strong>" +
          (entry.description ? "<small>" + escapeHtml(entry.description) + "</small>" : "") +
          '</span><span class="index-arrow" aria-hidden="true">↗</span></a>';
      }).join("") : '<p class="empty-state">此分類目前尚未收錄條目。</p>') + "</div>";
    setActiveNavigation("");
    return true;
  }

  async function showPage(path) {
    const normalized = normalizePagePath(path || indexPath);
    if (normalized !== "wiki/index") {
      const directory = normalized.replace(/\/+$/, "");
      if (renderCategory(directory)) {
        return;
      }
    }

    content.innerHTML = '<div class="loading-card" role="status"><span class="loader" aria-hidden="true"></span><p>正在載入頁面…</p></div>';
    content.setAttribute("aria-busy", "true");
    try {
      const markdown = await fetchMarkdown(normalized);
      const parsed = extractFrontmatter(markdown);
      const title = getPageTitle(parsed.metadata, parsed.body, normalized.split("/").pop());
      const articleHtml = renderMarkdown(parsed.body);
      content.innerHTML = "<header>" + renderHeader(title, parsed.metadata, normalized) +
        '</header><article class="article">' + articleHtml + "</article>";
      if (normalized === "wiki/index") {
        const article = content.querySelector(".article");
        article.insertAdjacentHTML("beforeend", renderIndexCards());
      }
      await markMissingWikiLinks(content);
      document.title = title + "｜射箭知識庫";
      setActiveNavigation(normalized);
      content.focus({ preventScroll: true });
    } catch (error) {
      content.innerHTML = '<section class="error-card" role="alert"><h2>頁面載入失敗</h2><p>' +
        escapeHtml(error.message) + '</p><p><a href="' + escapeHtml(pageUrl("wiki/index")) + '">回到知識庫首頁</a></p></section>';
    } finally {
      content.removeAttribute("aria-busy");
    }
  }

  async function initialize() {
    try {
      const index = await fetchMarkdown(indexPath);
      pageEntries = findPageEntries(index);
      renderNavigation(new URLSearchParams(window.location.search).get("page") || "wiki/index");
      const initialPath = new URLSearchParams(window.location.search).get("page") || "wiki/index";
      await showPage(initialPath);
    } catch (error) {
      navigation.innerHTML = '<p class="empty-state">目錄載入失敗。</p>';
      content.innerHTML = '<section class="error-card" role="alert"><h2>知識庫無法載入</h2><p>' +
        escapeHtml(error.message) + '</p><p>請確認網站已透過網頁伺服器提供，並稍後重試。</p></section>';
    }
  }

  function stripMarkdown(markdown) {
    return extractFrontmatter(markdown).body
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_match, target, label) {
        return label || target.split("/").filter(Boolean).pop();
      })
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[#>*_`~|-]/g, " ")
      .replace(/\s+/g, " ")
      .toLocaleLowerCase();
  }

  async function searchPages(query) {
    const term = query.trim().toLocaleLowerCase();
    const generation = ++searchGeneration;
    searchResults.hidden = !term;
    if (!term) {
      searchResults.innerHTML = "";
      return;
    }

    searchResults.innerHTML = '<p class="empty-state">搜尋中…</p>';
    const pages = await Promise.all(pageEntries.map(async function (entry) {
      const markdown = await fetchMarkdown(entry.path);
      const text = stripMarkdown(markdown);
      const position = text.indexOf(term);
      return position < 0 ? null : {
        entry: entry,
        excerpt: text.slice(Math.max(0, position - 35), position + term.length + 65)
      };
    }));
    if (generation !== searchGeneration) {
      return;
    }
    const results = pages.filter(Boolean).slice(0, 12);
    if (!results.length) {
      searchResults.innerHTML = '<p class="empty-state">找不到符合「' + escapeHtml(query) + '」的頁面。</p>';
      return;
    }
    searchResults.innerHTML = results.map(function (result) {
      return '<a class="search-result" href="' + escapeHtml(pageUrl(result.entry.path)) + '">' +
        "<strong>" + escapeHtml(result.entry.title) + "</strong><span>" +
        escapeHtml(result.excerpt) + "</span></a>";
    }).join("");
  }

  document.addEventListener("click", function (event) {
    const link = event.target.closest("a");
    if (!link) {
      return;
    }
    if (link.hasAttribute("data-wiki-path")) {
      event.preventDefault();
    }
    if (link.getAttribute("href") && link.getAttribute("href").startsWith("?page=")) {
      event.preventDefault();
      const path = new URL(link.href).searchParams.get("page") || "wiki/index";
      window.history.pushState({ page: path }, "", pageUrl(path));
      showPage(path);
      sidebar.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      searchResults.hidden = true;
      searchInput.value = "";
    }
  });

  window.addEventListener("popstate", function () {
    const path = new URLSearchParams(window.location.search).get("page") || "wiki/index";
    showPage(path);
  });

  searchInput.addEventListener("input", function () {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () {
      searchPages(searchInput.value).catch(function (error) {
        searchResults.innerHTML = '<p class="empty-state">' + escapeHtml(error.message) + "</p>";
      });
    }, 180);
  });

  document.getElementById("search-form").addEventListener("submit", function (event) {
    event.preventDefault();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && !/input|textarea/i.test(document.activeElement.tagName)) {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape") {
      searchInput.value = "";
      searchResults.hidden = true;
      searchResults.innerHTML = "";
      sidebar.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });

  menuToggle.addEventListener("click", function () {
    const open = sidebar.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  initialize();
}());
