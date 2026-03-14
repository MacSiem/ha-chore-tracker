class HaChoreTracker extends HTMLElement {
  static getConfigElement() {
    return document.createElement('ha-chore-tracker-editor');
  }

  static getStubConfig() {
    return {
      type: 'custom:ha-chore-tracker',
      title: 'Chore Tracker',
      members: [
        { name: 'Person 1', color: '#4CAF50' },
        { name: 'Person 2', color: '#2196F3' }
      ]
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.chores = [];
    this.activeTab = 'board';
    this.config = {};
    this.hass = null;
  }

  setConfig(config) {
    if (!config) return;
    this.config = config;
    this.members = config.members || [{ name: 'Person 1', color: '#4CAF50' }];
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  get hass() {
    return this._hass;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
        }

        :host {
          --primary-color: var(--ha-card-background, #ffffff);
          --text-color: var(--primary-text-color, #212121);
          --secondary-text: var(--secondary-text-color, #727272);
          --border-color: var(--divider-color, #e0e0e0);
          --ha-card-border-radius: 12px;
        }

        .card {
          background: var(--primary-color);
          color: var(--text-color);
          border-radius: var(--ha-card-border-radius);
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--border-color);
        }

        .title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .tab-btn {
          padding: 8px 16px;
          background: none;
          border: none;
          color: var(--secondary-text);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
        }

        .tab-btn.active {
          color: var(--text-color);
          border-bottom-color: var(--primary-color-rgb, #3498db);
        }

        .tab-btn:hover {
          color: var(--text-color);
        }

        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        /* Board View */
        .board {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .column {
          background: var(--ha-card-background, #f5f5f5);
          border-radius: 8px;
          padding: 12px;
          min-height: 400px;
        }

        .column-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-weight: 600;
          font-size: 14px;
          color: var(--text-color);
        }

        .column-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--border-color);
          border-radius: 50%;
          font-size: 12px;
          font-weight: bold;
        }

        .chore-card {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 10px;
          cursor: grab;
          transition: all 0.2s ease;
          border-left: 4px solid var(--border-color);
        }

        .chore-card:hover {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .chore-card.priority-high {
          border-left-color: #ff5252;
        }

        .chore-card.priority-medium {
          border-left-color: #ffa726;
        }

        .chore-card.priority-low {
          border-left-color: #66bb6a;
        }

        .chore-title {
          font-weight: 600;
          margin: 0 0 6px 0;
          font-size: 14px;
        }

        .chore-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--secondary-text);
          margin-top: 8px;
        }

        .chore-assignee {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: white;
          font-weight: 500;
        }

        .chore-actions {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }

        .btn-small {
          padding: 4px 8px;
          font-size: 11px;
          border: 1px solid var(--border-color);
          background: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-small:hover {
          background: var(--border-color);
        }

        /* Add Form */
        .add-form {
          background: var(--ha-card-background, #f9f9f9);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .form-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .form-group.full {
          grid-column: 1 / -1;
        }

        label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--text-color);
        }

        input[type="text"],
        input[type="number"],
        select {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 13px;
          background: white;
          color: var(--text-color);
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
        }

        .btn-primary {
          grid-column: 1 / -1;
          padding: 10px 16px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #2980b9;
        }

        /* Schedule View */
        .schedule {
          overflow-x: auto;
        }

        .week-grid {
          display: grid;
          grid-template-columns: 120px repeat(7, 1fr);
          gap: 1px;
          background: var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .week-cell {
          background: white;
          padding: 12px;
          min-height: 100px;
          font-size: 12px;
        }

        .week-header {
          background: var(--ha-card-background, #f5f5f5);
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chore-item {
          background: #e3f2fd;
          padding: 4px 6px;
          border-radius: 3px;
          margin-bottom: 4px;
          font-size: 11px;
          color: #1976d2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Stats View */
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: var(--ha-card-background, #f5f5f5);
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #3498db;
          margin: 8px 0;
        }

        .stat-label {
          font-size: 12px;
          color: var(--secondary-text);
          font-weight: 500;
        }

        .leaderboard {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .leaderboard-row {
          display: grid;
          grid-template-columns: 40px 1fr auto auto;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
          font-size: 13px;
        }

        .leaderboard-row:last-child {
          border-bottom: none;
        }

        .rank {
          font-weight: bold;
          font-size: 16px;
        }

        .name {
          font-weight: 500;
        }

        .streak {
          color: #ff9800;
          font-weight: 600;
        }

        .completion {
          color: #66bb6a;
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--secondary-text);
        }

        .emoji {
          margin-right: 4px;
        }
      </style>

      <div class="card">
        <div class="card-header">
          <h2 class="title">🏠 ${this.config.title || 'Chore Tracker'}</h2>
        </div>

        <div class="tabs">
          <button class="tab-btn active" data-tab="board">📋 Board</button>
          <button class="tab-btn" data-tab="schedule">📅 Schedule</button>
          <button class="tab-btn" data-tab="stats">🏆 Stats</button>
        </div>

        <!-- Board Tab -->
        <div class="tab-content active" id="board-tab">
          <div class="add-form">
            <div class="form-group full">
              <label>Chore Name</label>
              <input type="text" id="chore-name" placeholder="Enter chore name">
            </div>

            <div class="form-group">
              <div>
                <label>Assignee</label>
                <select id="chore-assignee">
                  ${this.members.map(m => `<option value="${m.name}">${m.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label>Room/Area</label>
                <select id="chore-room">
                  <option value="Kitchen">🍳 Kitchen</option>
                  <option value="Bathroom">🚿 Bathroom</option>
                  <option value="Bedroom">🛏️ Bedroom</option>
                  <option value="Living">🛋️ Living Room</option>
                  <option value="Yard">🌳 Yard</option>
                  <option value="General">📌 General</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <div>
                <label>Frequency</label>
                <select id="chore-frequency">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label>Priority</label>
                <select id="chore-priority">
                  <option value="low">Low 🟢</option>
                  <option value="medium">Medium 🟡</option>
                  <option value="high">High 🔴</option>
                </select>
              </div>
            </div>

            <button class="btn-primary" id="add-btn">➕ Add Chore</button>
          </div>

          <div class="board" id="board">
            <div class="column" data-status="todo">
              <div class="column-header">
                <span>📝 To Do</span>
                <div class="column-count">0</div>
              </div>
            </div>
            <div class="column" data-status="in-progress">
              <div class="column-header">
                <span>⏳ In Progress</span>
                <div class="column-count">0</div>
              </div>
            </div>
            <div class="column" data-status="done">
              <div class="column-header">
                <span>✅ Done</span>
                <div class="column-count">0</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule Tab -->
        <div class="tab-content" id="schedule-tab">
          <div class="schedule" id="schedule"></div>
          <div id="empty-schedule" class="empty-state" style="display:none;">
            📭 No chores scheduled yet. Add chores to see the weekly schedule.
          </div>
        </div>

        <!-- Stats Tab -->
        <div class="tab-content" id="stats-tab">
          <div class="stats-container" id="stats-container"></div>
          <div class="leaderboard" id="leaderboard"></div>
          <div id="empty-stats" class="empty-state" style="display:none;">
            📊 No statistics available yet. Complete chores to see stats.
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.updateBoard();
  }

  setupEventListeners() {
    // Tab switching
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Add chore
    this.shadowRoot.getElementById('add-btn').addEventListener('click', () => this.addChore());

    // Board column clicks
    this.shadowRoot.querySelectorAll('.column').forEach(col => {
      col.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-small')) {
          const action = e.target.dataset.action;
          const choreId = e.target.closest('.chore-card').dataset.id;
          if (action === 'next') this.moveChore(choreId, 'next');
          if (action === 'prev') this.moveChore(choreId, 'prev');
          if (action === 'delete') this.deleteChore(choreId);
        }
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    this.shadowRoot.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    this.shadowRoot.getElementById(`${tabName}-tab`).classList.add('active');
    this.shadowRoot.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    if (tabName === 'schedule') this.updateSchedule();
    if (tabName === 'stats') this.updateStats();
  }

  addChore() {
    const name = this.shadowRoot.getElementById('chore-name').value.trim();
    const assignee = this.shadowRoot.getElementById('chore-assignee').value;
    const room = this.shadowRoot.getElementById('chore-room').value;
    const frequency = this.shadowRoot.getElementById('chore-frequency').value;
    const priority = this.shadowRoot.getElementById('chore-priority').value;

    if (!name) return;

    const chore = {
      id: Date.now(),
      name,
      assignee,
      room,
      frequency,
      priority,
      status: 'todo',
      completedCount: 0,
      lastCompleted: null,
      streak: 0
    };

    this.chores.push(chore);
    this.shadowRoot.getElementById('chore-name').value = '';
    this.updateBoard();
  }

  moveChore(choreId, direction) {
    const chore = this.chores.find(c => c.id == choreId);
    if (!chore) return;

    const statuses = ['todo', 'in-progress', 'done'];
    const currentIndex = statuses.indexOf(chore.status);

    if (direction === 'next' && currentIndex < statuses.length - 1) {
      chore.status = statuses[currentIndex + 1];
      if (chore.status === 'done') {
        chore.completedCount++;
        chore.lastCompleted = new Date();
        chore.streak++;
      }
    } else if (direction === 'prev' && currentIndex > 0) {
      chore.status = statuses[currentIndex - 1];
    }

    this.updateBoard();
  }

  deleteChore(choreId) {
    this.chores = this.chores.filter(c => c.id != choreId);
    this.updateBoard();
  }

  updateBoard() {
    const statuses = ['todo', 'in-progress', 'done'];

    statuses.forEach(status => {
      const column = this.shadowRoot.querySelector(`[data-status="${status}"]`);
      const choreCards = this.chores.filter(c => c.status === status);

      const cardsHtml = choreCards.map(chore => `
        <div class="chore-card priority-${chore.priority}" data-id="${chore.id}">
          <h3 class="chore-title">${chore.name}</h3>
          <div class="chore-meta">
            <span class="chore-assignee" style="background-color: ${this.getMemberColor(chore.assignee)}">${chore.assignee}</span>
            <span>${this.getRoomEmoji(chore.room)}</span>
          </div>
          <div style="font-size: 11px; color: var(--secondary-text); margin-top: 6px;">
            ${this.getFrequencyLabel(chore.frequency)} • ${chore.priority.charAt(0).toUpperCase() + chore.priority.slice(1)}
          </div>
          <div class="chore-actions">
            ${status !== 'done' ? `<button class="btn-small" data-action="next">Next →</button>` : ''}
            ${status !== 'todo' ? `<button class="btn-small" data-action="prev">← Back</button>` : ''}
            <button class="btn-small" data-action="delete">🗑️</button>
          </div>
        </div>
      `).join('');

      const countEl = column.querySelector('.column-count');
      countEl.textContent = choreCards.length;

      const existingCards = column.querySelectorAll('.chore-card');
      existingCards.forEach(card => card.remove());

      column.insertAdjacentHTML('beforeend', cardsHtml);
    });
  }

  updateSchedule() {
    const scheduleEl = this.shadowRoot.getElementById('schedule');
    const emptyEl = this.shadowRoot.getElementById('empty-schedule');

    if (this.chores.length === 0) {
      scheduleEl.style.display = 'none';
      emptyEl.style.display = 'block';
      return;
    }

    scheduleEl.style.display = 'block';
    emptyEl.style.display = 'none';

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let html = '<div class="week-grid">';

    html += '<div class="week-cell week-header">Chore</div>';
    days.forEach(day => {
      html += `<div class="week-cell week-header">${day}</div>`;
    });

    this.chores.forEach(chore => {
      html += `<div class="week-cell"><strong>${chore.name}</strong></div>`;
      days.forEach((_, index) => {
        const show = this.isChoreOnDay(chore, index);
        html += `<div class="week-cell">${show ? `<div class="chore-item">${chore.room}</div>` : ''}</div>`;
      });
    });

    html += '</div>';
    scheduleEl.innerHTML = html;
  }

  isChoreOnDay(chore, dayIndex) {
    if (chore.frequency === 'daily') return true;
    if (chore.frequency === 'weekly') return dayIndex === 0;
    if (chore.frequency === 'biweekly') return dayIndex === 0;
    if (chore.frequency === 'monthly') return dayIndex === 0;
    return false;
  }

  updateStats() {
    const statsEl = this.shadowRoot.getElementById('stats-container');
    const leaderboardEl = this.shadowRoot.getElementById('leaderboard');
    const emptyEl = this.shadowRoot.getElementById('empty-stats');

    const completedChores = this.chores.filter(c => c.completedCount > 0).length;
    const totalChores = this.chores.length;
    const overallCompletion = totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0;

    const memberStats = {};
    this.members.forEach(m => {
      const memberChores = this.chores.filter(c => c.assignee === m.name);
      const completedByMember = memberChores.reduce((sum, c) => sum + c.completedCount, 0);
      const totalByMember = memberChores.length;
      const maxStreak = memberChores.length > 0 ? Math.max(...memberChores.map(c => c.streak)) : 0;

      memberStats[m.name] = {
        completed: completedByMember,
        total: totalByMember,
        streak: maxStreak
      };
    });

    const sortedMembers = Object.entries(memberStats).sort((a, b) => b[1].completed - a[1].completed);

    statsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">📋 Total Chores</div>
        <div class="stat-value">${totalChores}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">✅ Completed</div>
        <div class="stat-value">${completedChores}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">📊 Completion Rate</div>
        <div class="stat-value">${overallCompletion}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">👥 Active Members</div>
        <div class="stat-value">${this.members.length}</div>
      </div>
    `;

    if (sortedMembers.length === 0) {
      leaderboardEl.style.display = 'none';
      emptyEl.style.display = 'block';
      return;
    }

    leaderboardEl.style.display = 'block';
    emptyEl.style.display = 'none';

    leaderboardEl.innerHTML = sortedMembers.map((entry, index) => `
      <div class="leaderboard-row">
        <div class="rank">#${index + 1}</div>
        <div class="name">${entry[0]}</div>
        <div class="completion">${entry[1].completed} done</div>
        <div class="streak">🔥 ${entry[1].streak}</div>
      </div>
    `).join('');
  }

  getMemberColor(memberName) {
    const member = this.members.find(m => m.name === memberName);
    return member ? member.color : '#999999';
  }

  getRoomEmoji(room) {
    const emojis = {
      'Kitchen': '🍳',
      'Bathroom': '🚿',
      'Bedroom': '🛏️',
      'Living': '🛋️',
      'Yard': '🌳',
      'General': '📌'
    };
    return emojis[room] || '📌';
  }

  getFrequencyLabel(freq) {
    const labels = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'biweekly': 'Bi-weekly',
      'monthly': 'Monthly'
    };
    return labels[freq] || freq;
  }
}

customElements.define('ha-chore-tracker', HaChoreTracker);
