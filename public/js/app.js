document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let attendees = [];
    let events = [];
    let selectedDate = new Date();
    let selectedVenue = null;

    // DOM Elements
    const modal = document.getElementById('event-modal');
    const newEventBtn = document.getElementById('new-event-btn');
    const closeModal = document.querySelector('.close-modal');
    const eventForm = document.getElementById('event-form');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const sectionTitle = document.getElementById('section-title');

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show correct section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `${targetSection}-section`) {
                    section.classList.add('active');
                }
            });

            // Update header title
            updateSectionTitle(targetSection);

            // Load venues if venues section is activated
            if (targetSection === 'venues') {
                loadVenues();
            }
        });
    });

    function updateSectionTitle(section) {
        const titles = {
            calendar: 'Event Calendar',
            attendees: 'Attendee Management',
            venues: 'Available Venues'
        };
        sectionTitle.textContent = titles[section] || 'Event Planner';
    }

    // Venue Management
    async function loadVenues() {
        const venueResults = document.getElementById('venue-results');
        venueResults.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                Loading venues...
            </div>
        `;

        try {
            const response = await fetch('/.netlify/functions/venues');
            if (!response.ok) throw new Error('Failed to fetch venues');
            
            const venues = await response.json();
            displayVenues(venues);
        } catch (error) {
            console.error('Error loading venues:', error);
            venueResults.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    Failed to load venues. Please try again later.
                </div>
            `;
        }
    }

    function displayVenues(venues) {
        const venueResults = document.getElementById('venue-results');
        if (!venues.length) {
            venueResults.innerHTML = `
                <div class="no-venues">
                    <i class="fas fa-search"></i>
                    No venues found
                </div>
            `;
            return;
        }

        venueResults.innerHTML = venues.map(venue => `
            <div class="venue-card">
                ${venue.photos?.length ? 
                    `<img src="${venue.photos[0].prefix}original${venue.photos[0].suffix}" 
                         alt="${venue.name}">` : 
                    `<div class="no-image">
                        <i class="fas fa-image"></i>
                        <span>No Image Available</span>
                    </div>`
                }
                <div class="venue-info">
                    <h3>${venue.name}</h3>
                    <div class="venue-details">
                        ${venue.rating ? `
                            <span class="rating">
                                <i class="fas fa-star"></i> ${venue.rating}
                            </span>
                        ` : ''}
                        ${venue.price ? `
                            <span class="price">
                                ${'$'.repeat(venue.price)}
                            </span>
                        ` : ''}
                        ${venue.categories?.length ? `
                            <span class="category">
                                <i class="fas fa-tag"></i> ${venue.categories[0].name}
                            </span>
                        ` : ''}
                    </div>
                    ${venue.location ? `
                        <div class="venue-address">
                            <i class="fas fa-map-marker-alt"></i>
                            ${venue.location.formatted_address || venue.location.address}
                        </div>
                    ` : ''}
                    <button class="select-venue-btn" onclick="selectVenue('${venue.id}', '${venue.name}')">
                        <i class="fas fa-check"></i> Select Venue
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Make venue selection function globally available
    window.selectVenue = function(venueId, venueName) {
        selectedVenue = { id: venueId, name: venueName };
        document.getElementById('event-venue').value = venueName;
        modal.style.display = 'block';
        showNotification(`Selected venue: ${venueName}`, 'success');
    };
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
    
            const calendarHeader = document.querySelector('.calendar-header h3');
            calendarHeader.textContent = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    
            const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            const startingDay = firstDay.getDay();
            const totalDays = lastDay.getDate();
    
            const calendarGrid = document.querySelector('.calendar-grid');
            calendarGrid.innerHTML = '';
    
            // Add empty cells for days before the first day of the month
            for (let i = 0; i < startingDay; i++) {
                calendarGrid.appendChild(createDayElement(''));
            }
    
            // Add cells for each day of the month
            for (let day = 1; day <= totalDays; day++) {
                const dayElement = createDayElement(day);
                
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
                    eventDot.title = `${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}`;
                    dayElement.appendChild(eventDot);
                }
    
                if (isToday(day)) {
                    dayElement.classList.add('today');
                }
    
                dayElement.addEventListener('click', () => showEventsForDay(day));
                calendarGrid.appendChild(dayElement);
            }
        }
    
        function showEventsForDay(day) {
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
            
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
    
            popup.innerHTML = `
                <div class="popup-header">
                    <div class="date-badge">
                        <span class="day">${day}</span>
                        <span class="month">${monthNames[selectedDate.getMonth()]}</span>
                    </div>
                    <button class="close-popup"><i class="fas fa-times"></i></button>
                </div>
                <div class="events-list">
                    ${dayEvents.length ? dayEvents.map(event => `
                        <div class="event-item">
                            <div class="event-time">
                                <i class="far fa-clock"></i>
                                <span>${formatTime(event.time)}</span>
                            </div>
                            <div class="event-content">
                                <h4>${event.title}</h4>
                                ${event.venue ? `<p class="event-venue"><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>` : ''}
                                ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                            </div>
                            <button class="remove-event" data-id="${event.id}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `).join('') : '<p class="no-events">No events scheduled for this day</p>'}
                </div>
            `;
    
            document.querySelector('.calendar-container').appendChild(popup);
    
            // Add event listeners for popup buttons
            popup.querySelector('.close-popup').addEventListener('click', () => popup.remove());
            popup.querySelectorAll('.remove-event').forEach(button => {
                button.addEventListener('click', (e) => {
                    const eventId = e.target.closest('.remove-event').dataset.id;
                    removeEvent(eventId);
                    popup.remove();
                    updateCalendar();
                    showNotification('Event removed successfully', 'success');
                });
            });
        }
    
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
                venue: selectedVenue?.name || null,
                venueId: selectedVenue?.id || null,
                description: document.getElementById('event-description').value
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
    
        // Utility Functions
        function formatTime(time) {
            if (!time) return '';
            const [hours, minutes] = time.split(':');
            const period = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            return `${formattedHours}:${minutes} ${period}`;
        }
    
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
    
        function removeEvent(eventId) {
            events = events.filter(event => event.id !== eventId);
            localStorage.setItem('events', JSON.stringify(events));
        }
    
        function removeAttendee(email) {
            attendees = attendees.filter(e => e !== email);
            updateAttendeeList();
            showNotification('Attendee removed successfully', 'success');
            localStorage.setItem('attendees', JSON.stringify(attendees));
        }
    
        // Initialize
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
    
            updateCalendar();
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
    
        // Initialize the application
        loadSavedData();
        
        // Load venues on initial page load if venues section is active
        if (document.querySelector('#venues-section.active')) {
            loadVenues();
        }
    
        // Refresh venues button
        document.getElementById('refresh-venues')?.addEventListener('click', loadVenues);
    });