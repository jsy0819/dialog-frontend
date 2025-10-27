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
                if (linkPath === currentPage) {
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
        } catch(e) { 
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

const SELECTED_DATE_KEY = 'calendar_selected_date';
const STORAGE_KEY = 'calendar_events';
const TODO_STORAGE_KEY = 'calendar_todos';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
const today = new Date();
const todayOnlyDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

let selectedDate = todayOnlyDate;
let shouldShowOverlay = false; // 오버레이 표시 여부

// performance.navigation.type으로 페이지 진입 방식 확인
// 0: 일반 진입, 1: 새로고침, 2: 뒤로가기/앞으로가기
const isReload = performance.navigation && performance.navigation.type === 1;

if (isReload) {
    // 새로고침인 경우: 저장된 날짜 사용하되 오버레이는 표시 안 함
    const storedDate = sessionStorage.getItem(SELECTED_DATE_KEY);
    if (storedDate) {
        selectedDate = new Date(storedDate);
        currentYear = selectedDate.getFullYear();
        currentMonth = selectedDate.getMonth();
    }
} else {
    // 첫 진입인 경우: 오늘 날짜로 초기화
    selectedDate = todayOnlyDate;
    currentYear = todayOnlyDate.getFullYear();
    currentMonth = todayOnlyDate.getMonth();
    sessionStorage.removeItem(SELECTED_DATE_KEY);
}

function saveEventsToStorage(events) {
    console.log('💾 [캘린더] 이벤트 저장:', events.length, '개');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function saveTodosToStorage(todos) {
    console.log('💾 [캘린더] TODO 저장:', todos.length, '개');
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}

function loadEventsFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(event => ({
            ...event,
            date: new Date(event.date)
        }));
    }
    return [];  // ← getDefaultEvents() 제거, 빈 배열 반환
}

function loadTodosFromStorage() {
    const stored = localStorage.getItem(TODO_STORAGE_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(todo => ({
            ...todo,
            date: new Date(todo.date)
        }));
    }
    return [];
}

function getDefaultEvents() {
    return [
        { date: new Date(currentYear, 9, 20), title: "AI 모델 업데이트 검토", type: "team" }, 
        { date: new Date(currentYear, 9, 20), title: "팀 점심 회식 예약", type: "meeting" },
        { date: new Date(currentYear, 9, 20), title: "개인 학습 시간", type: "personal" }, 
        { date: new Date(currentYear, 9, 20), title: "차기 프로젝트 회의 준비", type: "personal" }, 
        { date: new Date(currentYear, 9, 20), title: "청구서 제출", type: "personal" }, 
        { date: new Date(currentYear, 9, 20), title: "장비 주문 및 확인", type: "personal" }, 
        { date: new Date(currentYear, 9, 20), title: "주간 성과 정리", type: "personal" },
        { date: new Date(currentYear, 9, 21), title: "주간 업무 보고 회의", type: "meeting" },
        { date: new Date(currentYear, 9, 21), title: "새로운 프로젝트 기획", type: "team", important: true },
        { date: new Date(currentYear, 9, 22), title: "인사팀 면접 일정", type: "meeting" },
        { date: new Date(currentYear, 9, 23), title: "보고서 최종 검토 마감", type: "team", important: true },
        { date: new Date(currentYear, 9, 23), title: "주말 계획 정리", type: "personal" },
        { date: new Date(currentYear, 9, 24), title: "개발팀 정기 주간회의", type: "meeting" },
        { date: new Date(currentYear, 9, 24), title: "마케팅 전략 회의", type: "meeting" },
    ];
}

let events = loadEventsFromStorage();
let todos = loadTodosFromStorage();
window.todos = todos;

// 최초 1회만 더미 데이터 생성 (초기화 플래그 확인)
const INIT_FLAG_KEY = 'calendar_initialized';
const isInitialized = localStorage.getItem(INIT_FLAG_KEY);

if (!isInitialized && events.length === 0) {
    events = getDefaultEvents();
    saveEventsToStorage(events);
    localStorage.setItem(INIT_FLAG_KEY, 'true');
    console.log('✅ [캘린더] 최초 더미 데이터 생성 완료');
}

console.log('📌 [캘린더] 초기 로드 - 이벤트:', events.length, 'TODO:', todos.length);

