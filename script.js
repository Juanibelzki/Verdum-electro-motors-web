/* ============================================
   VERDUN AUTOMOTORES - JAVASCRIPT INTERACTIVO
   ============================================ */

// ============================================
// 1. NAVBAR STICKY CON SCROLL
// ============================================
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ============================================
// 2. SMOOTH SCROLL PARA LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// 3. SCROLL REVEAL - FADE IN CON STAGGER
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Stagger effect
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
            
            // Detener observar una vez activado
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observar todos los elementos con fade-in
document.querySelectorAll('.fade-in').forEach(el => {
    // Agregar estilo inicial
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    observer.observe(el);
});

// Estilo para visible
const style = document.createElement('style');
style.innerHTML = `
    .fade-in.visible {
        animation: fade-in-up 0.6s ease forwards !important;
    }
`;
document.head.appendChild(style);

// ============================================
// 4. FLIP CARDS EN MOBILE (TAP)
// ============================================
document.querySelectorAll('.service-card-flip').forEach(card => {
    card.addEventListener('click', function() {
        // Solo en dispositivos móviles
        if (window.innerWidth <= 1023) {
            const inner = this.querySelector('.service-card-inner');
            inner.classList.toggle('flipped');
        }
    });
});

// ============================================
// 5. CONTADOR ANIMADO
// ============================================
function animateCounter(element, target, duration = 2000) {
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

// Ejecutar contadores cuando sean visibles
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
            entry.target.dataset.counted = 'true';
            const target = parseInt(entry.target.textContent);
            const cleanTarget = target.toString().replace(/\D/g, '');
            animateCounter(entry.target, parseInt(cleanTarget));
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Observar elementos .stat-number
document.querySelectorAll('.stat-number').forEach(el => {
    counterObserver.observe(el);
});

// ============================================
// 6. SISTEMA DE PARTÍCULAS (50 PARTÍCULAS)
// ============================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    // Limpiar partículas previas
    container.innerHTML = '';
    
    // Crear 50 partículas
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Posición aleatoria
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const randomDelay = Math.random() * 20;
        const randomDuration = 15 + Math.random() * 10;
        
        particle.style.cssText = `
            left: ${randomX}%;
            top: ${randomY}%;
            animation-delay: ${randomDelay}s;
            animation-duration: ${randomDuration}s;
        `;
        
        container.appendChild(particle);
    }
}

// Crear partículas al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createParticles);
} else {
    createParticles();
}

// ============================================
// 7. FORMULARIO WHATSAPP
// ============================================
function enviarWA(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const interes = document.getElementById('interes').value;
    const mensaje = document.getElementById('mensaje').value.trim();
    
    // Validación
    if (!nombre || !interes) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }
    
    // Construir mensaje
    let textoCompleto = `Hola Verdun! Soy ${nombre}`;
    
    if (interes) {
        textoCompleto += `, me interesa: ${interes}`;
    }
    
    if (mensaje) {
        textoCompleto += `. ${mensaje}`;
    }
    
    textoCompleto += '.';
    
    // Número de WhatsApp de Verdun
    const numeroWhatsApp = '5493704724077';
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(textoCompleto)}`;
    
    // Abrir WhatsApp
    window.open(urlWhatsApp, '_blank');
    
    // Limpiar formulario
    document.querySelector('.cta-form').reset();
}

// ============================================
// 8. BOTONES CTA (GENERAL)
// ============================================
document.querySelectorAll('.nav-cta, .btn-primary, .btn-secondary').forEach(btn => {
    // Agregar efecto ripple al hacer clic
    btn.addEventListener('mousedown', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Crear efecto ripple
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        // Agregar animación ripple si no existe
        if (!document.querySelector('style[data-ripple]')) {
            const rippleStyle = document.createElement('style');
            rippleStyle.setAttribute('data-ripple', 'true');
            rippleStyle.innerHTML = `
                @keyframes ripple {
                    to {
                        width: 100px;
                        height: 100px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(rippleStyle);
        }
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        // Remover ripple después de animación
        setTimeout(() => ripple.remove(), 600);
    });
});

