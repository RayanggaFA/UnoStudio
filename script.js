const SUPABASE_URL = 'https://gqkpcvcnuchbboslopcx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxa3BjdmNudWNoYmJvc2xvcGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NDIxNTcsImV4cCI6MjA3OTAxODE1N30.-FpNiOG1HFA0-0FsV20egh1KSafcaVu-dicJHVlJXJ0';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Handle email confirmation token
    const urlParams = new URLSearchParams(window.location.search);
    const tokenHash = urlParams.get('token_hash');
    const type = urlParams.get('type');
    
    if (tokenHash && type === 'signup') {
        try {
            const { error } = await supabaseClient.auth.verifyOtp({
                token_hash: tokenHash,
                type: 'signup'
            });
            
            if (error) throw error;
            
            alert('Email berhasil dikonfirmasi! Silakan login.');
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('Verification error:', error);
            alert('Gagal konfirmasi email: ' + error.message);
        }
    }

    const path = window.location.pathname;

    // Route to appropriate page handlers
    if (path.includes('login.html')) {
        handleLoginPage();
    } else if (path.includes('register.html')) {
        handleRegisterPage();
    } else if (path.includes('dashboard_admin.html')) {
        await loadAdminDashboard();
    } else if (path.includes('dashboard_client.html')) {
        await loadClientDashboard();
    } else {
        // Homepage scripts - only run if elements exist
        initializeHomepageScripts();
    }
    
    // Event listener untuk tombol logout (untuk dashboard pages)
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});

// ==================== AUTH FUNCTIONS ====================

async function handleLoginPage() {
    // Jika user sudah login, arahkan ke dashboard yang sesuai
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        await redirectToDashboard();
        return;
    }

    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');

        errorMessage.textContent = '';

        try {
            console.log('Attempting login for:', email);

            const { data, error } = await supabaseClient.auth.signInWithPassword({ 
                email, 
                password 
            });
            
            if (error) {
                console.error('Login error:', error);
                
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Email atau password salah. Silakan coba lagi.');
                } else if (error.message.includes('Email not confirmed')) {
                    throw new Error('Email belum dikonfirmasi. Silakan cek inbox Anda.');
                } else if (error.message.includes('User not found')) {
                    throw new Error('Akun tidak ditemukan. Silakan daftar terlebih dahulu.');
                } else {
                    throw error;
                }
            }

            console.log('Login successful:', data);
            await redirectToDashboard();
            
        } catch (error) {
            console.error('Caught error:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.color = 'red';
            errorMessage.style.marginTop = '10px';
        }
    });
}

async function handleRegisterPage() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('full-name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');

        if (password.length < 6) {
            errorMessage.textContent = 'Password minimal 6 karakter';
            return;
        }

        try {
            console.log('Registering user:', email);

            const { data: authData, error: authError } = await supabaseClient.auth.signUp({ 
                email, 
                password,
                options: {
                    data: {
                        full_name: fullName,
                        phone_number: phone
                    }
                }
            });
            
            if (authError) {
                console.error('Auth error:', authError);
                throw authError;
            }

            console.log('User created:', authData.user);

            if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                alert('Email sudah terdaftar. Silakan gunakan email lain atau login.');
                return;
            }

            if (authData.user && !authData.session) {
                alert('Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi, lalu login.');
            } else {
                alert('Pendaftaran berhasil! Silakan login.');
            }
            
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.message.includes('already registered')) {
                errorMessage.textContent = 'Email sudah terdaftar. Silakan login.';
            } else if (error.message.includes('Password should be')) {
                errorMessage.textContent = 'Password minimal 6 karakter.';
            } else {
                errorMessage.textContent = error.message || 'Terjadi kesalahan saat registrasi';
            }
        }
    });
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}

async function redirectToDashboard() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Ambil role dari tabel profiles
    const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        console.error('Error fetching profile or profile not found:', error);
        await handleLogout();
        return;
    }

    if (profile.role === 'admin') {
        window.location.href = 'dashboard_admin.html';
    } else {
        window.location.href = 'dashboard_client.html';
    }
}

// ==================== ADMIN DASHBOARD ====================

