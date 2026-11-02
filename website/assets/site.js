(() => {
  const titles = {
    en: {
      title: "pFlow — understand how systems and teams work",
      description: "Understand how systems and teams work. pFlow turns code evidence and natural-language process descriptions into linked documentation and interactive HTML."
    },
    ko: {
      title: "pFlow — 시스템과 팀의 업무 흐름 이해",
      description: "pFlow는 코드 근거와 자연어 프로세스 설명을 연결된 문서와 인터랙티브 HTML로 만듭니다."
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
