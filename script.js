const SUPABASE_URL = 'https://minidxzoceavkaksffkt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pbmlkeHpvY2Vhdmtha3NmZmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3OTcxNDUsImV4cCI6MjA3NzM3MzE0NX0.uG85i8pJBubXnCVGd41CV95H8058gj9-yVk8L07oHuQ';

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
            // Bersihkan URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('Verification error:', error);
            alert('Gagal konfirmasi email: ' + error.message);
        }
    }

    const path = window.location.pathname;

    if (path.includes('login.html')) {
        handleLoginPage();
    } else if (path.includes('register.html')) {
        handleRegisterPage();
    } else if (path.includes('dashboard_admin.html')) {
        loadAdminDashboard();
    } else if (path.includes('dashboard_client.html')) {
        loadClientDashboard();
    }
    
    // Event listener untuk tombol logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});

async function handleLoginPage() {
    // Jika user sudah login, arahkan ke dashboard yang sesuai
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        redirectToDashboard();
        return;
    }

    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');

        // Reset error message
        errorMessage.textContent = '';

        try {
            console.log('Attempting login for:', email); // Debug

            const { data, error } = await supabaseClient.auth.signInWithPassword({ 
                email, 
                password 
            });
            
            if (error) {
                console.error('Login error:', error); // Debug
                
                // Custom error messages dalam Bahasa Indonesia
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

            console.log('Login successful:', data); // Debug
            redirectToDashboard();
            
        } catch (error) {
            console.error('Caught error:', error); // Debug
            errorMessage.textContent = error.message;
            errorMessage.style.color = 'red';
            errorMessage.style.marginTop = '10px';
        }
    });
}

async function handleRegisterPage() {
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('full-name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');

        // Validasi minimal
        if (password.length < 6) {
            errorMessage.textContent = 'Password minimal 6 karakter';
            return;
        }

        try {
            console.log('Registering user:', email); // Debug

            // 1. Buat user di auth.users
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
                console.error('Auth error:', authError); // Debug
                throw authError;
            }

            console.log('User created:', authData.user); // Debug

            // Cek apakah email confirmation enabled
            if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                alert('Email sudah terdaftar. Silakan gunakan email lain atau login.');
                return;
            }

            // Cek apakah perlu konfirmasi email
            if (authData.user && !authData.session) {
                alert('Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi, lalu login.');
            } else {
                alert('Pendaftaran berhasil! Silakan login.');
            }
            
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Registration error:', error); // Debug
            
            // Custom error messages
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
        handleLogout(); // Jika profil tidak ditemukan, logout paksa
        return;
    }

    if (profile.role === 'admin') {
        window.location.href = 'dashboard_admin.html';
    } else {
        window.location.href = 'dashboard_client.html';
    }
}

async function loadAdminDashboard() {
    // Proteksi halaman: Hanya admin yang bisa mengakses
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (profile.role !== 'admin') {
        alert('Akses ditolak.');
        window.location.href = 'dashboard_client.html';
        return;
    }
    
    fetchAndDisplayAllReservations();
}

async function fetchAndDisplayAllReservations() {
    const tableBody = document.getElementById('reservations-table-body');
    if (!tableBody) return;

    // Join query untuk mengambil data terkait
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
        fetchAndDisplayAllReservations(); // Muat ulang data
    }
}

let selectedTimeSlot = null;

async function loadClientDashboard() {
     // Proteksi halaman
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    populateServicesDropdown();
    fetchAndDisplayClientReservations();

    document.getElementById('reservation-date').addEventListener('change', generateAvailableTimeSlots);
    document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
}

async function populateServicesDropdown() {
    const selectElement = document.getElementById('service-select');
    const { data: services, error } = await supabaseClient.from('services').select('*');
    if (error) return;

    selectElement.innerHTML = services.map(service => 
        `<option value="${service.id}" data-duration="${service.duration_minutes}">${service.name} - Rp${service.price}</option>`
    ).join('');
}

