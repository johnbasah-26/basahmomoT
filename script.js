document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle Functionality
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    body.classList.add(savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        if (body.classList.contains('dark')) {
            body.classList.replace('dark', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.replace('light', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        updateThemeIcon();
    });
    
    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        if (body.classList.contains('light')) {
            icon.classList.replace('fa-moon', 'fa-sun');
            icon.style.color = '#ff7b25'; // Orange color for sun icon
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            icon.style.color = '#ff7b25'; // Orange color for moon icon
        }
    }
    
    // Mobile Menu Toggle
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    mobileMenu.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        mobileMenu.innerHTML = navLinks.classList.contains('active') ? 
            '<i class="fas fa-times" style="color:#ff7b25"></i>' : 
            '<i class="fas fa-bars" style="color:#ff7b25"></i>';
    });
    
    // Close mobile menu when clicking a nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileMenu.innerHTML = '<i class="fas fa-bars" style="color:#ff7b25"></i>';
            }
        });
    });
    
    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
    
    // Projects Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectItems = document.querySelectorAll('.project-item');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active filter button
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.backgroundColor = 'transparent';
                btn.style.color = 'var(--text-primary)';
            });
            
            this.classList.add('active');
            this.style.backgroundColor = 'var(--primary)';
            this.style.color = 'var(--dark)';
            
            const filterValue = this.getAttribute('data-filter');
            
            // Filter project items with animation
            projectItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.style.display = 'block';
                    item.style.animation = 'fadeIn 0.5s ease-in-out';
                } else {
                    item.style.animation = 'fadeOut 0.3s ease-in-out';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Testimonials Slider
    const testimonials = document.querySelectorAll('.testimonial');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    let currentTestimonial = 0;
    let autoSlideInterval;
    
    function showTestimonial(index) {
        testimonials.forEach((testimonial, i) => {
            testimonial.classList.remove('active', 'fade-out');
            if (i === index) {
                testimonial.classList.add('active');
                testimonial.style.animation = 'fadeIn 0.5s ease-in-out';
            }
        });
        currentTestimonial = index;
    }
    
    function nextTestimonial() {
        let newIndex = currentTestimonial + 1;
        if (newIndex >= testimonials.length) newIndex = 0;
        
        // Add fade-out animation to current testimonial
        testimonials[currentTestimonial].classList.add('fade-out');
        
        setTimeout(() => {
            showTestimonial(newIndex);
        }, 300);
    }
    
    function prevTestimonial() {
        let newIndex = currentTestimonial - 1;
        if (newIndex < 0) newIndex = testimonials.length - 1;
        
        testimonials[currentTestimonial].classList.add('fade-out');
        
        setTimeout(() => {
            showTestimonial(newIndex);
        }, 300);
    }
    
    prevBtn.addEventListener('click', function() {
        clearInterval(autoSlideInterval);
        prevTestimonial();
        startAutoSlide();
    });
    
    nextBtn.addEventListener('click', function() {
        clearInterval(autoSlideInterval);
        nextTestimonial();
        startAutoSlide();
    });
    
    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            nextTestimonial();
        }, 5000);
    }
    
    // Start auto-sliding
    startAutoSlide();
    
    // Pause auto-slide when hovering over testimonials
    const testimonialContainer = document.querySelector('.testimonials-slider');
    testimonialContainer.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
    });
    
    testimonialContainer.addEventListener('mouseleave', startAutoSlide);
    
    // Form Submission
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const formData = new FormData(this);
            const formValues = Object.fromEntries(formData.entries());
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            // Simulate form submission (replace with actual AJAX call)
            setTimeout(() => {
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'form-success';
                successMessage.innerHTML = `
                    <i class="fas fa-check-circle" style="color:#ff7b25;font-size:2rem;margin-bottom:1rem;"></i>
                    <h3>Thank you for your message!</h3>
                    <p>We'll get back to you within 24 hours.</p>
                `;
                contactForm.parentNode.insertBefore(successMessage, contactForm);
                contactForm.style.display = 'none';
                
                // Reset button state
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                
                // Remove success message after 5 seconds
                setTimeout(() => {
                    successMessage.remove();
                    contactForm.style.display = 'block';
                    contactForm.reset();
                }, 5000);
            }, 1500);
        });
    }
    
    // Scroll Spy for Navigation
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        
        // Check each section
        document.querySelectorAll('section').forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                        link.style.color = 'var(--primary)';
                    }
                });
            }
        });
    });
    
    // Animation on Scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.service-card, .project-item, .mv-card, .about-image');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            }
        });
    };
    
    // Set initial state for animated elements
    document.querySelectorAll('.service-card, .project-item, .mv-card, .about-image').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
    });
    
    // Run once on load
    animateOnScroll();
    
    // Run on scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Add CSS animations dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(20px); }
        }
        .form-success {
            background: var(--secondary);
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            animation: fadeIn 0.5s ease-in-out;
        }
    `;
    document.head.appendChild(style);
});