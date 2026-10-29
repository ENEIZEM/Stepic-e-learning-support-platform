(function () {
  "use strict";

  const pages = Array.from(document.querySelectorAll(".page"));
  const pageIds = new Set(pages.map((page) => page.id));
  const sectionNames = {
    "1": "Введение",
    "2": "Общие сведения о платформе",
    "3": "Курсы и аналитика",
    "4": "Задания",
    "5": "Практика и самопроверка",
    "6": "Справочные материалы"
  };

  const titlePage = document.getElementById("title-page");
  const app = document.getElementById("app");
  const enterButton = document.getElementById("enter-btn");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("course-sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const sidebarClose = document.getElementById("sidebar-close");
  const sidebarCurrent = document.getElementById("sidebar-current");
  const headerNav = document.getElementById("header-nav");
  const headerCurrent = document.getElementById("header-current");
  const pageFooter = document.getElementById("page-footer");
  const prevButton = document.getElementById("prev-page");
  const nextButton = document.getElementById("next-page");
  let entered = false;
  let currentIndex = 0;
  let vantaEffect = null;

  function getHashPage() {
    const id = window.location.hash.slice(1);
    return pageIds.has(id) ? id : "page-1-1";
  }

  function getPageNumber(page) {
    const match = page.id.match(/^page-(\d+)-(\d+)$/);
    return match ? `${Number(match[1])}.${Number(match[2])}` : "";
  }

  function getSectionNumber(section) {
    return String(Number(section));
  }

  function makeButton(className, indexText, labelText, onClick, active) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className + (active ? " is-active" : "");
    if (active) button.setAttribute("aria-current", "page");

    if (indexText) {
      const index = document.createElement("span");
      index.className = className.indexOf("section-link") !== -1 ? "sidebar-section-index" : "sidebar-index";
      index.textContent = indexText;
      button.appendChild(index);
    }
    const label = document.createElement("span");
    label.textContent = labelText;
    button.appendChild(label);
    button.addEventListener("click", onClick);
    return button;
  }

  function updateSidebar() {
    const currentPage = pages[currentIndex];
    sidebarCurrent.replaceChildren();

    Object.keys(sectionNames).forEach((section) => {
      const sectionPages = pages.filter((page) => page.dataset.section === section);
      const group = document.createElement("div");
      group.className = "sidebar-tree-group";
      if (section === currentPage.dataset.section) group.classList.add("is-current-group");

      const pagesList = document.createElement("div");
      pagesList.className = "sidebar-tree-pages";
      pagesList.id = "sidebar-tree-pages-" + section;

      const moduleButton = makeButton(
        "sidebar-tree-module",
        getSectionNumber(section),
        sectionNames[section],
        () => {
          const expanded = moduleButton.getAttribute("aria-expanded") === "true";
          moduleButton.setAttribute("aria-expanded", String(!expanded));
          pagesList.hidden = expanded;
          group.classList.toggle("is-collapsed", expanded);
        },
        section === currentPage.dataset.section
      );
      moduleButton.setAttribute("aria-expanded", "true");
      moduleButton.setAttribute("aria-controls", pagesList.id);
      const moduleLabel = moduleButton.querySelector("span:last-of-type");
      if (moduleLabel) moduleLabel.className = "sidebar-tree-module-label";
      const caret = document.createElement("span");
      caret.className = "sidebar-tree-chevron";
      caret.setAttribute("aria-hidden", "true");
      moduleButton.appendChild(caret);
      group.appendChild(moduleButton);

      sectionPages.forEach((page) => {
        const pageButton = makeButton(
          "sidebar-tree-page",
          getPageNumber(page),
          page.dataset.title,
          () => {
            navigateTo(page.id);
            closeSidebar();
          },
          page.id === currentPage.id
        );
        pageButton.setAttribute("aria-current", page.id === currentPage.id ? "page" : "false");
        const pageLabel = pageButton.querySelector("span:last-of-type");
        if (pageLabel) pageLabel.className = "sidebar-tree-page-label";
        pagesList.appendChild(pageButton);
      });

      group.appendChild(pagesList);
      sidebarCurrent.appendChild(group);
    });
  }

  function buildHeaderDropdowns() {
    const triggers = Array.from(headerNav.querySelectorAll(":scope > button[data-section]"));
    triggers.forEach((trigger) => {
      const section = trigger.dataset.section;
      const group = document.createElement("div");
      group.className = "nav-group";
      headerNav.insertBefore(group, trigger);
      group.appendChild(trigger);
      trigger.classList.add("nav-group-trigger");
      trigger.setAttribute("aria-haspopup", "true");
      trigger.setAttribute("aria-expanded", "false");

      const caret = document.createElement("span");
      caret.className = "nav-chevron";
      caret.setAttribute("aria-hidden", "true");
      trigger.appendChild(caret);

      const dropdown = document.createElement("div");
      dropdown.className = "nav-dropdown";
      dropdown.setAttribute("role", "group");
      dropdown.setAttribute("aria-label", "Страницы раздела");
      pages.filter((page) => page.dataset.section === section).forEach((page) => {
        const link = document.createElement("a");
        link.className = "nav-dropdown-link";
        link.href = "#" + page.id;
        link.dataset.pageId = page.id;

        const index = document.createElement("span");
        index.className = "nav-dropdown-index";
        index.textContent = getPageNumber(page);
        const label = document.createElement("span");
        label.className = "nav-dropdown-label";
        label.textContent = page.dataset.title;
        link.append(index, label);

        link.addEventListener("click", (event) => {
          event.preventDefault();
          navigateTo(page.id);
          trigger.setAttribute("aria-expanded", "false");
          trigger.blur();
        });
        dropdown.appendChild(link);
      });
      group.appendChild(dropdown);

      trigger.addEventListener("focus", () => trigger.setAttribute("aria-expanded", "true"));
      group.addEventListener("mouseenter", () => trigger.setAttribute("aria-expanded", "true"));
      group.addEventListener("mouseleave", () => trigger.setAttribute("aria-expanded", "false"));
      group.addEventListener("focusout", (event) => {
        if (!group.contains(event.relatedTarget)) trigger.setAttribute("aria-expanded", "false");
      });
    });
  }

  function renderPage(id) {
    const pageId = pageIds.has(id) ? id : "page-1-1";
    currentIndex = pages.findIndex((page) => page.id === pageId);
    const currentPage = pages[currentIndex];

    pages.forEach((page) => {
      const active = page.id === pageId;
      page.classList.toggle("is-active", active);
      page.setAttribute("aria-hidden", String(!active));
    });

    const isLanding = currentPage.id === "page-1-1";
    headerCurrent.replaceChildren();
    if (!isLanding) {
      const number = document.createElement("span");
      number.className = "header-current-index";
      number.textContent = getPageNumber(currentPage);
      const title = document.createElement("span");
      title.className = "header-current-title";
      title.textContent = currentPage.dataset.title;
      headerCurrent.append(number, title);
    }
    document.getElementById("site-header").classList.toggle("is-home", isLanding);
    headerNav.querySelectorAll(".nav-group-trigger[data-section]").forEach((button) => {
      const active = button.dataset.section === currentPage.dataset.section;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    headerNav.querySelectorAll(".nav-dropdown-link").forEach((link) => {
      const active = link.dataset.pageId === currentPage.id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    pageFooter.hidden = isLanding;
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === pages.length - 1;
    document.title = currentPage.dataset.title + " — Stepic";
    updateSidebar();
  }

  function navigateTo(id) {
    if (!pageIds.has(id)) id = "page-1-1";
    if (window.location.hash === "#" + id) {
      renderPage(id);
    } else {
      window.location.hash = id;
    }
    document.getElementById("page-container").scrollTo({ top: 0, behavior: "smooth" });
  }

  function openSidebar() {
    updateSidebar();
    sidebarBackdrop.hidden = false;
    sidebar.inert = false;
    requestAnimationFrame(() => {
      sidebar.classList.add("is-open");
      sidebarBackdrop.classList.add("is-open");
    });
    sidebar.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Закрыть содержание");
    document.body.style.overflow = "hidden";
    sidebarClose.focus();
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarBackdrop.classList.remove("is-open");
    sidebar.setAttribute("aria-hidden", "true");
    sidebar.inert = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть содержание");
    document.body.style.overflow = "";
    window.setTimeout(() => {
      if (!sidebar.classList.contains("is-open")) sidebarBackdrop.hidden = true;
    }, 240);
  }

  function initializeVanta() {
    if (vantaEffect || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.VANTA || !window.THREE) return;
    const el = document.getElementById("vanta-net");
    if (!el) return;

    try {
      vantaEffect = window.VANTA.NET({
        el,
        THREE: window.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        color: 0xe4d1ff,
        backgroundColor: 0x211d31,
        points: 12,
        maxDistance: 26,
        spacing: 16,
        showDots: true
      });
    } catch (error) {
      // CSS background remains as a graceful fallback when WebGL is unavailable.
      console.warn("Vanta.NET could not be initialized; using the static background.", error);
    }
  }

  function enterResource() {
    entered = true;
    titlePage.hidden = true;
    app.hidden = false;
    const destination = getHashPage();
    renderPage(destination);
    initializeVanta();
    if (window.location.hash !== "#" + destination) {
      window.history.replaceState(null, "", "#" + destination);
    }
  }

  enterButton.addEventListener("click", enterResource);
  window.addEventListener("hashchange", () => {
    if (entered) renderPage(getHashPage());
  });

  buildHeaderDropdowns();
  headerNav.addEventListener("click", (event) => {
    const button = event.target.closest(".nav-group-trigger[data-section]");
    if (!button) return;
    const firstPage = pages.find((page) => page.dataset.section === button.dataset.section);
    if (firstPage) navigateTo(firstPage.id);
  });

  document.getElementById("start-learning").addEventListener("click", () => navigateTo("page-1-2"));
  prevButton.addEventListener("click", () => {
    if (currentIndex > 0) navigateTo(pages[currentIndex - 1].id);
  });
  nextButton.addEventListener("click", () => {
    if (currentIndex < pages.length - 1) navigateTo(pages[currentIndex + 1].id);
  });
  menuToggle.addEventListener("click", () => {
    if (sidebar.classList.contains("is-open")) closeSidebar();
    else openSidebar();
  });
  sidebarClose.addEventListener("click", closeSidebar);
  sidebarBackdrop.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
      closeSidebar();
      menuToggle.focus();
    }
  });

  /* Страница 5.1: распознавание форматов учебных заданий. */
  const questions = [
    {
      prompt: "«Выберите один правильный ответ из четырёх вариантов». Какой это тип задания?",
      options: ["Тест с одним ответом", "Сопоставление", "Программирование", "Взаимное оценивание"],
      correct: 0,
      explanation: "Нужно выбрать один вариант из нескольких. Ответ проверяется по ключу."
    },
    {
      prompt: "«Введите краткое определение термина своими словами». Какой формат подходит?",
      options: ["Тест с несколькими ответами", "Свободный ввод текста", "Сопоставление пар", "Взаимное оценивание"],
      correct: 1,
      explanation: "Ответ формулируется учащимся в текстовом поле, а не выбирается из списка."
    },
    {
      prompt: "«Соедините каждый термин с соответствующим определением». Как называется формат?",
      options: ["Программирование", "Тест с одним ответом", "Сопоставление", "Свободный ввод текста"],
      correct: 2,
      explanation: "Основное действие — установить соответствия между элементами двух наборов."
    },
    {
      prompt: "«Напишите функцию на Python, которая возвращает сумму двух чисел». Какой это тип?",
      options: ["Взаимное оценивание", "Сопоставление", "Тест с несколькими ответами", "Программирование"],
      correct: 3,
      explanation: "Учащийся пишет код, результат которого можно проверить с помощью тестов."
    },
    {
      prompt: "«Изучите решение другого учащегося и оцените его по заданным критериям». Что это?",
      options: ["Взаимное оценивание", "Свободный ввод текста", "Тест с одним ответом", "Сопоставление"],
      correct: 0,
      explanation: "Работу оценивает другой участник курса по заранее установленным критериям."
    },
    {
      prompt: "«Отметьте все утверждения, которые верно описывают API». Какой тип задания используется?",
      options: ["Программирование", "Тест с несколькими ответами", "Сопоставление", "Взаимное оценивание"],
      correct: 1,
      explanation: "Вопрос допускает несколько правильных вариантов, которые нужно отметить все."
    }
  ];

  const quizStage = document.getElementById("quiz-stage");
  const quizResult = document.getElementById("quiz-result");
  const questionCounter = document.getElementById("question-counter");
  const scoreCounter = document.getElementById("score-counter");
  const progressTrack = document.getElementById("quiz-progress-track");
  const progressFill = document.getElementById("quiz-progress");
  const prompt = document.getElementById("quiz-prompt");
  const answerList = document.getElementById("answer-list");
  const feedback = document.getElementById("quiz-feedback");
  const nextQuizButton = document.getElementById("quiz-next");
  const quizHint = document.getElementById("quiz-hint");
  let questionIndex = 0;
  let score = 0;
  let selectedAnswer = null;
  let answered = false;

  function renderQuestion() {
    const question = questions[questionIndex];
    selectedAnswer = null;
    answered = false;
    questionCounter.textContent = "Вопрос " + (questionIndex + 1) + " из " + questions.length;
    scoreCounter.textContent = "Верных ответов: " + score;
    progressFill.style.width = (questionIndex / questions.length * 100) + "%";
    progressTrack.setAttribute("aria-valuenow", String(questionIndex));
    prompt.textContent = question.prompt;
    feedback.textContent = "";
    feedback.className = "quiz-feedback";
    quizHint.textContent = "Выберите один вариант ответа.";
    nextQuizButton.disabled = true;
    nextQuizButton.textContent = "Проверить ответ";
    answerList.replaceChildren();

    question.options.forEach((text, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "answer-option";
      option.setAttribute("aria-pressed", "false");
      const letter = document.createElement("span");
      letter.className = "option-letter";
      letter.textContent = String.fromCharCode(65 + index);
      const label = document.createElement("span");
      label.textContent = text;
      option.append(letter, label);

      option.addEventListener("click", () => {
        if (answered) return;
        selectedAnswer = index;
        answerList.querySelectorAll(".answer-option").forEach((item) => {
          item.classList.remove("selected");
          item.setAttribute("aria-pressed", "false");
        });
        option.classList.add("selected");
        option.setAttribute("aria-pressed", "true");
        nextQuizButton.disabled = false;
      });
      answerList.appendChild(option);
    });
  }

  function checkOrAdvance() {
    const question = questions[questionIndex];
    if (!answered) {
      if (selectedAnswer === null) return;
      answered = true;
      const correct = selectedAnswer === question.correct;
      if (correct) score += 1;

      answerList.querySelectorAll(".answer-option").forEach((option, index) => {
        option.disabled = true;
        if (index === question.correct) option.classList.add("correct");
        if (index === selectedAnswer && !correct) option.classList.add("wrong");
      });

      scoreCounter.textContent = "Верных ответов: " + score;
      feedback.className = "quiz-feedback is-visible " + (correct ? "is-correct" : "is-wrong");
      feedback.textContent = (correct ? "Верно. " : "Неверно. ") + question.explanation;
      quizHint.textContent = correct ? "Ответ принят." : "Изучите пояснение к ответу.";
      progressFill.style.width = ((questionIndex + 1) / questions.length * 100) + "%";
      progressTrack.setAttribute("aria-valuenow", String(questionIndex + 1));
      nextQuizButton.textContent = questionIndex === questions.length - 1 ? "Результат" : "Следующий вопрос";
      nextQuizButton.focus();
      return;
    }

    if (questionIndex < questions.length - 1) {
      questionIndex += 1;
      renderQuestion();
    } else {
      showResult();
    }
  }

  function showResult() {
    quizStage.hidden = true;
    quizResult.hidden = false;
    document.getElementById("final-score").textContent = score + " / " + questions.length;

    const resultTitle = document.getElementById("result-title");
    const resultMessage = document.getElementById("result-message");
    if (score === questions.length) {
      resultTitle.textContent = "Все ответы верны";
      resultMessage.textContent = "Различия между форматами заданий усвоены.";
    } else if (score >= 4) {
      resultTitle.textContent = "Хороший результат";
      resultMessage.textContent = "Повторите пояснения к вопросам с ошибками и пройдите задание ещё раз.";
    } else {
      resultTitle.textContent = "Требуется повторение";
      resultMessage.textContent = "Повторите тему «Типы заданий», затем выполните упражнение ещё раз.";
    }
    progressFill.style.width = "100%";
    progressTrack.setAttribute("aria-valuenow", String(questions.length));
  }

  function restartQuiz() {
    questionIndex = 0;
    score = 0;
    quizStage.hidden = false;
    quizResult.hidden = true;
    renderQuestion();
  }

  nextQuizButton.addEventListener("click", checkOrAdvance);
  document.getElementById("quiz-restart").addEventListener("click", restartQuiz);

  renderQuestion();
  renderPage(getHashPage());
})();