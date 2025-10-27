/* ===============================
   Chatbot & Sidebar Fetch
=================================*/
document.addEventListener("DOMContentLoaded", () => {
  // 챗봇 로드
  fetch("components/chatbot.html")
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById("chatbot-container");
      container.innerHTML = html;

      const closeBtn = container.querySelector(".close-chat-btn");
      const sendBtn = container.querySelector(".send-btn");
      const chatInput = container.querySelector("#chatInput");
      const floatingBtn = document.getElementById("floatingChatBtn");

      if (closeBtn) closeBtn.addEventListener("click", closeChat);
      if (sendBtn) sendBtn.addEventListener("click", sendMessage);
      if (chatInput) chatInput.addEventListener("keypress", handleChatEnter);
      if (floatingBtn) floatingBtn.addEventListener("click", openChat);
    });

  // 사이드바 로드
  fetch("components/sidebar.html")
    .then(res => res.text())
    .then(html => {
      const sidebar = document.getElementById("sidebar-container");
      sidebar.innerHTML = html;

      // ✅ 사이드바 로드 후 사용자 정보 주입
      injectUserInfo();

      // 현재 페이지 활성화
      const currentPage = window.location.pathname.split("/").pop();
      const navItems = sidebar.querySelectorAll(".nav-menu a");

      navItems.forEach(item => {
        const linkPath = item.getAttribute("href");

        // recordSetting.html 또는 recording.html인 경우 회의록 작성 메뉴 활성화
        if ((currentPage === 'recordSetting.html' || currentPage === 'recordFinish.html') &&
          linkPath === 'recordSetting.html') {
          item.classList.add("active");
        } else if (linkPath === currentPage) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
    })
    .catch(error => {
      console.error('사이드바 로드 실패:', error);
    });
});

/* ===============================
   사용자 정보 표시 함수
=================================*/
function injectUserInfo() {
  // localStorage에서 사용자 정보 가져오기
  let user = null;
  const userData = localStorage.getItem("user");

  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch (e) {
      console.error('사용자 정보 파싱 실패:', e);
    }
  }

  // JWT 토큰에서 정보 추출 시도
  if (!user) {
    const token = getCookie('jwt') || localStorage.getItem('accessToken');
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        user = {
          name: payload.name || payload.email || "사용자",
          email: payload.email || ""
        };
      }
    }
  }

  // 사용자 정보가 있으면 표시
  if (user) {
    // 이름 표시 (.user-name 셀렉터 사용)
    document.querySelectorAll(".user-name").forEach(el => {
      el.textContent = user.name || "사용자";
    });

    // 이메일 표시
    document.querySelectorAll(".user-email").forEach(el => {
      el.textContent = user.email || "";
    });

    // 아바타 표시
    document.querySelectorAll(".user-avatar").forEach(el => {
      el.textContent = user.name ? user.name.charAt(0).toUpperCase() : "U";
    });

    console.log("✅ 로그인 사용자 표시:", user.name);
  } else {
    console.warn("⚠️ 로그인 정보 없음");
    // 필요시 로그인 페이지로 리다이렉트
    // window.location.href = 'login.html';
  }
}

    function openConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');

    titleEl.textContent = title;
    msgEl.innerHTML = message;

    modal.classList.remove('hidden');

    // 클릭 핸들러
    const closeModal = () => modal.classList.add('hidden');
    cancelBtn.onclick = closeModal;
    okBtn.onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };
    }

/* 공통 메시지 */
function showSuccessMessage(msg) {
  const div = document.createElement("div");
  div.className = "success-toast";
  div.textContent = msg;
  Object.assign(div.style, {
      position: "fixed",
      top: "24px",
      right: "24px",
      background: "#10b981",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "8px",
      zIndex: "9999",
  });
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2500);
}

function showErrorMessage(msg) {
  const div = document.createElement("div");
  div.className = "error-toast";
  div.textContent = msg;
  Object.assign(div.style, {
      position: "fixed",
      top: "24px",
      right: "24px",
      background: "#ef4444",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "8px",
      zIndex: "9999",
  });
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2500);
}