async function generateAvailableTimeSlots() {
    const date = document.getElementById('reservation-date').value;
    const container = document.getElementById('time-slots-container');
    if (!date) {
        container.innerHTML = '<p>Silakan pilih tanggal terlebih dahulu.</p>';
        return;
    }

    // 1. Ambil semua reservasi pada tanggal yang dipilih
    const { data: bookedSlots, error } = await supabaseClient
        .from('reservations')
        .select('start_time, end_time')
        .eq('reservation_date', date)
        .neq('status', 'cancelled');

    if (error) {
        container.innerHTML = '<p>Gagal memuat slot waktu.</p>';
        return;
    }

    // 2. Buat daftar semua kemungkinan slot waktu (misal dari jam 10:00 - 19:30)
    const allSlots = [];
    for (let hour = 10; hour < 20; hour++) {
        allSlots.push(`${String(hour).padStart(2, '0')}:00`);
        allSlots.push(`${String(hour).padStart(2, '0')}:30`);
    }

    // 3. Filter slot yang tersedia
    container.innerHTML = '';
    allSlots.forEach(slot => {
        const slotTime = `${slot}:00`;
        let isBooked = false;
        
        for (const booked of bookedSlots) {
            // Cek apakah slot ini tumpang tindih dengan slot yang sudah dibooking
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
                // Hapus seleksi sebelumnya
                document.querySelectorAll('.time-slot.selected').forEach(el => el.classList.remove('selected'));
                // Tambahkan seleksi baru
                slotElement.classList.add('selected');
                selectedTimeSlot = slot;
            });
        }
        container.appendChild(slotElement);
    });
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

    // Hitung waktu selesai
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
        fetchAndDisplayClientReservations(); // Muat ulang daftar reservasi
        document.getElementById('booking-form').reset();
        document.getElementById('time-slots-container').innerHTML = '<p>Silakan pilih tanggal terlebih dahulu.</p>';
        selectedTimeSlot = null;

    } catch (error) {
        alert('Gagal membuat reservasi: ' + error.message);
    }
}

