document.addEventListener('DOMContentLoaded', () => {
    const courseList = document.getElementById('course-list');
    if (!courseList) return; // Exit if the element doesn't exist

    const coursesRef = db.ref('courses');
    
    // Set up Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Optional: stop observing after it's visible
            }
        });
    }, { threshold: 0.1 });

    const loader = document.getElementById('loader-wrapper');
    if(loader) loader.style.display = 'flex'; // Show loader while fetching

    coursesRef.on('value', (snapshot) => {
        courseList.innerHTML = ''; // Clear the "Loading..." message
        if (snapshot.exists()) {
            const coursesData = snapshot.val();
            for (const courseId in coursesData) {
                const course = coursesData[courseId];
                const card = document.createElement('div');
                card.className = 'course-card animate-on-scroll';
                
                // Use a placeholder if the image URL is missing
                const imageUrl = course.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto-format&fit=crop';
                card.style.backgroundImage = `url('${imageUrl}')`;
                
                card.innerHTML = `
                    <div class="card-overlay"></div>
                    <div class="course-content">
                        <span class="category-tag">${course.category || 'General'}</span>
                        <h3>${course.title || 'Untitled Course'}</h3>
                        <div class="course-details">
                            <span><i class="bi bi-clock"></i> ${course.duration || 'N/A'}</span>
                            <span><i class="bi bi-laptop"></i> ${course.mode || 'N/A'}</span>
                        </div>
                    </div>
                `;
                courseList.appendChild(card);
                observer.observe(card); // Observe the new card for animation
            }
        } else {
            courseList.innerHTML = '<p>No courses are available at the moment. Please check back later.</p>';
        }
        if(loader) loader.style.display = 'none'; // Hide loader after fetching
    }, (error) => {
        console.error("Firebase Read Error:", error);
        courseList.innerHTML = '<p>Could not load courses due to a database error.</p>';
        if(loader) loader.style.display = 'none'; // Hide loader on error
    });
});