/* ===============================
   전역 상태 변수
=================================*/
let meetingData = null;                 // 회의 전체 데이터
let speakerMappingData = {};            // 발화자 ↔ 참석자 매핑 정보
let actionItems = [];                   // 액션 아이템 리스트
let currentEditingTranscriptIndex = -1; // 현재 편집 중인 발화 인덱스
let activeKeyword = null;               // 선택된 하이라이트 키워드
let isEditingSummary = false;           // 요약 편집 모드 여부
let originalSummaryData = {};           // 편집 전 요약 데이터 저장
let currentMappingSpeaker = null;       // 현재 매핑 중인 발화자

/* ===============================
   회의 데이터 로드 (Spring API)
=================================*/
async function loadMeetingData() {
  try {
    const meetingId = localStorage.getItem("currentMeetingId");
    if (!meetingId) {
      showErrorMessage("회의 ID가 없습니다.");
      return;
    }

  // Spring API로 회의 정보 가져오기
    const res = await fetch(`http://localhost:8080/api/meetings/${meetingId}`);
    if (!res.ok) throw new Error("회의 정보를 불러오지 못했습니다.");
    meetingData = await res.json();

    loadMeetingData(); // 기존 함수 호출 유지
  } catch (err) {
    console.error("회의 정보 불러오기 실패:", err);
    showErrorMessage("서버에서 회의 데이터를 불러오지 못했습니다.");
  }
}
/* 회의 정보 표시 */
function displayMeetingInfo() {
  const title = meetingData.title || "제목 없음";
  document.getElementById("meetingTitle").textContent = title;

  const dateEl = document.getElementById("meetingDate");
  if (meetingData.date && dateEl) {
      const date = new Date(meetingData.date);
      dateEl.textContent = `${date.getFullYear()}.${String(
          date.getMonth() + 1
      ).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(
          date.getHours()
      ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  const dur = document.getElementById("meetingDuration");
  if (meetingData.duration && dur)
      dur.textContent = formatDuration(meetingData.duration);

  const part = document.getElementById("participantCount");
  if (meetingData.participants && part)
      part.textContent = meetingData.participants.length + "명 참석";
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ===============================
   회의 제목 수정 (PUT 요청) -> Spring
=================================*/
async function editMeetingTitle() {
  const el = document.getElementById("meetingTitle");
  const newTitle = prompt("회의 제목을 입력하세요:", el.textContent);
  if (!newTitle.trim()) return;

  try {
    const meetingId = localStorage.getItem("currentMeetingId");
    // Spring API로 제목 수정 요청
    const res = await fetch(`http://localhost:8080/api/meetings/${meetingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() })
    });

    if (!res.ok) throw new Error("수정 실패");
    el.textContent = newTitle.trim();
    showSuccessMessage("회의 제목이 수정되었습니다.");
  } catch (e) {
    showErrorMessage("서버와 통신 중 오류가 발생했습니다.");
  }
}

/* 키워드 하이라이트 */
function highlightKeywords(text) {
  if (!activeKeyword) return text;
  const regex = new RegExp("(" + activeKeyword + ")", "gi");
  return text.replace(
      regex,
      '<mark style="background:#fef3c7;color:#d97706;padding:2px 4px;border-radius:3px;">$1</mark>'
  );
}

/* 실시간 로그 표시 */
function displayTranscripts() {
  if (!meetingData || !meetingData.transcripts) return;
  const body = document.getElementById("transcriptList");
  body.innerHTML = "";
  
  meetingData.transcripts.forEach((transcript, index) => {
      const item = document.createElement("div");
      item.className = "transcript-item";
      item.setAttribute("data-index", index);
      
      const speakerClass = speakerMappingData[transcript.speaker] ? "mapped" : "";
      const displayName = speakerMappingData[transcript.speaker] || transcript.speaker;
      const avatarText = displayName.charAt(0).toUpperCase();
      
      item.innerHTML = `
          <div class="speaker-avatar-wrapper">
              <div class="speaker-avatar ${speakerClass}" onclick="openSpeakerModal('${transcript.speaker}')" title="${displayName}">
                  ${avatarText}
              </div>
          </div>
          <div class="transcript-content">
              <div class="transcript-header">
                  <div class="transcript-meta">
                      <span class="speaker-name ${speakerClass}" onclick="openSpeakerModal('${transcript.speaker}')">${displayName}</span>
                      <span class="time-stamp">${transcript.time}</span>
                  </div>
                  <button class="edit-transcript-btn" onclick="editTranscript(${index})" title="수정">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                  </button>
              </div>
              <div class="transcript-text" id="transcript-text-${index}">${highlightKeywords(transcript.text)}</div>
          </div>
      `;
      body.appendChild(item);
  });
  updateTranscriptStats();
}

