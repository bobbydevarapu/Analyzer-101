const BASE_URL = "https://aia-011.up.railway.app";

let isAdminLoggedIn = false;
let adminToken = null;
let fullResults = null;

/* Restore admin session on page load */
window.addEventListener('DOMContentLoaded', () => {
    const stored = localStorage.getItem('adminToken');
    if (stored) {
        adminToken = stored;
        isAdminLoggedIn = true;
        document.getElementById('role').value = 'admin';
        switchRole();
        renderAdminPanel();
    }
});

/* ================= ROLE SWITCH ================= */
function switchRole() {

    const role = document.getElementById("role").value;

    if (isAdminLoggedIn && role !== "admin") {
        alert("Logout first to switch role");
        document.getElementById("role").value = "admin";
        return;
    }

    document.getElementById("studentSection").style.display = "none";
    document.getElementById("teacherSection").style.display = "none";
    document.getElementById("adminSection").style.display = "none";

    clearMessages();

    if (role === "student") {
        document.getElementById("studentSection").style.display = "block";
    }

    if (role === "teacher") {
        document.getElementById("teacherSection").style.display = "block";
    }

    if (role === "admin") {
        showAdminLogin();
    }
}

/* ================= ADMIN ================= */

function showAdminLogin() {

    document.getElementById("adminSection").style.display = "block";

    document.getElementById("adminSection").innerHTML = `
        <h2>Admin Login</h2>

        <input id="adminUser" placeholder="Username">
        <input id="adminPass" type="password" placeholder="Password">

        <button class="login-action" onclick="adminLogin()">Login</button>
    `;
}

function toggleAdminPassword() {
    const inp = document.getElementById('adminPass');
    const btn = document.querySelector('#adminSection .password-toggle');

    if (!inp || !btn) return;

    if (inp.type === 'password') {
        inp.type = 'text';
        btn.innerHTML = `<svg class="password-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M12 5C7 5 3.3 8.1 2 12c1.3 3.9 5 7 10 7 1.7 0 3.3-.4 4.7-1.2" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>`;
    } else {
        inp.type = 'password';
        btn.innerHTML = `<svg class="password-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 5C7 5 3.3 8.1 2 12c1.3 3.9 5 7 10 7s8.7-3.1 10-7c-1.3-3.9-5-7-10-7z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`;
    }
}

function adminLogin() {
    const user = document.getElementById("adminUser").value.trim();
    const pass = document.getElementById("adminPass").value.trim();

    if (!user || !pass) {
        showMessage("Enter admin username and password", "error");
        return;
    }

    const form = new FormData();
    form.append("username", user);
    form.append("password", pass);

    fetch(`${BASE_URL}/admin/login`, {
        method: "POST",
        body: form
    })
    .then(r => {
        if (!r.ok) throw r;
        return r.json();
    })
    .then(data => {
        adminToken = data.token;
        isAdminLoggedIn = true;
        
        /* Persist admin token to localStorage */
        localStorage.setItem('adminToken', adminToken);

        renderAdminPanel();
        showMessage("Admin logged in", "success");
    })
    .catch(async err => {
        let msg = "Invalid admin credentials";
        try { const j = await err.json(); if (j && j.detail) msg = j.detail; } catch(e){}
        showMessage(msg, "error");
    });
}

function adminLogout() {
    isAdminLoggedIn = false;
    adminToken = null;
    
    /* Clear admin token from localStorage */
    localStorage.removeItem('adminToken');
    
    document.getElementById("role").value = "student";
    switchRole();
    showMessage("Logged out successfully", "info");
}

function renderAdminPanel() {
    document.getElementById("adminSection").innerHTML = `
        <h2>Admin Panel</h2>
        <button class="admin-action-btn" onclick="adminLogout()" style="background:#dc2626; float:right;">Logout</button>
        <div style="clear:both"></div>
        <h3 style="margin-top:28px;">Available Assignments</h3>
        <div id="adminAssignmentsContainer" class="assignment-cards"></div>
    `;
    fetchAdminAssignments();
}

