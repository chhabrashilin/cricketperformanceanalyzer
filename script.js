// Cricket Performance Analyzer JavaScript

class CricketAnalyzer {
    constructor() {
        this.dismissals = [];
        this.currentDot = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStats();
    }

    bindEvents() {
        const field = document.getElementById('cricketField');
        const form = document.getElementById('detailsForm');
        const cancelBtn = document.getElementById('cancelBtn');
        const modal = document.getElementById('detailModal');
        const closeBtn = document.querySelector('.close');

        // Field click to place dot
        field.addEventListener('click', (e) => this.handleFieldClick(e));

        // Form submission
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Cancel button
        cancelBtn.addEventListener('click', () => this.cancelDismissal());

        // Modal close
        closeBtn.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    handleFieldClick(e) {
        // Don't place dot if clicking on existing dots or labels
        if (e.target.classList.contains('dismissal-dot') || 
            e.target.classList.contains('field-label') ||
            e.target.tagName === 'text') {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to SVG coordinates
        const svgPoint = this.getSVGPoint(e.currentTarget, x, y);

        // Create temporary dot
        this.createTempDot(svgPoint.x, svgPoint.y);
    }

    getSVGPoint(svg, clientX, clientY) {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    }

    createTempDot(x, y) {
        // Remove existing temp dot
        const existingTemp = document.querySelector('.temp-dot');
        if (existingTemp) {
            existingTemp.remove();
        }

        // Create new temporary dot
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        dot.setAttribute('r', 6);
        dot.setAttribute('fill', '#ff4444');
        dot.setAttribute('stroke', '#ffffff');
        dot.setAttribute('stroke-width', 2);
        dot.classList.add('temp-dot');
        dot.style.opacity = '0.7';

        // Add pulsing animation
        dot.style.animation = 'pulse 1.5s infinite';

        document.getElementById('cricketField').appendChild(dot);

        // Show form
        this.showForm();
    }

    showForm() {
        document.getElementById('dismissalForm').style.display = 'block';
        document.getElementById('dismissalType').focus();
    }

    hideForm() {
        document.getElementById('dismissalForm').style.display = 'none';
        const tempDot = document.querySelector('.temp-dot');
        if (tempDot) {
            tempDot.remove();
        }
        this.resetForm();
    }

    resetForm() {
        document.getElementById('detailsForm').reset();
        this.currentDot = null;
    }

    cancelDismissal() {
        this.hideForm();
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const dismissal = {
            id: Date.now(),
            x: this.getTempDotPosition().x,
            y: this.getTempDotPosition().y,
            type: formData.get('dismissalType') || document.getElementById('dismissalType').value,
            bowler: document.getElementById('bowler').value,
            runs: parseInt(document.getElementById('runs').value) || 0,
            balls: parseInt(document.getElementById('balls').value) || 1,
            notes: document.getElementById('notes').value,
            timestamp: new Date().toLocaleString()
        };

        this.addDismissal(dismissal);
        this.hideForm();
    }

    getTempDotPosition() {
        const tempDot = document.querySelector('.temp-dot');
        if (tempDot) {
            return {
                x: parseFloat(tempDot.getAttribute('cx')),
                y: parseFloat(tempDot.getAttribute('cy'))
            };
        }
        return { x: 0, y: 0 };
    }

    addDismissal(dismissal) {
        this.dismissals.push(dismissal);
        this.createDismissalDot(dismissal);
        this.updateStats();
    }

    createDismissalDot(dismissal) {
        // Remove temp dot
        const tempDot = document.querySelector('.temp-dot');
        if (tempDot) {
            tempDot.remove();
        }

        // Create permanent dot
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', dismissal.x);
        dot.setAttribute('cy', dismissal.y);
        dot.setAttribute('r', 6);
        dot.setAttribute('fill', this.getDismissalColor(dismissal.type));
        dot.setAttribute('stroke', '#ffffff');
        dot.setAttribute('stroke-width', 2);
        dot.classList.add('dismissal-dot');
        dot.dataset.dismissalId = dismissal.id;

        // Add click handler
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDismissalDetails(dismissal);
        });

        document.getElementById('cricketField').appendChild(dot);
    }

