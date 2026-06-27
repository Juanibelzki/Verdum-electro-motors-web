/* ============================================
   VERDUN AUTOMOTORES - JAVASCRIPT INTERACTIVO
   ============================================ */

// ============================================
// SISTEMA DE STOCK POR CARPETAS (JSON EN REPO)
// ============================================

const CATEGORY_FOLDERS = {
    'autos-0km': '0km',
    'autos-usados': 'usados',
    'motos-electricas': 'motos',
    'patinetas-electricas': 'patacletas',
    'vehiculos-especiales': 'especiales'
};

const CATEGORY_TITLES = {
    'autos-0km': 'Autos 0KM',
    'autos-usados': 'Autos Usados',
    'motos-electricas': 'Motos Eléctricas',
    'patinetas-electricas': 'Patinetas Eléctricas',
    'vehiculos-especiales': 'Vehículos Especiales'
};

let stockCache = null;

async function loadStockFromJSON() {
    if (stockCache) return stockCache;

    const inventory = {};
    let idCounter = 0;

    for (const catKey of Object.keys(CATEGORY_FOLDERS)) {
        const folder = CATEGORY_FOLDERS[catKey];
        let slugs = [];
        try {
            const resp = await fetch(`images/stock/${folder}/index.json`);
            slugs = await resp.json();
        } catch {}

        const vehicles = [];

        for (const slug of slugs) {
            try {
                const resp = await fetch(`images/stock/${folder}/${slug}/datos.json`);
                const data = await resp.json();
                idCounter++;

                const marca = data.nombre.split(' ')[0] || slug.split('-')[0];
                const firstPhoto = data.fotos && data.fotos.length > 0
                    ? `images/stock/${folder}/${slug}/${data.fotos[0]}`
                    : `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"/%3E`;

                vehicles.push({
                    id: idCounter,
                    marca: marca,
                    modelo: data.nombre,
                    nombre: data.nombre,
                    año: data.año,
                    km: data.km,
                    color: data.color,
                    precio: data.precio || 'Consultar',
                    descripcion: data.descripcion || '',
                    image: firstPhoto,
                    fotos: data.fotos || [],
                    slug: slug,
                    folder: folder,
                    whatsappMsg: data.whatsapp || `Hola! Me interesa el ${data.nombre} que vi en su sitio web.`
                });
            } catch {}
        }

        inventory[catKey] = { title: CATEGORY_TITLES[catKey], vehicles: vehicles };
    }

    stockCache = inventory;
    return inventory;
}

const VEHICLES_STORAGE_KEY = 'verdun_vehicles';
const CUSTOM_VEHICLES_KEY = 'verdun_custom_vehicles';

async function getMergedVehicleInventory() {
    const inventory = await loadStockFromJSON();

    const overrides = JSON.parse(localStorage.getItem(VEHICLES_STORAGE_KEY)) || {};
    Object.keys(inventory).forEach(catKey => {
        inventory[catKey].vehicles = inventory[catKey].vehicles.map(v => {
            const o = overrides[v.id];
            if (!o) return v;
            return { ...v, nombre: o.nombre, descripcion: o.descripcion, precio: o.precio !== undefined ? o.precio : v.precio, año: o.anio !== undefined ? o.anio : v.año, km: o.km !== undefined ? o.km : v.km, color: o.color !== undefined ? o.color : v.color, image: o.image || v.image };
        });
    });

    const customVehicles = JSON.parse(localStorage.getItem(CUSTOM_VEHICLES_KEY)) || [];
    customVehicles.forEach(cv => {
        if (inventory[cv.category]) {
            inventory[cv.category].vehicles.push({
                id: cv.id, marca: cv.marca, modelo: cv.modelo, nombre: cv.nombre || `${cv.marca} ${cv.modelo}`,
                año: cv.anio, precio: cv.precio, km: cv.km, color: cv.color,
                descripcion: cv.descripcion || '',
                image: cv.image || `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"/%3E`,
                fotos: [], slug: '', folder: '', whatsappMsg: `Hola! Me interesa el ${cv.marca} ${cv.modelo} que vi en su sitio web.`
            });
        }
    });

    return inventory;
}

function getVehicleDisplayName(vehicle) {
    return vehicle.nombre || `${vehicle.marca} ${vehicle.modelo}`;
}

