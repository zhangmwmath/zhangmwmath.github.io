(() => {
  "use strict";
  const profile = window.PROFILE || {};
  const text = (value) => typeof value === "string" ? value.trim() : "";
  const safeHref = (value) => {
    const href = text(value);
    if (!href || /[\u0000-\u0020\u007f\\]/.test(href) || href.startsWith("//")) return "";
    if (/^[a-z][a-z\d+.-]*:/i.test(href) && !/^https?:\/\//i.test(href)) return "";
    return href;
  };
  const linkHref = (item) => {
    let value = text(item?.url);
    const hasArxivPrefix = /^arxiv\s*:/i.test(value);
    const isArxiv = hasArxivPrefix || /^arxiv$/i.test(text(item?.label));
    const id = value.replace(/^arxiv\s*:\s*/i, "");
    if (isArxiv && /^(?:\d{4}\.\d{4,5}|[a-z][a-z.-]*\/\d{7})(?:v[1-9]\d*)?$/i.test(id)) {
      value = "https://arxiv.org/abs/" + id;
    }
    return safeHref(value);
  };
  const linkLabel = (item, href) => {
    const arxiv = /^https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\/((?:\d{4}\.\d{4,5}|[a-z][a-z.-]*\/\d{7})(?:v[1-9]\d*)?)(?:\.pdf)?(?:[?#].*)?$/i.exec(href);
    return arxiv ? "arXiv:" + arxiv[1] : "[" + (text(item.label) || "link") + "]";
  };
  const setField = (id, value) => {
    const node = document.getElementById(id);
    node.textContent = text(value);
    node.hidden = !text(value);
    return node;
  };
  const link = (label, href) => {
    const anchor = document.createElement("a");
    anchor.textContent = label;
    anchor.href = href;
    return anchor;
  };
  const italic = (value) => {
    if (!text(value)) return null;
    const node = document.createElement("em");
    node.textContent = text(value);
    return node;
  };
  const quoted = (value) => text(value) ? "“" + text(value) + "”" : "";
  const addParts = (node, parts, separator = ", ") => {
    parts.filter(Boolean).forEach((part, index) => {
      if (index) node.append(separator);
      node.append(part);
    });
  };
  const endSentence = (node) => {
    if (node.textContent && !/[.!?]$/.test(node.textContent)) node.append(".");
  };
  const addLinks = (node, values) => {
    const span = document.createElement("span");
    span.className = "entry-links";
    (Array.isArray(values) ? values : []).forEach((item) => {
      const href = linkHref(item);
      if (href) span.append(link(linkLabel(item, href), href));
    });
    if (span.childElementCount) node.append(span);
  };
  const renderList = (sectionId, listId, values, render) => {
    const list = document.getElementById(listId);
    list.replaceChildren();
    (Array.isArray(values) ? values : []).forEach((item) => {
      if (!item || typeof item !== "object") return;
      const entry = document.createElement("li");
      render(entry, item);
      if (text(entry.textContent)) list.append(entry);
    });
    const empty = list.childElementCount === 0;
    document.getElementById(sectionId).hidden = empty;
    document.querySelector('.navigation a[href="#' + sectionId + '"]').hidden = empty;
  };

  setField("name", profile.name);
  setField("position", profile.position);
  const institution = setField("institution", profile.institution);
  const research = setField("research-interests", profile.researchInterests);
  research.parentElement.hidden = research.hidden;
  const address = document.getElementById("address");
  address.replaceChildren();
  (Array.isArray(profile.addressLines) ? profile.addressLines : []).map(text).filter(Boolean).forEach((value) => {
    const line = document.createElement("p");
    line.textContent = value;
    address.append(line);
  });
  address.hidden = address.childElementCount === 0;
  document.querySelector(".affiliation").hidden = institution.hidden && address.hidden;
  const email = document.getElementById("email");
  email.replaceChildren();
  const mail = text(profile.email);
  email.parentElement.hidden = !mail;
  if (mail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) && !/[?&#]/.test(mail)) {
    email.append(link(mail, "mailto:" + mail));
  } else email.textContent = mail;
  const cv = document.getElementById("cv");
  cv.replaceChildren();
  const cvHref = safeHref(profile.cv);
  cv.hidden = !cvHref;
  if (cvHref) cv.append(link("[CV]", cvHref));
  const header = document.getElementById("home");
  header.hidden = [...header.children].every((node) => node.hidden);

  renderList("publications", "publication-list", profile.publications, (node, item) => {
    addParts(node, [text(item.authors), quoted(item.title), italic(item.venue)]);
    endSentence(node);
    addLinks(node, item.links);
  });
  renderList("teaching", "teaching-list", profile.teaching, (node, item) => {
    addParts(node, [text(item.title), text(item.term), text(item.institution)]);
    if (text(item.role)) node.append((node.textContent ? " " : "") + "(" + text(item.role) + ")");
    endSentence(node);
    addLinks(node, item.links);
  });
  renderList("talks", "talk-list", profile.talks, (node, item) => {
    addParts(node, [quoted(item.title), italic(item.event), text(item.location), text(item.date)]);
    endSentence(node);
    if (text(item.note)) node.append((node.textContent ? " " : "") + text(item.note));
    addLinks(node, item.links);
  });
  renderList("notes", "note-list", profile.notes, (node, item) => {
    const href = safeHref(item.url);
    if (href) node.append(link(text(item.title) || "PDF", href));
    else if (text(item.title)) node.append(text(item.title));
    if (text(item.description)) node.append((node.textContent ? " — " : "") + text(item.description));
  });
  const navigation = document.querySelector(".navigation");
  const hasSections = [...navigation.children].some((node) => !node.hidden);
  navigation.hidden = !hasSections;
  const name = text(profile.name);
  const siteName = text(profile.siteName) || name;
  const siteTitle = text(profile.siteTitle) || (siteName ? siteName + "'s homepage" : "Personal homepage");
  let siteUrl = "";
  try {
    const value = safeHref(profile.siteUrl);
    if (/^https?:\/\//i.test(value)) siteUrl = new URL(value).href;
  } catch {}
  document.title = siteTitle;
  const description = [siteName, text(profile.position), text(profile.institution), text(profile.researchInterests)].filter(Boolean).join(". ");
  const setMeta = (selector, value) => {
    const node = document.querySelector(selector);
    if (value) node.setAttribute("content", value);
    else node.removeAttribute("content");
  };
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:site_name"]', siteName);
  setMeta('meta[property="og:title"]', siteTitle);
  setMeta('meta[property="og:url"]', siteUrl);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (siteUrl) canonical.setAttribute("href", siteUrl);
  else canonical.removeAttribute("href");
  document.getElementById("site-schema").textContent = siteName && siteUrl
    ? JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: siteName, url: siteUrl })
    : "";
  const footerText = document.getElementById("footer-text");
  footerText.textContent = [name, text(profile.lastUpdated) ? "Last updated: " + text(profile.lastUpdated) : ""].filter(Boolean).join(" · ");
  footerText.hidden = !footerText.textContent;
  const backToTop = document.querySelector('footer a[href="#home"]');
  backToTop.hidden = !hasSections || header.hidden;
  document.querySelector("footer").hidden = footerText.hidden && backToTop.hidden;
  if (typeof window.renderMathInElement === "function") {
    window.renderMathInElement(document.getElementById("main"), {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      throwOnError: false,
      trust: false
    });
  }
})();
