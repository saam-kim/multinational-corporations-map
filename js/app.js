/**
 * 통합사회 다국적 기업 공간적 분업 프로페셔널 웹앱 메인 컨트롤러
 * 디자인 레퍼런스: sejong-gerrymandering-rebuild (Clean EdTech Style)
 */

document.addEventListener("DOMContentLoaded", () => {
  // 상태 변수
  let currentCompanyId = "samsung";
  let currentHubId = null;
  let currentMode = "explore";
  let currentQuizIndex = 0;
  let quizScore = 0;
  let answeredThisQuiz = false;

  // DOM 엘리먼트
  const companiesBar = document.getElementById("companies-bar");
  const sidebarExplore = document.getElementById("sidebar-explore");
  const sidebarQuiz = document.getElementById("sidebar-quiz");

  const btnModeExplore = document.getElementById("btn-mode-explore");
  const btnModeQuiz = document.getElementById("btn-mode-quiz");
  const btnFullscreen = document.getElementById("btn-fullscreen");

  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnResetView = document.getElementById("btn-reset-view");

  const companyProfileCard = document.getElementById("company-profile-card");
  const hubsListContainer = document.getElementById("hubs-list-container");
  const hubDetailContainer = document.getElementById("hub-detail-container");

  // 1. Leaflet 표준 맵 렌더러 초기화
  const mapRenderer = new StandardWorldMapRenderer("world-map", {
    onMarkerClick: (marker) => {
      if (marker.type === "hub") {
        selectHub(marker.data.id);
      } else if (marker.type === "headquarters") {
        selectHeadquarters();
      }
    }
  });

  // 2. 대륙별 기업 선택 탭 바 렌더링
  function renderCompanyTabs() {
    companiesBar.innerHTML = "";
    COMPANIES_DATA.forEach((comp) => {
      const tab = document.createElement("button");
      tab.className = `company-tab ${comp.id === currentCompanyId ? "active" : ""}`;
      tab.innerHTML = `
        <span class="tab-flag">${comp.flag}</span>
        <span>${comp.name}</span>
        <span class="tab-continent">(${comp.continent.split('/')[0].trim()})</span>
      `;
      tab.addEventListener("click", () => {
        selectCompany(comp.id);
        openCompanyModal(comp.id);
      });
      companiesBar.appendChild(tab);
    });
  }

  // 3. 기업 선택 및 지도 연동
  function selectCompany(companyId) {
    currentCompanyId = companyId;
    currentHubId = null;

    const tabs = companiesBar.querySelectorAll(".company-tab");
    tabs.forEach((tab, idx) => {
      if (COMPANIES_DATA[idx].id === companyId) {
        tab.classList.add("active");
        tab.scrollIntoView({ behavior: "smooth", inline: "center" });
      } else {
        tab.classList.remove("active");
      }
    });

    const company = COMPANIES_DATA.find((c) => c.id === companyId);
    if (!company) return;

    mapRenderer.setCompany(company);

    renderCompanyProfile(company);
    renderHubsList(company);

    if (company.hubs && company.hubs.length > 0) {
      selectHub(company.hubs[0].id);
    }
  }

  // 4. 기업 프로필 카드 렌더링 (세종 스타일 화이트 카드)
  function renderCompanyProfile(company) {
    companyProfileCard.innerHTML = `
      <div class="profile-top">
        <div class="profile-name">
          <div class="profile-title">
            <span>${company.flag}</span>
            <span>${company.name}</span>
          </div>
          <span class="profile-eng">${company.engName}</span>
        </div>
        <span class="profile-badge">${company.category}</span>
      </div>
      
      <div class="profile-hq cursor-pointer" id="profile-hq-btn" title="글로벌 본사 정보 보기">
        <span>★ 글로벌 본사:</span>
        <strong>${company.headquarters.city}</strong>
      </div>
      
      <p class="profile-desc">${company.headquarters.desc}</p>
      
      <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
        <button id="btn-open-profile-modal" style="
          background: var(--primary-50);
          color: var(--primary-700);
          border: 1px solid var(--primary-200);
          padding: 6px 14px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 5px;
        ">
          ℹ️ 기업 상세 개요 & 분업 전략 보기
        </button>
      </div>
    `;

    document.getElementById("profile-hq-btn").addEventListener("click", () => {
      selectHeadquarters();
    });

    document.getElementById("btn-open-profile-modal").addEventListener("click", () => {
      openCompanyModal(company.id);
    });
  }

  // [모달] 다국적 기업 상세 개요 모달 열기
  function openCompanyModal(companyId) {
    const company = COMPANIES_DATA.find((c) => c.id === companyId);
    if (!company) return;

    const modal = document.getElementById("company-modal");
    if (!modal) return;

    const ov = company.overview || {
      founded: "정보 준비 중",
      hqDetail: company.headquarters.city,
      globalScale: "글로벌 다국적 기업",
      coreBusiness: company.category,
      spatialDivisionSummary: company.headquarters.desc,
      keyFeatures: [
        { title: "본사 (HQ)", text: company.headquarters.desc }
      ],
      curriculumQuestion: "해당 기업의 글로벌 공간적 분업 전략을 지도를 통해 탐구해보세요."
    };

    // 모달 필드 데이터 바인딩
    document.getElementById("modal-badge-region").textContent = company.continent;
    document.getElementById("modal-badge-category").textContent = company.category;
    document.getElementById("modal-company-name").textContent = `${company.flag} ${company.name}`;
    document.getElementById("modal-company-eng").textContent = company.engName;

    document.getElementById("modal-spec-founded").textContent = ov.founded;
    document.getElementById("modal-spec-scale").textContent = ov.globalScale;
    document.getElementById("modal-spec-business").textContent = ov.coreBusiness;

    document.getElementById("modal-spatial-summary").textContent = ov.spatialDivisionSummary;

    // 4대 거점 피처 카드 생성
    const featuresContainer = document.getElementById("modal-features-container");
    featuresContainer.innerHTML = "";
    if (ov.keyFeatures && ov.keyFeatures.length > 0) {
      ov.keyFeatures.forEach((feat) => {
        const card = document.createElement("div");
        card.className = "feature-card";
        card.innerHTML = `
          <div class="feature-title">📌 ${feat.title}</div>
          <p class="feature-text">${feat.text}</p>
        `;
        featuresContainer.appendChild(card);
      });
    }

    document.getElementById("modal-curriculum-question").textContent = ov.curriculumQuestion;

    // 모달 표시
    modal.style.display = "flex";
  }

  // 모달 닫기
  function closeCompanyModal() {
    const modal = document.getElementById("company-modal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  // 모달 닫기 이벤트 리스너 등록
  const btnCloseModal = document.getElementById("btn-close-modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const btnModalExploreNow = document.getElementById("btn-modal-explore-now");

  if (btnCloseModal) btnCloseModal.addEventListener("click", closeCompanyModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeCompanyModal);
  if (btnModalExploreNow) btnModalExploreNow.addEventListener("click", closeCompanyModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCompanyModal();
    }
  });

  // 5. 거점 목록 렌더링
  function renderHubsList(company) {
    hubsListContainer.innerHTML = "";
    company.hubs.forEach((hub) => {
      const chip = document.createElement("div");
      chip.className = `hub-chip-item ${hub.id === currentHubId ? "active" : ""}`;
      chip.dataset.hubId = hub.id;
      chip.innerHTML = `
        <div class="hub-chip-left">
          <div class="hub-chip-dot" style="background-color: ${hub.color};"></div>
          <div>
            <div class="hub-chip-title">${hub.name}</div>
          </div>
        </div>
        <span class="hub-chip-badge">${hub.typeLabel}</span>
      `;
      chip.addEventListener("click", () => {
        selectHub(hub.id);
      });
      hubsListContainer.appendChild(chip);
    });
  }

  // 6. 거점 상세 3단계 입지 요인 분석 렌더링
  function selectHub(hubId) {
    currentHubId = hubId;
    mapRenderer.selectHub(hubId);

    const chips = hubsListContainer.querySelectorAll(".hub-chip-item");
    chips.forEach((chip) => {
      if (chip.dataset.hubId === hubId) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });

    const company = COMPANIES_DATA.find((c) => c.id === currentCompanyId);
    if (!company) return;
    const hub = company.hubs.find((h) => h.id === hubId);
    if (!hub) return;

    let reasonsHtml = hub.reasons.map((r, i) => `
      <div class="reason-item-box">
        <div class="reason-title">
          <span style="display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:50%; background:var(--primary-100); color:var(--primary-700); font-size:11px; font-weight:800;">${i + 1}</span>
          <span>${r.title}</span>
        </div>
        <div class="reason-detail">${r.detail}</div>
      </div>
    `).join("");

    hubDetailContainer.innerHTML = `
      <div class="hub-detail-card">
        <div class="detail-header">
          <div class="detail-title-wrap">
            <div class="detail-hub-name">${hub.name}</div>
            <span class="profile-badge" style="background:${hub.color}15; color:${hub.color}; border-color:${hub.color}40;">
              ${hub.typeLabel}
            </span>
          </div>
          <p class="detail-summary">${hub.summary}</p>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:8px;">
          <span style="font-size:12px; font-weight:800; color:var(--text-title); display:flex; align-items:center; gap:4px;">
            💡 왜 이 지역에서 분업(입지)할까?
          </span>
          <div class="reasons-list">
            ${reasonsHtml}
          </div>
        </div>

        <div class="textbook-point-box">
          <div class="textbook-point-tag">📚 통합사회 교과서 핵심 포인트</div>
          <div class="textbook-point-text">${hub.textbookPoint}</div>
        </div>
      </div>
    `;
  }

  // 7. 본사 클릭 시 본사 상세 분석 렌더링
  function selectHeadquarters() {
    currentHubId = null;
    const company = COMPANIES_DATA.find((c) => c.id === currentCompanyId);
    if (!company) return;

    const chips = hubsListContainer.querySelectorAll(".hub-chip-item");
    chips.forEach((chip) => chip.classList.remove("active"));

    mapRenderer.resetView();

    hubDetailContainer.innerHTML = `
      <div class="hub-detail-card">
        <div class="detail-header">
          <div class="detail-title-wrap">
            <div class="detail-hub-name">★ 글로벌 본사 (HQ)</div>
            <span class="profile-badge">의사결정 · 총괄</span>
          </div>
          <p class="detail-summary">${company.headquarters.city}</p>
        </div>

        <div class="reasons-list">
          <div class="reason-item-box">
            <div class="reason-title">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:50%; background:var(--primary-100); color:var(--primary-700); font-size:11px; font-weight:800;">1</span>
              <span>최고 의사결정 및 자본 투자 통제</span>
            </div>
            <div class="reason-detail">대규모 M&A, 글로벌 신규 공장 증설, 조 단위 R&D 예산 배분 등 기업의 명운을 가르는 핵심 결정을 수행합니다.</div>
          </div>
          <div class="reason-item-box">
            <div class="reason-title">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:50%; background:var(--primary-100); color:var(--primary-700); font-size:11px; font-weight:800;">2</span>
              <span>본국(모국)의 고급 인재 및 금융 인프라 집약</span>
            </div>
            <div class="reason-detail">수도권 및 대도시의 최고급 경영·기획 인력과 글로벌 투자은행, 정부 기관과의 긴밀한 네트워크를 활용합니다.</div>
          </div>
        </div>

        <div class="textbook-point-box">
          <div class="textbook-point-tag">📚 통합사회 교과서 핵심 포인트</div>
          <div class="textbook-point-text">【본사의 본국 집중】 공간적 분업이 심화되더라도, 정보 수집과 자본 조달이 유리한 본국 대도시에 본사 기능은 유지됩니다.</div>
        </div>
      </div>
    `;
  }

  // 8. 퀴즈 모드 렌더링 (형성평가 10문항)
  function renderQuizQuestion() {
    const quiz = QUIZ_DATA[currentQuizIndex];
    if (!quiz) {
      renderQuizResult();
      return;
    }

    answeredThisQuiz = false;
    const progressPercent = ((currentQuizIndex + 1) / QUIZ_DATA.length) * 100;

    let optionsHtml = quiz.options.map((opt, idx) => `
      <button class="quiz-option-btn" data-index="${idx}">
        <span>${idx + 1}. ${opt}</span>
        <span class="quiz-opt-icon" style="font-size:14px; opacity:0;">✓</span>
      </button>
    `).join("");

    sidebarQuiz.innerHTML = `
      <div class="quiz-panel-wrapper">
        <div class="quiz-header-bar">
          <div>
            <span class="badge-subject">형성평가 10문항</span>
            <div style="font-size: 15px; font-weight: 800; color: var(--text-title); margin-top: 4px;">
              Q${currentQuizIndex + 1}. ${quiz.question}
            </div>
          </div>
          <div style="text-align: right; flex-shrink: 0; margin-left: 12px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">진행률</div>
            <div style="font-size: 14px; font-weight: 800; color: var(--primary-600);">${currentQuizIndex + 1} / ${QUIZ_DATA.length}</div>
          </div>
        </div>

        <div class="quiz-progress-bar-wrap">
          <div class="quiz-progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;" id="quiz-options-box">
          ${optionsHtml}
        </div>

        <div id="quiz-feedback-box" style="display: none; background: var(--bg-subtle); border-radius: var(--radius-lg); padding: 14px 16px; border: 1px solid var(--border-subtle);">
          <div id="feedback-result" style="font-size: 13.5px; font-weight: 800; margin-bottom: 4px;"></div>
          <div id="feedback-explanation" style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;"></div>
          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button id="btn-next-quiz" class="btn-primary" style="padding: 7px 16px; font-size: 12.5px;">
              ${currentQuizIndex + 1 === QUIZ_DATA.length ? "결과 확인하기 →" : "다음 문제 →"}
            </button>
          </div>
        </div>
      </div>
    `;

    const optButtons = sidebarQuiz.querySelectorAll(".quiz-option-btn");
    optButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (answeredThisQuiz) return;
        answeredThisQuiz = true;

        const selectedIdx = parseInt(btn.dataset.index, 10);
        const feedbackBox = document.getElementById("quiz-feedback-box");
        const feedbackResult = document.getElementById("feedback-result");
        const feedbackExp = document.getElementById("feedback-explanation");

        if (selectedIdx === quiz.correct) {
          quizScore++;
          btn.classList.add("correct");
          feedbackResult.innerHTML = `<span style="color: #15803d;">🎉 정답입니다! (+10점)</span>`;
        } else {
          btn.classList.add("wrong");
          optButtons[quiz.correct].classList.add("correct");
          feedbackResult.innerHTML = `<span style="color: #b91c1c;">❌ 아쉽네요! 정답은 ${quiz.correct + 1}번입니다.</span>`;
        }

        feedbackExp.innerHTML = `<strong>해설:</strong> ${quiz.explanation}`;
        feedbackBox.style.display = "block";

        document.getElementById("btn-next-quiz").addEventListener("click", () => {
          currentQuizIndex++;
          renderQuizQuestion();
        });
      });
    });
  }

  // 9. 퀴즈 최종 결과창
  function renderQuizResult() {
    const total = QUIZ_DATA.length;
    const finalScore = quizScore * 10;
    let badge = "🥇";
    let message = "공간적 분업 마스터! 통합사회 1등급입니다.";

    if (finalScore < 60) {
      badge = "🥉";
      message = "지도를 다시 탐구하며 복습해 볼까요?";
    } else if (finalScore < 90) {
      badge = "🥈";
      message = "훌륭합니다! 교과서 핵심 개념을 잘 이해하고 있네요.";
    }

    sidebarQuiz.innerHTML = `
      <div class="quiz-panel-wrapper" style="text-align: center; padding: 40px 24px;">
        <div style="font-size: 48px; margin-bottom: 8px;">${badge}</div>
        <div style="font-size: 24px; font-weight: 800; color: var(--text-title);">형성평가 완료!</div>
        <div style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">${message}</div>
        
        <div style="background: var(--primary-50); border: 1px solid var(--primary-200); border-radius: var(--radius-xl); padding: 20px; margin: 24px auto; max-width: 320px;">
          <div style="font-size: 12px; color: var(--primary-700); font-weight: 700;">나의 최종 점수</div>
          <div style="font-size: 36px; font-weight: 900; color: var(--primary-600); margin-top: 2px;">${finalScore} <span style="font-size: 16px; font-weight: 600; color: var(--primary-800);">/ 100점</span></div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">총 ${total}문제 중 ${quizScore}문제 정답</div>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="btn-restart-quiz" class="btn-primary">
            🔄 다시 도전하기
          </button>
          <button id="btn-back-to-explore" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-title); padding: 9px 20px; border-radius: var(--radius-md); font-size: 13px; font-weight: 700; cursor: pointer;">
            🗺️ 지도로 돌아가기
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-restart-quiz").addEventListener("click", () => {
      currentQuizIndex = 0;
      quizScore = 0;
      renderQuizQuestion();
    });

    document.getElementById("btn-back-to-explore").addEventListener("click", () => {
      switchMode("explore");
    });
  }

  // 10. 모드 전환 (탐구 지도 <-> 퀴즈)
  function switchMode(mode) {
    currentMode = mode;
    if (mode === "explore") {
      btnModeExplore.classList.add("active");
      btnModeQuiz.classList.remove("active");
      sidebarExplore.style.display = "flex";
      sidebarQuiz.style.display = "none";
    } else {
      btnModeQuiz.classList.add("active");
      btnModeExplore.classList.remove("active");
      sidebarExplore.style.display = "none";
      sidebarQuiz.style.display = "block";
      currentQuizIndex = 0;
      quizScore = 0;
      renderQuizQuestion();
    }
  }

  // 이벤트 바인딩
  btnModeExplore.addEventListener("click", () => switchMode("explore"));
  btnModeQuiz.addEventListener("click", () => switchMode("quiz"));

  btnZoomIn.addEventListener("click", () => mapRenderer.zoomIn());
  btnZoomOut.addEventListener("click", () => mapRenderer.zoomOut());
  btnResetView.addEventListener("click", () => mapRenderer.resetView());

  btnFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
      btnFullscreen.innerHTML = "<span>⛶ 축소</span>";
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
      btnFullscreen.innerHTML = "<span>⛶ 전체화면</span>";
    }
  });

  // 초기 실행
  renderCompanyTabs();
  selectCompany("samsung");
});