const WHATSAPP_NUMBER = '543795300020';

function consultarWhatsApp(vehicleName, año, customMsg) {
    const mensaje = customMsg || `Hola! Me interesa el ${vehicleName}${año ? ' (' + año + ')' : ''} que vi en su sitio web. ¿Podrían darme más información?`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

function enviarWhatsApp(mensaje) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// ============================================
// FUNCIONES DE MODAL DE STOCK
// ============================================

let currentStockVehicles = [];

/**
 * Abre el modal de stock para la categoría especificada
 */
async function openStockModal(category) {
    const modal = document.getElementById('stockModal');
    const merged = await getMergedVehicleInventory();
    const inventory = merged[category];
    
    if (!inventory) {
        console.error(`Categoría ${category} no encontrada`);
        return;
    }
    
    // Actualizar título
    document.getElementById('stockModalTitle').textContent = inventory.title;
    currentStockVehicles = inventory.vehicles;
    
    // Limpiar filtro
    const filterInput = document.getElementById('stockFilter');
    if (filterInput) filterInput.value = '';
    
    // Renderizar vehículos
    renderVehicles(currentStockVehicles, category);
    
    // Mostrar modal con animación
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevenir scroll
}

function filterStock() {
    const query = document.getElementById('stockFilter').value.toLowerCase().trim();
    if (!query) {
        renderVehicles(currentStockVehicles);
        return;
    }
    const filtered = currentStockVehicles.filter(v => {
        const name = getVehicleDisplayName(v).toLowerCase();
        const desc = (v.descripcion || '').toLowerCase();
        return name.includes(query) || desc.includes(query);
    });
    renderVehicles(filtered);
}

/**
 * Cierra el modal de stock
 */
function closeStockModal() {
    const modal = document.getElementById('stockModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaurar scroll
}

/**
 * Renderiza los vehículos en el contenedor del modal
 */
function renderVehicles(vehicles, category) {
    const container = document.getElementById('stockVehiclesContainer');
    container.innerHTML = '';

    if (!vehicles || vehicles.length === 0) {
        container.innerHTML = '<p class="empty-stock">No hay vehículos disponibles en esta categoría</p>';
        return;
    }

    vehicles.forEach(vehicle => {
        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'vehicle-card';

        const displayName = getVehicleDisplayName(vehicle);
        const descripcionHtml = vehicle.descripcion
            ? `<p class="vehicle-description">${vehicle.descripcion}</p>`
            : '';
        const safeName = String(displayName).replace(/'/g, "\\'");
        const imageSrc = vehicle.image;
        const whatsappMsg = vehicle.whatsappMsg
            ? String(vehicle.whatsappMsg).replace(/'/g, "\\'")
            : '';

        vehicleCard.innerHTML = `
            <div class="vehicle-image-wrapper">
                <img 
                    src="${imageSrc}" 
                    alt="${displayName}" 
                    class="vehicle-image"
                    loading="lazy"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"225\"/%3E'"
                >
            </div>
            <div class="vehicle-info">
                <h4 class="vehicle-title">${displayName}</h4>
                ${descripcionHtml}
                <div class="vehicle-details">
                    <span class="detail-item">
                        <strong>Año:</strong> ${vehicle.año}
                    </span>
                    <span class="detail-item">
                        <strong>KM:</strong> ${vehicle.km}
                    </span>
                    <span class="detail-item">
                        <strong>Color:</strong> ${vehicle.color}
                    </span>
                </div>
                <button 
                    class="btn-consultar" 
                    onclick="consultarWhatsApp('${safeName}', ${vehicle.año || 0}, '${whatsappMsg}')"
                >
                    Consultar por WhatsApp
                </button>
            </div>
        `;

        container.appendChild(vehicleCard);
    });
}


/**
 * Formatea el precio en pesos argentinos
 */
function formatPrice(price) {
    return `$${price.toLocaleString('es-AR')}`;
}

// ============================================
// EVENT LISTENERS PARA MODAL
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('stockModal');
    
    // Cerrar modal al hacer clic en el overlay
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeStockModal();
            }
        });
    }
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            closeStockModal();
        }
    });
});

// ============================================
// CARGAR DATOS EDITADOS DEL ADMIN
// ============================================