function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function initCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const dailyEventsList = document.getElementById('dailyEventsList');
    const dailyEventsTitle = document.getElementById('dailyEventsTitle');
    const dailyEventsContent = document.getElementById('dailyEventsContent');
    const meetingListEl = document.getElementById('meetingList');
    const meetingCardTitleContentEl = document.getElementById('meetingCardTitleContent');
    const meetingCountEl = document.getElementById('meetingCount');
    const todoListEl = document.getElementById('todoList');
    const todoInput = document.getElementById('todoInput');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoCardTitleContentEl = document.getElementById('todoCardTitleContent');
    const todoCountEl = document.getElementById('todoCount');

    if (!calendarGrid || !currentMonthYear) {
        console.warn('캘린더 요소를 찾을 수 없습니다.');
        return;
    }

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    function formatMonthYear(year, monthIndex) {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${monthNames[monthIndex]} ${year}`;
    }

    function getEventsForDate(date) {
        const dateString = formatDateString(date);
        return events.filter(event => {
            const eventDateString = formatDateString(event.date);
            return eventDateString === dateString;
        });
    }

    function createEventDots(dayEvents) {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'event-dots';
        
        // 팀 회의가 있는지 체크 (meeting, team, important 모두 팀 회의로 간주)
        const hasTeamEvent = dayEvents.some(e => 
            e.type === 'meeting' || e.type === 'team' || e.type === 'important'
        );
        
        // 개인 일정이 있는지 체크
        const hasPersonalEvent = dayEvents.some(e => e.type === 'personal');
        
        // 팀 회의 점 추가
        if (hasTeamEvent) {
            const dot = document.createElement('span');
            dot.className = 'event-dot event-type-team';
            dotsContainer.appendChild(dot);
        }
        
        // 개인 일정 점 추가
        if (hasPersonalEvent) {
            const dot = document.createElement('span');
            dot.className = 'event-dot event-type-personal';
            dotsContainer.appendChild(dot);
        }
        
        return dotsContainer;
    }

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        
        currentMonthYear.textContent = formatMonthYear(currentYear, currentMonth);

        dayNames.forEach(day => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'calendar-day-label';
            dayLabel.textContent = day;
            calendarGrid.appendChild(dayLabel);
        });

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day-cell other-month';
            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = daysInPrevMonth - firstDayOfMonth + 1 + i;
            dayCell.appendChild(dayNumber);
            calendarGrid.appendChild(dayCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day-cell';
            dayCell.dataset.date = formatDateString(date);
            
            // 날짜 컨테이너 생성 (날짜 숫자 + 점을 세로로 배치)
            const dayContent = document.createElement('div');
            dayContent.style.display = 'flex';
            dayContent.style.flexDirection = 'column';
            dayContent.style.alignItems = 'flex-end';
            dayContent.style.width = '100%';
            
            if (formatDateString(date) === formatDateString(todayOnlyDate)) {
                dayCell.classList.add('today');
            }

            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayContent.appendChild(dayNumber);

            const dayEvents = getEventsForDate(date);
            if (dayEvents.length > 0) {
                const eventDots = createEventDots(dayEvents);
                dayContent.appendChild(eventDots);
            }
            
            dayCell.appendChild(dayContent);

            dayCell.addEventListener('click', () => {
                selectDay(dayCell.dataset.date);
            });

            calendarGrid.appendChild(dayCell);
        }
        
        const totalCells = calendarGrid.children.length;
        const remainingCells = 7 - ((totalCells - 7) % 7);
        
        if (remainingCells < 7) {
            for (let i = 1; i <= remainingCells; i++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day-cell other-month';
                const dayNumber = document.createElement('span');
                dayNumber.className = 'day-number';
                dayNumber.textContent = i;
                dayCell.appendChild(dayNumber);
                calendarGrid.appendChild(dayCell);
            }
        }
        
        const totalRows = Math.ceil((calendarGrid.children.length - 7) / 7);
        calendarGrid.style.gridTemplateRows = `auto repeat(${totalRows}, 1fr)`;
    }

    function selectDay(dateString) {
        if (!dailyEventsList) return;

        document.querySelectorAll('.calendar-day-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });

        const selectedCell = document.querySelector(`.calendar-day-cell[data-date="${dateString}"]`);
        if (selectedCell) {
            selectedCell.classList.add('selected');
        }
        
        const [year, month, day] = dateString.split('-').map(Number);
        selectedDate = new Date(year, month - 1, day);
        
        sessionStorage.setItem(SELECTED_DATE_KEY, selectedDate.toISOString());

        const dayEvents = getEventsForDate(selectedDate);
        
        if (dailyEventsTitle) {
            dailyEventsTitle.textContent = `${selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}의 일정`;
        }
        
        if (dailyEventsContent) {
            dailyEventsContent.innerHTML = '';
            
            const meetings = dayEvents.filter(e => e.type === 'meeting' || e.type === 'important' || e.type === 'team');
            const personalTodos = dayEvents.filter(e => e.type === 'personal');

            const typeOrder = { 'important': 1, 'team': 2, 'meeting': 3 };
            meetings.sort((a, b) => (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4));

            const meetingSection = document.createElement('div');
            meetingSection.className = 'daily-events-section';
            meetingSection.innerHTML = '<div class="daily-events-section-title">회의</div>';
            
            const meetingList = document.createElement('div');
            meetingList.className = 'daily-events-list';
            
            if (meetings.length === 0) {
                meetingList.innerHTML = '<p class="cell-secondary" style="text-align: center; padding: 16px;">등록된 회의가 없습니다.</p>';
            } else {
                meetings.forEach(item => {
                    const meetingItem = document.createElement('div');
                    meetingItem.className = 'daily-event-item type-team';
                    
                    const isImportant = item.important || false;
                    
                    meetingItem.innerHTML = `
                        <div class="event-details">
                            <div class="event-title">${item.title}</div>
                            <div class="event-meta">팀 회의${isImportant ? ' • 중요' : ''}</div>
                        </div>
                        ${isImportant ? `<svg class="event-star" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" style="margin-left: 8px;">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>` : ''}
                    `;
                    
                    meetingList.appendChild(meetingItem);
                });
            }
            
            meetingSection.appendChild(meetingList);
            
            const todoSection = document.createElement('div');
            todoSection.className = 'daily-events-section';
            todoSection.innerHTML = '<div class="daily-events-section-title">To-do</div>';

            const todoList = document.createElement('div');
            todoList.className = 'daily-events-list';

            if (personalTodos.length === 0) {
                todoList.innerHTML = '<p class="cell-secondary" style="text-align: center; padding: 16px;">등록된 할 일이 없습니다.</p>';
            } else {
                personalTodos.forEach(event => {
                    const selectedDateString = formatDateString(selectedDate);
                    const matchedTodo = window.todos.find(t => 
                        t.title === event.title && 
                        formatDateString(new Date(t.date)) === selectedDateString
                    );
                    const isCompleted = matchedTodo ? matchedTodo.completed : false;
                    
                    const eventItem = document.createElement('div');
                    eventItem.className = `daily-event-item type-personal ${isCompleted ? 'completed' : ''}`;
                    
                    eventItem.innerHTML = `
                        <div class="event-details">
                            <div class="event-title" style="${isCompleted ? 'text-decoration: line-through; color: #9ca3af;' : ''}">${event.title}</div>
                            <div class="event-meta">개인${isCompleted ? ' • 완료' : ''}</div>
                        </div>
                    `;
                    todoList.appendChild(eventItem);
                });
            }
            
            todoSection.appendChild(todoList);
            
            dailyEventsContent.appendChild(meetingSection);
            dailyEventsContent.appendChild(todoSection);
        }

        dailyEventsList.classList.remove('hidden');

        renderMeetingList();
        renderTodoList();
    }

    window.closeDailyEvents = function() {
        if (dailyEventsList) {
            dailyEventsList.classList.add('hidden');
        }
        document.querySelectorAll('.calendar-day-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
    }

    function changeMonth(direction) {
        currentMonth += direction;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        } else if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
        if (dailyEventsList) {
            dailyEventsList.classList.add('hidden');
        }
    }

    function renderMeetingList() {
        if (!meetingListEl) return;

        const formattedDate = selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric'});
        if (meetingCardTitleContentEl) {
            meetingCardTitleContentEl.textContent = `${formattedDate}의 회의`;
        }

        const selectedEvents = getEventsForDate(selectedDate);
        const meetings = selectedEvents.filter(event => event.type === 'meeting' || event.type === 'team' || event.type === 'important');

        const typeOrder = { 'important': 1, 'team': 2, 'meeting': 3 };
        meetings.sort((a, b) => {
            return (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4);
        });

        meetingListEl.innerHTML = '';

        if (meetings.length === 0) {
            meetingListEl.innerHTML = '<p class="cell-secondary" style="text-align: center; padding: 16px 0;">회의가 없습니다.</p>';
            if (meetingCountEl) {
                meetingCountEl.textContent = `(총 0개)`;
            }
            return;
        }

        meetings.forEach(event => {
            const meetingItem = document.createElement('div');
            meetingItem.className = 'meeting-item';
            
            const isImportant = event.important || false;
            
            meetingItem.innerHTML = `
                <span class="meeting-item-dot type-team"></span>
                <span class="meeting-item-text">${event.title}</span>
                <button class="star-btn ${isImportant ? 'active' : ''}" data-meeting-title="${event.title}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${isImportant ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                </button>
            `;
            
            const starBtn = meetingItem.querySelector('.star-btn');
            starBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const title = this.getAttribute('data-meeting-title');
                toggleImportant(title);
            });
            
            meetingListEl.appendChild(meetingItem);
        });

        if (meetingCountEl) {
            meetingCountEl.textContent = `(총 ${meetings.length}개)`;
        }
    }

    function toggleImportant(title) {
        const selectedDateString = formatDateString(selectedDate);
        
        // 모든 회의 타입 포함하여 검색
        const eventIndex = events.findIndex(e => 
            e.title === title && 
            formatDateString(e.date) === selectedDateString
        );
        
        if (eventIndex !== -1) {
            events[eventIndex].important = !events[eventIndex].important;
            saveEventsToStorage(events);
            
            console.log('✅ 중요 표시 토글:', title, '→', events[eventIndex].important);
            
            // 필요한 부분만 업데이트
            renderCalendar();
            renderMeetingList();
            selectDay(selectedDateString);
            showSuccessMessage(events[eventIndex].important ? '중요 회의로 표시했습니다' : '중요 표시를 해제했습니다');
        } else {
            console.error('❌ 회의를 찾을 수 없습니다:', title, selectedDateString);
        }
    }

    function renderTodoList() {
        if (!todoListEl) return;

        const formattedDate = selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric'});
        if (todoCardTitleContentEl) {
            todoCardTitleContentEl.textContent = `${formattedDate}의 To-do`;
        }

        const selectedEvents = getEventsForDate(selectedDate);
        const personalEvents = selectedEvents.filter(event => event.type === 'personal');

        const selectedDateString = formatDateString(selectedDate);
        const selectedTodos = todos.filter(t => {
            const todoDateString = formatDateString(new Date(t.date));
            return todoDateString === selectedDateString;
        });

        const combinedTodos = [
            ...personalEvents,
            ...selectedTodos.map(t => ({ title: t.title, type: t.type, id: t.id }))
        ];

        const uniqueTitles = new Set();
        let finalTodos = [];
        combinedTodos.forEach(item => {
            if (!uniqueTitles.has(item.title)) {
                uniqueTitles.add(item.title);
                finalTodos.push(item);
            }
        });

        todoListEl.innerHTML = '';

        if (finalTodos.length === 0) {
            todoListEl.innerHTML = '<p class="cell-secondary" style="text-align: center; padding: 16px 0;">등록된 할 일이 없습니다.</p>';
            if (todoCountEl) {
                todoCountEl.textContent = `(총 0개)`;
            }
            return;
        }

        finalTodos.forEach(item => {
            const todoItem = document.createElement('div');
            todoItem.className = 'todo-item';
            
            const todoId = item.id || `todo_${item.title.replace(/\s/g, '_')}`;
            
            todoItem.innerHTML = `
                <span class="todo-item-dot type-personal"></span>
                <span class="todo-item-text">${item.title}</span>
                <div class="todo-actions">
                    <button class="todo-action-btn edit" data-todo-id="${todoId}" data-todo-title="${item.title}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="todo-action-btn delete" data-todo-id="${todoId}" data-todo-title="${item.title}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
            
            const editBtn = todoItem.querySelector('.edit');
            const deleteBtn = todoItem.querySelector('.delete');
            
            editBtn.addEventListener('click', function() {
                const id = this.getAttribute('data-todo-id');
                const title = this.getAttribute('data-todo-title');
                editTodo(id, title);
            });
            
            deleteBtn.addEventListener('click', function() {
                const id = this.getAttribute('data-todo-id');
                const title = this.getAttribute('data-todo-title');
                deleteTodo(id, title);
            });
            
            todoListEl.appendChild(todoItem);
        });

        if (todoCountEl) {
            todoCountEl.textContent = `(총 ${finalTodos.length}개)`;
        }
    }

    function addTodo() {
        if (!todoInput) return;

        const title = todoInput.value.trim();
        if (title) {
            const todoId = `todo_${Date.now()}`;
            
            events.push({ 
                date: selectedDate,
                title: title, 
                type: "personal"
            });
            
            todos.push({
                id: todoId,
                date: selectedDate,
                title: title,
                type: "personal",
                completed: false
            });
            
            window.todos = todos;

            saveEventsToStorage(events);
            saveTodosToStorage(todos);

            todoInput.value = '';
            
            renderCalendar();
            renderMeetingList();
            renderTodoList();

            const selectedString = formatDateString(selectedDate);
            selectDay(selectedString);
            
            showSuccessMessage('할 일이 추가되었습니다');
        }
    }

    function editTodo(todoId, currentTitle) {
        const newTitle = prompt('할 일 수정:', currentTitle);
        if (newTitle && newTitle.trim() && newTitle !== currentTitle) {
            const todoIndex = todos.findIndex(t => t.id === todoId || t.title === currentTitle);
            if (todoIndex !== -1) {
                todos[todoIndex].title = newTitle.trim();
            }
            
            const eventIndex = events.findIndex(e => 
                e.title === currentTitle && 
                e.type === 'personal' &&
                formatDateString(e.date) === formatDateString(selectedDate)
            );
            if (eventIndex !== -1) {
                events[eventIndex].title = newTitle.trim();
            }
            
            window.todos = todos;
            
            saveEventsToStorage(events);
            saveTodosToStorage(todos);
            
            // 전체 새로고침 대신 필요한 부분만 업데이트
            renderCalendar();
            renderTodoList();
            const selectedString = formatDateString(selectedDate);
            selectDay(selectedString);
            
            showSuccessMessage('할 일이 수정되었습니다');
        }
    }

    function deleteTodo(todoId, title) {
        if (confirm(`"${title}" 할 일을 삭제하시겠습니까?`)) {
            const todoIndex = todos.findIndex(t => t.id === todoId || t.title === title);
            if (todoIndex !== -1) {
                todos.splice(todoIndex, 1);
            }
            
            const eventIndex = events.findIndex(e => 
                e.title === title && 
                e.type === 'personal' &&
                formatDateString(e.date) === formatDateString(selectedDate)
            );
            if (eventIndex !== -1) {
                events.splice(eventIndex, 1);
            }
            
            window.todos = todos;
            
            saveEventsToStorage(events);
            saveTodosToStorage(todos);
            
            // 전체 새로고침 대신 필요한 부분만 업데이트
            renderCalendar();
            renderTodoList();
            const selectedString = formatDateString(selectedDate);
            selectDay(selectedString);
            
            showSuccessMessage('할 일이 삭제되었습니다');
        }
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
    }
    if (addTodoBtn) {
        addTodoBtn.addEventListener('click', addTodo);
    }
    if (todoInput) {
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
    }

    renderCalendar();
    renderMeetingList();
    renderTodoList();
    
    // 새로고침인 경우에만 선택 상태 유지 (오버레이는 항상 숨김)
    if (isReload && selectedDate.getTime() !== todayOnlyDate.getTime()) {
        const dateString = formatDateString(selectedDate);
        const selectedCell = document.querySelector(`.calendar-day-cell[data-date="${dateString}"]`);
        if (selectedCell) {
            selectedCell.classList.add('selected');
        }
    }
}

function showSuccessMessage(msg) {
    const div = document.createElement("div");
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
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
    });
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
} else {
    initCalendar();
}