/* 로그 통계 업데이트 */
function updateTranscriptStats() {
  const countEl = document.getElementById("transcriptCount");
  const mappingEl = document.getElementById("mappingStatus");

  if (!meetingData || !meetingData.transcripts) return;

  const total = meetingData.transcripts.length;
  const uniqueSpeakers = [...new Set(meetingData.transcripts.map(t => t.speaker))];
  const mappedCount = uniqueSpeakers.filter(s => speakerMappingData[s]).length;

  if (countEl) countEl.textContent = `총 ${total}개 발화`;
  if (mappingEl) mappingEl.textContent = `${mappedCount}/${uniqueSpeakers.length} 매핑 완료`;
}

/* 발화자 매핑 */
function openSpeakerModal(speaker) {
  currentMappingSpeaker = speaker;
  const modal = document.getElementById("speakerModal");
  const list = document.getElementById("participantList");
  list.innerHTML = "";
  
  meetingData.participants.forEach((p, index) => {
      const item = document.createElement("div");
      item.className = "participant-item";
      if (speakerMappingData[speaker] === p) item.classList.add("selected");
      item.innerHTML = `
          <div class="participant-avatar">${p.charAt(0)}</div>
          <span class="participant-name">${p}</span>
          <button class="participant-delete-btn" onclick="event.stopPropagation(); deleteParticipant(${index})" title="삭제">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
          </button>
      `;
      item.onclick = () => selectParticipant(item, p);
      list.appendChild(item);
  });

  // 참석자 추가 폼
  const addForm = document.createElement("div");
  addForm.className = "add-participant-form";
  addForm.innerHTML = `
      <input type="text" class="add-participant-input" id="newParticipantInput" placeholder="새 참석자 이름 입력">
      <button class="add-participant-btn" onclick="addParticipant()">추가</button>
  `;
  list.appendChild(addForm);
  
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Enter 키로 추가
  setTimeout(() => {
      const input = document.getElementById("newParticipantInput");
      if (input) {
          input.addEventListener("keypress", (e) => {
              if (e.key === "Enter") addParticipant();
          });
      }
  }, 100);
}

function addParticipant() {
  const input = document.getElementById("newParticipantInput");
  const name = input.value.trim();
  
  if (!name) {
      showErrorMessage("참석자 이름을 입력해주세요.");
      return;
  }

  if (meetingData.participants.includes(name)) {
      showErrorMessage("이미 존재하는 참석자입니다.");
      return;
  }

  meetingData.participants.push(name);
  input.value = "";
  
  // 리스트 새로고침
  const speaker = currentMappingSpeaker;
  closeSpeakerModal();
  openSpeakerModal(speaker);
  
  showSuccessMessage(`${name}님이 추가되었습니다.`);
}

function deleteParticipant(index) {
  const participant = meetingData.participants[index];
  
  if (confirm(`${participant}님을 참석자 목록에서 삭제하시겠습니까?`)) {
      meetingData.participants.splice(index, 1);
      
      // 해당 참석자로 매핑된 발화자 매핑 제거
      Object.keys(speakerMappingData).forEach(speaker => {
          if (speakerMappingData[speaker] === participant) {
              delete speakerMappingData[speaker];
          }
      });
      
      // 리스트 새로고침
      const speaker = currentMappingSpeaker;
      closeSpeakerModal();
      openSpeakerModal(speaker);
      displayTranscripts();
      
      showSuccessMessage(`${participant}님이 삭제되었습니다.`);
  }
}

function selectParticipant(item, participant) {
  document.querySelectorAll(".participant-item").forEach(el => el.classList.remove("selected"));
  item.classList.add("selected");
  speakerMappingData[currentMappingSpeaker] = participant;
}

