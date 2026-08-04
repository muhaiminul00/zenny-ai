(() => {
  "use strict";

  const DOCUMENT_PATH = "docs/Agent_Runtime_System_v1.md";
  const FLOWCHART_MANIFEST = "docs/Flowcharts/manifest.json";
  const STORAGE_KEY = "architecture-explorer:v1";
  const SCHEMA_VERSION = 2;
  // The prior source document was not included, so no section can safely be labelled changed/new.
  const CHANGESET = { newSections: [], changedSections: [] };
  const state = {
    markdown: "", sections: [], roots: [], byId: new Map(), activeId: "", focus: false,
    focusIndex: 0, filter: "all", reviewed: new Set(), bookmarks: new Set(), notes: {},
    timestamps: {}, orphanedBookmarks: [], flowcharts: [], flowchartsViewed: new Set(),
    activeFlowchart: null, diagramZoom: 1, readingPosition: null
  };
  const $ = id => document.getElementById(id);
  const els = {
    document: $("document"), outline: $("outline"), loading: $("loading"), error: $("error"),
    search: $("search"), results: $("search-results"), focusToggle: $("focus-toggle"),
    focusNav: $("focus-nav"), focusPosition: $("focus-position")
  };

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function slugify(text, used) {
    const base = text.toLowerCase().replace(/<[^>]*>/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "section";
    let id = base, n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    return id;
  }

  function normalize(value) {
    return value.toLowerCase().replace(/\b(flow|map|step|module|archetype)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  }

  function parseDocument(markdown) {
    const lines = markdown.split(/\r?\n/), headings = [];
    let fence = "";
    lines.forEach((line, i) => {
      const marker = /^\s*(```|~~~)/.exec(line)?.[1];
      if (marker) { fence = fence ? "" : marker; return; }
      if (fence) return;
      const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (match) headings.push({ line: i, level: match[1].length, title: match[2] });
    });
    const used = new Set();
    state.sections = headings.map((heading, i) => {
      const id = slugify(heading.title, used);
      return {
        ...heading, id, endLine: headings[i + 1]?.line ?? lines.length,
        markdown: lines.slice(heading.line, headings[i + 1]?.line ?? lines.length).join("\n"),
        children: [], parent: null,
        change: CHANGESET.newSections.includes(id) ? "new" : CHANGESET.changedSections.includes(id) ? "changed" : ""
      };
    });
    state.byId = new Map(state.sections.map(section => [section.id, section]));
    const stack = [];
    state.sections.forEach(section => {
      while (stack.length && stack.at(-1).level >= section.level) stack.pop();
      if (stack.length) { section.parent = stack.at(-1); section.parent.children.push(section); }
      stack.push(section);
    });
    state.roots = state.sections.filter(section => !section.parent);
    state.preamble = lines.slice(0, headings[0]?.line ?? lines.length).join("\n");
  }

  function restoreState() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { saved = {}; }
    if ((saved.schemaVersion || 1) < SCHEMA_VERSION && localStorage.getItem(STORAGE_KEY)) {
      const backupKey = `${STORAGE_KEY}:backup:${new Date().toISOString()}`;
      localStorage.setItem(backupKey, localStorage.getItem(STORAGE_KEY));
    }
    state.reviewed = new Set(saved.reviewed || saved.completedSections || []);
    state.bookmarks = new Set(saved.bookmarks || []);
    state.notes = saved.notes || {};
    state.timestamps = saved.timestamps || {};
    state.flowchartsViewed = new Set(saved.flowchartsViewed || []);
    state.readingPosition = saved.readingPosition || saved.activeId || null;
    const known = new Set(state.sections.map(section => section.id));
    state.orphanedBookmarks = [...new Set([...(saved.orphanedBookmarks || []), ...[...state.bookmarks].filter(id => !known.has(id))])];
    state.bookmarks = new Set([...state.bookmarks].filter(id => known.has(id)));
    saveState();
  }

  function snapshot() {
    return {
      schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(),
      completedSections: [...state.reviewed], reviewed: [...state.reviewed],
      currentReadingPosition: state.readingPosition, readingPosition: state.readingPosition,
      bookmarks: [...state.bookmarks], orphanedBookmarks: state.orphanedBookmarks,
      notes: state.notes, timestamps: state.timestamps, flowchartsViewed: [...state.flowchartsViewed]
    };
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot())); }

  function matchesFilter(section) {
    return state.filter === "all" ||
      (state.filter === "unread" && !state.reviewed.has(section.id)) ||
      (state.filter === "new" && section.change === "new") ||
      (state.filter === "changed" && section.change === "changed") ||
      (state.filter === "bookmarked" && state.bookmarks.has(section.id));
  }

  function renderOutline() {
    const hasMatch = section => matchesFilter(section) || section.children.some(hasMatch);
    const branch = items => `<ul>${items.filter(hasMatch).map(section => `
      <li data-tree-id="${section.id}">
        <div class="tree-row" data-row-id="${section.id}">
          <button class="tree-toggle ${section.children.length ? "" : "empty"}" data-toggle="${section.id}" aria-label="Toggle section">${section.children.length ? "▾" : ""}</button>
          <button class="tree-link" data-jump="${section.id}" title="${escapeHtml(section.title)}">${escapeHtml(section.title)}</button>
          ${section.change ? `<span class="change-badge ${section.change}">${section.change === "new" ? "NEW" : "UPDATED"}</span>` : ""}
          <span class="review-dot ${state.reviewed.has(section.id) ? "done" : ""}">${state.reviewed.has(section.id) ? "✓" : "○"}</span>
        </div>${section.children.length ? branch(section.children) : ""}
      </li>`).join("")}</ul>`;
    els.outline.innerHTML = branch(state.roots) || '<p class="muted">No sections match this filter.</p>';
  }

  function renderDocument() {
    const preamble = state.preamble.trim() ? `<div class="doc-preamble">${marked.parse(state.preamble)}</div>` : "";
    els.document.innerHTML = preamble + state.sections.map(section => `
      <section class="doc-section" id="${section.id}" data-section-id="${section.id}">
        ${section.change ? `<div class="change-notice ${section.change}">${section.change === "new" ? "New since last version" : "Updated since last version"}</div>` : ""}
        ${marked.parse(section.markdown)}
        <div class="section-tools">
          <button data-review="${section.id}" class="${state.reviewed.has(section.id) ? "selected" : ""}">${state.reviewed.has(section.id) ? "✓ Reviewed" : "Mark Reviewed"}</button>
          <button data-bookmark="${section.id}" class="${state.bookmarks.has(section.id) ? "selected" : ""}">${state.bookmarks.has(section.id) ? "★ Review Later" : "☆ Review Later"}</button>
        </div>
      </section>`).join("");
  }

  async function loadFlowcharts() {
    try {
      const files = await fetchJson(FLOWCHART_MANIFEST);
      state.flowcharts = (await Promise.all(files.filter(file => /\.(md|mmd)$/i.test(file)).map(async file => {
        const text = await fetchText(`docs/Flowcharts/${file}`);
        const source = /```mermaid\s*([\s\S]*?)```/i.exec(text)?.[1]?.trim() ||
          (/\.mmd$/i.test(file) ? text.trim() : /```\s*([\s\S]*?)```/.exec(text)?.[1]?.trim());
        if (!source) return null;
        const title = /^#\s+(.+)$/m.exec(text)?.[1]?.trim() || file.replace(/\.(md|mmd)$/i, "").replace(/_/g, " ");
        return { id: file.replace(/\.(md|mmd)$/i, ""), file, title, source, change: "new" };
      }))).filter(Boolean);
    } catch (error) {
      console.warn("Flowcharts unavailable:", error);
      state.flowcharts = [];
    }
  }

  function findFlowchart(section) {
    const pathText = ancestors(section).map(item => item.title).join(" ");
    const sectionWords = new Set(normalize(pathText).split(/\s+/).filter(word => word.length > 2));
    let best = null, bestScore = 0;
    state.flowcharts.forEach(chart => {
      const words = normalize(chart.title).split(/\s+/).filter(Boolean);
      const hits = words.filter(word => sectionWords.has(word)).length;
      const score = hits / Math.max(words.length, 1);
      if (hits && score > bestScore) { best = chart; bestScore = score; }
    });
    return bestScore >= .5 ? best : null;
  }

  async function showFlowchart(chart) {
    if (!chart || state.activeFlowchart?.id === chart.id) return;
    state.activeFlowchart = chart;
    state.flowchartsViewed.add(chart.id);
    state.timestamps[`flowchart:${chart.id}:viewed`] ||= new Date().toISOString();
    saveState();
    $("diagram-section").hidden = false;
    $("diagram-title").textContent = chart.title;
    $("diagram-status").textContent = chart.change === "new" ? "NEW" : chart.change === "changed" ? "UPDATED" : "";
    $("diagram-status").className = `change-badge ${chart.change || ""}`;
    $("diagram-viewport").hidden = false;
    $("diagram-toggle").textContent = "Hide";
    state.diagramZoom = 1;
    await renderMermaid($("diagram"), chart.source, `diagram-${chart.id}`);
    applyDiagramZoom();
    updateStats();
  }

  async function renderMermaid(container, source, id) {
    if (!window.mermaid) { container.textContent = "Mermaid could not be loaded."; return; }
    try {
      const result = await mermaid.render(`${id}-${Date.now()}`, source);
      container.innerHTML = result.svg;
      result.bindFunctions?.(container);
    } catch (error) {
      container.innerHTML = `<p class="error-inline">Diagram could not be rendered: ${escapeHtml(error.message)}</p><pre>${escapeHtml(source)}</pre>`;
    }
  }

  function ancestors(section) {
    const result = [];
    while (section) { result.unshift(section); section = section.parent; }
    return result;
  }

  function setActive(id, shouldScroll = false) {
    const section = state.byId.get(id);
    if (!section) return;
    state.activeId = id; state.readingPosition = id; state.focusIndex = state.sections.indexOf(section);
    state.timestamps.lastRead = new Date().toISOString();
    saveState();
    document.querySelector(".tree-row.active")?.classList.remove("active");
    document.querySelector(`[data-row-id="${CSS.escape(id)}"]`)?.classList.add("active");
    ancestors(section).forEach(item => document.querySelector(`[data-tree-id="${CSS.escape(item.id)}"]`)?.classList.remove("collapsed"));
    const path = ancestors(section);
    $("current-module").textContent = (path.find(item => item.level === 1) || path[0])?.title || "—";
    $("current-section").textContent = path.find(item => item.level === 2)?.title || "—";
    $("current-subsection").textContent = [...path].reverse().find(item => item.level >= 3)?.title || "—";
    const chart = findFlowchart(section);
    if (chart) showFlowchart(chart);
    else { $("diagram-section").hidden = true; state.activeFlowchart = null; }
    if (state.focus) applyFocus();
    if (shouldScroll) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); closeMobileNav(); }
  }

  function updateStats() {
    const reviewed = state.sections.filter(section => state.reviewed.has(section.id)).length;
    const total = state.sections.length, percent = total ? Math.round(reviewed / total * 100) : 0;
    $("section-count").textContent = total; $("dashboard-reviewed").textContent = reviewed;
    $("dashboard-remaining").textContent = total - reviewed;
    $("dashboard-new").textContent = state.sections.filter(section => section.change === "new").length;
    $("dashboard-changed").textContent = state.sections.filter(section => section.change === "changed").length;
    $("dashboard-bookmarks").textContent = state.bookmarks.size;
    $("progress-value").textContent = `${percent}%`; $("progress-bar").style.width = `${percent}%`;
    $("review-count").textContent = `${reviewed} of ${total} sections reviewed`;
    $("flowchart-progress").textContent = `Flowcharts: ${state.flowchartsViewed.size} / ${state.flowcharts.length} reviewed`;
  }

  function renderBookmarks() {
    const sections = state.sections.filter(section => state.bookmarks.has(section.id));
    $("bookmark-count").textContent = sections.length;
    $("bookmarks").innerHTML = sections.length ? sections.map(section =>
      `<button data-jump="${section.id}" title="${escapeHtml(section.title)}">★ ${escapeHtml(section.title)}</button>`).join("") : '<p class="muted">No bookmarks yet.</p>';
    $("migrated-bookmarks-section").hidden = !state.orphanedBookmarks.length;
    $("migrated-bookmark-count").textContent = state.orphanedBookmarks.length;
    $("migrated-bookmarks").innerHTML = state.orphanedBookmarks.map(id => `<p class="orphan">⚠ ${escapeHtml(id)}</p>`).join("");
  }

  function toggleReview(id) {
    state.reviewed.has(id) ? state.reviewed.delete(id) : state.reviewed.add(id);
    state.timestamps[`section:${id}:reviewed`] = new Date().toISOString(); saveState();
    const selected = state.reviewed.has(id), tool = document.querySelector(`[data-review="${CSS.escape(id)}"]`);
    if (tool) { tool.classList.toggle("selected", selected); tool.textContent = selected ? "✓ Reviewed" : "Mark Reviewed"; }
    renderOutline(); updateStats();
  }

  function toggleBookmark(id) {
    state.bookmarks.has(id) ? state.bookmarks.delete(id) : state.bookmarks.add(id);
    state.timestamps[`section:${id}:bookmarked`] = new Date().toISOString(); saveState();
    const selected = state.bookmarks.has(id), tool = document.querySelector(`[data-bookmark="${CSS.escape(id)}"]`);
    if (tool) { tool.classList.toggle("selected", selected); tool.textContent = selected ? "★ Review Later" : "☆ Review Later"; }
    renderBookmarks(); renderOutline(); updateStats();
  }

  function performSearch(query) {
    const q = query.trim().toLocaleLowerCase();
    if (q.length < 2) { els.results.hidden = true; return; }
    const matches = state.sections.filter(section => `${section.title}\n${section.markdown}`.toLocaleLowerCase().includes(q)).slice(0, 50);
    els.results.innerHTML = matches.length ? matches.map(section =>
      `<button class="search-result" data-search-jump="${section.id}"><strong>${escapeHtml(section.title)}</strong></button>`).join("") : '<p class="muted">No matching sections found.</p>';
    els.results.hidden = false;
  }

  function applyFocus() {
    const current = state.sections[state.focusIndex];
    els.document.querySelectorAll(".doc-section").forEach(node => { node.hidden = node.dataset.sectionId !== current.id; });
    els.focusPosition.textContent = `${state.focusIndex + 1} / ${state.sections.length}`;
    $("previous-section").disabled = state.focusIndex === 0; $("next-section").disabled = state.focusIndex === state.sections.length - 1;
  }
  function toggleFocus() {
    state.focus = !state.focus; els.focusToggle.classList.toggle("active", state.focus);
    els.focusToggle.textContent = state.focus ? "Exit Focus" : "Focus Mode"; els.focusNav.hidden = !state.focus;
    if (state.focus) applyFocus(); else els.document.querySelectorAll(".doc-section").forEach(node => { node.hidden = false; });
  }
  function moveFocus(delta) {
    state.focusIndex = Math.max(0, Math.min(state.sections.length - 1, state.focusIndex + delta));
    setActive(state.sections[state.focusIndex].id, true);
  }
  function applyDiagramZoom() { $("diagram").style.transform = `scale(${state.diagramZoom})`; }

  function exportProgress() {
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "progress_backup.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  }

  function bindEvents() {
    document.addEventListener("click", event => {
      const jump = event.target.closest("[data-jump]"), searchJump = event.target.closest("[data-search-jump]");
      const review = event.target.closest("[data-review]"), bookmark = event.target.closest("[data-bookmark]");
      const toggle = event.target.closest("[data-toggle]"), filter = event.target.closest("[data-filter]");
      if (jump) setActive(jump.dataset.jump, true);
      if (searchJump) { setActive(searchJump.dataset.searchJump, true); els.results.hidden = true; }
      if (review) toggleReview(review.dataset.review);
      if (bookmark) toggleBookmark(bookmark.dataset.bookmark);
      if (toggle) {
        const li = document.querySelector(`[data-tree-id="${CSS.escape(toggle.dataset.toggle)}"]`);
        li?.classList.toggle("collapsed"); toggle.textContent = li?.classList.contains("collapsed") ? "▸" : "▾";
      }
      if (filter) {
        state.filter = filter.dataset.filter;
        $("filters").querySelector(".active")?.classList.remove("active"); filter.classList.add("active"); renderOutline();
      }
      if (!event.target.closest(".search-wrap")) els.results.hidden = true;
    });
    $("expand-all").onclick = () => els.outline.querySelectorAll("li").forEach(li => li.classList.remove("collapsed"));
    $("collapse-all").onclick = () => els.outline.querySelectorAll("li").forEach(li => li.classList.add("collapsed"));
    els.search.oninput = () => performSearch(els.search.value);
    document.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); els.search.focus(); }
      if (event.key === "Escape") els.results.hidden = true;
    });
    els.focusToggle.onclick = toggleFocus; $("previous-section").onclick = () => moveFocus(-1); $("next-section").onclick = () => moveFocus(1);
    $("nav-toggle").onclick = openMobileNav; $("nav-close").onclick = closeMobileNav; $("scrim").onclick = closeMobileNav;
    $("export-progress").onclick = exportProgress;
    $("diagram-toggle").onclick = () => {
      const hidden = !$("diagram-viewport").hidden; $("diagram-viewport").hidden = hidden; $("diagram-toggle").textContent = hidden ? "Show" : "Hide";
    };
    $("diagram-zoom-in").onclick = () => { state.diagramZoom = Math.min(2, state.diagramZoom + .15); applyDiagramZoom(); };
    $("diagram-zoom-out").onclick = () => { state.diagramZoom = Math.max(.4, state.diagramZoom - .15); applyDiagramZoom(); };
    $("diagram-copy").onclick = async () => {
      if (!state.activeFlowchart) return;
      await navigator.clipboard.writeText(state.activeFlowchart.source);
      $("diagram-copy").textContent = "Copied"; setTimeout(() => { $("diagram-copy").textContent = "Copy source"; }, 1200);
    };
    $("diagram-fullscreen").onclick = async () => {
      const dialog = $("diagram-dialog"); dialog.showModal();
      await renderMermaid($("diagram-fullscreen-content"), state.activeFlowchart.source, `fullscreen-${state.activeFlowchart.id}`);
    };
    $("diagram-dialog-close").onclick = () => $("diagram-dialog").close();
  }

  function setupObserver() {
    const observer = new IntersectionObserver(entries => {
      if (state.focus) return;
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.dataset.sectionId);
    }, { rootMargin: "-72px 0px -72% 0px" });
    els.document.querySelectorAll(".doc-section").forEach(section => observer.observe(section));
  }
  function openMobileNav() { $("left-panel").classList.add("open"); $("scrim").hidden = false; }
  function closeMobileNav() { $("left-panel").classList.remove("open"); $("scrim").hidden = true; }
  async function fetchText(path) {
    const response = await fetch(path); if (!response.ok) throw new Error(`${path}: ${response.status}`); return response.text();
  }
  async function fetchJson(path) {
    const response = await fetch(path); if (!response.ok) throw new Error(`${path}: ${response.status}`); return response.json();
  }

  async function init() {
    bindEvents();
    try {
      if (!window.marked) throw new Error("The Markdown renderer could not be loaded.");
      marked.use({ gfm: true, breaks: false });
      window.mermaid?.initialize({ startOnLoad: true });
      [state.markdown] = await Promise.all([fetchText(DOCUMENT_PATH), loadFlowcharts()]);
      parseDocument(state.markdown); restoreState(); renderOutline(); renderDocument(); renderBookmarks(); updateStats();
      els.loading.hidden = true;
      const initial = state.byId.has(state.readingPosition) ? state.readingPosition : state.sections[0]?.id;
      if (initial) setActive(initial, Boolean(state.readingPosition));
      setupObserver();
    } catch (error) {
      els.loading.hidden = true; els.error.hidden = false;
      els.error.innerHTML = `<h1>Could not load the architecture</h1><p>${escapeHtml(error.message)}</p><p>Run this folder through a local web server.</p>`;
    }
  }
  init();
})();