async function loadAdminDashboard() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (!profile || profile.role !== 'admin') {
        alert('Akses ditolak.');
        window.location.href = 'dashboard_client.html';
        return;
    }
    
    await fetchAndDisplayAllReservations();
}

async function fetchAndDisplayAllReservations() {
    const tableBody = document.getElementById('reservations-table-body');
    if (!tableBody) return;

    const { data: reservations, error } = await supabaseClient
        .from('reservations')
        .select(`
            id,
            reservation_date,
            start_time,
            status,
            profiles ( full_name ),
            services ( name )
        `)
        .order('reservation_date', { ascending: false });

    if (error) {
        console.error('Error fetching reservations:', error);
        return;
    }

    tableBody.innerHTML = reservations.map(res => `
        <tr>
            <td>${res.profiles.full_name}</td>
            <td>${res.services.name}</td>
            <td>${res.reservation_date}</td>
            <td>${res.start_time.substring(0, 5)}</td>
            <td><span class="status-${res.status}">${res.status}</span></td>
            <td>
                ${res.status === 'pending' ? `
                <button class="action-btn confirm-btn" onclick="updateReservationStatus('${res.id}', 'confirmed')">Confirm</button>
                <button class="action-btn cancel-btn" onclick="updateReservationStatus('${res.id}', 'cancelled')">Cancel</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

async function updateReservationStatus(reservationId, newStatus) {
    const { error } = await supabaseClient
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId);
    
    if (error) {
        alert('Gagal mengupdate status: ' + error.message);
    } else {
        alert('Status berhasil diupdate!');
        await fetchAndDisplayAllReservations();
    }
}

// ==================== CLIENT DASHBOARD ====================

let selectedTimeSlot = null;
let currentServiceData = null;

async function loadClientDashboard() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    await populateServicesDropdown();
    await fetchAndDisplayClientReservations();
    await fetchAndDisplayPaymentHistory();
    
    const dateInput = document.getElementById('reservation-date');
    const serviceSelect = document.getElementById('service-select');
    const bookingForm = document.getElementById('booking-form');
    
    // Set minimum date to today
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        dateInput.addEventListener('change', () => {
            generateAvailableTimeSlots();
            updateBookingSummary();
        });
    }
    
    if (serviceSelect) {
        serviceSelect.addEventListener('change', updateBookingSummary);
    }
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Silakan pilih waktu dan klik tombol "Bayar Sekarang" untuk melanjutkan pembayaran.');
        });
    }
    
    // Payment button handler
    const btnPay = document.getElementById('btn-pay');
    if (btnPay) {
        btnPay.addEventListener('click', handlePaymentClick);
    }
}

async function populateServicesDropdown() {
    const selectElement = document.getElementById('service-select');
    if (!selectElement) return;

    const { data: services, error } = await supabaseClient.from('services').select('*');
    if (error) {
        console.error('Error loading services:', error);
        return;
    }

    selectElement.innerHTML = '<option value="">-- Pilih Layanan --</option>' + 
        services.map(service => 
            `<option value="${service.id}" 
                     data-name="${service.name}"
                     data-price="${service.price}"
                     data-duration="${service.duration_minutes}">
                ${service.name} (${service.duration_minutes} menit) - Rp ${service.price.toLocaleString('id-ID')}
            </option>`
        ).join('');
}

async function generateAvailableTimeSlots() {
    const date = document.getElementById('reservation-date').value;
    const container = document.getElementById('time-slots-container');
    
    if (!container) return;
    
    if (!date) {
        container.innerHTML = '<p>Silakan pilih tanggal terlebih dahulu.</p>';
        return;
    }

    const { data: bookedSlots, error } = await supabaseClient
        .from('reservations')
        .select('start_time, end_time')
        .eq('reservation_date', date)
        .in('status', ['pending', 'confirmed']); // Exclude cancelled

    if (error) {
        console.error('Error fetching booked slots:', error);
        container.innerHTML = '<p>Gagal memuat slot waktu.</p>';
        return;
    }

    const allSlots = [];
    for (let hour = 10; hour < 20; hour++) {
        allSlots.push(`${String(hour).padStart(2, '0')}:00`);
        allSlots.push(`${String(hour).padStart(2, '0')}:30`);
    }

    container.innerHTML = '';
    
    allSlots.forEach(slot => {
        const slotTime = `${slot}:00`;
        let isBooked = false;
        
        for (const booked of bookedSlots) {
            if (slotTime >= booked.start_time && slotTime < booked.end_time) {
                isBooked = true;
                break;
            }
        }
        
        const slotElement = document.createElement('div');
        slotElement.textContent = slot;
        slotElement.classList.add('time-slot');
        
        if (isBooked) {
            slotElement.classList.add('disabled');
        } else {
            slotElement.addEventListener('click', () => {
                document.querySelectorAll('.time-slot.selected').forEach(el => el.classList.remove('selected'));
                slotElement.classList.add('selected');
                selectedTimeSlot = slot;
                updateBookingSummary(); // Update summary setelah pilih slot
            });
        }
        
        container.appendChild(slotElement);
    });
    
    console.log(`Generated ${allSlots.length} time slots, ${bookedSlots.length} booked`);
}

