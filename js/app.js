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
      moduleButton.removeAttribute("aria-current");
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
    if (entered && !isLanding) openSidebar();
    else closeSidebar();

    // Vanta's host is display:none on lesson pages. Re-measure only after
    // the home page is painted again, otherwise the canvas can keep stale
    // dimensions and collapse into a small corner.
    if (isLanding && vantaEffect) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (pages[currentIndex]?.id === "page-1-1" && vantaEffect) {
            vantaEffect.resize();
          }
        });
      });
    }
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
    sidebarBackdrop.hidden = true;
    sidebarBackdrop.classList.remove("is-open");
    sidebar.classList.add("is-open");
    sidebar.inert = false;
    sidebar.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Свернуть навигацию");
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarBackdrop.classList.remove("is-open");
    sidebarBackdrop.hidden = true;
    sidebar.setAttribute("aria-hidden", "true");
    sidebar.inert = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть навигацию");
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

  // Recalculate the WebGL canvas after restoring a backgrounded browser tab.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !entered || !vantaEffect) return;
    if (pages[currentIndex]?.id !== "page-1-1") return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (document.visibilityState === "visible" && pages[currentIndex]?.id === "page-1-1" && vantaEffect) {
          vantaEffect.resize();
        }
      });
    });
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

  // Page 1.2: clickable course hierarchy — each level explains its role.
  const structureCopy = {
    course: {
      eyebrow: "Уровень 1",
      title: "Курс",
      description: "Объединяет учебные материалы по общей теме, задаёт цель и последовательность обучения. Курс может включать несколько модулей.",
      example: "Пример: «Основы анализа данных»"
    },
    module: {
      eyebrow: "Уровень 2",
      title: "Модуль",
      description: "Группирует уроки по крупным темам или этапам программы. Автор может менять название, расположение и настройки модуля.",
      example: "Пример: «Введение в работу с данными»"
    },
    lesson: {
      eyebrow: "Уровень 3",
      title: "Урок",
      description: "Собирает материалы по одной теме. В урок можно добавлять новые или ранее созданные шаги; один урок может использоваться в разных курсах.",
      example: "Пример: «Таблицы и типы данных»"
    },
    step: {
      eyebrow: "Уровень 4",
      title: "Шаг",
      description: "Минимальная учебная единица: теоретический материал, видео или практическое задание. В одном уроке может быть до 16 шагов.",
      example: "Пример: текстовое объяснение, тест или задача на программирование"
    }
  };

  document.querySelectorAll("[data-course-level]").forEach((button) => {
    button.addEventListener("click", () => {
      const detail = structureCopy[button.dataset.courseLevel];
      if (!detail) return;
      document.querySelectorAll("[data-course-level]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      document.getElementById("course-level-eyebrow").textContent = detail.eyebrow;
      document.getElementById("course-level-title").textContent = detail.title;
      document.getElementById("course-level-description").textContent = detail.description;
      document.getElementById("course-level-example").textContent = detail.example;
    });
  });

  // Page 1.2: local-only imitation of the course-enrolment state.
  const enrollDemoButton = document.getElementById("course-enroll-demo");
  const enrollFeedback = document.getElementById("course-enroll-feedback");
  if (enrollDemoButton && enrollFeedback) {
    enrollDemoButton.addEventListener("click", () => {
      enrollDemoButton.textContent = "Вы записаны";
      enrollDemoButton.classList.add("is-complete");
      enrollDemoButton.disabled = true;
      enrollFeedback.textContent = "Демо-состояние изменено: курс добавлен в список обучения.";
    });
  }

  // Page 2.1: select a historical milestone and read its source-backed note.
  const historyEvents = {
    launch: {
      period: "2013 · Основание платформы",
      title: "Появление Stepik",
      description: "Справочный центр Stepik указывает 2013 год как год создания платформы. Сервис развивается как образовательная платформа и конструктор онлайн-курсов.",
      source: "https://help.stepik.org/article/54716",
      sourceLabel: "Общая информация о Stepik"
    },
    events: {
      period: "2016–2024 · Образовательные события",
      title: "Платформа для массовых онлайн-мероприятий",
      description: "По официальной справке Stepik, на платформе проводился отборочный этап Национальной технологической олимпиады в 2016–2023 годах, а в 2017–2024 годах — онлайн-этап акции «Тотальный диктант».",
      source: "https://help.stepik.org/article/54716",
      sourceLabel: "Общая информация о Stepik"
    },
    scale: {
      period: "2023 · Исторический статистический срез",
      title: "Рост аудитории и числа решений",
      description: "К 2023 году на платформе было зарегистрировано более 7 миллионов пользователей и отправлено более 1 миллиарда решений. Эти цифры относятся к 2023 году и не выдаются за актуальную статистику.",
      source: "https://help.stepik.org/article/54716",
      sourceLabel: "Общая информация о Stepik"
    }
  };
  document.querySelectorAll("[data-history-event]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = historyEvents[button.dataset.historyEvent];
      if (!item) return;
      document.querySelectorAll("[data-history-event]").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-pressed", String(active));
      });
      document.getElementById("history-detail-period").textContent = item.period;
      document.getElementById("history-detail-title").textContent = item.title;
      document.getElementById("history-detail-description").textContent = item.description;
      const sourceLine = document.getElementById("history-detail-source");
      sourceLine.replaceChildren("Источник: ");
      const sourceLink = document.createElement("a");
      sourceLink.href = item.source;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      sourceLink.textContent = item.sourceLabel;
      sourceLine.append(sourceLink, ".");
    });
  });


  // Page 2.2: switch the comparison detail without changing the report-based matrix.
  const analogueProfiles = {
    stepik: {
      kind: "Самый близкий аналог по предмету",
      title: "Создание курса на Stepik: Начальный уровень",
      strength: "Обучение идёт внутри самой платформы: короткие шаги, тестовые вопросы и практические задачи связаны с реальным интерфейсом Stepik.",
      limit: "Для прохождения нужна учётная запись; курс из 25 уроков длиннее краткой инструкции на нашем ресурсе.",
      transfer: "Показывать действие короткими порциями, после объяснения давать вопрос или небольшое практическое действие.",
      link: "https://stepik.org/course/5207",
      linkLabel: "Открыть официальный курс Stepik"
    },
    moodle: {
      kind: "Пример последовательного обучения преподавателя",
      title: "Moodle Academy — Start Teaching with Moodle",
      strength: "Самостоятельный маршрут для начинающего преподавателя: знакомство с навигацией, учебным пространством и предоставлением доступа учащимся.",
      limit: "Курс рассчитан примерно на три часа и использует терминологию и организацию Moodle, поэтому сценарии нельзя переносить на Stepik без адаптации.",
      transfer: "Разбить крупную тему на короткие этапы и явно формулировать цель каждого этапа.",
      link: "https://moodle.academy/course/view.php?id=34",
      linkLabel: "Открыть курс Moodle Academy"
    },
    openedx: {
      kind: "Пример обучения через пробную среду",
      title: "Open edX — Demo Course и Studio Sandbox",
      strength: "Документация связана с демонстрационным курсом и отдельной песочницей, где можно попробовать инструменты создания структуры курса.",
      limit: "Нужна отдельная среда и дополнительное знакомство с терминологией; по Практике № 2 тестовые аккаунты и материалы Sandbox удаляются каждые семь дней.",
      transfer: "Сразу после инструкции предлагать безопасное пробное действие в локальном макете, не изменяющее настоящий курс.",
      link: "https://docs.openedx.org/en/latest/educators/quickstarts/build_a_course.html",
      linkLabel: "Открыть руководство Open edX"
    },
    canvas: {
      kind: "Пример обучения внутри LMS",
      title: "Growing with Canvas",
      strength: "Самостоятельный курс расположен непосредственно в Canvas, поэтому пользователь осваивает материал в среде самой платформы.",
      limit: "Для записи требуется вход в Canvas; общий курс не раскрывает особенности конкретной университетской установки.",
      transfer: "Давать подсказки по навигации в контексте учебной платформы, не перегружая страницу отдельной инструкцией.",
      link: "https://go.canvas.duke.edu/growing-canvas-course/",
      linkLabel: "Открыть Growing with Canvas"
    }
  };
  document.querySelectorAll("[data-analogue]").forEach((button) => {
    button.addEventListener("click", () => {
      const profile = analogueProfiles[button.dataset.analogue];
      if (!profile) return;
      document.querySelectorAll("[data-analogue]").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-pressed", String(active));
      });
      document.getElementById("analogue-kind").textContent = profile.kind;
      document.getElementById("analogue-title").textContent = profile.title;
      document.getElementById("analogue-strength").textContent = profile.strength;
      document.getElementById("analogue-limit").textContent = profile.limit;
      document.getElementById("analogue-transfer").textContent = profile.transfer;
      const link = document.getElementById("analogue-link");
      link.href = profile.link;
      link.textContent = profile.linkLabel;
    });
  });

  // Page 3.1: a local-only course-builder prototype based on Stepik's documented flow.
  const builderRoot = document.getElementById("course-builder-demo");
  if (builderRoot) {
    const dashboard = document.getElementById("builder-dashboard");
    const workspace = document.getElementById("builder-workspace");
    const modal = document.getElementById("builder-modal");
    const dialogForm = document.getElementById("builder-dialog-form");
    const dialogTitle = document.getElementById("builder-dialog-title");
    const dialogName = document.getElementById("builder-dialog-name");
    const dialogNameLabel = document.getElementById("builder-dialog-name-label");
    const dialogHint = document.getElementById("builder-dialog-hint");
    const dialogTypeWrap = document.getElementById("builder-dialog-type-wrap");
    const dialogType = document.getElementById("builder-dialog-type");
    const outlineTree = document.getElementById("builder-outline-tree");
    const editorPanel = document.getElementById("builder-editor-panel");
    const aboutPanel = document.getElementById("builder-about-panel");
    const contentPanel = document.getElementById("builder-content-panel");
    const dialogSubmit = dialogForm.querySelector('button[type="submit"]');

    let builderCourse = null;
    let builderModules = [];
    let selectedModuleId = null;
    let selectedLessonId = null;
    let dialogMode = "course";
    let dialogModuleId = null;
    let dialogLessonId = null;
    let builderId = 0;
    let builderPaid = false;

    const nextBuilderId = (prefix) => prefix + "-" + (++builderId);
    const makeBuilderButton = (label, className, onClick, title) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = label;
      if (title) button.title = title;
      button.addEventListener("click", onClick);
      return button;
    };

    function closeBuilderDialog() {
      modal.hidden = true;
      dialogForm.reset();
      dialogName.setCustomValidity("");
    }

    function openBuilderDialog(mode, moduleId, lessonId) {
      dialogMode = mode;
      dialogModuleId = moduleId || null;
      dialogLessonId = lessonId || null;
      dialogTypeWrap.hidden = mode !== "step";
      dialogName.value = "";
      dialogName.setCustomValidity("");
      if (mode === "course") {
        dialogTitle.textContent = "Новый курс";
        dialogNameLabel.textContent = "Название курса";
        dialogName.placeholder = "Например, Основы анализа данных";
        dialogHint.textContent = "На первом этапе создания курса Stepik запрашивает только его название. Описание можно заполнить после создания.";
        dialogSubmit.textContent = "Создать курс";
      } else if (mode === "module") {
        dialogTitle.textContent = "Новый модуль";
        dialogNameLabel.textContent = "Название модуля";
        dialogName.placeholder = "Например, Введение";
        dialogHint.textContent = "Модуль объединяет уроки по одной теме или учебной неделе.";
        dialogSubmit.textContent = "Добавить модуль";
      } else if (mode === "lesson") {
        dialogTitle.textContent = "Новый урок";
        dialogNameLabel.textContent = "Название урока";
        dialogName.placeholder = "Например, Первые шаги";
        dialogHint.textContent = "Урок объединяет материалы и практические задания по одной теме.";
        dialogSubmit.textContent = "Добавить урок";
      } else {
        dialogTitle.textContent = "Новый шаг";
        dialogNameLabel.textContent = "Название шага";
        dialogName.placeholder = "Например, Что такое переменная";
        dialogHint.textContent = "Выбери формат шага. В одном уроке может быть не более 16 шагов.";
        dialogSubmit.textContent = "Добавить шаг";
      }
      modal.hidden = false;
      dialogName.focus();
    }

    function getSelectedModule() {
      return builderModules.find((module) => module.id === selectedModuleId) || null;
    }
    function getSelectedLesson() {
      const module = getSelectedModule();
      return module ? module.lessons.find((lesson) => lesson.id === selectedLessonId) || null : null;
    }

    function renderBuilderOutline() {
      outlineTree.replaceChildren();
      if (!builderModules.length) {
        const empty = document.createElement("p");
        empty.className = "builder-empty-outline";
        empty.textContent = "Добавьте первый модуль, чтобы начать собирать курс.";
        outlineTree.appendChild(empty);
        return;
      }
      builderModules.forEach((module, moduleIndex) => {
        const moduleCard = document.createElement("div");
        moduleCard.className = "builder-tree-module" + (module.id === selectedModuleId ? " is-active" : "");
        const moduleLine = document.createElement("div");
        moduleLine.className = "builder-tree-module-line";
        const moduleSelect = makeBuilderButton(
          (moduleIndex + 1) + ". " + module.title,
          "builder-tree-select",
          () => { selectedModuleId = module.id; selectedLessonId = null; renderBuilder(); }
        );
        moduleLine.appendChild(moduleSelect);
        moduleLine.appendChild(makeBuilderButton("＋ Урок", "builder-tree-add", () => openBuilderDialog("lesson", module.id)));
        moduleCard.appendChild(moduleLine);

        if (module.lessons.length) {
          const lessonList = document.createElement("div");
          lessonList.className = "builder-tree-lessons";
          module.lessons.forEach((lesson, lessonIndex) => {
            const lessonLine = document.createElement("div");
            lessonLine.className = "builder-tree-lesson" + (lesson.id === selectedLessonId ? " is-active" : "");
            const lessonSelect = makeBuilderButton(
              lessonIndex + 1 + ". " + lesson.title + " · " + lesson.steps.length + "/16",
              "builder-tree-lesson-select",
              () => { selectedModuleId = module.id; selectedLessonId = lesson.id; renderBuilder(); }
            );
            lessonLine.appendChild(lessonSelect);
            lessonLine.appendChild(makeBuilderButton("＋", "builder-tree-step-add", () => openBuilderDialog("step", module.id, lesson.id), "Добавить шаг"));
            lessonList.appendChild(lessonLine);
          });
          moduleCard.appendChild(lessonList);
        } else {
          const emptyLesson = document.createElement("p");
          emptyLesson.className = "builder-tree-empty";
          emptyLesson.textContent = "В модуле пока нет уроков.";
          moduleCard.appendChild(emptyLesson);
        }
        outlineTree.appendChild(moduleCard);
      });
    }

    function renderModuleEditor(module) {
      editorPanel.replaceChildren();
      const header = document.createElement("div");
      header.className = "builder-editor-header";
      const titleWrap = document.createElement("div");
      const eyebrow = document.createElement("p");
      eyebrow.className = "builder-eyebrow";
      eyebrow.textContent = "Настройки содержания";
      const title = document.createElement("h4");
      title.textContent = module.title;
      titleWrap.append(eyebrow, title);
      header.appendChild(titleWrap);
      header.appendChild(makeBuilderButton("＋ Добавить урок", "builder-primary-button builder-small-button", () => openBuilderDialog("lesson", module.id)));
      editorPanel.appendChild(header);

      const note = document.createElement("p");
      note.className = "builder-editor-note";
      note.textContent = "В модуле можно разместить любое количество уроков. Для изменения порядка уроков на Stepik используется перетаскивание за маркер слева от названия.";
      editorPanel.appendChild(note);

      const settings = document.createElement("details");
      settings.className = "builder-module-settings";
      const summary = document.createElement("summary");
      summary.textContent = "Настройки модуля и сроки";
      settings.appendChild(summary);
      const settingsBody = document.createElement("div");
      settingsBody.className = "builder-settings-body";

      const paidNotice = document.createElement("p");
      paidNotice.className = "builder-settings-note";
      paidNotice.textContent = builderPaid
        ? "В демо выбран платный курс: расширенные настройки доступны для пробного изменения."
        : "В справке Stepik расширенные даты и последовательное открытие модулей обозначены как функции платных курсов.";
      settingsBody.appendChild(paidNotice);

      const dateFields = [
        ["Мягкий дедлайн", "softDeadline"],
        ["Жёсткий дедлайн", "hardDeadline"],
        ["Дата окончания модуля", "moduleEnd"]
      ];
      dateFields.forEach(([label, key]) => {
        const row = document.createElement("label");
        row.className = "builder-setting-row";
        const caption = document.createElement("span");
        caption.textContent = label;
        const input = document.createElement("input");
        input.type = "date";
        input.value = module.settings[key] || "";
        input.disabled = !builderPaid;
        input.addEventListener("change", () => { module.settings[key] = input.value; });
        row.append(caption, input);
        settingsBody.appendChild(row);
      });

      const prerequisiteLabel = document.createElement("label");
      prerequisiteLabel.className = "builder-setting-row builder-prerequisite-row";
      const prerequisiteCaption = document.createElement("span");
      prerequisiteCaption.textContent = "Открыть после модуля";
      const prerequisite = document.createElement("select");
      prerequisite.disabled = !builderPaid;
      const noRequirement = document.createElement("option");
      noRequirement.value = "";
      noRequirement.textContent = "Без ограничения";
      prerequisite.appendChild(noRequirement);
      builderModules.filter((item) => item.id !== module.id).forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.title;
        prerequisite.appendChild(option);
      });
      prerequisite.value = module.settings.requiredModule || "";
      prerequisite.addEventListener("change", () => { module.settings.requiredModule = prerequisite.value; });
      prerequisiteLabel.append(prerequisiteCaption, prerequisite);
      settingsBody.appendChild(prerequisiteLabel);

      if (!builderPaid) {
        const locked = document.createElement("p");
        locked.className = "builder-locked-note";
        locked.textContent = "Переключи тип курса на «Платный · демо», чтобы увидеть работу этих полей. Это не меняет реальный курс.";
        settingsBody.appendChild(locked);
      }
      settings.appendChild(settingsBody);
      editorPanel.appendChild(settings);
      editorPanel.appendChild(makeBuilderButton("＋ Добавить урок в этот модуль", "builder-outline-button builder-add-lesson-wide", () => openBuilderDialog("lesson", module.id)));
    }

    function renderLessonEditor(module, lesson) {
      editorPanel.replaceChildren();
      const header = document.createElement("div");
      header.className = "builder-editor-header";
      const titleWrap = document.createElement("div");
      const eyebrow = document.createElement("p");
      eyebrow.className = "builder-eyebrow";
      eyebrow.textContent = module.title + " / Урок";
      const title = document.createElement("h4");
      title.textContent = lesson.title;
      titleWrap.append(eyebrow, title);
      header.appendChild(titleWrap);
      const addStep = makeBuilderButton(
        lesson.steps.length >= 16 ? "Достигнут лимит шагов" : "＋ Добавить шаг",
        "builder-primary-button builder-small-button",
        () => openBuilderDialog("step", module.id, lesson.id)
      );
      addStep.disabled = lesson.steps.length >= 16;
      header.appendChild(addStep);
      editorPanel.appendChild(header);

      const note = document.createElement("p");
      note.className = "builder-editor-note";
      note.textContent = "Добавляй теоретические шаги, видео и практические задачи. В одном уроке допускается до 16 шагов.";
      editorPanel.appendChild(note);

      const list = document.createElement("div");
      list.className = "builder-step-list";
      if (!lesson.steps.length) {
        const empty = document.createElement("p");
        empty.className = "builder-tree-empty";
        empty.textContent = "В этом уроке пока нет шагов.";
        list.appendChild(empty);
      } else {
        lesson.steps.forEach((step, index) => {
          const row = document.createElement("div");
          row.className = "builder-step-row";
          const number = document.createElement("span");
          number.className = "builder-step-number";
          number.textContent = String(index + 1);
          const main = document.createElement("div");
          const name = document.createElement("strong");
          name.textContent = step.title;
          const type = document.createElement("small");
          type.textContent = step.typeLabel;
          main.append(name, type);
          row.append(number, main);
          list.appendChild(row);
        });
      }
      editorPanel.appendChild(list);
    }

    function renderBuilder() {
      dashboard.hidden = Boolean(builderCourse);
      workspace.hidden = !builderCourse;
      if (!builderCourse) return;

      document.getElementById("builder-course-heading").textContent = builderCourse.title;
      const descriptionInput = document.getElementById("builder-course-description-input");
      if (descriptionInput && document.activeElement !== descriptionInput) descriptionInput.value = builderCourse.description;
      document.getElementById("builder-course-type").value = builderPaid ? "paid" : "free";
      renderBuilderOutline();

      const module = getSelectedModule();
      const lesson = getSelectedLesson();
      if (lesson && module) renderLessonEditor(module, lesson);
      else if (module) renderModuleEditor(module);
      else {
        editorPanel.replaceChildren();
        const empty = document.createElement("div");
        empty.className = "builder-editor-empty";
        const step = document.createElement("span");
        step.textContent = "01";
        const title = document.createElement("h4");
        title.textContent = "Содержание курса";
        const description = document.createElement("p");
        description.textContent = builderModules.length ? "Выбери модуль или создай новый." : "Создай первый модуль в панели слева. Затем добавь в него уроки и шаги.";
        empty.append(step, title, description);
        editorPanel.appendChild(empty);
      }
    }

    function createBuilderCourse(name) {
      builderCourse = { title: name, description: "" };
      builderModules = [];
      selectedModuleId = null;
      selectedLessonId = null;
      builderPaid = false;
      renderBuilder();
    }

    document.getElementById("builder-new-course").addEventListener("click", () => openBuilderDialog("course"));
    document.getElementById("builder-empty-create").addEventListener("click", () => openBuilderDialog("course"));
    document.getElementById("builder-add-module").addEventListener("click", () => openBuilderDialog("module"));
    document.getElementById("builder-dialog-close").addEventListener("click", closeBuilderDialog);
    document.getElementById("builder-dialog-cancel").addEventListener("click", closeBuilderDialog);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeBuilderDialog(); });

    dialogForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = dialogName.value.trim();
      if (!name) { dialogName.focus(); return; }
      if (dialogMode === "course") {
        createBuilderCourse(name);
      } else if (dialogMode === "module") {
        const module = {
          id: nextBuilderId("module"),
          title: name,
          lessons: [],
          settings: { softDeadline: "", hardDeadline: "", moduleEnd: "", requiredModule: "" }
        };
        builderModules.push(module);
        selectedModuleId = module.id;
        selectedLessonId = null;
        renderBuilder();
      } else if (dialogMode === "lesson") {
        const module = builderModules.find((item) => item.id === dialogModuleId);
        if (!module) return;
        const lesson = { id: nextBuilderId("lesson"), title: name, steps: [] };
        module.lessons.push(lesson);
        selectedModuleId = module.id;
        selectedLessonId = lesson.id;
        renderBuilder();
      } else if (dialogMode === "step") {
        const module = builderModules.find((item) => item.id === dialogModuleId);
        const lesson = module?.lessons.find((item) => item.id === dialogLessonId);
        if (!lesson || lesson.steps.length >= 16) return;
        const typeMap = {
          text: "Теория · текст",
          video: "Видео",
          task: "Практическая задача"
        };
        lesson.steps.push({
          id: nextBuilderId("step"),
          title: name,
          type: dialogType.value,
          typeLabel: typeMap[dialogType.value] || "Учебный шаг"
        });
        selectedModuleId = module.id;
        selectedLessonId = lesson.id;
        renderBuilder();
      }
      closeBuilderDialog();
    });

    document.getElementById("builder-course-type").addEventListener("change", (event) => {
      builderPaid = event.target.value === "paid";
      renderBuilder();
    });
    document.querySelectorAll("[data-builder-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll("[data-builder-tab]").forEach((item) => item.classList.toggle("is-active", item === tab));
        const about = tab.dataset.builderTab === "about";
        aboutPanel.hidden = !about;
        contentPanel.hidden = about;
      });
    });
    document.getElementById("builder-course-description-input").addEventListener("input", (event) => {
      if (builderCourse) builderCourse.description = event.target.value;
    });
    document.getElementById("builder-save-description").addEventListener("click", () => {
      document.getElementById("builder-description-feedback").textContent = "Описание сохранено в демонстрационном курсе.";
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeBuilderDialog();
    });
  }

  renderQuestion();
  renderPage(getHashPage());
})();