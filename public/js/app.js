document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let attendees = [];
    let events = [];
    let selectedDate = new Date();
    let selectedVenue = null;

    // Sample Venues Data (Replace this with your actual venues)
    const sampleVenues = [
        {
            id: 1,
            name: "Grand Ballroom",
            image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3",
            rating: 4.8,
            price: 3,
            category: "Luxury Venue",
            capacity: "500 guests",
            address: "123 Main Street, City Center",
            description: "Elegant ballroom with crystal chandeliers and marble floors"
        },
        {
            id: 2,
            name: "Garden Paradise",
            image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3",
            rating: 4.6,
            price: 2,
            category: "Outdoor Venue",
            capacity: "300 guests",
            address: "456 Park Avenue, Green District",
            description: "Beautiful outdoor venue with landscaped gardens"
        },
        {
            id: 3,
            name: "Urban Loft",
            image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af",
            rating: 4.5,
            price: 2,
            category: "Modern Venue",
            capacity: "150 guests",
            address: "789 Industrial Ave, Downtown",
            description: "Modern industrial space with exposed brick walls"
        },
        {
            id: 4,
            name: "Seaside Resort",
            image: "https://images.unsplash.com/photo-1439539698758-ba2680ecadb9",
            rating: 4.9,
            price: 3,
            category: "Beach Venue",
            capacity: "400 guests",
            address: "321 Coast Road, Beachfront",
            description: "Stunning beachfront location with ocean views"
        }
    ];

    // DOM Elements
    const modal = document.getElementById('event-modal');
    const newEventBtn = document.getElementById('new-event-btn');
    const closeModal = document.querySelector('.close-modal');
    const eventForm = document.getElementById('event-form');

    // Initialize Venues
    function initializeVenues() {
        const venueResults = document.getElementById('venue-results');
        venueResults.innerHTML = sampleVenues.map(venue => `
            <div class="venue-card">
                <img src="${venue.image}" alt="${venue.name}">
                <div class="venue-info">
                    <h3>${venue.name}</h3>
                    <div class="venue-details">
                        <span class="rating">
                            <i class="fas fa-star"></i> ${venue.rating}
                        </span>
                        <span class="price">
                            ${'$'.repeat(venue.price)}
                        </span>
                        <span class="capacity">
                            <i class="fas fa-users"></i> ${venue.capacity}
                        </span>
                    </div>
                    <div class="venue-category">
                        <i class="fas fa-tag"></i> ${venue.category}
                    </div>
                    <div class="venue-address">
                        <i class="fas fa-map-marker-alt"></i> ${venue.address}
                    </div>
                    <p class="venue-description">${venue.description}</p>
                    <button class="select-venue-btn" onclick="selectVenue(${venue.id})">
                        <i class="fas fa-check"></i> Select Venue
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Calendar Functions
    function createDayElement(day) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        if (day === '') {
            div.className += ' empty';
        } else {
            div.innerHTML = `<span>${day}</span>`;
        }
        return div;
    }

    function isToday(day) {
        const today = new Date();
        return day === today.getDate() && 
               selectedDate.getMonth() === today.getMonth() && 
               selectedDate.getFullYear() === today.getFullYear();
    }

    function updateCalendar() {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        // Update header
        const calendarHeader = document.querySelector('.calendar-header h3');
        calendarHeader.textContent = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

        // Calculate calendar days
        const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // Clear and rebuild calendar grid
        const calendarGrid = document.querySelector('.calendar-grid');
        calendarGrid.innerHTML = '';

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            calendarGrid.appendChild(createDayElement(''));
        }

        // Add cells for each day of the month
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = createDayElement(day);
            
            // Check for events on this day
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getDate() === day && 
                       eventDate.getMonth() === selectedDate.getMonth() && 
                       eventDate.getFullYear() === selectedDate.getFullYear();
            });

            if (dayEvents.length > 0) {
                dayElement.classList.add('has-event');
                const eventDot = document.createElement('div');
                eventDot.className = 'event-dot';
                dayElement.appendChild(eventDot);
            }

            if (isToday(day)) {
                dayElement.classList.add('today');
            }

            // Add click event to show events
            dayElement.addEventListener('click', () => showEventsForDay(day));
            calendarGrid.appendChild(dayElement);
        }
    }
    function showEventsForDay(day) {
        // Remove any existing popup
        const existingPopup = document.querySelector('.events-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day && 
                   eventDate.getMonth() === selectedDate.getMonth() && 
                   eventDate.getFullYear() === selectedDate.getFullYear();
        });

        const popup = document.createElement('div');
        popup.className = 'events-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <h3>${day} ${selectedDate.toLocaleString('default', { month: 'long' })}</h3>
                <button class="close-popup"><i class="fas fa-times"></i></button>
            </div>
            <div class="popup-content">
                ${dayEvents.length ? dayEvents.map(event => `
                    <div class="event-item">
                        <h4>${event.title}</h4>
                        <p><i class="far fa-clock"></i> ${event.time}</p>
                        ${event.venue ? `<p><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>` : ''}
                        <p>${event.description}</p>
                        <button class="remove-event" data-id="${event.id}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                `).join('') : '<p class="no-events">No events scheduled</p>'}
            </div>
        `;

        document.querySelector('.calendar-container').appendChild(popup);

        // Add event listeners for popup buttons
        popup.querySelector('.close-popup').addEventListener('click', () => popup.remove());
        popup.querySelectorAll('.remove-event').forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = e.target.dataset.id;
                removeEvent(eventId);
                popup.remove();
                updateCalendar();
                showNotification('Event removed successfully', 'success');
            });
        });
    }

    // Venue Selection
    window.selectVenue = function(venueId) {
        const venue = sampleVenues.find(v => v.id === venueId);
        if (venue) {
            selectedVenue = venue;
            document.getElementById('event-venue').value = venue.name;
            showNotification(`Selected venue: ${venue.name}`, 'success');
            modal.style.display = 'block';
        }
    };

    // Event Form Handling
    function showModal() {
        modal.style.display = 'block';
        document.getElementById('event-date').valueAsDate = new Date();
    }

    function hideModal() {
        modal.style.display = 'none';
        eventForm.reset();
        selectedVenue = null;
    }

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEvent = {
            id: Date.now().toString(),
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            description: document.getElementById('event-description').value,
            venue: selectedVenue ? selectedVenue.name : null
        };

        events.push(newEvent);
        updateCalendar();
        hideModal();
        showNotification('Event created successfully!', 'success');
        
        // Save to localStorage
        localStorage.setItem('events', JSON.stringify(events));
    });

    // Attendee Management
    document.getElementById('add-attendee').addEventListener('click', () => {
        const emailInput = document.getElementById('attendee-email');
        const email = emailInput.value.trim();
        
        if (email && isValidEmail(email)) {
            if (attendees.includes(email)) {
                showNotification('This email is already in the list!', 'error');
                return;
            }
            
            attendees.push(email);
            updateAttendeeList();
            emailInput.value = '';
            showNotification('Attendee added successfully!', 'success');
            
            // Save to localStorage
            localStorage.setItem('attendees', JSON.stringify(attendees));
        } else {
            showNotification('Please enter a valid email address!', 'error');
        }
    });

    function updateAttendeeList() {
        const list = document.getElementById('attendee-list');
        list.innerHTML = attendees.map(email => `
            <li class="attendee-item">
                <div class="attendee-info">
                    <i class="fas fa-user-circle"></i>
                    <span>${email}</span>
                </div>
                <button class="remove-btn" data-email="${email}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </li>
        `).join('');

        // Add event listeners to remove buttons
        list.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const email = e.target.closest('.remove-btn').dataset.email;
                removeAttendee(email);
            });
        });
    }

    function removeAttendee(email) {
        attendees = attendees.filter(e => e !== email);
        updateAttendeeList();
        showNotification('Attendee removed successfully', 'success');
        localStorage.setItem('attendees', JSON.stringify(attendees));
    }

    function removeEvent(eventId) {
        events = events.filter(event => event.id !== eventId);
        localStorage.setItem('events', JSON.stringify(events));
    }

    // Utility Functions
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Load saved data from localStorage
    function loadSavedData() {
        const savedEvents = localStorage.getItem('events');
        const savedAttendees = localStorage.getItem('attendees');

        if (savedEvents) {
            events = JSON.parse(savedEvents);
        }

        if (savedAttendees) {
            attendees = JSON.parse(savedAttendees);
            updateAttendeeList();
        }
    }

    // Event Listeners
    newEventBtn.addEventListener('click', showModal);
    closeModal.addEventListener('click', hideModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    document.getElementById('prev-month').addEventListener('click', () => {
        selectedDate.setMonth(selectedDate.getMonth() - 1);
        updateCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        selectedDate.setMonth(selectedDate.getMonth() + 1);
        updateCalendar();
    });

    // Initialize
    loadSavedData();
    updateCalendar();
    initializeVenues();
});