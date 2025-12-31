/**
 * Project: Research Rover
 * @author Wasana Karunanayaka
 * Description: Main controller for the SPA. Handles Routing, Mock Authentication, Data Persistence, and User Interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    /* =========================================
       1. STATE & MOCK DATA
       ========================================= */

    // Initialize state. persistence checks occur in init()
    const state = {
        currentUser: null, // object { name, role: 'student'|'researcher' }
        view: 'home',      // home, auth, dashboard
        applications: []   // list of project IDs the user applied to
    };

    // Mock Database of research projects
    const projects = [
        {
            id: 1,
            title: "AI for Tea Plantations",
            field: "IT",
            researcher: "Dr. S. Perera",
            description: "Developing machine learning models to detect disease in tea leaves using drone imagery. Looking for students with Python and Computer Vision skills.",
            requirements: ["Python (PyTorch/TensorFlow)", "Basic Computer Vision", "Drone piloting (bonus)"]
        },
        {
            id: 2,
            title: "Marine Biology Survey",
            field: "Biology",
            researcher: "Prof. K. Silva",
            description: "Comprehensive survey of coral reef health off the coast of Mirissa. Requires diving certification and data collection skills.",
            requirements: ["PADI Open Water Certification", "Data Logging", "Swimming"]
        },
        {
            id: 3,
            title: "Sustainable Concrete Mixes",
            field: "Engineering",
            researcher: "Dr. M. Fernando",
            description: "Testing new eco-friendly concrete formulations using rice husk ash. Lab processing and strength testing roles available.",
            requirements: ["Civil Engineering bg", "Lab Safety Protocols", "Material Testing"]
        },
        {
            id: 4,
            title: "Rural Education Impact",
            field: "Social Science",
            researcher: "Dr. A. Jayasuriya",
            description: "Analyzing the impact of digital literacy programs in rural schools. Survey design and statistical analysis support needed.",
            requirements: ["SPSS/R", "Survey Design", "Willingness to travel"]
        },
        {
            id: 5,
            title: "Smart Irrigation System",
            field: "Agriculture",
            researcher: "Eng. D. Bandara",
            description: "IoT-based irrigation control for paddy fields. Arduino programming and sensor integration skills required.",
            requirements: ["Arduino/C++", "Circuit Design", "IoT Protocols"]
        },
        {
            id: 6,
            title: "Historical Archives Digitization",
            field: "Social Science",
            researcher: "Prof. L. Gunawardena",
            description: "Digitizing and cataloging colonial-era manuscripts using OCR technology and metadata tagging.",
            requirements: ["History/Archival Studies", "Detail Oriented", "OCR Tools"]
        }
    ];

    /* =========================================
       2. DOM ELEMENTS
       ========================================= */
    // Views - These specific IDs must exist in index.html
    const views = {
        home: document.getElementById('view-home'),
        auth: document.getElementById('view-auth'),
        dashboard: document.getElementById('view-dashboard')
    };

    // Navigation Links
    const navLinks = {
        home: document.getElementById('nav-home'),
        login: document.getElementById('nav-login'),
        opportunities: document.getElementById('nav-opportunities'),
        authItem: document.getElementById('auth-nav-item')
    };

    // Authentication Elements
    const authTabs = document.querySelectorAll('.auth-tab');
    const authTitle = document.getElementById('auth-title');
    const loginForm = document.getElementById('login-form');
    let selectedRole = 'student'; // Default selection

    // Dashboard Elements
    const dashUserName = document.getElementById('dash-user-name');
    const dashUserRole = document.getElementById('dash-user-role');
    const dashStats = document.getElementById('dashboard-stats');
    const dashList = document.getElementById('dashboard-list');
    const dashListTitle = document.getElementById('dash-list-title');
    const dashActionBtn = document.getElementById('dash-action-btn');

    // Modal Interaction Elements
    const projectDetailModal = document.getElementById('modal-project-detail');
    const postProjectModal = document.getElementById('modal-post-project');
    const closeButtons = document.querySelectorAll('.close-modal-btn');

    // Project Detail Content Slots
    const detailTitle = document.getElementById('detail-title');
    const detailTag = document.getElementById('detail-tag');
    const detailResearcher = document.getElementById('detail-researcher');
    const detailDescription = document.getElementById('detail-description');
    const detailRequirements = document.getElementById('detail-requirements');
    const confirmAppBtn = document.getElementById('confirm-application-btn');
    let currentProjectId = null;

    // Feedback Elements
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // General UI Elements
    const projectsGrid = document.getElementById('projects-grid');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');

    /* =========================================
       3. ROUTER & VIEW MANAGEMENT
       ========================================= */

    /**
     * Handles switching between different application views (Home, Auth, Dashboard).
     * It manages CSS classes to hide/show content and scrolls to top on transition.
     * @param {string} viewName - The key matching the 'views' object.
     */
    function navigateTo(viewName) {
        // Hide all views first to ensure clean state
        Object.values(views).forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });

        // Activate the requested view
        if (views[viewName]) {
            views[viewName].classList.remove('hidden');
            views[viewName].classList.add('active');
            state.view = viewName;
            window.scrollTo(0, 0); // Reset scroll position for better UX
        }

        updateNavigation();
    }

    /**
     * Updates the Navbar based on the user's authentication state.
     * Swaps 'Login' for 'Logout' and 'My Dashboard'.
     */
    function updateNavigation() {
        if (state.currentUser) {
            // User is logged in: Show Logout
            navLinks.authItem.innerHTML = `<a href="#" id="nav-logout" class="login-btn">Logout</a>`;

            // Re-attach listener specifically for logout since we replaced the innerHTML
            document.getElementById('nav-logout').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });

            // Inject "My Dashboard" link if it doesn't already exist
            const dashLinkExists = document.getElementById('nav-dashboard-link');
            if (!dashLinkExists) {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" id="nav-dashboard-link">My Dashboard</a>`;
                navLinks.authItem.parentElement.insertBefore(li, navLinks.authItem);

                document.getElementById('nav-dashboard-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    renderDashboard();
                    navigateTo('dashboard');
                });
            }
        } else {
            // User is guest: Show Login
            navLinks.authItem.innerHTML = `<a href="#login" class="login-btn" id="nav-login">Login</a>`;
            document.getElementById('nav-login').addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('auth');
            });

            // Remove Dashboard link regarding clean-up
            const dashLink = document.getElementById('nav-dashboard-link');
            if (dashLink) dashLink.parentElement.remove();
        }
    }

    // Attach core navigation listeners
    navLinks.home.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('home');
    });

    if (navLinks.opportunities) {
        navLinks.opportunities.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('home');
            // Allow time for view transition before scrolling
            setTimeout(() => {
                document.getElementById('opportunities').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
    }

    // Initial listener for the static login button
    navLinks.login.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('auth');
    });

    // Restore functionalities for "Post Project" and Hero buttons
    const heroBtnStudent = document.getElementById('hero-btn-student');
    const heroBtnResearcher = document.getElementById('hero-btn-researcher');
    const navPostProject = document.getElementById('nav-post-project');

    if (heroBtnStudent) {
        heroBtnStudent.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('opportunities').scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (heroBtnResearcher) {
        heroBtnResearcher.addEventListener('click', (e) => {
            e.preventDefault();
            openGenericModal(postProjectModal);
        });
    }

    if (navPostProject) {
        navPostProject.addEventListener('click', (e) => {
            e.preventDefault();
            openGenericModal(postProjectModal);
        });
    }

    /* =========================================
       4. AUTHENTICATION LOGIC (MOCK)
       ========================================= */

    // Handle tab switching in Auth view (Student vs Researcher)
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            selectedRole = tab.dataset.role;
            // Update UI text to reflect selected role
            authTitle.innerText = selectedRole === 'student' ? 'Welcome Student' : 'Welcome Researcher';
        });
    });

    /**
     * Process Mock Login.
     * Determines user name from email and saves session to localStorage.
     */
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const name = email.split('@')[0]; // Extract usable name from email

        // Update State
        state.currentUser = {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            role: selectedRole
        };

        // Persist Session
        localStorage.setItem('researchRoverUser', JSON.stringify(state.currentUser));

        showToast(`Welcome back, ${state.currentUser.name}!`);
        renderDashboard();
        navigateTo('dashboard');
    });

    function logout() {
        state.currentUser = null;
        state.applications = [];

        // Clear Persistence
        localStorage.removeItem('researchRoverUser');
        localStorage.removeItem('researchRoverApps');

        showToast('Logged out successfully.');
        navigateTo('home');
    }


    /* =========================================
       5. DASHBOARD LOGIC
       ========================================= */

    /**
     * Renders the Dashboard view dynamically based on the current user's role.
     * Differentiates content for Students (Applications) vs Researchers (Posted Projects).
     */
    function renderDashboard() {
        if (!state.currentUser) return;

        // Populate User Info
        dashUserName.innerText = state.currentUser.name;
        dashUserRole.innerText = state.currentUser.role === 'student' ? 'Student Researcher' : 'Lead Researcher';
        dashList.innerHTML = ''; // Reset list container

        if (state.currentUser.role === 'student') {
            // --- Student View Configuration ---
            dashActionBtn.innerHTML = "Browse Projects";
            dashActionBtn.onclick = () => {
                navigateTo('home');
                setTimeout(() => {
                    document.getElementById('opportunities').scrollIntoView({ behavior: 'smooth' });
                }, 100);
            };
            dashListTitle.innerText = "My Applications";

            // Render Application Stats
            dashStats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><ion-icon name="paper-plane-outline"></ion-icon></div>
                    <div class="stat-info"><h3>${state.applications.length}</h3><p>Applications Sent</p></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><ion-icon name="bookmark-outline"></ion-icon></div>
                    <div class="stat-info"><h3>0</h3><p>Saved Projects</p></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><ion-icon name="trophy-outline"></ion-icon></div>
                    <div class="stat-info"><h3>0</h3><p>Accepted</p></div>
                </div>
            `;

            // Render List of Applied Projects
            if (state.applications.length === 0) {
                dashList.innerHTML = `<div class="empty-state"><p>You haven't applied to any projects yet.</p></div>`;
            } else {
                const appliedProjects = projects.filter(p => state.applications.includes(p.id));
                dashList.innerHTML = appliedProjects.map(p => createCardHTML(p, true)).join('');
            }

        } else {
            // --- Researcher View Configuration ---
            dashActionBtn.innerHTML = "Post New Project";
            dashActionBtn.onclick = () => openGenericModal(postProjectModal);
            dashListTitle.innerText = "My Posted Projects";

            // Render Project Stats
            dashStats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><ion-icon name="list-outline"></ion-icon></div>
                    <div class="stat-info"><h3>2</h3><p>Active Projects</p></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><ion-icon name="people-outline"></ion-icon></div>
                    <div class="stat-info"><h3>12</h3><p>Applicants</p></div>
                </div>
            `;

            // Mock: Just show 2 random projects as "Owned" by this researcher
            const myProjects = [projects[0], projects[2]];
            dashList.innerHTML = myProjects.map(p => createCardHTML(p, false)).join('');
        }
    }


    /* =========================================
       6. SHOWCASE & APPLICATION LOGIC
       ========================================= */

    /**
     * Generates HTML for project cards.
     * Adapts button states based on dashboard context and application status.
     * @param {Object} project - The project data object.
     * @param {boolean} isDashboard - Context flag.
     * @returns {string} HTML string.
     */
    function createCardHTML(project, isDashboard = false) {
        let btnHTML = `<button class="apply-btn" onclick="window.viewProject(${project.id})">Apply Now</button>`;

        // Condition: User already applied (disable button)
        if (state.applications.includes(project.id) && !isDashboard) {
            btnHTML = `<button class="apply-btn" style="background-color: #2e8b57;" disabled>Applied</button>`;
        } else if (isDashboard && state.currentUser.role === 'student') {
            // Dashboard view for students shows status
            btnHTML = `<button class="apply-btn" style="background-color: var(--color-slate);">Pending Status</button>`;
        } else if (isDashboard && state.currentUser.role === 'researcher') {
            // Dashboard view for researchers shows management options
            btnHTML = `<button class="apply-btn">Manage</button>`;
        }

        return `
            <div class="project-card" data-field="${project.field}">
                <span class="project-tag">${project.field}</span>
                <h3>${project.title}</h3>
                <div class="project-researcher">
                    <ion-icon name="person-circle-outline"></ion-icon>
                    ${project.researcher}
                </div>
                <p class="project-description">${project.description}</p>
                ${btnHTML}
            </div>
        `;
    }

    function renderProjects(list) {
        if (projectsGrid) {
            projectsGrid.innerHTML = list.map(p => createCardHTML(p)).join('');
        }
    }

    // Expose global function for inline onclick handlers in generated HTML
    window.viewProject = function (id) {
        const project = projects.find(p => p.id === id);
        if (!project) return;

        currentProjectId = id;

        // Populate Modal Details
        detailTitle.innerText = project.title;
        detailTag.innerText = project.field;
        detailResearcher.innerText = project.researcher;
        detailDescription.innerText = project.description;

        detailRequirements.innerHTML = project.requirements
            ? project.requirements.map(r => `<li>${r}</li>`).join('')
            : '<li>General Research Enthusiasm</li>';

        openGenericModal(projectDetailModal);
    };


    /* =========================================
       7. FILTER LOGIC
       ========================================= */

    // Real-time filtering for search text and categories
    function filterProjects() {
        const term = searchInput.value.toLowerCase();
        const cat = categoryFilter.value;

        const filtered = projects.filter(p => {
            const matchSearch = p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);
            const matchCat = cat === 'All' || p.field === cat;
            return matchSearch && matchCat;
        });

        renderProjects(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', filterProjects);
    if (categoryFilter) categoryFilter.addEventListener('change', filterProjects);


    /* =========================================
       8. MODAL & TOAST SYSTEM
       ========================================= */

    function openGenericModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeGenericModal() {
        projectDetailModal.classList.remove('active');
        postProjectModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeGenericModal);
    });

    // Close modal on outside click (Overlay click)
    [projectDetailModal, postProjectModal].forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) closeGenericModal();
        });
    });

    // Handle Application Logic
    if (confirmAppBtn) {
        confirmAppBtn.addEventListener('click', () => {
            // Guard: Must be logged in
            if (!state.currentUser) {
                closeGenericModal();
                showToast('Please login to apply!', true);
                navigateTo('auth');
                return;
            }

            if (!state.applications.includes(currentProjectId)) {
                // Success: Add ID to applications list
                state.applications.push(currentProjectId);
                localStorage.setItem('researchRoverApps', JSON.stringify(state.applications)); // Persist

                showToast('Application Sent Successfully!');
                closeGenericModal();

                // Re-render to update UI button states
                if (state.view === 'home') filterProjects();
            } else {
                showToast('You have already applied.');
                closeGenericModal();
            }
        });
    }

    // Mock Post Project
    const postForm = document.getElementById('post-project-form');
    if (postForm) {
        postForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Project Posted Successfully!');
            closeGenericModal();
            postForm.reset();
        });
    }

    /**
     * Display a temporary toast message to the user.
     * @param {string} msg - Message to display.
     */
    function showToast(msg) {
        toastMessage.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }


    /* =========================================
       9. INITIALIZATION
       ========================================= */

    function init() {
        // 1. Check for persisted session
        const savedUser = localStorage.getItem('researchRoverUser');
        const savedApps = localStorage.getItem('researchRoverApps');

        if (savedUser) {
            state.currentUser = JSON.parse(savedUser);
            if (savedApps) state.applications = JSON.parse(savedApps);
            updateNavigation();
        }

        // 2. Initial Render
        renderProjects(projects);

        // 3. Setup Animations
        setupCounters();

        // 4. Default View
        // If user is logged in, we stay on Home, but they can go to Dashboard.
        // If they were deep-linked, we might handle that here, but for now default to Home.
    }

    function setupCounters() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const updateCount = () => {
                const count = +counter.innerText;
                const inc = target / 200;
                if (count < target) {
                    counter.innerText = Math.ceil(count + inc);
                    setTimeout(updateCount, 1);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    }

    init(); // Run startup logic

});
