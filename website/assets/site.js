(() => {
  const locales = {
    en: {
      htmlLang: "en",
      title: "pFlow — code and process documentation",
      description: "pFlow is an AI Coding Agent Skill for code architecture and described processes. It creates Markdown, graph JSON, and a standalone interactive HTML Viewer.",
      copied: "Copied",
      copyFailed: "Copy failed"
    },
    ko: {
      htmlLang: "ko",
      title: "pFlow — 코드와 프로세스 문서화",
      description: "pFlow는 코드 아키텍처와 자연어로 설명한 프로세스를 Markdown, 그래프 JSON, 독립 실행형 HTML Viewer로 문서화하는 AI Coding Agent Skill입니다.",
      copied: "복사했습니다",
      copyFailed: "복사하지 못했습니다"
    },
    ja: {
      htmlLang: "ja",
      title: "pFlow — コードとプロセスの文書化",
      description: "pFlow は、コードアーキテクチャと自然言語で説明したプロセスを Markdown、グラフ JSON、スタンドアロンの HTML Viewer として文書化する AI Coding Agent Skill です。",
      copied: "コピーしました",
      copyFailed: "コピーできませんでした"
    },
    zh: {
      htmlLang: "zh-CN",
      title: "pFlow — 代码与流程文档化",
      description: "pFlow 是一个 AI Coding Agent Skill，可将代码架构和用自然语言描述的流程生成为 Markdown、图 JSON 和独立的 HTML Viewer。",
      copied: "已复制",
      copyFailed: "复制失败"
    }
  };
  const storageKey = "pflow-site-language";
  const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

  let activeLanguage = "en";
  try {
    const stored = localStorage.getItem(storageKey);
    if (Object.hasOwn(locales, stored)) activeLanguage = stored;
  } catch {}

  function setLanguage(language) {
    if (!Object.hasOwn(locales, language)) return;
    const locale = locales[language];
    activeLanguage = language;
    document.documentElement.lang = locale.htmlLang;
    document.title = locale.title;
    document.querySelector('meta[name="description"]').content = locale.description;

    document.querySelectorAll("[data-lang]").forEach((element) => {
      element.hidden = element.dataset.lang !== language;
    });
    document.querySelectorAll("[data-en-aria]").forEach((element) => {
      const label = element.dataset[language + "Aria"] ?? element.dataset.enAria;
      element.setAttribute("aria-label", label);
    });
    document.querySelectorAll("iframe[data-title-en]").forEach((frame) => {
      frame.title = frame.dataset["title" + capitalize(language)] ?? frame.dataset.titleEn;
    });
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
    });
    document.querySelectorAll(".copy-status").forEach((status) => {
      status.textContent = "";
    });
    try {
      localStorage.setItem(storageKey, language);
    } catch {}
  }

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });

  function fallbackCopy(text) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    if (!copied) throw new Error("Clipboard copy failed");
  }

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const source = document.getElementById(button.dataset.copyTarget);
      const status = button.parentElement.querySelector(".copy-status");
      if (!source || !status) return;
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(source.textContent);
        else fallbackCopy(source.textContent);
        status.textContent = locales[activeLanguage].copied;
      } catch {
        status.textContent = locales[activeLanguage].copyFailed;
      }
    });
  });

  setLanguage(activeLanguage);
})();