function fetchAdminAssignments() {
    const container = document.getElementById('adminAssignmentsContainer');
    if (!container) return;
    container.innerHTML = '<div class="admin-loading">Loading assignments...</div>';
    fetch(`${BASE_URL}/admin/assignments`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    .then(res => res.json())
    .then(data => {
        if (!data.assignments || data.assignments.length === 0) {
            container.innerHTML = '<div class="admin-empty">No assignments found.</div>';
            return;
        }
        container.innerHTML = data.assignments.map(a => renderAssignmentCard(a)).join('');
    })
    .catch(() => {
        container.innerHTML = '<div class="admin-error">Failed to load assignments.</div>';
    });
}

function renderAssignmentCard(a) {
    return `
    <div class="assignment-card" id="card-${a.assignment_id}">
        <div class="assignment-id">${a.assignment_id}</div>
        <div class="assignment-meta">
            <span>Students: <b>${a.student_count}</b></span>
            <span>Flagged: <b>${a.flagged_count}</b></span>
        </div>
        <button class="delete-btn" onclick="deleteAssignmentCard('${a.assignment_id}')">Delete</button>
    </div>
    `;
}

function deleteAssignmentCard(assignmentId) {
    if (!confirm(`Delete assignment ${assignmentId}? This cannot be undone.`)) return;
    fetch(`${BASE_URL}/delete/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.message && data.message.includes('Deleted')) {
            showMessage(`Assignment ${assignmentId} deleted.`, 'success');
            const card = document.getElementById(`card-${assignmentId}`);
            if (card) card.remove();
        } else {
            showMessage(data.error || 'Delete failed', 'error');
        }
    })
    .catch(() => showMessage('Delete failed', 'error'));
}

/* ================= SUBMIT ================= */

async function submitAssignment() {

    const id = assignmentId.value.trim();
    const rollVal = roll.value.trim();
    const emailVal = email.value.trim();
    const fileVal = file.files[0];

    if (!id || !rollVal || !emailVal || !fileVal) {
        showMessage("All fields required", "error");
        return;
    }

    if (!emailVal.includes("@")) {
        showMessage("Invalid email format", "error");
        return;
    }

    const form = new FormData();
    form.append("assignment_id", id);
    form.append("roll", rollVal);
    form.append("email", emailVal);
    form.append("file", fileVal);

    const res = await fetch(`${BASE_URL}/submit`, {
        method: "POST",
        body: form
    });

    const data = await res.json();

    if (data.error) {
        showMessage(data.error, "error");
    } else {
        showMessage("Submission successful", "success");

        assignmentId.value = "";
        roll.value = "";
        email.value = "";
        file.value = "";
    }
}

/* ================= ANALYZE ================= */

async function analyze() {

    const id = document.getElementById("teacherAssignmentId").value.trim();

    if (!id) {
        showMessage("Enter Assignment ID", "error");
        return;
    }

    const res = await fetch(`${BASE_URL}/analyze/${id}`, {
        method: "POST"
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        const text = await res.text();
        showMessage(`Analyze failed (${res.status}): ${text || res.statusText}`, "error");
        return;
    }

    const data = await res.json();

    if (!res.ok) {
        showMessage(data.detail || data.error || "Analyze request failed", "error");
        return;
    }

    if (data.error) {
        showMessage(data.error, "error");
        return;
    }

    fullResults = data;

    renderResults(data);
    showToast(`Analysis complete for ${id}`, "success");
}

/* ================= RENDER ================= */

function renderResults(data) {

    const assignmentId = document.getElementById("teacherAssignmentId").value.trim();

    const copiedPairs = (data.results || []).filter(r => {
        const status = (r.status || "").toLowerCase();
        return status.includes("similar") || status.includes("copied");
    });

    let html = `
    <div class="report">
        <div class="report-header">
            <div>
                <h2>Assignment ${assignmentId} Analysis</h2>
                <p><b>Total Submissions:</b> ${data.total_students}</p>
            </div>
            <div class="report-badge ${copiedPairs.length ? 'danger' : 'success'}">
                ${copiedPairs.length ? `${copiedPairs.length} copied pair(s)` : 'No copied pairs'}
            </div>
        </div>
    `;

    /* ===== SMART VERDICT ===== */
    let total = 0;
    let count = 0;

    data.matrix.forEach(row => {
        row.forEach(val => {
            if (val !== 100) {
                total += val;
                count++;
            }
        });
    });

    let avg = count ? total / count : 0;

    let verdict = "Unique Documents";
    if (avg >= 95) verdict = "Totally Copied";
    else if (avg > 75) verdict = "Highly Copied";
    else if (avg > 60) verdict = "Partially Copied";

    html += `<p><b>Overall Verdict:</b> ${verdict} (${avg.toFixed(2)}%)</p>`;
    html += `<p>Pairs with ≥60% similarity require review.</p>`;

    /* ===== MATRIX ===== */
    html += `<h3>Similarity Matrix</h3>`;
    html += `<div class="table-wrap"><table class="matrix-table">`;

    html += "<tr><th>Roll No</th>";
    data.students.forEach(s => {
        html += `<th>${s}</th>`;
    });
    html += "</tr>";

    data.matrix.forEach((row, i) => {

        html += `<tr>`;
        html += `<th>${data.students[i]}</th>`;

        row.forEach(val => {

            let style = "";

            if (val >= 60) {
                style = "background:#dc2626;color:white;font-weight:bold;";
            } else if (val >= 40) {
                style = "background:#f59e0b;color:white;";
            } else {
                style = "background:#10b981;color:white;";
            }

            html += `<td style="${style}">
                        ${val.toFixed(2)}%
                     </td>`;
        });

        html += "</tr>";
    });

    html += `</table></div>`;

    /* ===== FLAGGED ===== */
    html += `<h3>Flagged Pairs</h3>`;

    if (copiedPairs.length === 0) {
        html += `<p>No suspicious pairs found</p>`;
    } else {
        html += `
        <div class="table-wrap"><table class="flag-table">
            <tr>
                <th>Roll1</th>
                <th>Roll2</th>
                <th>Similarity</th>
                <th>Status</th>
            </tr>
        `;

        copiedPairs.forEach(r => {
            const similarity = Number(r.score || 0);
            const displayStatus = similarity >= 100 ? "Copied" : (r.status || "Flagged");
            html += `
            <tr>
                <td>${r.student1}</td>
                <td>${r.student2}</td>
                <td>${similarity.toFixed(0)}%</td>
                <td>${displayStatus}</td>
            </tr>
            `;
        });

        html += `</table></div>`;
    }

    html += `
        <div style="display:flex;gap:12px;margin-top:16px;justify-content:center;flex-wrap:wrap;">
            <button onclick="downloadReport('${assignmentId}', 'json')" style="background:#f97316;color:white;padding:10px 16px;border:none;border-radius:8px;cursor:pointer;font-weight:500;flex:1;min-width:150px;">Download Report (JSON)</button>
            <button onclick="downloadReport('${assignmentId}', 'csv')" style="background:#f97316;color:white;padding:10px 16px;border:none;border-radius:8px;cursor:pointer;font-weight:500;flex:1;min-width:150px;">Download Report (CSV)</button>
            <button onclick="downloadReport('${assignmentId}', 'pdf')" style="background:#f97316;color:white;padding:10px 16px;border:none;border-radius:8px;cursor:pointer;font-weight:500;flex:1;min-width:150px;">Download Report (PDF)</button>
        </div>
    </div>`;

    document.getElementById("result").innerHTML = html;
}

function downloadReport(assignmentId, format) {
    if (!fullResults) {
        showMessage("No results to download", "error");
        return;
    }

    let content, filename, mimeType;

    if (format === 'json') {
        content = JSON.stringify(fullResults, null, 2);
        filename = `${assignmentId}_report.json`;
        mimeType = 'application/json';
    } else if (format === 'csv') {
        // Build CSV from results
        let csv = "Student 1,Student 2,Similarity %,Status\n";
        const results = fullResults.results || [];
        results.forEach(r => {
            csv += `${r.student1},${r.student2},${r.score},${r.status}\n`;
        });
        content = csv;
        filename = `${assignmentId}_report.csv`;
        mimeType = 'text/csv';
    } else if (format === 'pdf') {
        // Generate PDF report
        generatePDFReport(assignmentId);
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Report downloaded: ${filename}`, "success");
}

function generatePDFReport(assignmentId) {
    // Load jsPDF
    const jsPdfScript = document.createElement('script');
    jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    jsPdfScript.onload = () => {
        // Load autoTable plugin
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
        autoTableScript.onload = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let yPosition = margin;

            // Title
            doc.setFontSize(18);
            doc.setTextColor(40);
            doc.text('Assignment Integrity Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 12;

            // Assignment details
            doc.setFontSize(11);
            doc.setTextColor(80);
            doc.text(`Assignment ID: ${assignmentId}`, margin, yPosition);
            yPosition += 8;
            doc.text(`Total Submissions: ${fullResults.total_students || 0}`, margin, yPosition);
            yPosition += 8;
            doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
            yPosition += 12;

            // Flagged pairs summary
            const copiedPairs = (fullResults.results || []).filter(r => {
                const status = (r.status || '').toLowerCase();
                return status.includes('similar') || status.includes('copied');
            });
            doc.setDrawColor(200);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 15);
            doc.setFontSize(10);
            doc.setTextColor(40);
            doc.text(`Flagged Pairs: ${copiedPairs.length}`, margin + 5, yPosition + 2);
            yPosition += 20;

            // Results table
            if (copiedPairs.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(40);
                doc.text('Flagged Pairs', margin, yPosition);
                yPosition += 8;

                const tableData = copiedPairs.map(r => [
                    r.student1 || 'N/A',
                    r.student2 || 'N/A',
                    `${r.score}%`,
                    r.status || 'Copied'
                ]);

                doc.autoTable({
                    head: [['Student 1', 'Student 2', 'Similarity', 'Status']],
                    body: tableData,
                    startY: yPosition,
                    margin: { left: margin, right: margin },
                    theme: 'grid',
                    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
                    bodyStyles: { textColor: 50 },
                    alternateRowStyles: { fillColor: [245, 245, 245] }
                });
            } else {
                doc.setFontSize(11);
                doc.setTextColor(100);
                doc.text('No flagged pairs — all submissions appear unique.', margin, yPosition);
            }

            // Footer
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('Assignment Integrity Analyzer', pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Save PDF
            doc.save(`${assignmentId}_report.pdf`);
            showToast(`Report downloaded: ${assignmentId}_report.pdf`, "success");
        };
        document.head.appendChild(autoTableScript);
    };
    document.head.appendChild(jsPdfScript);
}

/* ================= EMAIL ================= */

async function sendEmails() {

    if (!confirm("Send emails to suspicious students?")) return;

    const id = document.getElementById("teacherAssignmentId").value.trim();

    if (!id) {
        showMessage("Enter Assignment ID", "error");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/send/${id}`, {
            method: "POST"
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            showMessage(data.error || data.message || "Failed to send emails", "error");
            return;
        }

        showMessage(data.message || "Emails processed successfully", "success");
    } catch (err) {
        showMessage("Server error during email send", "error");
    }
}

/* ================= DELETE ================= */

async function deleteResults() {

    const id = document.getElementById("adminAssignmentId").value.trim();

    if (!id) {
        showMessage("Enter Assignment ID", "error");
        return;
    }

    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
        const headers = {};
        if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;

        const res = await fetch(`${BASE_URL}/delete/${id}`, {
            method: "DELETE",
            headers
        });

        const data = await res.json();

        if (data.error) {
            showMessage(data.error, "error");
        } else {
            showMessage(
                `Deleted Successfully (Submissions: ${data.submissions_deleted}, Results: ${data.results_deleted})`,
                "success"
            );

            document.getElementById("adminAssignmentId").value = "";
        }

    } catch (err) {
        showMessage("Server error during delete", "error");
    }
}

/* ================= ALERT ================= */

function showMessage(msg, type) {
    // Keep the page clean by removing any stale inline message card.
    clearMessages();

    // Show only the popup toast for transient feedback.
    showToast(msg, type);
}

function clearMessages() {
    document.getElementById("result").innerHTML = "";
}

/* ================= TOASTS ================= */
function ensureToastContainer() {
    let c = document.querySelector('.toast-container');
    if (!c) {
        c = document.createElement('div');
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    return c;
}

function showToast(msg, type = 'info', timeout = 5000) {
    const c = ensureToastContainer();
    const t = document.createElement('div');
    t.className = `toast ${type}`;

    t.innerHTML = `
        <div class="msg">${msg}</div>
        <button class="close" type="button">✕</button>
    `;

    const closeBtn = t.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(-10px) translateX(-50%)';
        setTimeout(() => t.remove(), 200);
    });

    c.appendChild(t);

    // Auto remove after timeout
    setTimeout(() => {
        if (t.parentNode) {
            t.style.opacity = '0';
            t.style.transform = 'translateY(-10px) translateX(-50%)';
            setTimeout(() => {
                if (t.parentNode) t.remove();
            }, 200);
        }
    }, timeout);
}