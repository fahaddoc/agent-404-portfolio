import { PORTFOLIO } from '../../data/portfolio.js';

export default class ClassifiedModal {
  constructor() {
    this.overlay = document.getElementById('modal-overlay');
    this.modal = document.getElementById('classified-modal');
    this.inner = document.getElementById('modal-inner');
    this.closeBtn = document.getElementById('modal-close');
    this.isOpen = false;
    this._onClose = null;

    this.closeBtn.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  open(section, onClose) {
    const data = PORTFOLIO[section];
    if (!data) return;

    this._onClose = onClose;
    this.inner.innerHTML = this._buildContent(section, data);
    this.isOpen = true;

    this.overlay.classList.add('active');
    // Small delay so CSS transition fires
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.modal.classList.add('active');
      });
    });
  }

  close() {
    this.isOpen = false;
    this.modal.classList.remove('active');
    this.overlay.classList.remove('active');
    if (this._onClose) {
      setTimeout(() => {
        this._onClose();
        this._onClose = null;
      }, 420);
    }
  }

  _buildContent(section, data) {
    let html = `
      <div class="modal-stamp">${data.stamp || 'CLASSIFIED'}</div>
      <div class="modal-title">${data.title}</div>
    `;

    switch (section) {
      case 'intro':
        html += this._buildIntro(data);
        break;
      case 'about':
        html += this._buildAbout(data);
        break;
      case 'skills':
        html += this._buildSkills(data);
        break;
      case 'projects':
        html += this._buildProjects(data);
        break;
      case 'experience':
        html += this._buildExperience(data);
        break;
      case 'contact':
        html += this._buildContact(data);
        break;
    }

    return html;
  }

  _buildIntro(d) {
    return `
      <div class="modal-subtitle" style="font-size:11px;color:#FFB800;margin-bottom:6px;">
        ${d.codename}
      </div>
      <div class="section-label">IDENTITY</div>
      <div class="bio-text">
        <span style="color:#FFB800">${d.name}</span><br>
        ${d.designation}<br>
        <span style="color:#555">${d.location}</span>
      </div>
      <div style="margin:8px 0;padding:6px 10px;border:1px solid rgba(0,255,136,0.3);color:#00FF88;font-size:10px;letter-spacing:2px;">
        ◉ ${d.status}
      </div>
      <div class="section-label">MISSION BRIEF</div>
      <div class="bio-text">${d.bio}</div>
      <div class="section-label">FIELD STATS</div>
      <div class="stat-grid">
        ${d.stats.map(s => `
          <div class="stat-box">
            <span class="stat-num">${s.num}</span>
            <span class="stat-lbl">${s.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  _buildAbout(d) {
    return `
      <div class="section-label">OPERATIVE PROFILE</div>
      <div class="bio-text">${d.bio}</div>
      <div class="section-label">FIELD STATS</div>
      <div class="stat-grid">
        ${d.stats.map(s => `
          <div class="stat-box">
            <span class="stat-num">${s.num}</span>
            <span class="stat-lbl">${s.label}</span>
          </div>
        `).join('')}
      </div>
      <div class="section-label">SPECIALIZATIONS</div>
      ${d.specializations.map(s => `
        <div style="padding:6px 10px;border-left:2px solid rgba(255,184,0,0.4);margin-bottom:6px;color:#aaa;font-size:11px;">
          ${s}
        </div>
      `).join('')}
    `;
  }

  _buildSkills(d) {
    return d.categories.map(cat => `
      <div class="section-label">${cat.label}</div>
      <div class="skill-wrap">
        ${cat.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
    `).join('');
  }

  _buildProjects(d) {
    return `
      <div class="bio-text" style="margin-bottom:16px;color:#666;font-size:11px;">
        ${d.items.length} MISSIONS ON RECORD
      </div>
      ${d.items.map(p => `
        <div class="project-card">
          <div class="project-name">${p.name}</div>
          <div class="project-company">${p.company}</div>
          <div class="project-desc">${p.desc}</div>
        </div>
      `).join('')}
    `;
  }

  _buildExperience(d) {
    return d.items.map(e => `
      <div class="exp-item">
        <div class="exp-company">${e.company}</div>
        <div class="exp-role">${e.role}</div>
        <div class="exp-period">${e.period}</div>
        <div class="exp-desc">${e.desc}</div>
      </div>
    `).join('');
  }

  _buildContact(d) {
    return `
      <div class="bio-text" style="margin-bottom:16px;font-size:12px;color:#666;">${d.message}</div>
      ${d.items.map(c => `
        <div class="contact-row">
          <span class="contact-key">${c.key}</span>
          <a class="contact-val" href="${c.href}" target="_blank" rel="noopener">${c.value}</a>
        </div>
      `).join('')}
      <div class="mission-complete" style="margin-top:24px;">
        <div class="mission-complete-text">◉ ${d.closing}</div>
        <div style="color:#444;font-size:10px;letter-spacing:2px;margin-top:6px;">ALL SECTORS CLEARED · AGENT 404</div>
      </div>
    `;
  }
}