function updateBookingSummary() {
    const serviceSelect = document.getElementById('service-select');
    const dateInput = document.getElementById('reservation-date');
    const summary = document.getElementById('booking-summary');
    
    if (!serviceSelect || !dateInput || !summary) return;
    
    if (!serviceSelect.value || !dateInput.value || !selectedTimeSlot) {
        summary.classList.remove('show');
        return;
    }
    
    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    const serviceName = selectedOption.dataset.name;
    const totalAmount = parseInt(selectedOption.dataset.price);
    const durationMinutes = parseInt(selectedOption.dataset.duration);
    
    const startTime = selectedTimeSlot + ':00';
    const endTimeObj = new Date(`1970-01-01T${startTime}`);
    endTimeObj.setMinutes(endTimeObj.getMinutes() + durationMinutes);
    const endTime = endTimeObj.toTimeString().substring(0, 8);
    
    console.log('=== BOOKING SUMMARY ===');
    console.log('Service:', serviceName);
    console.log('Total:', totalAmount);
    console.log('Duration:', durationMinutes, 'minutes');
    console.log('Time:', startTime, '-', endTime);
    
    currentServiceData = {
        service_id: serviceSelect.value,
        service_name: serviceName,
        reservation_date: dateInput.value,
        start_time: startTime,
        end_time: endTime,
        total_amount: totalAmount,
        duration_minutes: durationMinutes
    };
    
    // Update display
    document.getElementById('summary-service').textContent = serviceName;
    document.getElementById('summary-date').textContent = formatDate(dateInput.value);
    document.getElementById('summary-time').textContent = `${selectedTimeSlot} - ${endTime.substring(0,5)}`;
    document.getElementById('summary-duration').textContent = `${durationMinutes} Menit`;
    document.getElementById('summary-price-per-hour').textContent = `Total Paket`;
    document.getElementById('summary-total').textContent = `Rp ${totalAmount.toLocaleString('id-ID')}`;
    
    summary.classList.add('show');
}


async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        window.location.href = 'login.html';
        return;
    }
    
    const serviceSelect = document.getElementById('service-select');
    const serviceId = serviceSelect.value;
    const duration = serviceSelect.options[serviceSelect.selectedIndex].dataset.duration;
    const reservationDate = document.getElementById('reservation-date').value;
    const notes = document.getElementById('notes').value;

    if (!selectedTimeSlot) {
        alert('Silakan pilih jam reservasi.');
        return;
    }

    const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
    const startTime = `${selectedTimeSlot}:00`;
    const endTimeObj = new Date(`1970-01-01T${startTime}`);
    endTimeObj.setMinutes(endTimeObj.getMinutes() + parseInt(duration));
    const endTime = endTimeObj.toTimeString().split(' ')[0];
    
    try {
        const { error } = await supabaseClient.from('reservations').insert([{
            client_id: user.id,
            service_id: serviceId,
            reservation_date: reservationDate,
            start_time: startTime,
            end_time: endTime,
            status: 'pending',
            notes: notes
        }]);

        if (error) throw error;

        alert('Reservasi berhasil dibuat! Menunggu konfirmasi dari admin.');
        await fetchAndDisplayClientReservations();
        document.getElementById('booking-form').reset();
        document.getElementById('time-slots-container').innerHTML = '<p>Silakan pilih tanggal terlebih dahulu.</p>';
        selectedTimeSlot = null;

    } catch (error) {
        alert('Gagal membuat reservasi: ' + error.message);
    }
}