async function fetchAndDisplayClientReservations() {
    const listContainer = document.getElementById('client-reservations-list');
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: reservations, error } = await supabaseClient
        .from('reservations')
        .select(`*, services(name)`)
        .eq('client_id', user.id)
        .order('reservation_date', { ascending: false });

    if (error) {
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
        </div>
    `).join('');
}

    
    
    
    document.addEventListener('DOMContentLoaded', function() {
        // Pilih semua tautan di header yang mengarah ke anchor
        const navLinks = document.querySelectorAll('header .nav-links a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Menyesuaikan posisi scroll dengan memperhitungkan tinggi header
                    const headerHeight = document.querySelector('header').offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    });

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    
    // Function to handle scroll event
    function handleScroll() {
        // Add 'scrolled' class when page is scrolled beyond 50px
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Call once on page load (in case page is already scrolled)
    handleScroll();
    });

    //Testimoni Slide
// Tunggu hingga dokumen sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Periksa apakah elemen slider ada di dalam dokumen
    const swiperContainer = document.querySelector('.testimonial-swiper');
    
    if (!swiperContainer) {
        console.error('Element dengan class "testimonial-swiper" tidak ditemukan');
        return; // Keluar dari fungsi jika elemen tidak ditemukan
    }
    
    // Inisialisasi Swiper dengan lebih banyak cek error
    try {
        // Initialize Swiper
        const testimonialsSwiper = new Swiper('.testimonial-swiper', {
            // Basic settings
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            grabCursor: true,
            
            // Auto play settings
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            
            // Pagination
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true,
                dynamicMainBullets: 5,
            },
            
            // Navigation arrows
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            
            // Responsive breakpoints
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
        
        // Tambahkan event listener hanya jika Swiper berhasil diinisialisasi
        if (testimonialsSwiper) {
            // Optional: Pause autoplay ketika hover
            swiperContainer.addEventListener('mouseenter', function() {
                if (testimonialsSwiper.autoplay && testimonialsSwiper.autoplay.stop) {
                    testimonialsSwiper.autoplay.stop();
                }
            });
            
            swiperContainer.addEventListener('mouseleave', function() {
                if (testimonialsSwiper.autoplay && testimonialsSwiper.autoplay.start) {
                    testimonialsSwiper.autoplay.start();
                }
            });
            
            // Optional: Keyboard navigation
            document.addEventListener('keydown', function(e) {
                if (e.key === 'ArrowRight') {
                    testimonialsSwiper.slideNext();
                } else if (e.key === 'ArrowLeft') {
                    testimonialsSwiper.slidePrev();
                }
            });
        }
        
    } catch (error) {
        console.error('Terjadi kesalahan saat menginisialisasi Swiper:', error);
    }
});

//Testimoni Section
// testimonial-slider.js

document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.testimonial-slider');
    const track = document.querySelector('.testimonial-track');
    
    let isDown = false;
    let startX;
    let scrollLeft;
    let animationPaused = false;
    
    // Mouse events
    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        track.classList.add('dragging');
        track.style.animationPlayState = 'paused';
        animationPaused = true;
    });
    
    slider.addEventListener('mouseleave', () => {
        if (isDown) {
            isDown = false;
            track.classList.remove('dragging');
            // Resume animation after a delay
            setTimeout(() => {
                if (animationPaused) {
                    track.style.animationPlayState = 'running';
                    animationPaused = false;
                }
            }, 1000);
        }
    });
    
    slider.addEventListener('mouseup', () => {
        isDown = false;
        track.classList.remove('dragging');
        // Resume animation after a delay
        setTimeout(() => {
            if (animationPaused) {
                track.style.animationPlayState = 'running';
                animationPaused = false;
            }
        }, 1000);
    });
    
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });
    
    // Touch events for mobile
    let touchStartX;
    let touchScrollLeft;
    
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].pageX - slider.offsetLeft;
        touchScrollLeft = slider.scrollLeft;
        track.classList.add('dragging');
        track.style.animationPlayState = 'paused';
        animationPaused = true;
    });
    
    slider.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const x = e.touches[0].pageX - slider.offsetLeft;
        const walk = (x - touchStartX) * 2;
        slider.scrollLeft = touchScrollLeft - walk;
    });
    
    slider.addEventListener('touchend', () => {
        track.classList.remove('dragging');
        // Resume animation after a delay
        setTimeout(() => {
            if (animationPaused) {
                track.style.animationPlayState = 'running';
                animationPaused = false;
            }
        }, 1000);
    });
    
    // Pause animation on hover
    slider.addEventListener('mouseenter', () => {
        if (!isDown) {
            track.style.animationPlayState = 'paused';
        }
    });
    
    slider.addEventListener('mouseleave', () => {
        if (!isDown && !animationPaused) {
            track.style.animationPlayState = 'running';
        }
    });
    
    // Adjust animation speed based on viewport width
    function adjustAnimationSpeed() {
        const viewportWidth = window.innerWidth;
        const cards = document.querySelectorAll('.testimonial-card');
        const cardWidth = cards[0].offsetWidth;
        const gap = 30; // Gap between cards
        
        // Calculate total width of all cards
        const totalWidth = (cardWidth + gap) * 20;
        
        // Adjust animation duration based on viewport
        const baseSpeed = 40; // seconds
        const speedFactor = totalWidth / 6000; // Adjust this value to change speed
        const animationDuration = baseSpeed * speedFactor;
        
        track.style.animationDuration = `${animationDuration}s`;
    }
    
    // Call on load and resize
    adjustAnimationSpeed();
    window.addEventListener('resize', adjustAnimationSpeed);
    
    // Smooth scrolling effect
    function smoothScroll() {
        if (!isDown && !animationPaused) {
            const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
            
            if (slider.scrollLeft >= maxScrollLeft - 1) {
                slider.scrollLeft = 0;
            }
        }
        
        requestAnimationFrame(smoothScroll);
    }
    
    // Start smooth scrolling
    smoothScroll();
});


document.addEventListener('DOMContentLoaded', function() {
    // Ambil semua slide
    const slides = document.querySelectorAll('.slide');
    
    // Jika tidak ada slide, keluar dari fungsi
    if (slides.length === 0) {
        console.error("Tidak ada slide yang ditemukan!");
        return;
    }
    
    console.log(`Ditemukan ${slides.length} slide`);
    
    let currentSlide = 0;
    
    // Fungsi untuk mengubah slide
    function nextSlide() {
        // Hapus kelas aktif dari slide saat ini
        slides[currentSlide].classList.remove('active');
        
        // Hitung indeks slide berikutnya
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Tambahkan kelas aktif ke slide baru
        slides[currentSlide].classList.add('active');
    }
    
    // Ubah slide setiap 5 detik
    setInterval(nextSlide, 5000);
});

document.addEventListener('DOMContentLoaded', function() {
    // Ambil semua slide
    const slides = document.querySelectorAll('.slide');
    
    // Jika tidak ada slide, keluar dari fungsi
    if (slides.length === 0) {
        console.error("Tidak ada slide yang ditemukan!");
        return;
    }
    
    console.log(`Ditemukan ${slides.length} slide`);
    
    let currentSlide = 0;
    
    // Fungsi untuk mengubah slide
    function nextSlide() {
        // Hapus kelas aktif dari slide saat ini
        slides[currentSlide].classList.remove('active');
        
        // Hitung indeks slide berikutnya
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Tambahkan kelas aktif ke slide baru
        slides[currentSlide].classList.add('active');
    }
    
    // Ubah slide setiap 5 detik
    setInterval(nextSlide, 5000);
});


function checkImageExists(url, callback) {
    const img = new Image();
    img.onload = function() { callback(true); };
    img.onerror = function() { callback(false); };
    img.src = url;
}


document.addEventListener('DOMContentLoaded', function() {
    const imagePaths = [
        'images/DSC05005.JPG',
        'images/02.webp',
        'images/03.webp',
        'images/04.webp'
    ];
    
    imagePaths.forEach(path => {
        checkImageExists(path, function(exists) {
            console.log(`Gambar ${path} ${exists ? 'ditemukan' : 'TIDAK DITEMUKAN'}`);
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
            const accordionItems = document.querySelectorAll('.accordion-item');
            
            accordionItems.forEach(item => {
                const header = item.querySelector('.accordion-header');
                
                header.addEventListener('click', function() {
                    const currentlyActive = document.querySelector('.accordion-item.active');
                    
                    if(currentlyActive && currentlyActive !== item) {
                        currentlyActive.classList.remove('active');
                    }
                    
                    item.classList.toggle('active');
                });
            });
        });


        document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    
    // Add mobile menu button to header
    const header = document.querySelector('header .container');
    const navLinks = document.querySelector('.nav-links');
    
    if (header && navLinks) {
        header.insertBefore(mobileMenuBtn, navLinks);
        
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            // Change icon based on menu state
            if (navLinks.classList.contains('active')) {
                mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        // Close mobile menu when clicking on a link
        const navItems = document.querySelectorAll('.nav-links a');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
    
    // Header scroll effect
    const siteHeader = document.querySelector('header');
    
    function headerScroll() {
        if (window.scrollY > 50) {
            siteHeader.classList.add('scrolled');
        } else {
            siteHeader.classList.remove('scrolled');
        }
    }
    
    window.addEventListener('scroll', headerScroll);
    headerScroll(); // Initial call
    
    // Back to top button
    const backToTopButton = document.createElement('div');
    backToTopButton.className = 'back-to-top';
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(backToTopButton);
    
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


    //--------------------------------------------
    // Touch event handling for mobile devices
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // Improve touch interaction for portfolio items
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        portfolioItems.forEach(item => {
            item.addEventListener('touchstart', function() {
                portfolioItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.querySelector('.portfolio-overlay').style.opacity = '0';
                    }
                });
                
                const overlay = this.querySelector('.portfolio-overlay');
                overlay.style.opacity = overlay.style.opacity === '1' ? '0' : '1';
            });
        });
        
        // Fix for iOS vh unit bug
        function setVhProperty() {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        
        setVhProperty();
        window.addEventListener('resize', setVhProperty);
    }
    
    // Fix for accordion on mobile
    const accordionItems = document.querySelectorAll('.accordion-item');
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        
        header.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all accordions
            accordionItems.forEach(accItem => {
                accItem.classList.remove('active');
                accItem.querySelector('.accordion-content').style.maxHeight = '0';
            });
            
            // Open clicked accordion (if it wasn't active before)
            if (!isActive) {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
    
    // Initialize mobile slideshow if exists
    const slideshow = document.querySelector('.slideshow-container');
    if (slideshow) {
        const slides = slideshow.querySelectorAll('.slide');
        let currentSlide = 0;
        
        function showSlide() {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[currentSlide].classList.add('active');
            currentSlide = (currentSlide + 1) % slides.length;
        }
        
        showSlide(); // Show first slide immediately
        setInterval(showSlide, 5000); // Rotate every 5 seconds
    }
});



const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
    
    // Close menu when a link is clicked
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // Add this code to improve mobile performance

// Image lazy loading
document.addEventListener('DOMContentLoaded', function() {
    // Mark all images for lazy loading
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Don't add to images already with loading attribute
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // Add delayed loading effect
        img.classList.add('delayed-image');
        
        // Once image is loaded, add loaded class
        img.addEventListener('load', function() {
            this.classList.add('loaded');
        });
    });
    
    // Create a simple Intersection Observer to lazy load images
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                
                // If data-src is set, use it
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    delete img.dataset.src;
                }
                
                // Stop observing image
                observer.unobserve(img);
            }
        });
    });
    
    // Observe all images
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
    
    // Detect connection speed and optimize accordingly
    if (navigator.connection) {
        const connection = navigator.connection;
        
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            // Disable animations for slow connections
            document.body.classList.add('reduce-animations');
            
            // Add CSS to reduce animations
            const style = document.createElement('style');
            style.innerHTML = `
                .reduce-animations * {
                    transition-duration: 0.1s !important;
                    animation-duration: 0.1s !important;
                }
                
                .reduce-animations .fade-up,
                .reduce-animations .fade-in {
                    opacity: 1 !important;
                    transform: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Mobile-specific optimization
    if (window.innerWidth <= 768) {
        // Debounce scroll events
        function debounce(func, wait) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        }
        
        // Apply debouncing to scroll-intensive functions
        const scrollEvents = ['scroll', 'resize'];
        
        scrollEvents.forEach(event => {
            window.addEventListener(event, debounce(function() {
                // Add your scroll-dependent functions here
                // Example: animation triggers, parallax effects, etc.
            }, 100));
        });
        
        // Simplify animations for mobile
        document.querySelectorAll('.service-card, .portfolio-item, .team-member')
            .forEach(item => {
                item.addEventListener('touchstart', function() {
                    this.style.transform = 'translateY(-5px)';
                });
                
                item.addEventListener('touchend', function() {
                    this.style.transform = 'none';
                });
            });
    }
});