// ============================================
// 9. BOTÓN WHATSAPP FLOTANTE (OPCIONAL)
// ============================================
function createFloatingWhatsAppButton() {
    // Verificar si ya existe
    if (document.querySelector('.whatsapp-floating')) return;
    
    const button = document.createElement('a');
    button.href = 'https://wa.me/5493704724077';
    button.target = '_blank';
    button.className = 'whatsapp-floating';
    button.innerHTML = '💬';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #a8873d 0%, #c9a84c 30%, #f0c96b 60%, #c9a84c 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        box-shadow: 0 4px 24px rgba(201,168,76,0.4);
        z-index: 999;
        transition: all 0.3s ease;
        cursor: pointer;
    `;
    
    // Hover effect
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 8px 40px rgba(201,168,76,0.6)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 24px rgba(201,168,76,0.4)';
    });
    
    document.body.appendChild(button);
}

// Crear botón flotante después de cargar
window.addEventListener('load', () => {
    // createFloatingWhatsAppButton(); // Comentado por defecto
});

// ============================================
// 10. MANEJO DE FORMULARIO DE CONTACTO
// ============================================
function setupContactForm() {
    const form = document.querySelector('.cta-form');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        // Validación en tiempo real
        input.addEventListener('blur', function() {
            if (this.value.trim() === '' && this.hasAttribute('required')) {
                this.style.borderColor = '#ff6b6b';
            } else {
                this.style.borderColor = 'rgba(201,168,76,0.2)';
            }
        });
        
        // Limpiar error al escribir
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.style.borderColor = 'rgba(201,168,76,0.2)';
            }
        });
    });
    
    // Submit
    form.addEventListener('submit', function(e) {
        // La función enviarWA ya maneja esto
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupContactForm);
} else {
    setupContactForm();
}

// ============================================
// 11. MENÚ HAMBURGUESA MÓVIL
// ============================================
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    if (!hamburger) return;
    
    hamburger.addEventListener('click', function() {
        const navLinks = document.querySelector('.nav-links');
        
        if (navLinks.style.display === 'flex') {
            navLinks.style.display = 'none';
        } else {
            navLinks.style.cssText = `
                display: flex !important;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(0,0,0,0.95);
                flex-direction: column;
                padding: 20px 40px;
                gap: 20px;
                border-bottom: 1px solid rgba(201,168,76,0.1);
            `;
        }
    });
    
    // Cerrar menú al hacer clic en un link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.style.display = 'none';
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileMenu);
} else {
    setupMobileMenu();
}

// ============================================
// 12. DETECT DARK/LIGHT MODE PREFERENCE
// ============================================
function detectColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
    }
}

detectColorScheme();

// ============================================
// 13. PERFORMANCE: Lazy Loading de imágenes
// ============================================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ============================================
// 14. ANIMACIÓN DE SCROLL SUAVE
// ============================================
document.addEventListener('wheel', (e) => {
    // Este evento se dispara pero no interrumpimos el scroll
    // Solo para tracking si es necesario
}, { passive: true });

// ============================================
// 15. UTILIDADES Y HELPERS
// ============================================

// Función para animar números
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Función para verificar si un elemento está en viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// ============================================
// 16. INICIALIZACIÓN GENERAL
// ============================================
console.log('✅ Verdun Automotores - Script cargado correctamente');

// Log de información
console.log(`
╔════════════════════════════════════╗
║  VERDUN AUTOMOTORES - LANDING PAGE║
║  Dark Mode Premium - 2024          ║
╚════════════════════════════════════╝
`);

// ============================================
// 17. EVENT LISTENERS ADICIONALES
// ============================================

// Prevenir comportamientos por defecto en ciertos elementos
document.querySelectorAll('button[type="button"]').forEach(btn => {
    btn.addEventListener('click', function(e) {
        if (!this.onclick) {
            e.preventDefault();
        }
    });
});

// Agregar clase 'loaded' al body cuando todo está listo
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ============================================
// 18. MANEJO DE ERRORES Y VALIDACIÓN
// ============================================

// Validar enlaces externos
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', function(e) {
        // Los enlaces externos se abren normalmente
        // Pero podríamos agregar tracking aquí
    });
});

// ============================================
// 19. SISTEMA DE LOGIN Y ADMIN
// ============================================

const ADMIN_PASSWORD = 'admin123';
const IMAGES_STORAGE_KEY = 'verdun_images';

// Evento del botón login - Con verificación de que existe
document.addEventListener('DOMContentLoaded', () => {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const modal = document.getElementById('loginModal');
            const passwordInput = document.getElementById('adminPassword');
            if (modal && passwordInput) {
                modal.style.display = 'flex';
                passwordInput.focus();
            }
        });
    }
    
    // WhatsApp button in navbar
    const navWhatsAppBtn = document.getElementById('navWhatsAppBtn');
    if (navWhatsAppBtn) {
        navWhatsAppBtn.addEventListener('click', () => {
            window.open('https://wa.me/5493704724077', '_blank');
        });
    }
});

// Cerrar modal de login
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginForm').reset();
}

// Cerrar panel admin
function closeAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
}

// Manejar login
function handleLogin(event) {
    event.preventDefault();
    
    const password = document.getElementById('adminPassword').value.trim();
    
    if (password === ADMIN_PASSWORD) {
        closeLoginModal();
        openAdminPanel();
    } else {
        alert('❌ Contraseña incorrecta');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

// Abrir panel admin
function openAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'flex';
        loadSavedImages();
    }
}

// ============================================
// MANEJO DE IMÁGENES
// ============================================

function handleImageUpload(event, imageType) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar que sea PNG
    if (file.type !== 'image/png') {
        showStatus('❌ Solo se permiten archivos PNG', 'error');
        return;
    }
    
    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showStatus('❌ Archivo muy grande (máx 5MB)', 'error');
        return;
    }
    
    // Leer archivo
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        
        // Guardar en localStorage
        let images = JSON.parse(localStorage.getItem(IMAGES_STORAGE_KEY) || '{}');
        images[imageType] = {
            name: file.name,
            size: (file.size / 1024).toFixed(2) + ' KB',
            data: base64,
            timestamp: new Date().toLocaleString('es-AR')
        };
        localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(images));
        
        // Actualizar UI
        updateImageUI(imageType, base64, file.size);
        showStatus(`✅ ${imageType} cargado correctamente`, 'success');
        
        // Actualizar en la página
        updatePageImages();
    };
    reader.readAsDataURL(file);
}

function updateImageUI(imageType, base64, size) {
    // Actualizar tamaño
    const sizeElement = document.getElementById(imageType + 'Size');
    if (sizeElement) {
        sizeElement.textContent = (size / 1024).toFixed(2) + ' KB';
    }
    
    // Mostrar preview
    const previewElement = document.getElementById('preview' + capitalizeFirstLetter(imageType));
    if (previewElement) {
        previewElement.classList.add('active');
        previewElement.innerHTML = `<img src="${base64}" alt="${imageType}">`;
    }
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showStatus(message, type) {
    const statusElement = document.getElementById('adminStatus');
    statusElement.textContent = message;
    statusElement.className = 'admin-status ' + type;
    
    setTimeout(() => {
        statusElement.className = 'admin-status';
    }, 3000);
}

function loadSavedImages() {
    const images = JSON.parse(localStorage.getItem(IMAGES_STORAGE_KEY) || '{}');
    
    Object.keys(images).forEach(imageType => {
        const image = images[imageType];
        updateImageUI(imageType, image.data, parseFloat(image.size) * 1024);
    });
}

function updatePageImages() {
    const images = JSON.parse(localStorage.getItem(IMAGES_STORAGE_KEY) || '{}');
    
    // Actualizar todas las imágenes en la página
    Object.keys(images).forEach(imageType => {
        const base64 = images[imageType].data;
        
        // Buscar todos los img con src de images/
        document.querySelectorAll(`img[src*="images/${imageType}.png"]`).forEach(img => {
            img.src = base64;
        });
    });
}

function exportImages() {
    const images = JSON.parse(localStorage.getItem(IMAGES_STORAGE_KEY) || '{}');
    
    if (Object.keys(images).length === 0) {
        showStatus('❌ No hay imágenes para exportar', 'error');
        return;
    }
    
    // Crear objeto exportable
    const exportData = {};
    Object.keys(images).forEach(imageType => {
        exportData[imageType] = {
            name: images[imageType].name,
            size: images[imageType].size,
            timestamp: images[imageType].timestamp
        };
    });
    
    // Descargar JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'verdun_images_info.json';
    link.click();
    
    showStatus('✅ Información de imágenes exportada', 'success');
}

function clearAllImages() {
    if (confirm('⚠️ ¿Estás seguro? Se borrarán TODAS las imágenes cargadas.')) {
        localStorage.removeItem(IMAGES_STORAGE_KEY);
        
        // Limpiar UI
        document.querySelectorAll('.preview-mini').forEach(el => {
            el.classList.remove('active');
            el.innerHTML = '';
        });
        
        document.querySelectorAll('.file-size').forEach(el => {
            el.textContent = '';
        });
        
        showStatus('✅ Todas las imágenes fueron eliminadas', 'success');
    }
}

// ============================================
// CARGAR IMÁGENES AL CARGAR LA PÁGINA
// ============================================

window.addEventListener('load', () => {
    updatePageImages();
});

// ============================================
// CERRAR MODAL AL PRESIONAR ESC
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const loginModal = document.getElementById('loginModal');
        const adminPanel = document.getElementById('adminPanel');
        if (loginModal) loginModal.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'none';
    }
});

// ============================================
// CERRAR MODAL AL HACER CLICK FUERA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeLoginModal();
            }
        });
    }
});

console.log('✅ Sistema de admin cargado correctamente');

// ============================================
// FIN DEL SCRIPT
// ============================================