async function fetchAndDisplayClientReservations() {
    const listContainer = document.getElementById('client-reservations-list');
    if (!listContainer) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: reservations, error } = await supabaseClient
        .from('reservations')
        .select(`*, services(name)`)
        .eq('client_id', user.id)
        .order('reservation_date', { ascending: false });

    if (error) {
        console.error('Error fetching reservations:', error);
        listContainer.innerHTML = '<p>Gagal memuat riwayat reservasi.</p>';
        return;
    }
    
    if (reservations.length === 0) {
        listContainer.innerHTML = '<p>Anda belum memiliki reservasi.</p>';
        return;
    }
    
    listContainer.innerHTML = reservations.map(res => `
        <div class="reservation-item">
            <p><strong>Layanan:</strong> ${res.services.name}</p>
            <p><strong>Tanggal:</strong> ${res.reservation_date} - Jam ${res.start_time.substring(0, 5)}</p>
            <p><strong>Status:</strong> <span class="status-${res.status}">${res.status}</span></p>
            ${res.notes ? `<p><strong>Catatan:</strong> ${res.notes}</p>` : ''}
        </div>
    `).join('');
}

// ==================== HOMEPAGE SCRIPTS ====================

function initializeHomepageScripts() {
    // Smooth scroll for anchor links
    const navLinks = document.querySelectorAll('header .nav-links a[href^="#"]');
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const header = document.querySelector('header');
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Header scroll effect
    const header = document.querySelector('header');
    if (header) {
        function handleScroll() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }

    // Testimonial Swiper
    const swiperContainer = document.querySelector('.testimonial-swiper');
    if (swiperContainer && typeof Swiper !== 'undefined') {
        try {
            const testimonialsSwiper = new Swiper('.testimonial-swiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                loop: true,
                grabCursor: true,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                    dynamicBullets: true,
                    dynamicMainBullets: 5,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                breakpoints: {
                    640: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                    },
                    992: {
                        slidesPerView: 3,
                        spaceBetween: 30,
                    },
                },
            });
        } catch (error) {
            console.error('Error initializing Swiper:', error);
        }
    }

    // Slideshow - only if elements exist
    const slides = document.querySelectorAll('.slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        
        function nextSlide() {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }
        
        setInterval(nextSlide, 5000);
    }

    // Accordion
    const accordionItems = document.querySelectorAll('.accordion-item');
    if (accordionItems.length > 0) {
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            if (header) {
                header.addEventListener('click', function() {
                    const currentlyActive = document.querySelector('.accordion-item.active');
                    
                    if(currentlyActive && currentlyActive !== item) {
                        currentlyActive.classList.remove('active');
                    }
                    
                    item.classList.toggle('active');
                });
            }
        });
    }

    // Mobile menu
    initializeMobileMenu();

    // Back to top button
    initializeBackToTop();

    // Photo card interactions
    initializePhotoCards();
}

function initializeMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Check if mobile menu button already exists
    let mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    if (!mobileMenuBtn) {
        mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        
        const header = document.querySelector('header .container');
        if (header) {
            header.insertBefore(mobileMenuBtn, navLinks);
        }
    }
    
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        if (navLinks.classList.contains('active')) {
            mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
}

function initializeBackToTop() {
    // Check if button already exists
    let backToTopButton = document.querySelector('.back-to-top');
    
    if (!backToTopButton) {
        backToTopButton = document.createElement('div');
        backToTopButton.className = 'back-to-top';
        backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        document.body.appendChild(backToTopButton);
    }
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('active');
        } else {
            backToTopButton.classList.remove('active');
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function initializePhotoCards() {
    const photoCards = document.querySelectorAll('.photo-card');
    
    if (photoCards.length > 0) {
        photoCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-in');
            
            card.addEventListener('mouseenter', function() {
                this.classList.add('hovered');
            });
            
            card.addEventListener('mouseleave', function() {
                this.classList.remove('hovered');
            });
        });
    }
}

// ==================== PAYMENT INTEGRATION ====================

