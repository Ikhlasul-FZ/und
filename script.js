// Constants and Configurations
const CONFIG = {
  WEDDING_DATE: '2025-06-14T00:00:00',
  ALERT_TIMEOUT: 5000,
  ANIMATION_DURATION: 500,
  GALLERY_AUTOPLAY_INTERVAL: 5000
};

// DOM Elements
const DOM = {
  audio: {
    button: document.querySelector('.audio-btn'),
    element: document.getElementById('background-music')
  },
  pages: {
    opening: document.querySelector('.opening-page'),
    main: document.querySelector('.main-content')
  },
  forms: {
    rsvp: document.getElementById('rsvp-form'),
    wishesList: document.getElementById('wishes-list')
  },
  gallery: {
    container: document.querySelector('.mobile-gallery-container'),
    items: document.querySelectorAll('.mobile-gallery-item'),
    dots: document.querySelector('.gallery-dots'),
    prevBtn: document.querySelector('.gallery-nav .prev'),
    nextBtn: document.querySelector('.gallery-nav .next')
  },
  copyButtons: document.querySelectorAll('.copy-btn')
};

// Utility Functions
const utils = {
  // Format time units with leading zeros
  padZero: (num) => String(num).padStart(2, '0'),
  
  // Calculate time difference in human readable format
  getTimeAgo: (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      tahun: 31536000,
      bulan: 2592000,
      hari: 86400,
      jam: 3600,
      menit: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = seconds / secondsInUnit;
      if (interval > 1) return `${Math.floor(interval)} ${unit} yang lalu`;
    }
    return 'Baru saja';
  },

  // Show notification alert
  showAlert: (type, title, message) => {
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = `custom-alert ${type}`;
    
    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle'
    };

    alert.innerHTML = `
      <div class="alert-content">
        <div class="alert-icon">
          <i class="fas ${iconMap[type] || 'fa-bell'}"></i>
        </div>
        <div class="alert-text">
          <h4>${title}</h4>
          <p>${message}</p>
        </div>
        <button class="close-alert">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="alert-progress"></div>
    `;

    document.body.appendChild(alert);
    
    // Add show class after a small delay for animation
    setTimeout(() => alert.classList.add('show'), 100);

    // Add progress bar animation
    const progressBar = alert.querySelector('.alert-progress');
    progressBar.style.width = '100%';
    progressBar.style.transition = `width ${CONFIG.ALERT_TIMEOUT}ms linear`;

    // Handle close button
    const closeBtn = alert.querySelector('.close-alert');
    closeBtn.addEventListener('click', () => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), CONFIG.ANIMATION_DURATION);
    });

    // Auto remove after timeout
    setTimeout(() => {
      if (alert.classList.contains('show')) {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), CONFIG.ANIMATION_DURATION);
      }
    }, CONFIG.ALERT_TIMEOUT);
  }
};

