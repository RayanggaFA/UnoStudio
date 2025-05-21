
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