function getAdminData(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function loadAdminContent() {
    const services = getAdminData('services', []);
    const content = getAdminData('content', {});
    const testimonios = getAdminData('testimonios', []);
    const financing = getAdminData('financing_images', {});

    applyFinancingData(financing);
    applyContentData(content, services, testimonios);
}

function applyFinancingData(financing) {
    if (!financing || Object.keys(financing).length === 0) return;
    Object.entries(financing).forEach(([type, data]) => {
        const img = document.querySelector(`img[data-image-type="${type}"]`);
        if (!img) return;
        if (data.url) img.src = data.url;
        else if (data.fallback_base64) img.src = data.fallback_base64;
        const card = img.closest('.financing-card');
        if (!card) return;
        const titleEl = card.querySelector('.financing-card-title');
        const descEl = card.querySelector('.financing-card-description');
        const featuresEl = card.querySelector('.financing-card-features');
        if (titleEl && data.title) titleEl.textContent = data.title;
        if (descEl && data.description) descEl.textContent = data.description;
        if (featuresEl && data.features && Array.isArray(data.features)) {
            featuresEl.innerHTML = data.features.map(f => `<li>✓ ${f}</li>`).join('');
        }
    });
}

function applyContentData(content, services, testimonios) {
    if (content && Object.keys(content).length > 0) {
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const statNumbers = document.querySelectorAll('.stat-number');
        if (heroTitle) {
            heroTitle.innerHTML = `${content.heroTitle}<br><span class="highlight">${content.heroHighlight}</span>`;
        }
        if (heroSubtitle) heroSubtitle.textContent = content.heroSubtitle;
        if (statNumbers[0]) statNumbers[0].textContent = content.statYears;
        if (statNumbers[1]) statNumbers[1].textContent = content.statVehicles;
    }

    if (services && services.length > 0) {
        const serviceCards = document.querySelectorAll('.service-card-flip');
        serviceCards.forEach((card, index) => {
            const service = services[index];
            if (!service || !card) return;
            const backCard = card.querySelector('.service-card-back');
            if (!backCard) return;
            const p = backCard.querySelector('p');
            const featuresDiv = backCard.querySelector('.service-features');
            if (p) p.textContent = service.desc;
            if (featuresDiv && service.features) {
                featuresDiv.innerHTML = service.features.map(f =>
                    `<span class="feature-tag">${f}</span>`
                ).join('');
            }
        });
    }

    if (testimonios && testimonios.length > 0) {
        const testimonioCards = document.querySelectorAll('.testimonio-card');
        testimonioCards.forEach((card, index) => {
            const t = testimonios[index];
            if (!t || !card) return;
            const textEl = card.querySelector('.testimonio-text');
            const nameEl = card.querySelector('.author-name');
            const roleEl = card.querySelector('.author-role');
            if (textEl) textEl.textContent = t.text;
            if (nameEl) nameEl.textContent = t.author;
            if (roleEl) roleEl.textContent = t.role;
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAdminContent);
} else {
    loadAdminContent();
}

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
    const isPercent = target.toString().includes('%');
    const hasPlus = !isPercent && target.toString().includes('+');
    const cleanTarget = parseInt(target.toString().replace(/\D/g, ''));
    if (isNaN(cleanTarget) || cleanTarget === 0) return;
    const suffix = isPercent ? '%' : hasPlus ? '+' : '';

    const startTime = performance.now();

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const current = Math.round(easedProgress * cleanTarget);

        element.textContent = current + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = cleanTarget + suffix;
        }
    }

    requestAnimationFrame(update);
}

// Ejecutar contadores cuando sean visibles
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
            entry.target.dataset.counted = 'true';
            const text = entry.target.textContent;
            animateCounter(entry.target, text);
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
    const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(textoCompleto)}`;
    
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
    button.href = `https://wa.me/${WHATSAPP_NUMBER}`;
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
    // createFloatingWhatsAppButton();
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
// 19. WHATSAPP NAVBAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const navWhatsAppBtn = document.getElementById('navWhatsAppBtn');
    if (navWhatsAppBtn) {
        navWhatsAppBtn.addEventListener('click', () => {
            window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
        });
    }
});

// ============================================
// FIN DEL SCRIPT
// ============================================