function saveSpeakerMapping() {
  closeSpeakerModal();
  displayTranscripts();
  showSuccessMessage("발화자 매핑이 저장되었습니다.");
}

function closeSpeakerModal() {
  const modal = document.getElementById("speakerModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

/* 발화 점유율 차트 */
function openParticipationChart() {
  if (!meetingData || !meetingData.transcripts) {
      showErrorMessage("회의 데이터가 없습니다.");
      return;
  }

  const speakerCounts = {};
  meetingData.transcripts.forEach(t => {
      const speaker = speakerMappingData[t.speaker] || t.speaker;
      speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
  });

  const total = meetingData.transcripts.length;
  const chartData = Object.entries(speakerCounts).map(([speaker, count]) => ({
      speaker,
      count,
      percentage: ((count / total) * 100).toFixed(1)
  }));

  chartData.sort((a, b) => b.count - a.count);

  const container = document.getElementById("chartContainer");
  container.innerHTML = "";

  chartData.forEach(data => {
      const barDiv = document.createElement("div");
      barDiv.className = "chart-bar";
      barDiv.innerHTML = `
          <div class="chart-label">
              <span class="chart-name">${data.speaker}</span>
              <span class="chart-percentage">${data.percentage}% (${data.count}회)</span>
          </div>
          <div class="chart-bar-bg">
              <div class="chart-bar-fill" style="width: ${data.percentage}%"></div>
          </div>
      `;
      container.appendChild(barDiv);
  });

  const modal = document.getElementById("chartModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeChartModal() {
  const modal = document.getElementById("chartModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

/* AI 요약 편집 */
function toggleSummaryEdit() {
  isEditingSummary = !isEditingSummary;
  const editBtn = document.getElementById("editBtnText");
  const editActions = document.getElementById("editActions");

  const sections = [
      { view: "purposeView", editor: "purposeEditor" },
      { view: "agendaView", editor: "agendaEditor" },
      { view: "summaryView", editor: "summaryEditor" },
  ];

  if (isEditingSummary) {
      editBtn.textContent = "편집 중";
      editActions.classList.remove("hidden");
      originalSummaryData = {};
      sections.forEach(({ view, editor }) => {
          const viewEl = document.getElementById(view);
          const editEl = document.getElementById(editor);
          const text = viewEl.textContent.trim();
          originalSummaryData[view] = text;
          editEl.value = text;
          viewEl.classList.add("hidden");
          editEl.classList.remove("hidden");
      });
  } else {
      editBtn.textContent = "편집";
      editActions.classList.add("hidden");
      sections.forEach(({ view, editor }) => {
          const viewEl = document.getElementById(view);
          const editEl = document.getElementById(editor);
          viewEl.classList.remove("hidden");
          editEl.classList.add("hidden");
      });
  }
}

function saveSummaryEdit() {
  ["purpose", "agenda", "summary"].forEach(id => {
      const editor = document.getElementById(`${id}Editor`);
      const view = document.getElementById(`${id}View`);
      view.textContent = editor.value.trim() || "내용 없음";
  });
  toggleSummaryEdit();
  showSuccessMessage("AI 요약이 저장되었습니다.");
}

function cancelSummaryEdit() {
  ["purpose", "agenda", "summary"].forEach(id => {
      const view = document.getElementById(`${id}View`);
      view.textContent = originalSummaryData[`${id}View`];
  });
  toggleSummaryEdit();
}

/* AI 요약 표시 */
function generateAISummary() {
  document.getElementById("purposeView").textContent = meetingData.purpose || "회의 목적 없음";
  document.getElementById("agendaView").textContent = meetingData.agenda || "의제 없음";
  document.getElementById("summaryView").textContent = meetingData.summary || "요약 내용이 없습니다.";

  const kwContainer = document.getElementById("keywords");
  kwContainer.innerHTML = "";
  (meetingData.keywords || []).forEach(k => {
      const tag = document.createElement("div");
      tag.className = "keyword";
      tag.textContent = k;
      tag.onclick = () => toggleKeyword(tag, k);
      kwContainer.appendChild(tag);
  });
}

function toggleKeyword(el, keyword) {
  if (activeKeyword === keyword) {
      activeKeyword = null;
      el.classList.remove("active");
  } else {
      document.querySelectorAll(".keyword").forEach(tag => tag.classList.remove("active"));
      el.classList.add("active");
      activeKeyword = keyword;
  }
  displayTranscripts();
}

/* 액션 아이템 */
function renderActionItems() {
  const container = document.getElementById("actionList");
  container.innerHTML = "";
  actionItems.forEach((a, index) => {
      const div = document.createElement("div");
      div.className = "action-item";
      div.innerHTML = `
          <div class="rfc-action-header">
              <div class="action-title">${a.title}</div>
              <div class="action-controls">
                  <button class="btn-icon-small" onclick="editAction(${index})" title="수정">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                  </button>
                  <button class="btn-icon-small delete" onclick="deleteAction(${index})" title="삭제">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                  </button>
              </div>
          </div>
          <div class="action-meta">${a.assignee ? `담당: ${a.assignee}` : ""}${a.assignee && a.deadline ? " · " : ""}${a.deadline || ""}</div>
          <div class="action-buttons">
              <button class="calendar-btn ${a.addedToCalendar ? 'added' : ''}" onclick="toggleCalendar(${index})">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  ${a.addedToCalendar ? '캘린더에 추가됨' : '캘린더에 추가'}
              </button>
          </div>
      `;
      container.appendChild(div);
  });
}

function deleteAction(index) {
  if (confirm("이 액션 아이템을 삭제하시겠습니까?")) {
      actionItems.splice(index, 1);
      renderActionItems();
      showSuccessMessage("액션 아이템이 삭제되었습니다.");
  }
}

function editAction(index) {
  const action = actionItems[index];
  document.getElementById("actionTitle").value = action.title;
  document.getElementById("actionAssignee").value = action.assignee || "";
  document.getElementById("actionDeadline").value = action.deadline || "";

  const assigneeSelect = document.getElementById("actionAssignee");
  assigneeSelect.innerHTML = '<option value="">선택하세요</option>';
  if (meetingData && meetingData.participants) {
      meetingData.participants.forEach(p => {
          const option = document.createElement("option");
          option.value = p;
          option.textContent = p;
          if (p === action.assignee) option.selected = true;
          assigneeSelect.appendChild(option);
      });
  }

  const modal = document.getElementById("actionModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // 저장 버튼을 수정 모드로 변경
  const saveBtn = modal.querySelector(".btn-primary");
  saveBtn.textContent = "수정";
  saveBtn.onclick = () => {
      const title = document.getElementById("actionTitle").value.trim();
      if (!title) {
          showErrorMessage("액션 아이템을 입력해주세요.");
          return;
      }

      const assignee = document.getElementById("actionAssignee").value;
      const deadline = document.getElementById("actionDeadline").value;

      actionItems[index] = { 
          title, 
          assignee, 
          deadline,
          addedToCalendar: action.addedToCalendar 
      };
      renderActionItems();
      closeActionModal();
      showSuccessMessage("액션 아이템이 수정되었습니다.");

      // 버튼 원래대로 복구
      saveBtn.textContent = "추가";
      saveBtn.onclick = saveAction;
  };
}

function toggleCalendar(index) {
  actionItems[index].addedToCalendar = !actionItems[index].addedToCalendar;
  renderActionItems();
  if (actionItems[index].addedToCalendar) {
      showSuccessMessage("캘린더에 추가되었습니다.");
  } else {
      showSuccessMessage("캘린더에서 제거되었습니다.");
  }
}

function openActionModal() {
  const modal = document.getElementById("actionModal");
  document.getElementById("actionTitle").value = "";
  document.getElementById("actionAssignee").value = "";
  document.getElementById("actionDeadline").value = "";

  const assigneeSelect = document.getElementById("actionAssignee");
  assigneeSelect.innerHTML = '<option value="">선택하세요</option>';
  if (meetingData && meetingData.participants) {
      meetingData.participants.forEach(p => {
          const option = document.createElement("option");
          option.value = p;
          option.textContent = p;
          assigneeSelect.appendChild(option);
      });
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeActionModal() {
  const modal = document.getElementById("actionModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function saveAction() {
  const title = document.getElementById("actionTitle").value.trim();
  if (!title) {
      showErrorMessage("액션 아이템을 입력해주세요.");
      return;
  }

  const assignee = document.getElementById("actionAssignee").value;
  const deadline = document.getElementById("actionDeadline").value;

  actionItems.push({ title, assignee, deadline, addedToCalendar: false });
  renderActionItems();
  closeActionModal();
  showSuccessMessage("액션 아이템이 추가되었습니다.");
}

/* 로그 수정 */
function editTranscript(index) {
  if (currentEditingTranscriptIndex !== -1) {
      cancelTranscriptEdit(currentEditingTranscriptIndex);
  }
  currentEditingTranscriptIndex = index;

  const item = document.querySelector(`.transcript-item[data-index="${index}"]`);
  const textDiv = item.querySelector(".transcript-text");
  const originalText = meetingData.transcripts[index].text;

  textDiv.innerHTML = `
      <textarea class="summary-editor" id="transcript-editor-${index}" style="width: 100%; padding: 8px; border: 2px solid #8E44AD; border-radius: 8px; font-size: 15px; line-height: 1.7; resize: vertical; min-height: 60px; margin-top: 8px;">${originalText}</textarea>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
          <button class="btn btn-secondary" onclick="cancelTranscriptEdit(${index})">취소</button>
          <button class="btn btn-primary" onclick="saveTranscriptEdit(${index})">저장</button>
      </div>
  `;
  const editor = document.getElementById(`transcript-editor-${index}`);
  editor.focus();
}

/* ===============================
   발화 로그 수정 (PUT 요청) -> spring
=================================*/
async function saveTranscriptEdit(index) {
  const editor = document.getElementById(`transcript-editor-${index}`);
  const newText = editor.value.trim();
  if (!newText) {
    showErrorMessage("내용을 입력해주세요.");
    return;
  }

  const transcript = meetingData.transcripts[index];
  try {
    const meetingId = localStorage.getItem("currentMeetingId");
    await fetch(`http://localhost:8080/api/meetings/${meetingId}/transcripts/${index}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText })
    });

    meetingData.transcripts[index].text = newText;
    displayTranscripts();
    showSuccessMessage("발화 로그가 수정되었습니다.");
  } catch (e) {
    console.error(e);
    showErrorMessage("서버에 로그를 저장하지 못했습니다.");
  }
}


function cancelTranscriptEdit(index) {
  currentEditingTranscriptIndex = -1;
  displayTranscripts();
}

/* 저장 및 내보내기 */
function toggleDropdown() {
  const dropdown = document.getElementById("downloadDropdown");
  dropdown.classList.toggle("show");
}

// 드롭다운 외부 클릭 시 닫기
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("downloadDropdown");
  const btn = document.getElementById("downloadBtn");
  if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.remove("show");
  }
});

function collectFinalData() {
  return {
      ...meetingData,
      speakerMapping: speakerMappingData,
      actions: actionItems,
      createdAt: new Date().toISOString(),
  };
}

function exportJSON() {
  const dropdown = document.getElementById("downloadDropdown");
  if (dropdown) dropdown.classList.remove("show");
  
  const data = collectFinalData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${meetingData.title || "meeting"}.json`;
  a.click();
  showSuccessMessage("JSON 파일이 다운로드되었습니다.");
}

function exportPDF() {
  const dropdown = document.getElementById("downloadDropdown");
  if (dropdown) dropdown.classList.remove("show");
  
  showErrorMessage("PDF 내보내기 기능은 준비 중입니다.");
}

/* ===============================
   회의록 저장 (POST /summary)
=================================*/
async function saveMeeting() {
  try {
    const meetingId = localStorage.getItem("currentMeetingId");
    const data = collectFinalData();

    const res = await fetch(`http://localhost:8080/api/meetings/${meetingId}/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("저장 실패");
    showSuccessMessage("회의록이 서버에 저장되었습니다.");
  } catch (e) {
    console.error(e);
    showErrorMessage("서버에 회의록 저장 실패");
  }
}


/* 초기화 */
document.addEventListener("DOMContentLoaded", () => {
  const stored = localStorage.getItem("lastMeeting");
  if (stored) {
      meetingData = JSON.parse(stored);
      loadMeetingData();
  } else {
      // 테스트 데이터
      meetingData = {
          title: "프로젝트 기획 회의",
          date: new Date().toISOString(),
          duration: 2723,
          participants: ["김철수", "이영희", "박민수"],
          transcripts: [
              { speaker: "Speaker 1", time: "00:00:15", text: "안녕하세요. 오늘 회의를 시작하겠습니다." },
              { speaker: "Speaker 2", time: "00:00:32", text: "네, 예산 부분에 대해 논의해야 할 것 같습니다." },
              { speaker: "Speaker 1", time: "00:01:05", text: "좋습니다. 예산안을 검토해보죠. 올해 목표는 전년 대비 20% 증가입니다." },
              { speaker: "Speaker 3", time: "00:01:28", text: "일정도 함께 조율하면 좋겠습니다. 다음 주 금요일까지 초안을 완성해야 합니다." },
              { speaker: "Speaker 1", time: "00:02:10", text: "그렇게 하겠습니다. 다음 주까지 정리하죠." },
              { speaker: "Speaker 2", time: "00:02:45", text: "마케팅 예산은 어떻게 배정할 계획인가요?" },
              { speaker: "Speaker 1", time: "00:03:12", text: "전체 예산의 30% 정도를 마케팅에 할당하려고 합니다." },
              { speaker: "Speaker 3", time: "00:03:38", text: "좋네요. 그럼 개발팀 인력 충원은 언제쯤 가능할까요?" },
              { speaker: "Speaker 1", time: "00:04:05", text: "다음 분기부터 3명 정도 충원 예정입니다." },
              { speaker: "Speaker 2", time: "00:04:30", text: "신규 프로젝트 일정에 대해서도 논의해야 할 것 같습니다." },
              { speaker: "Speaker 3", time: "00:05:00", text: "네, 저희 팀에서는 다음 달 초에 착수할 수 있을 것 같습니다." },
              { speaker: "Speaker 1", time: "00:05:25", text: "그럼 역할 분담을 명확히 해둘까요?" },
              { speaker: "Speaker 2", time: "00:05:48", text: "저는 마케팅 전략 수립을 맡겠습니다." },
              { speaker: "Speaker 3", time: "00:06:10", text: "개발 일정 관리는 제가 담당하겠습니다." },
              { speaker: "Speaker 1", time: "00:06:35", text: "좋습니다. 그럼 전체 프로젝트 총괄은 제가 하겠습니다." },
              { speaker: "Speaker 2", time: "00:07:00", text: "협력업체와의 미팅은 언제 잡으시나요?" },
              { speaker: "Speaker 1", time: "00:07:22", text: "이번 주 목요일 오후 2시로 잡았습니다." },
              { speaker: "Speaker 3", time: "00:07:45", text: "그럼 그 전까지 제안서를 완성해야겠네요." },
              { speaker: "Speaker 1", time: "00:08:10", text: "맞습니다. 수요일까지 초안 공유 부탁드립니다." },
              { speaker: "Speaker 2", time: "00:08:35", text: "알겠습니다. 검토 후 피드백 드리겠습니다." }
          ],
          purpose: "프로젝트 방향성 논의 및 세부 일정 수립",
          agenda: "예산 배정, 일정 조율, 역할 분담",
          summary: "이번 회의에서는 프로젝트의 주요 목표와 일정에 대해 논의했습니다. 예산안 검토 및 각 팀원의 역할 분담이 이루어졌으며, 다음 주까지 세부 일정을 확정하기로 했습니다.",
          keywords: ["예산", "일정", "역할", "검토"],
          actions: [
              { title: "예산안 작성 및 검토", assignee: "김철수", deadline: "2025.10.15", addedToCalendar: false },
              { title: "일정 조율 회의 예약", assignee: "이영희", deadline: "2025.10.12", addedToCalendar: false },
              { title: "역할 분담표 작성", assignee: "박민수", deadline: "2025.10.18", addedToCalendar: false }
          ]
      };
      loadMeetingData();
  }
});