// Mobile swipe detection for sliders
function enableSwipe(element, onSwipeLeft, onSwipeRight) {
    let startX;
    let endX;
    const threshold = 50; // Minimum distance to be considered a swipe
    
    element.addEventListener('touchstart', function(e) {
        startX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    element.addEventListener('touchend', function(e) {
        endX = e.changedTouches[0].screenX;
        
        // Calculate swipe distance
        const distance = endX - startX;
        
        if (Math.abs(distance) >= threshold) {
            if (distance > 0) {
                // Swipe right
                if (onSwipeRight) onSwipeRight();
            } else {
                // Swipe left
                if (onSwipeLeft) onSwipeLeft();
            }
        }
    }, { passive: true });
}

/*Photo Card*/
// Photo card interactions and animations
document.addEventListener('DOMContentLoaded', function() {
    const photoCards = document.querySelectorAll('.photo-card');
    
    // Initialize cards with entrance animations
    initializeCardAnimations();
    
    // Add interaction event listeners
    addCardInteractions();
    
    // Setup back button functionality
    setupBackButton();
    
    // Setup scroll animations
    setupScrollAnimations();
});

/**
 * Initialize card entrance animations with stagger effect
 */
function initializeCardAnimations() {
    const photoCards = document.querySelectorAll('.photo-card');
    
    photoCards.forEach((card, index) => {
        // Add staggered delay for entrance animation
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
    });
}

/**
 * Add hover and click interactions to photo cards
 */
function addCardInteractions() {
    const photoCards = document.querySelectorAll('.photo-card');
    
    photoCards.forEach(card => {
        // Enhanced hover interaction
        card.addEventListener('mouseenter', function() {
            this.classList.add('hovered');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hovered');
        });
        
        // Click interaction for better mobile experience
        card.addEventListener('click', function(e) {
            // Don't interfere with view-more button clicks
            if (e.target.closest('.view-more-btn')) {
                return;
            }
            
            // Add click feedback animation
            addClickFeedback(this);
        });
        
        // Touch interactions for mobile
        card.addEventListener('touchstart', function() {
            this.classList.add('hovered');
        });
        
        card.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('hovered');
            }, 300);
        });
    });
}

