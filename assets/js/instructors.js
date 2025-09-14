document.addEventListener('DOMContentLoaded', () => {
    const instructorGrid = document.getElementById('instructor-grid');
    const loader = document.getElementById('loader-wrapper');
    if (!instructorGrid) return;

    // ** FIX: Show loader before fetching data **
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }

    const instructorsRef = db.ref('instructors');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    instructorsRef.on('value', (snapshot) => {
        instructorGrid.innerHTML = '';
        if (snapshot.exists()) {
            const instructorsData = snapshot.val();
            for (const id in instructorsData) {
                const instructor = instructorsData[id];
                const card = document.createElement('div');
                card.className = 'instructor-card animate-on-scroll';
                card.innerHTML = `
                    <img src="${instructor.imageUrl || 'https://images.unsplash.com/photo-1580894742597-87bc8789db3d?q=80&w=2070&auto=format&fit=crop'}" alt="${instructor.name}">
                    <div class="instructor-info">
                        <h3>${instructor.name}</h3>
                        <span>${instructor.expertise}</span>
                    </div>
                `;
                instructorGrid.appendChild(card);
                observer.observe(card);
            }
        } else {
            instructorGrid.innerHTML = '<p>No instructors found.</p>';
        }

        // ** FIX: Hide loader after data is fetched and displayed **
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    }, (error) => {
        console.error("Firebase Read Error:", error);
        instructorGrid.innerHTML = '<p>Could not load instructors due to a database error.</p>';
        // ** FIX: Hide loader even if there is an error **
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    });
});