async function loadClientDashboard() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    await populateServicesDropdown();
    await fetchAndDisplayClientReservations();
    await fetchAndDisplayPaymentHistory(); // TAMBAHAN INI
    
    const dateInput = document.getElementById('reservation-date');
    const serviceSelect = document.getElementById('service-select');
    const bookingForm = document.getElementById('booking-form');
    
    // Set minimum date to today
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        dateInput.addEventListener('change', () => {
            generateAvailableTimeSlots();
            updateBookingSummary();
        });
    }
    
    if (serviceSelect) {
        serviceSelect.addEventListener('change', updateBookingSummary);
    }
    
    if (bookingForm) {
        bookingForm.removeEventListener('submit', handleBookingSubmit); // Remove old listener
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission
            alert('Silakan pilih waktu dan klik tombol "Bayar Sekarang" untuk melanjutkan pembayaran.');
        });
    }
    
    // Payment button handler
    const btnPay = document.getElementById('btn-pay');
    if (btnPay) {
        btnPay.addEventListener('click', handlePaymentClick);
    }
}

// Override generateAvailableTimeSlots untuk tambahkan updateBookingSummary
const originalGenerateSlots = generateAvailableTimeSlots;
generateAvailableTimeSlots = async function() {
    await originalGenerateSlots();
    
    // Add click listener untuk update summary
    const slots = document.querySelectorAll('.time-slot:not(.disabled)');
    slots.forEach(slot => {
        const oldListener = slot.onclick;
        slot.onclick = function() {
            if (oldListener) oldListener.call(this);
            updateBookingSummary();
        };
    });
};

function updateBookingSummary() {
    const serviceSelect = document.getElementById('service-select');
    const dateInput = document.getElementById('reservation-date');
    const summary = document.getElementById('booking-summary');
    
    if (!serviceSelect || !dateInput || !summary) return;
    
    if (!serviceSelect.value || !dateInput.value || !selectedTimeSlot) {
        summary.classList.remove('show');
        return;
    }
    
    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    const serviceName = selectedOption.dataset.name;
    const totalAmount = parseInt(selectedOption.dataset.price); // Langsung pakai price, sudah total!
    const durationMinutes = parseInt(selectedOption.dataset.duration);
    
    const startTime = selectedTimeSlot + ':00';
    const endTimeObj = new Date(`1970-01-01T${startTime}`);
    endTimeObj.setMinutes(endTimeObj.getMinutes() + durationMinutes);
    const endTime = endTimeObj.toTimeString().substring(0, 8);
    
    console.log('=== BOOKING SUMMARY DEBUG ===');
    console.log('Service:', serviceName);
    console.log('Total Price:', totalAmount);
    console.log('Duration (minutes):', durationMinutes);
    console.log('Start:', startTime, 'End:', endTime);
    
    currentServiceData = {
        service_id: serviceSelect.value,
        service_name: serviceName,
        reservation_date: dateInput.value,
        start_time: startTime,
        end_time: endTime,
        total_amount: totalAmount, // Langsung pakai
        duration_minutes: durationMinutes
    };
    
    // Update display
    document.getElementById('summary-service').textContent = serviceName;
    document.getElementById('summary-date').textContent = formatDate(dateInput.value);
    document.getElementById('summary-time').textContent = `${selectedTimeSlot} - ${endTime.substring(0,5)}`;
    document.getElementById('summary-duration').textContent = `${durationMinutes} Menit`;
    document.getElementById('summary-price-per-hour').textContent = `Total Paket`; // Ganti label
    document.getElementById('summary-total').textContent = `Rp ${totalAmount.toLocaleString('id-ID')}`;
    
    summary.classList.add('show');
}