/**
 * Add click feedback animation
 * @param {Element} element - The element to animate
 */
function addClickFeedback(element) {
    element.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
        element.style.transform = '';
    }, 150);
}

/**
 * Setup back button functionality
 */
function setupBackButton() {
    const backButton = document.querySelector('.back-button');
    
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add click animation
            this.style.opacity = '0.6';
            
            setTimeout(() => {
                this.style.opacity = '';
                // Navigate back in history
                window.history.back();
            }, 100);
        });
    }
}

/**
 * Setup intersection observer for scroll-triggered animations
 */
function setupScrollAnimations() {
    const photoCards = document.querySelectorAll('.photo-card');
    
    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Add a subtle pulse effect when card becomes visible
                setTimeout(() => {
                    entry.target.style.transform = 'scale(1.02)';
                    
                    setTimeout(() => {
                        entry.target.style.transform = '';
                    }, 200);
                }, 100);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    // Observe all photo cards
    photoCards.forEach(card => {
        observer.observe(card);
    });
}

/**
 * Add smooth scrolling behavior for internal links
 */
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Handle responsive behavior
 */
function handleResponsiveChanges() {
    let resizeTimer;
    
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        
        resizeTimer = setTimeout(function() {
            // Re-calculate card heights on mobile if needed
            const photoCards = document.querySelectorAll('.photo-card');
            const isMobile = window.innerWidth <= 768;
            
            photoCards.forEach(card => {
                if (isMobile) {
                    card.style.height = '350px';
                } else {
                    card.style.height = '420px';
                }
            });
        }, 250);
    });
}

