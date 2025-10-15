// Cricket Performance Analyzer JavaScript

class CricketAnalyzer {
    constructor() {
        this.dismissals = [];
        this.currentDot = null;
        this.lastClickTime = 0;
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

        // Field click to place dot - use mousedown instead of click for more control
        field.addEventListener('mousedown', (e) => this.handleFieldClick(e));

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
        // Prevent default behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Prevent multiple rapid clicks with a more robust system
        const now = Date.now();
        if (this.lastClickTime && (now - this.lastClickTime) < 500) {
            console.log('Click blocked - too rapid');
            return;
        }
        this.lastClickTime = now;

        // Get the SVG element
        const svg = document.getElementById('cricketField');
        const rect = svg.getBoundingClientRect();
        
        // Calculate relative position within the SVG
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to SVG coordinate system
        const svgPoint = this.getSVGPoint(svg, x, y);

        // Check if click is within the circular field (center: 600,400, radius: 380)
        const distanceFromCenter = Math.sqrt(
            Math.pow(svgPoint.x - 600, 2) + Math.pow(svgPoint.y - 400, 2)
        );
        
        if (distanceFromCenter > 370) {
            console.log('Click outside field boundary, ignoring');
            return;
        }

        console.log('=== NEW CLICK ===');
        console.log('Mouse position:', e.clientX, e.clientY);
        console.log('SVG rect:', rect.left, rect.top, rect.width, rect.height);
        console.log('Relative to SVG:', x, y);
        console.log('SVG coords:', svgPoint.x, svgPoint.y);
        console.log('Distance from center:', distanceFromCenter);

        // Create temporary dot
        this.createTempDot(svgPoint.x, svgPoint.y);
    }

    getSVGPoint(svg, clientX, clientY) {
        // Use SVG's built-in coordinate transformation
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        
        // Transform using the SVG's current transformation matrix
        const ctm = svg.getScreenCTM();
        if (ctm) {
            const transformedPoint = pt.matrixTransform(ctm.inverse());
            console.log('SVG transformed coords:', transformedPoint.x, transformedPoint.y);
            return {
                x: Math.round(transformedPoint.x),
                y: Math.round(transformedPoint.y)
            };
        }
        
        // Fallback: manual calculation
        const rect = svg.getBoundingClientRect();
        const viewBox = svg.viewBox.baseVal;
        const svgX = Math.round((clientX / rect.width) * viewBox.width);
        const svgY = Math.round((clientY / rect.height) * viewBox.height);
        
        console.log('Fallback calculation:', svgX, svgY);
        return {
            x: svgX,
            y: svgY
        };
    }

    createTempDot(x, y) {
        // Remove existing temp dot
        const existingTemp = document.querySelector('.temp-dot');
        if (existingTemp) {
            existingTemp.remove();
        }

        // Validate coordinates are within reasonable bounds
        if (x < 50 || x > 1150 || y < 50 || y > 750) {
            console.log('Click outside field bounds, ignoring. Coords:', x, y);
            return;
        }

        console.log('Creating dot at:', x, y);

        // Create new temporary dot
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        dot.setAttribute('r', 8);
        dot.setAttribute('fill', '#ff4444');
        dot.setAttribute('stroke', '#ffffff');
        dot.setAttribute('stroke-width', 3);
        dot.classList.add('temp-dot');
        dot.style.opacity = '0.9';
        dot.style.cursor = 'pointer';

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