async function handlePaymentClick() {
    if (!currentServiceData) {
        alert('Silakan lengkapi form booking terlebih dahulu.');
        return;
    }
    
    const btnPay = document.getElementById('btn-pay');
    btnPay.disabled = true;
    btnPay.textContent = '⏳ Memproses pembayaran...';
    
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            alert('Sesi berakhir. Silakan login kembali.');
            window.location.href = 'login.html';
            return;
        }
        
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('full_name, phone_number')
            .eq('id', user.id)
            .single();
        
        if (profileError || !profile) {
            throw new Error('Gagal mengambil data profile: ' + (profileError?.message || 'Profile tidak ditemukan'));
        }
        
        const notes = document.getElementById('notes').value;
        
        const paymentData = {
            service_id: currentServiceData.service_id,
            service_name: currentServiceData.service_name,
            reservation_date: currentServiceData.reservation_date,
            start_time: currentServiceData.start_time,
            end_time: currentServiceData.end_time,
            total_amount: currentServiceData.total_amount,
            notes: notes || '',
            customer_name: profile.full_name,
            customer_email: user.email,
            customer_phone: profile.phone_number || '08123456789'
        };
        
        console.log('=== PAYMENT REQUEST ===');
        console.log(paymentData);
        
        const { data: { session } } = await supabaseClient.auth.getSession();
        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/create-payment`;
        
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(paymentData)
        });
        
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Gagal memproses pembayaran');
        }
        
        if (!result.snap_token) {
            throw new Error('Snap token tidak ditemukan');
        }
        
        if (typeof window.snap === 'undefined') {
            throw new Error('Midtrans Snap belum dimuat. Refresh halaman dan coba lagi.');
        }
        
        console.log('Opening Midtrans Snap...');
        
        window.snap.pay(result.snap_token, {
            onSuccess: async function(paymentResult) {
                console.log('✅ Payment success:', paymentResult);
                
                try {
                    console.log('Processing post-payment actions...');
                    
                    // Update payment status
                    const { error: updateError } = await supabaseClient
                        .from('payments')
                        .update({ 
                            payment_status: 'paid',
                            transaction_id: paymentResult.transaction_id || 'snap-success',
                            paid_at: new Date().toISOString()
                        })
                        .eq('order_id', result.order_id);
                    
                    if (updateError) {
                        console.error('❌ Failed to update payment:', updateError);
                    } else {
                        console.log('✅ Payment status updated to paid');
                    }
                    
                    // Get payment data
                    const { data: payment, error: fetchError } = await supabaseClient
                        .from('payments')
                        .select('*')
                        .eq('order_id', result.order_id)
                        .single();
                    
                    if (fetchError) {
                        console.error('❌ Failed to fetch payment:', fetchError);
                    } else if (payment && !payment.reservation_id) {
                        console.log('Creating reservation...');
                        
                        // Create reservation
                        const { data: reservation, error: resError } = await supabaseClient
                            .from('reservations')
                            .insert({
                                client_id: payment.client_id,
                                service_id: payment.service_id,
                                reservation_date: payment.reservation_date,
                                start_time: payment.start_time,
                                end_time: payment.end_time,
                                status: 'pending',
                                notes: payment.notes
                            })
                            .select()
                            .single();
                        
                        if (resError) {
                            console.error('❌ Failed to create reservation:', resError);
                        } else {
                            console.log('✅ Reservation created:', reservation.id);
                            
                            // Link payment to reservation
                            await supabaseClient
                                .from('payments')
                                .update({ reservation_id: reservation.id })
                                .eq('order_id', result.order_id);
                            
                            console.log('✅ Payment linked to reservation');
                        }
                    }
                    
                } catch (e) {
                    console.error('❌ Error in post-payment processing:', e);
                }
                
                alert('✅ Pembayaran berhasil! Reservasi Anda sedang menunggu konfirmasi admin.');
                
                // Reset form
                document.getElementById('booking-form').reset();
                document.getElementById('booking-summary').classList.remove('show');
                document.getElementById('time-slots-container').innerHTML = 
                    '<p>Silakan pilih tanggal terlebih dahulu.</p>';
                selectedTimeSlot = null;
                currentServiceData = null;
                
                // Reload data
                setTimeout(async () => {
                    await fetchAndDisplayClientReservations();
                    await fetchAndDisplayPaymentHistory();
                }, 1500);
                
                btnPay.disabled = false;
                btnPay.textContent = '💳 Bayar Sekarang';
            },
            
            onPending: function(paymentResult) {
                console.log('⏳ Payment pending:', paymentResult);
                alert('⏳ Pembayaran tertunda. Silakan selesaikan pembayaran Anda.');
                btnPay.disabled = false;
                btnPay.textContent = '💳 Bayar Sekarang';
                fetchAndDisplayPaymentHistory();
            },
            
            onError: function(paymentResult) {
                console.error('❌ Payment error:', paymentResult);
                alert('❌ Pembayaran gagal atau dibatalkan.');
                btnPay.disabled = false;
                btnPay.textContent = '💳 Bayar Sekarang';
            },
            
            onClose: function() {
                console.log('🚪 Payment popup closed');
                btnPay.disabled = false;
                btnPay.textContent = '💳 Bayar Sekarang';
            }
        });
        
    } catch (error) {
        console.error('💥 PAYMENT ERROR:', error);
        alert('Gagal memproses pembayaran: ' + error.message);
        btnPay.disabled = false;
        btnPay.textContent = '💳 Bayar Sekarang';
    }
}

// Payment History
// Payment History
async function fetchAndDisplayPaymentHistory() {
    const listContainer = document.getElementById('payment-history-list');
    if (!listContainer) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: payments, error } = await supabaseClient
        .from('payments')
        .select(`
            *,
            services(name, price),
            reservations(id, status)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching payments:', error);
        listContainer.innerHTML = '<p>Gagal memuat riwayat pembayaran.</p>';
        return;
    }
    
    if (payments.length === 0) {
        listContainer.innerHTML = '<p>Belum ada riwayat pembayaran.</p>';
        return;
    }
    
    listContainer.innerHTML = payments.map(payment => {
        const statusBadge = getPaymentStatusBadgeHTML(payment.payment_status);
        const reservationStatus = payment.reservations 
            ? `<p><strong>Status Reservasi:</strong> <span class="status-${payment.reservations.status}">${payment.reservations.status}</span></p>`
            : '';
        const payButton = (payment.payment_status === 'unpaid' || payment.payment_status === 'pending') && payment.snap_token
            ? `<button onclick="retryPayment('${payment.snap_token}')" class="retry-pay-btn">Lanjutkan Pembayaran</button>`
            : '';
        
        return `
            <div class="payment-item">
                <div class="payment-header">
                    <strong>${payment.services?.name || 'N/A'}</strong>
                    ${statusBadge}
                </div>
                <p><strong>Order ID:</strong> ${payment.order_id}</p>
                <p><strong>Tanggal:</strong> ${formatDate(payment.reservation_date)} | ${payment.start_time.substring(0,5)} - ${payment.end_time.substring(0,5)}</p>
                <p><strong>Total:</strong> Rp ${payment.amount.toLocaleString('id-ID')}</p>
                ${payment.payment_method ? `<p><strong>Metode:</strong> ${payment.payment_method}</p>` : ''}
                ${reservationStatus}
                <p style="font-size: 12px; color: #999; margin-top: 10px;">Dibuat: ${formatDateTime(payment.created_at)}</p>
                ${payButton}
            </div>
        `;
    }).join('');
}