/**
 * Add keyboard navigation support
 */
function addKeyboardNavigation() {
    const photoCards = document.querySelectorAll('.photo-card');
    
    photoCards.forEach((card, index) => {
        card.setAttribute('tabindex', '0');
        
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                
                // Find the view-more link and click it
                const viewMoreBtn = this.querySelector('.view-more-btn');
                if (viewMoreBtn) {
                    viewMoreBtn.click();
                }
            }
        });
        
        // Add focus styles
        card.addEventListener('focus', function() {
            this.style.outline = '2px solid #4a5568';
            this.style.outlineOffset = '2px';
        });
        
        card.addEventListener('blur', function() {
            this.style.outline = '';
            this.style.outlineOffset = '';
        });
    });
}

// Initialize additional features when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    handleResponsiveChanges();
    addKeyboardNavigation();
    setupSmoothScrolling();
});

// Export functions for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeCardAnimations,
        addCardInteractions,
        setupBackButton,
        setupScrollAnimations
    };
}



// Example usage:
document.addEventListener('DOMContentLoaded', function() {
    const testimonialSlider = document.querySelector('.testimonial-slider');
    if (testimonialSlider) {
        let currentSlide = 0;
        const slides = testimonialSlider.querySelectorAll('.testimonial-item');
        const dots = testimonialSlider.querySelectorAll('.slider-dot');
        
        function goToSlide(index) {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            
            slides.forEach(slide => slide.style.display = 'none');
            dots.forEach(dot => dot.classList.remove('active'));
            
            slides[index].style.display = 'block';
            dots[index].classList.add('active');
            currentSlide = index;
        }
        
        // Initialize first slide
        goToSlide(0);
        
        // Enable swipe
        enableSwipe(testimonialSlider, 
            // Swipe left (next slide)
            function() {
                goToSlide(currentSlide + 1);
            }, 
            // Swipe right (previous slide)
            function() {
                goToSlide(currentSlide - 1);
            }
        );
    }
});