// Controllers
const controllers = {
  audio: {
    isPlaying: false,
    toggle: () => {
      if (controllers.audio.isPlaying) {
        DOM.audio.element.pause();
        DOM.audio.button.classList.add('muted');
        DOM.audio.button.innerHTML = '<i class="fas fa-volume-mute"></i>';
      } else {
        DOM.audio.element.play()
          .then(() => {
            DOM.audio.button.classList.remove('muted');
            DOM.audio.button.innerHTML = '<i class="fas fa-volume-up"></i>';
          })
          .catch(error => console.log('Playback prevented:', error));
      }
      controllers.audio.isPlaying = !controllers.audio.isPlaying;
    }
  },

  page: {
    init: () => {
      const openInvitationBtn = document.querySelector('.open-invitation-btn');
      if (!openInvitationBtn) return;

      openInvitationBtn.addEventListener('click', () => {
        // Hide opening page
        DOM.pages.opening.style.opacity = '0';
        DOM.pages.opening.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ease`;
        
        // Show main content
        DOM.pages.main.style.display = 'block';
        DOM.pages.main.style.opacity = '0';
        setTimeout(() => {
          DOM.pages.main.style.opacity = '1';
          DOM.pages.main.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ease`;
        }, 100);
        
        // Start music
        DOM.audio.element.play().catch(error => console.log('Audio playback failed:', error));
        
        // Remove opening page
        setTimeout(() => {
          DOM.pages.opening.style.display = 'none';
        }, CONFIG.ANIMATION_DURATION);
      });
    }
  },

  countdown: {
    interval: null,
    update: () => {
      const weddingDate = new Date(CONFIG.WEDDING_DATE).getTime();
      const now = new Date().getTime();
      const distance = weddingDate - now;

      const timeUnits = {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };

      Object.entries(timeUnits).forEach(([unit, value]) => {
        const element = document.getElementById(unit);
        if (element) element.textContent = utils.padZero(value);
      });

      if (distance < 0) {
        clearInterval(controllers.countdown.interval);
        document.querySelector('.countdown-container').innerHTML = '<h3>Wedding Day!</h3>';
      }
    },
    init: () => {
      controllers.countdown.interval = setInterval(controllers.countdown.update, 1000);
      controllers.countdown.update();
    }
  },

  wishes: {
    load: async () => {
      try {
        const response = await fetch('wishes_handler.php');
        const data = await response.json();
        
        if (data.status === 'success') {
          DOM.forms.wishesList.innerHTML = '';
          data.data.forEach(wish => controllers.wishes.addCard(wish));
        }
      } catch (error) {
        console.error('Error loading wishes:', error);
        utils.showAlert('error', 'Oops!', 'Gagal memuat ucapan yang ada.');
      }
    },

    addCard: (wish) => {
      const wishCard = document.createElement('div');
      wishCard.className = 'wish-card';
      
      const date = new Date(wish.created_at);
      const timeAgo = utils.getTimeAgo(date);
      
      wishCard.innerHTML = `
        <div class="wish-header">
          <h4>${wish.name}</h4>
          <span>${timeAgo}</span>
        </div>
        <p>${wish.message}</p>
      `;

      wishCard.style.opacity = '0';
      wishCard.style.transform = 'translateY(20px)';
      DOM.forms.wishesList.insertBefore(wishCard, DOM.forms.wishesList.firstChild);

      setTimeout(() => {
        wishCard.style.transition = 'all 0.5s ease';
        wishCard.style.opacity = '1';
        wishCard.style.transform = 'translateY(0)';
      }, 100);
    },

    submit: async (e) => {
      e.preventDefault();

      const formData = {
        name: document.getElementById('name').value,
        attendance: document.getElementById('attendance').value,
        guests: document.getElementById('guests').value,
        message: document.getElementById('message').value
      };

      if (!formData.name || !formData.attendance || !formData.message) {
        utils.showAlert('error', 'Oops!', 'Mohon lengkapi semua field yang diperlukan.');
        return;
      }

      try {
        const response = await fetch('wishes_handler.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.status === 'success') {
          controllers.wishes.addCard({
            ...formData,
            created_at: new Date().toISOString()
          });
          DOM.forms.rsvp.reset();
          utils.showAlert('success', 'Terima Kasih!', 'Ucapan dan konfirmasi kehadiran Anda telah kami terima.');
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Error submitting wish:', error);
        utils.showAlert('error', 'Oops!', 'Terjadi kesalahan saat mengirim ucapan. Silakan coba lagi.');
      }
    }
  },

  gallery: {
    currentIndex: 0,
    isDragging: false,
    startX: 0,
    autoplayInterval: null,

    init: () => {
      // Create dots
      DOM.gallery.items.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('gallery-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => controllers.gallery.goToSlide(index));
        DOM.gallery.dots.appendChild(dot);
      });

      // Event listeners
      if (DOM.gallery.prevBtn && DOM.gallery.nextBtn) {
        DOM.gallery.prevBtn.addEventListener('click', controllers.gallery.prevSlide);
        DOM.gallery.nextBtn.addEventListener('click', controllers.gallery.nextSlide);
      }

      // Touch events
      DOM.gallery.container.addEventListener('touchstart', (e) => {
        controllers.gallery.startX = e.touches[0].clientX;
        controllers.gallery.isDragging = true;
      });

      DOM.gallery.container.addEventListener('touchmove', (e) => {
        if (!controllers.gallery.isDragging) return;
        const currentX = e.touches[0].clientX;
        const diff = controllers.gallery.startX - currentX;
        const offset = -controllers.gallery.currentIndex * 100 - (diff / DOM.gallery.container.offsetWidth) * 100;
        DOM.gallery.container.style.transform = `translateX(${offset}%)`;
      });

      DOM.gallery.container.addEventListener('touchend', (e) => {
        controllers.gallery.isDragging = false;
        const endX = e.changedTouches[0].clientX;
        const diff = controllers.gallery.startX - endX;

        if (Math.abs(diff) > 50) {
          diff > 0 ? controllers.gallery.nextSlide() : controllers.gallery.prevSlide();
        } else {
          controllers.gallery.goToSlide(controllers.gallery.currentIndex);
        }
      });

      // Autoplay
      controllers.gallery.startAutoplay();
      DOM.gallery.container.addEventListener('mouseenter', () => controllers.gallery.stopAutoplay());
      DOM.gallery.container.addEventListener('mouseleave', () => controllers.gallery.startAutoplay());
    },

    updateDots: () => {
      document.querySelectorAll('.gallery-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === controllers.gallery.currentIndex);
      });
    },

    goToSlide: (index) => {
      controllers.gallery.currentIndex = index;
      DOM.gallery.container.style.transform = `translateX(${-index * 100}%)`;
      controllers.gallery.updateDots();
    },

    nextSlide: () => {
      controllers.gallery.currentIndex = (controllers.gallery.currentIndex + 1) % DOM.gallery.items.length;
      controllers.gallery.goToSlide(controllers.gallery.currentIndex);
    },

    prevSlide: () => {
      controllers.gallery.currentIndex = (controllers.gallery.currentIndex - 1 + DOM.gallery.items.length) % DOM.gallery.items.length;
      controllers.gallery.goToSlide(controllers.gallery.currentIndex);
    },

    startAutoplay: () => {
      controllers.gallery.autoplayInterval = setInterval(controllers.gallery.nextSlide, CONFIG.GALLERY_AUTOPLAY_INTERVAL);
    },

    stopAutoplay: () => {
      clearInterval(controllers.gallery.autoplayInterval);
    }
  },

  clipboard: {
    init: () => {
      DOM.copyButtons.forEach(button => {
        button.addEventListener('click', async () => {
          const accountNumber = button.getAttribute('data-clipboard');
          const bankName = button.closest('.bank-item').querySelector('h4').textContent;
          
          if (!accountNumber) {
            utils.showAlert('error', 'Oops!', 'Nomor rekening tidak tersedia.');
            return;
          }

          try {
            // Try using modern Clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
              await navigator.clipboard.writeText(accountNumber);
            } else {
              // Fallback for older browsers
              const textArea = document.createElement('textarea');
              textArea.value = accountNumber;
              textArea.style.position = 'fixed';
              textArea.style.left = '-999999px';
              textArea.style.top = '-999999px';
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              
              try {
                document.execCommand('copy');
                textArea.remove();
              } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
                textArea.remove();
                throw new Error('Copy failed');
              }
            }
            
            // Add copied class for animation
            button.classList.add('copied');
            
            // Change icon to checkmark with animation
            const icon = button.querySelector('i');
            icon.style.transition = 'transform 0.3s ease';
            icon.className = 'fas fa-check';
            icon.style.transform = 'scale(1.2)';
            
            // Show success alert with bank name
            utils.showAlert('success', 'Berhasil!', `Nomor rekening ${bankName} berhasil disalin ke clipboard`);
            
            // Reset button after animation
            setTimeout(() => {
              button.classList.remove('copied');
              icon.className = 'fas fa-copy';
              icon.style.transform = 'scale(1)';
            }, 2000);
          } catch (err) {
            console.error('Failed to copy text: ', err);
            utils.showAlert('error', 'Oops!', 'Gagal menyalin nomor rekening. Silakan salin secara manual.');
          }
        });
      });
    }
  }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize audio controls
  DOM.audio.button.addEventListener('click', controllers.audio.toggle);

  // Initialize page transitions
  controllers.page.init();

  // Initialize countdown
  controllers.countdown.init();

  // Initialize wishes system
  DOM.forms.rsvp.addEventListener('submit', controllers.wishes.submit);
  controllers.wishes.load();

  // Initialize gallery
  controllers.gallery.init();

  // Initialize clipboard
  controllers.clipboard.init();

  // Initialize smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
});
