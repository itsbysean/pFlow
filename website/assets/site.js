(() => {
  const titles = {
    en: {
      title: "pFlow — code and process documentation",
      description: "pFlow is an AI Coding Agent Skill for code architecture and described processes. It creates Markdown, graph JSON, and a standalone interactive HTML Viewer."
    },
    ko: {
      title: "pFlow — 코드와 프로세스 문서화",
      description: "pFlow는 코드 아키텍처와 자연어로 설명한 프로세스를 Markdown, 그래프 JSON, 독립 실행형 HTML Viewer로 문서화하는 AI Coding Agent Skill입니다."
    }
  };

  let activeLanguage = "en";
  try {
    activeLanguage = localStorage.getItem("pflow-site-language") === "ko" ? "ko" : "en";
  } catch {}

  function setLanguage(language) {
    if (language !== "en" && language !== "ko") return;
    activeLanguage = language;
    document.documentElement.lang = language;
    document.title = titles[language].title;
    document.querySelector('meta[name="description"]').content = titles[language].description;

    document.querySelectorAll("[data-lang]").forEach((element) => {
      element.hidden = element.dataset.lang !== language;
    });
    document.querySelectorAll("[data-en-aria][data-ko-aria]").forEach((element) => {
      element.setAttribute("aria-label", element.dataset[language + "Aria"]);
    });
    document.querySelectorAll("iframe[data-title-en][data-title-ko]").forEach((frame) => {
      frame.title = frame.dataset["title" + (language === "en" ? "En" : "Ko")];
    });
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
    });
    document.querySelectorAll(".copy-status").forEach((status) => {
      status.textContent = "";
    });
    try {
      localStorage.setItem("pflow-site-language", language);
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
        status.textContent = activeLanguage === "en" ? "Copied" : "복사했습니다";
      } catch {
        status.textContent = activeLanguage === "en" ? "Copy failed" : "복사하지 못했습니다";
      }
    });
  });

  setLanguage(activeLanguage);
})();
