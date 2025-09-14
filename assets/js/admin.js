document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Guard ---
    auth.onAuthStateChanged(user => {
        if (user) {
            db.ref('users/' + user.uid).once('value').then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.role === 'admin') {
                    initializeAdminPanel(userData);
                } else {
                    alert("Access Denied. You do not have administrator privileges.");
                    window.location.href = 'login.html';
                }
            }).catch(err => {
                console.error("Auth Guard Error:", err);
                window.location.href = 'login.html';
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    // --- DOM Elements ---
    const userNameDisplay = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    const alertMessage = document.getElementById('alert-message');

    // Forms
    const addCourseForm = document.getElementById('add-course-form');
    const addInstructorForm = document.getElementById('add-instructor-form');
    const addEventForm = document.getElementById('add-event-form');

    // Tables
    const coursesTbody = document.querySelector('#courses-table tbody');
    const instructorsTbody = document.querySelector('#instructors-table tbody');
    const eventsTbody = document.querySelector('#events-table tbody');
    const usersTbody = document.querySelector('#users-table tbody');
    
    // Search Inputs
    const courseSearch = document.getElementById('course-search');
    const instructorSearch = document.getElementById('instructor-search');
    const eventSearch = document.getElementById('event-search');
    const userSearch = document.getElementById('user-search');
    
    // --- Utility Functions ---
    const showAlert = (message, isSuccess = true) => {
        alertMessage.textContent = message;
        alertMessage.className = `alert-message ${isSuccess ? 'success' : 'error'}`;
        alertMessage.style.display = 'block';
        setTimeout(() => { alertMessage.style.display = 'none'; }, 3000);
    };

    const initializeAdminPanel = (adminData) => {
        if (userNameDisplay) {
            userNameDisplay.textContent = `Welcome, ${adminData.name || 'Admin'}`;
        }
        loadCourses();
        loadInstructors();
        loadEvents();
        loadUsers();
    };

    // --- Firebase Data References ---
    const coursesRef = db.ref('courses');
    const instructorsRef = db.ref('instructors');
    const eventsRef = db.ref('events');
    const usersRef = db.ref('users');

    // --- "CREATE" Functionality ---
    addCourseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newCourse = {
            title: document.getElementById('course-title').value,
            category: document.getElementById('course-category').value,
            duration: document.getElementById('course-duration').value,
            mode: document.getElementById('course-mode').value,
            imageUrl: document.getElementById('course-image-url').value
        };
        coursesRef.push(newCourse)
            .then(() => {
                showAlert('Course added successfully!');
                addCourseForm.reset();
            })
            .catch(err => showAlert('Error adding course: ' + err.message, false));
    });

    addInstructorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newInstructor = {
            name: document.getElementById('instructor-name').value,
            expertise: document.getElementById('instructor-expertise').value,
            imageUrl: document.getElementById('instructor-image-url').value
        };
        instructorsRef.push(newInstructor)
            .then(() => {
                showAlert('Instructor added successfully!');
                addInstructorForm.reset();
            })
            .catch(err => showAlert('Error adding instructor: ' + err.message, false));
    });

    addEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEvent = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            description: document.getElementById('event-description').value
        };
        eventsRef.push(newEvent)
            .then(() => {
                showAlert('Event added successfully!');
                addEventForm.reset();
            })
            .catch(err => showAlert('Error adding event: ' + err.message, false));
    });

    // --- "READ" & Display Functionality ---
    const loadCourses = () => {
        coursesRef.on('value', snapshot => {
            coursesTbody.innerHTML = '';
            snapshot.forEach(childSnapshot => {
                const key = childSnapshot.key;
                const data = childSnapshot.val();
                const row = `<tr>
                    <td>${data.title}</td>
                    <td>${data.category}</td>
                    <td>${data.duration}</td>
                    <td><button class="btn-delete" data-id="${key}" data-type="courses">Delete</button></td>
                </tr>`;
                coursesTbody.innerHTML += row;
            });
        });
    };

    const loadInstructors = () => {
        instructorsRef.on('value', snapshot => {
            instructorsTbody.innerHTML = '';
            snapshot.forEach(childSnapshot => {
                const key = childSnapshot.key;
                const data = childSnapshot.val();
                const row = `<tr>
                    <td>${data.name}</td>
                    <td>${data.expertise}</td>
                    <td><button class="btn-delete" data-id="${key}" data-type="instructors">Delete</button></td>
                </tr>`;
                instructorsTbody.innerHTML += row;
            });
        });
    };
    
    const loadEvents = () => {
        eventsRef.orderByChild('date').on('value', snapshot => {
            eventsTbody.innerHTML = '';
            snapshot.forEach(childSnapshot => {
                const key = childSnapshot.key;
                const data = childSnapshot.val();
                const row = `<tr>
                    <td>${data.date}</td>
                    <td>${data.title}</td>
                    <td>${data.description}</td>
                    <td><button class="btn-delete" data-id="${key}" data-type="events">Delete</button></td>
                </tr>`;
                eventsTbody.innerHTML += row;
            });
        });
    };

    const loadUsers = () => {
        usersRef.on('value', snapshot => {
            usersTbody.innerHTML = '';
            snapshot.forEach(childSnapshot => {
                const key = childSnapshot.key;
                const data = childSnapshot.val();
                // Prevent admin from deleting themselves
                const currentUser = auth.currentUser;
                const deleteButton = (currentUser && currentUser.uid === key) 
                    ? `<button class="btn-delete" disabled>Cannot Delete Self</button>`
                    : `<button class="btn-delete" data-id="${key}" data-type="users">Delete</button>`;
                
                const row = `<tr>
                    <td>${data.name || 'N/A'}</td>
                    <td>${data.email}</td>
                    <td>${data.role}</td>
                    <td>${deleteButton}</td>
                </tr>`;
                usersTbody.innerHTML += row;
            });
        });
    };

    // --- "DELETE" Functionality (Event delegation) ---
    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-delete')) {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;

            if (!id || !type) return;

            if (confirm(`Are you sure you want to delete this ${type.slice(0, -1)}? This action cannot be undone.`)) {
                db.ref(`${type}/${id}`).remove()
                    .then(() => showAlert(`${type.slice(0, -1)} deleted successfully!`))
                    .catch(err => showAlert(`Error deleting: ${err.message}`, false));
            }
        }
    });

    // --- SEARCH Functionality ---
    const filterTable = (searchInput, table) => {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            if (rowText.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };

    courseSearch.addEventListener('keyup', () => filterTable(courseSearch, document.getElementById('courses-table')));
    instructorSearch.addEventListener('keyup', () => filterTable(instructorSearch, document.getElementById('instructors-table')));
    eventSearch.addEventListener('keyup', () => filterTable(eventSearch, document.getElementById('events-table')));
    userSearch.addEventListener('keyup', () => filterTable(userSearch, document.getElementById('users-table')));

    // --- Logout ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
    }
});