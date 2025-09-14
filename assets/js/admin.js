document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Guard ---
    // This function runs first to protect the page
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is logged in, now check their role in the database
            db.ref('users/' + user.uid).once('value', snapshot => {
                const userData = snapshot.val();
                // Check if user exists and has the 'admin' role
                if (userData && userData.role === 'admin') {
                    initializeAdminPanel(userData);
                } else {
                    // If not an admin, show an alert and redirect
                    alert("Access Denied. You do not have administrator privileges.");
                    auth.signOut();
                    window.location.href = 'login.html';
                }
            }).catch(err => {
                // Handle potential database errors during role check
                console.error("Auth Guard Firebase Error:", err);
                alert("Could not verify your role due to a database error.");
                auth.signOut();
                window.location.href = 'login.html';
            });
        } else {
            // If no user is logged in, redirect to the login page
            window.location.href = 'login.html';
        }
    });

    // --- Global State Variables ---
    // These hold all course and instructor data for quick access without re-fetching
    let allCourses = {};
    let allInstructors = {};
    let currentInstructorId = null; // Tracks which instructor is being edited in the modal

    // --- DOM Element References ---
    const userNameDisplay = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    const alertMessage = document.getElementById('alert-message');
    
    // Forms & Form Elements
    const addCourseForm = document.getElementById('add-course-form');
    const editCourseId = document.getElementById('edit-course-id');
    const submitCourseBtn = document.getElementById('submit-course-btn');
    const cancelCourseEditBtn = document.getElementById('cancel-course-edit-btn');
    const courseFormTitle = document.getElementById('course-form-title');

    const addEventForm = document.getElementById('add-event-form');
    const editEventId = document.getElementById('edit-event-id');
    const submitEventBtn = document.getElementById('submit-event-btn');
    const cancelEventEditBtn = document.getElementById('cancel-event-edit-btn');
    const eventFormTitle = document.getElementById('event-form-title');

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

    // Modal Elements
    const assignmentModal = document.getElementById('assignment-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalInstructorName = document.getElementById('modal-instructor-name');
    const assignedCoursesList = document.getElementById('assigned-courses-list');
    const unassignedCoursesSelect = document.getElementById('unassigned-courses-select');
    const assignCourseBtn = document.getElementById('assign-course-btn');
    
    // --- Utility Functions ---
    const showAlert = (message, isSuccess = true) => {
        alertMessage.textContent = message;
        alertMessage.className = `alert-message ${isSuccess ? 'success' : 'error'}`;
        alertMessage.style.display = 'block';
        setTimeout(() => { alertMessage.style.display = 'none'; }, 3000);
    };

    // --- Initialization ---
    const initializeAdminPanel = (adminData) => {
        if (userNameDisplay) {
            userNameDisplay.textContent = `Welcome, ${adminData.name || 'Admin'}`;
        }
        loadAllCourses();
        loadAllInstructors();
        loadEvents();
        loadUsers();
    };

    // --- Firebase Data References ---
    const coursesRef = db.ref('courses');
    const instructorsRef = db.ref('instructors');
    const eventsRef = db.ref('events');
    const usersRef = db.ref('users');

    // --- CREATE & UPDATE Functionality ---
    addCourseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const courseData = {
            title: document.getElementById('course-title').value,
            category: document.getElementById('course-category').value,
            duration: document.getElementById('course-duration').value,
            mode: document.getElementById('course-mode').value,
            imageUrl: document.getElementById('course-image-url').value
        };

        const key = editCourseId.value;
        if (key) { // Update existing course
            coursesRef.child(key).update(courseData)
                .then(() => {
                    showAlert('Course updated successfully!');
                    resetCourseForm();
                })
                .catch(err => showAlert('Error updating course: ' + err.message, false));
        } else { // Add new course
            coursesRef.push(courseData)
                .then(() => {
                    showAlert('Course added successfully!');
                    addCourseForm.reset();
                })
                .catch(err => showAlert('Error adding course: ' + err.message, false));
        }
    });

    addEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const eventData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            description: document.getElementById('event-description').value
        };
        const key = editEventId.value;
        if (key) { // Update
            eventsRef.child(key).update(eventData)
                .then(() => {
                    showAlert('Event updated successfully!');
                    resetEventForm();
                })
                .catch(err => showAlert('Error updating event: ' + err.message, false));
        } else { // Add new
            eventsRef.push(eventData)
                .then(() => {
                    showAlert('Event added successfully!');
                    addEventForm.reset();
                })
                .catch(err => showAlert('Error adding event: ' + err.message, false));
        }
    });

    // --- "READ" & Display Functionality ---
    const loadAllCourses = () => {
        coursesRef.on('value', snapshot => {
            allCourses = snapshot.val() || {};
            coursesTbody.innerHTML = '';
            snapshot.forEach(childSnapshot => {
                const key = childSnapshot.key;
                const data = childSnapshot.val();
                const row = `<tr>
                    <td>${data.title}</td>
                    <td>${data.category}</td>
                    <td>${data.duration}</td>
                    <td>
                        <button class="btn-edit" data-id="${key}" data-type="courses">Edit</button>
                        <button class="btn-delete" data-id="${key}" data-type="courses">Delete</button>
                    </td>
                </tr>`;
                coursesTbody.innerHTML += row;
            });
        });
    };
    
    const loadAllInstructors = () => {
        instructorsRef.on('value', snapshot => {
            allInstructors = snapshot.val() || {};
            displayInstructors();
            loadUsers(); // Refresh users table to update promote buttons
        });
    };

    const displayInstructors = () => {
        instructorsTbody.innerHTML = '';
        for (const key in allInstructors) {
            const data = allInstructors[key];
            const row = `<tr>
                <td>${data.name}</td>
                <td>${data.expertise}</td>
                <td>
                    <button class="btn-assign" data-id="${key}" data-name="${data.name}">Assign</button>
                    <button class="btn-delete" data-id="${key}" data-type="instructors">Delete</button>
                </td>
            </tr>`;
            instructorsTbody.innerHTML += row;
        }
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
                    <td>
                        <button class="btn-edit" data-id="${key}" data-type="events">Edit</button>
                        <button class="btn-delete" data-id="${key}" data-type="events">Delete</button>
                    </td>
                </tr>`;
                eventsTbody.innerHTML += row;
            });
        });
    };

    const loadUsers = () => {
        usersRef.on('value', snapshot => {
            usersTbody.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const uid = childSnapshot.key;
                    const data = childSnapshot.val();
                    const currentUser = auth.currentUser;
                    
                    let actions = `<button class="btn-delete" data-id="${uid}" data-type="users">Delete</button>`;
                    
                    if (data.role === 'instructor') {
                        const profileExists = Object.values(allInstructors).some(inst => inst.uid === uid);
                        if (!profileExists) {
                            actions += ` <button class="btn-promote" data-id="${uid}" data-name="${data.name}">Promote</button>`;
                        }
                    }

                    if (currentUser && currentUser.uid === uid) {
                        actions = `<button class="btn-delete" disabled>Cannot Delete Self</button>`;
                    }
                    
                    const row = `<tr>
                        <td>${data.name || 'N/A'}</td>
                        <td>${data.email}</td>
                        <td>${data.role}</td>
                        <td>${actions}</td>
                    </tr>`;
                    usersTbody.innerHTML += row;
                });
            } else {
                usersTbody.innerHTML = '<tr><td colspan="4">No users found.</td></tr>';
            }
        });
    };
    
    const handlePromoteToInstructor = (uid, name) => {
        if (!uid || !name) return;
        
        const newInstructorProfile = {
            uid: uid,
            name: name,
            expertise: "To be updated",
            imageUrl: `https://placehold.co/400x400/005A9E/FFFFFF?text=${name.charAt(0)}`,
            courseIds: {}
        };

        instructorsRef.push(newInstructorProfile)
            .then(() => {
                showAlert(`${name} has been promoted to a public instructor!`);
            })
            .catch(err => showAlert('Error promoting user: ' + err.message, false));
    };

    // --- Event Delegation for Buttons ---
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.btn-edit')) {
            handleEdit(target.dataset.id, target.dataset.type);
        } else if (target.matches('.btn-promote')) {
            handlePromoteToInstructor(target.dataset.id, target.dataset.name);
        } else if (target.matches('.btn-assign')) {
            openAssignmentModal(target.dataset.id, target.dataset.name);
        } else if (target.matches('.btn-unassign')) {
            handleUnassignCourse(target.dataset.courseId);
        } else if (target.matches('.btn-delete')) {
            const id = target.dataset.id;
            const type = target.dataset.type;
            if (confirm(`Are you sure you want to delete this ${type.slice(0, -1)}? This cannot be undone.`)) {
                db.ref(`${type}/${id}`).remove()
                    .then(() => showAlert(`${type.slice(0, -1)} deleted successfully!`))
                    .catch(err => showAlert(`Error deleting: ${err.message}`, false));
            }
        }
    });

    // --- EDIT & Form Reset Logic ---
    const handleEdit = (id, type) => {
        if (type === 'courses') {
            const course = allCourses[id];
            if (course) {
                editCourseId.value = id;
                document.getElementById('course-title').value = course.title;
                document.getElementById('course-category').value = course.category;
                document.getElementById('course-duration').value = course.duration;
                document.getElementById('course-mode').value = course.mode;
                document.getElementById('course-image-url').value = course.imageUrl;
                submitCourseBtn.textContent = 'Update Course';
                cancelCourseEditBtn.style.display = 'inline-block';
                courseFormTitle.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (type === 'events') {
            eventsRef.child(id).once('value', snapshot => {
                const event = snapshot.val();
                if (event) {
                    editEventId.value = id;
                    document.getElementById('event-title').value = event.title;
                    document.getElementById('event-date').value = event.date;
                    document.getElementById('event-description').value = event.description;
                    submitEventBtn.textContent = 'Update Event';
                    cancelEventEditBtn.style.display = 'inline-block';
                    eventFormTitle.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    };

    const resetCourseForm = () => {
        addCourseForm.reset();
        editCourseId.value = '';
        submitCourseBtn.textContent = 'Add Course';
        cancelCourseEditBtn.style.display = 'none';
    };

    const resetEventForm = () => {
        addEventForm.reset();
        editEventId.value = '';
        submitEventBtn.textContent = 'Add Event';
        cancelEventEditBtn.style.display = 'none';
    };

    cancelCourseEditBtn.addEventListener('click', resetCourseForm);
    cancelEventEditBtn.addEventListener('click', resetEventForm);

    // --- Course Assignment Modal Logic ---
    const openAssignmentModal = (instructorId, instructorName) => {
        currentInstructorId = instructorId;
        modalInstructorName.textContent = `Assign Courses to ${instructorName}`;
        assignedCoursesList.innerHTML = '';
        unassignedCoursesSelect.innerHTML = '<option value="">Select an available course...</option>';
        let hasAssignedCourses = false;

        db.ref('instructors/' + instructorId + '/courseIds').once('value', assignedSnapshot => {
            const assignedCourseIds = assignedSnapshot.val() || {};
            
            for (const courseId in allCourses) {
                const course = allCourses[courseId];
                if (assignedCourseIds[courseId]) {
                    hasAssignedCourses = true;
                    const assignedItem = document.createElement('div');
                    assignedItem.className = 'assigned-course-item';
                    assignedItem.innerHTML = `<span>${course.title}</span><button class="btn-unassign" data-course-id="${courseId}">&times;</button>`;
                    assignedCoursesList.appendChild(assignedItem);
                } else if (!course.instructorId) {
                    const option = document.createElement('option');
                    option.value = courseId;
                    option.textContent = course.title;
                    unassignedCoursesSelect.appendChild(option);
                }
            }
            if (!hasAssignedCourses) {
                assignedCoursesList.innerHTML = '<p>No courses assigned yet.</p>';
            }
            assignmentModal.classList.add('show');
        });
    };

    const closeAssignmentModal = () => {
        assignmentModal.classList.remove('show');
        currentInstructorId = null;
    };

    const handleAssignCourse = () => {
        const courseId = unassignedCoursesSelect.value;
        if (!courseId || !currentInstructorId) return;
        const updates = {};
        updates[`/courses/${courseId}/instructorId`] = currentInstructorId;
        updates[`/instructors/${currentInstructorId}/courseIds/${courseId}`] = true;
        db.ref().update(updates)
            .then(() => {
                showAlert('Course assigned successfully!');
                const instructorName = modalInstructorName.textContent.replace('Assign Courses to ', '');
                openAssignmentModal(currentInstructorId, instructorName);
            })
            .catch(err => showAlert('Assignment failed: ' + err.message, false));
    };

    const handleUnassignCourse = (courseId) => {
        if (!courseId || !currentInstructorId) return;
        const updates = {};
        updates[`/courses/${courseId}/instructorId`] = null;
        updates[`/instructors/${currentInstructorId}/courseIds/${courseId}`] = null;
        db.ref().update(updates)
            .then(() => {
                showAlert('Course unassigned successfully!');
                const instructorName = modalInstructorName.textContent.replace('Assign Courses to ', '');
                openAssignmentModal(currentInstructorId, instructorName);
            })
            .catch(err => showAlert('Unassignment failed: ' + err.message, false));
    };

    modalCloseBtn.addEventListener('click', closeAssignmentModal);
    assignCourseBtn.addEventListener('click', handleAssignCourse);
    window.addEventListener('click', (e) => {
        if (e.target === assignmentModal) closeAssignmentModal();
    });

    // --- SEARCH Functionality ---
    const filterTable = (searchInput, table) => {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(searchTerm) ? '' : 'none';
        });
    };

    courseSearch.addEventListener('keyup', () => filterTable(courseSearch, document.getElementById('courses-table')));
    instructorSearch.addEventListener('keyup', () => filterTable(instructorSearch, document.getElementById('instructors-table')));
    eventSearch.addEventListener('keyup', () => filterTable(eventSearch, document.getElementById('events-table')));
    userSearch.addEventListener('keyup', () => filterTable(userSearch, document.getElementById('users-table')));

    // --- Logout ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => { window.location.href = 'index.html'; });
        });
    }
});