function getPaymentStatusBadgeHTML(status) {
    const badges = {
        'paid': '<span class="badge badge-success">✓ Lunas</span>',
        'pending': '<span class="badge badge-warning">⏳ Pending</span>',
        'unpaid': '<span class="badge badge-danger">✗ Belum Bayar</span>',
        'failed': '<span class="badge badge-danger">✗ Gagal</span>',
        'expired': '<span class="badge badge-secondary">⊘ Expired</span>',
    };
    return badges[status] || `<span class="badge">${status}</span>`;
}

async function retryPayment(snapToken) {
    try {
        if (typeof window.snap === 'undefined') {
            alert('Midtrans Snap belum dimuat. Refresh halaman dan coba lagi.');
            return;
        }
        
        window.snap.pay(snapToken, {
            onSuccess: async function() {
                alert('✅ Pembayaran berhasil!');
                await fetchAndDisplayClientReservations();
                await fetchAndDisplayPaymentHistory();
            },
            onPending: function() {
                alert('⏳ Menunggu pembayaran.');
                fetchAndDisplayPaymentHistory();
            },
            onError: function() {
                alert('❌ Pembayaran gagal.');
            }
        });
    } catch (error) {
        alert('Gagal membuka pembayaran: ' + error.message);
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function formatDateTime(datetimeStr) {
    const date = new Date(datetimeStr);
    return date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

window.retryPayment = retryPayment;

// Make functions globally available for onclick handlers
window.updateReservationStatus = updateReservationStatus;