    getDismissalColor(type) {
        const colors = {
            'bowled': '#f44336',
            'caught': '#ff9800',
            'lbw': '#9c27b0',
            'runout': '#2196f3',
            'stumped': '#00bcd4',
            'hitwicket': '#795548',
            'other': '#607d8b'
        };
        return colors[type] || '#607d8b';
    }

    showDismissalDetails(dismissal) {
        const modal = document.getElementById('detailModal');
        const content = document.getElementById('modalContent');
        
        content.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Dismissal Type:</span>
                <span class="detail-value">${this.formatDismissalType(dismissal.type)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Bowler/Fielder:</span>
                <span class="detail-value">${dismissal.bowler || 'Not specified'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Runs Scored:</span>
                <span class="detail-value">${dismissal.runs}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Balls Faced:</span>
                <span class="detail-value">${dismissal.balls}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Strike Rate:</span>
                <span class="detail-value">${((dismissal.runs / dismissal.balls) * 100).toFixed(1)}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${dismissal.timestamp}</span>
            </div>
            ${dismissal.notes ? `
            <div class="detail-item">
                <span class="detail-label">Notes:</span>
                <span class="detail-value">${dismissal.notes}</span>
            </div>
            ` : ''}
            <div class="detail-item" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                <button onclick="cricketAnalyzer.deleteDismissal(${dismissal.id})" 
                        style="background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    Delete This Dismissal
                </button>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    formatDismissalType(type) {
        const types = {
            'bowled': 'Bowled',
            'caught': 'Caught',
            'lbw': 'LBW',
            'runout': 'Run Out',
            'stumped': 'Stumped',
            'hitwicket': 'Hit Wicket',
            'other': 'Other'
        };
        return types[type] || type;
    }

    closeModal() {
        document.getElementById('detailModal').style.display = 'none';
    }

    deleteDismissal(id) {
        if (confirm('Are you sure you want to delete this dismissal?')) {
            this.dismissals = this.dismissals.filter(d => d.id !== id);
            
            // Remove dot from field
            const dot = document.querySelector(`[data-dismissal-id="${id}"]`);
            if (dot) {
                dot.remove();
            }
            
            this.updateStats();
            this.closeModal();
        }
    }

    updateStats() {
        const statsContent = document.getElementById('statsContent');
        
        if (this.dismissals.length === 0) {
            statsContent.innerHTML = '<p>Click on the field to add your first dismissal</p>';
            return;
        }

        const totalRuns = this.dismissals.reduce((sum, d) => sum + d.runs, 0);
        const totalBalls = this.dismissals.reduce((sum, d) => sum + d.balls, 0);
        const avgRuns = (totalRuns / this.dismissals.length).toFixed(1);
        const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : 0;

        // Count dismissal types
        const dismissalCounts = {};
        this.dismissals.forEach(d => {
            dismissalCounts[d.type] = (dismissalCounts[d.type] || 0) + 1;
        });

        const mostCommonDismissal = Object.keys(dismissalCounts).reduce((a, b) => 
            dismissalCounts[a] > dismissalCounts[b] ? a : b, 'none');

        statsContent.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Dismissals:</span>
                <span class="stat-value">${this.dismissals.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Runs:</span>
                <span class="stat-value">${totalRuns}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Balls Faced:</span>
                <span class="stat-value">${totalBalls}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Average Runs per Dismissal:</span>
                <span class="stat-value">${avgRuns}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Overall Strike Rate:</span>
                <span class="stat-value">${strikeRate}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Most Common Dismissal:</span>
                <span class="stat-value">${this.formatDismissalType(mostCommonDismissal)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Dismissal Breakdown:</span>
                <span class="stat-value"></span>
            </div>
            ${Object.entries(dismissalCounts).map(([type, count]) => `
                <div class="stat-item" style="padding-left: 20px;">
                    <span class="stat-label" style="font-size: 0.9rem;">${this.formatDismissalType(type)}:</span>
                    <span class="stat-value" style="font-size: 0.9rem;">${count}</span>
                </div>
            `).join('')}
        `;
    }
}

// Add CSS animation for pulse effect
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 0.7; }
    }
`;
document.head.appendChild(style);

// Initialize the application
let cricketAnalyzer;
document.addEventListener('DOMContentLoaded', () => {
    cricketAnalyzer = new CricketAnalyzer();
});
