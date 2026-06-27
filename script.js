/* ============================================
   VERDUN AUTOMOTORES - JAVASCRIPT INTERACTIVO
   ============================================ */

// ============================================
// GOOGLE SHEETS - INVENTARIO DE VEHÍCULOS
// ============================================
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/16WBDELGRENY08zZiJRnsWm6cP-lB55Q-kGmE0R_RWSk/gviz/tq?tqx=out:csv&gid=663097902';
const PHOTOS_STORAGE_KEY = 'verdun_vehicle_photos';

// Marca actual (se actualiza al parsear el CSV)
let currentBrand = '';
let vehicleIdCounter = 0;

/**
 * Parsea una línea CSV respetando comillas
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * Detecta si una fila es encabezado de marca (FORD, TOYOTA, etc.)
 */
function isBrandRow(columns) {
    const brandNames = ['FORD', 'VOLKSWAGEN', 'TOYOTA', 'RENAULT', 'FIAT', 'CAMION', 'NISSAN', 'PEUGEOT', 'BMW', 'DODGE', 'MOTO', 'HONDA', 'CHEVROLET', 'CITROEN', 'SUZUKI', 'HYUNDAI', 'KIA', 'MERCEDES', 'AUDI', 'SUBARU', 'LEXUS', 'MAZDA', 'MITSUBISHI'];
    const firstCol = columns[0]?.toUpperCase().trim();
    
    // Es marca si la primera columna es un nombre de marca conocido
    // y las demás columnas están vacías o son fechas/notas
    if (brandNames.includes(firstCol)) {
        const emptyCols = columns.slice(1).filter(c => c === '' || c.match(/^\d{1,2}\/\d{1,2}/) || c.includes('renove') || c.includes('NP') || c.includes('falta')).length;
        if (emptyCols >= columns.length - 2) {
            return true;
        }
    }
    return false;
}

/**
 * Detecta si una fila es encabezado de columnas (MODELO, COLOR, etc.)
 */
function isHeaderRow(columns) {
    return columns[0]?.toUpperCase().includes('MODELO') || columns[0]?.toUpperCase().includes('ACLARACION');
}

/**
 * Parsea el CSV de Google Sheets y retorna array de vehículos
 */
function parseVehicleCSV(csvText) {
    const lines = csvText.split('\n');
    const vehicles = [];
    currentBrand = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = parseCSVLine(line);
        
        // Saltar filas de encabezado y aclaraciones
        if (isHeaderRow(columns)) continue;
        if (columns[0]?.includes('ACLARACION')) continue;
        if (columns[0]?.match(/^\d{2}\/\d{2}\/\d{4}$/)) continue; // Fecha
        
        // Detectar marca
        if (isBrandRow(columns)) {
            currentBrand = columns[0].trim();
            continue;
        }
        
        // Filas vacías o con pocos datos
        if (columns.length < 4) continue;
        
        const modelo = columns[0]?.trim();
        const color = columns[1]?.trim() || '';
        const yearStr = columns[2]?.trim() || '';
        const kmStr = columns[3]?.trim() || '';
        const precioStr = columns[4]?.trim() || '';
        
        // Saltar si no hay modelo
        if (!modelo || modelo === '' || modelo.includes('MODELO')) continue;
        
        // Parsear año
        const year = parseInt(yearStr) || 2024;
        
        // Parsear kilómetros
        let km = kmStr;
        if (kmStr.includes('0 KM') || kmStr === '0' || kmStr === '') {
            km = '0 KM';
        } else {
            km = kmStr.replace(/\./g, '').replace(/,/g, '') + ' km';
        }
        
        // Parsear precio
        let precio = 0;
        let precioStr2 = '';
        if (precioStr) {
            if (precioStr.includes('USD')) {
                // Precio en dólares - lo mostramos pero no convertimos
                precioStr2 = precioStr;
                precio = 0;
            } else {
                const cleanPrice = precioStr.replace(/[$ ]/g, '').replace(/\./g, '').replace(/,/g, '');
                precio = parseInt(cleanPrice) || 0;
            }
        }
        
        vehicleIdCounter++;
        
        vehicles.push({
            id: vehicleIdCounter,
            marca: currentBrand,
            modelo: modelo,
            año: year,
            precio: precio,
            precioDisplay: precioStr || precioStr2 || 'Consultar',
            km: km,
            color: color,
            image: `images/${getModelSlug(currentBrand, modelo)}.jpg`
        });
    }
    
    return vehicles;
}

/**
 * Genera un slug para el nombre del archivo de imagen
 */
function getModelSlug(marca, modelo) {
    return `${marca.toLowerCase()}-${modelo.toLowerCase()}`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Carga fotos del admin (localStorage)
 */
function loadVehiclePhotos() {
    try {
        return JSON.parse(localStorage.getItem(PHOTOS_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

/**
 * Guarda foto del admin (localStorage)
 */
function saveVehiclePhoto(vehicleId, base64Data) {
    const photos = loadVehiclePhotos();
    photos[vehicleId] = base64Data;
    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos));
}

/**
 * Obtiene la imagen del vehículo (admin photo o placeholder)
 */
function getVehicleImage(vehicle, photos) {
    // Primero buscar foto del admin
    if (photos[vehicle.id]) {
        return photos[vehicle.id];
    }
    // Luego intentar imagen del repo
    return vehicle.image;
}

// ============================================
// DATOS DE INVENTARIO DE VEHÍCULOS (se cargan desde Google Sheets)
// ============================================
let vehicleInventory = {};

/**
 * Carga el inventario desde Google Sheets
 */
async function loadInventoryFromSheets() {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL);
        const csvText = await response.text();
        const vehicles = parseVehicleCSV(csvText);
        
        // Agrupar por marca
        const byBrand = {};
        vehicles.forEach(v => {
            if (!byBrand[v.marca]) {
                byBrand[v.marca] = [];
            }
            byBrand[v.marca].push(v);
        });
        
        // Crear estructura de inventory
        vehicleInventory = {};
        Object.keys(byBrand).forEach(brand => {
            vehicleInventory[brand.toLowerCase()] = {
                title: brand,
                vehicles: byBrand[brand]
            };
        });
        
        // Guardar en variable global para uso del admin
        window._allVehicles = vehicles;
        
        console.log(`✅ Cargados ${vehicles.length} vehículos desde Google Sheets`);
        return vehicles;
    } catch (error) {
        console.error('❌ Error cargando vehículos:', error);
        return [];
    }
}

// Número de WhatsApp (reemplazar con número real)
const WHATSAPP_NUMBER = '543765345678'; // Formato: 54 (Argentina) + 9 (celular) + número

// ============================================
// FUNCIONES DE MODAL DE STOCK
// ============================================

/**
 * Abre el modal de stock para la categoría especificada
 */
function openStockModal(category) {
    const modal = document.getElementById('stockModal');
    const inventory = vehicleInventory[category];
    
    if (!inventory) {
        console.error(`Categoría ${category} no encontrada`);
        return;
    }
    
    // Actualizar título
    document.getElementById('stockModalTitle').textContent = inventory.title;
    
    // Renderizar vehículos
    renderVehicles(inventory.vehicles, category);
    
    // Mostrar modal con animación
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevenir scroll
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
    
    const photos = loadVehiclePhotos();
    
    vehicles.forEach(vehicle => {
        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'vehicle-card';
        
        const imageSrc = getVehicleImage(vehicle, photos);
        
        vehicleCard.innerHTML = `
            <div class="vehicle-image-wrapper">
                <img 
                    src="${imageSrc}" 
                    alt="${vehicle.marca} ${vehicle.modelo}" 
                    class="vehicle-image"
                    onerror="this.src='https://via.placeholder.com/400x225?text=Sin+imagen'"
                >
            </div>
            <div class="vehicle-info">
                <h4 class="vehicle-title">${vehicle.marca} ${vehicle.modelo}</h4>
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
                    onclick="consultarWhatsApp('${vehicle.marca}', '${vehicle.modelo}', ${vehicle.año})"
                >
                    Consultar por WhatsApp
                </button>
            </div>
        `;
        
        container.appendChild(vehicleCard);
    });
}

/**
 * Abre WhatsApp con mensaje predefinido
 */
function consultarWhatsApp(marca, modelo, año) {
    const mensaje = `Hola! Me interesa el ${marca} ${modelo} ${año} que vi en su sitio web. ¿Podrían darme más información?`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
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
// 0. CARGAR DATOS EDITADOS DEL ADMIN (DESDE LOCALSTORAGE)
// ============================================
async function loadAdminContent() {
    // Cargar métricas editadas desde localStorage
    try {
        const metrics = JSON.parse(localStorage.getItem('verdun_metrics') || 'null');
        if (metrics) {
            const metricsItems = document.querySelectorAll('.metric-item');
            metrics.forEach((metric, index) => {
                if (metricsItems[index]) {
                    metricsItems[index].querySelector('.metric-icon').textContent = metric.icon;
                    metricsItems[index].querySelector('.metric-text').textContent = metric.text;
                }
            });
        }
    } catch (e) {
        console.log('No hay métricas guardadas');
    }
    
    // Cargar contenido editado desde localStorage
    try {
        const content = JSON.parse(localStorage.getItem('verdun_content') || 'null');
        if (content) {
            const heroTitle = document.querySelector('.hero-title');
            const heroSubtitle = document.querySelector('.hero-subtitle');
            const statNumbers = document.querySelectorAll('.stat-number');
            
            if (heroTitle && content.heroTitle) {
                heroTitle.innerHTML = `${content.heroTitle}<br><span class="highlight">${content.heroHighlight || ''}</span>`;
            }
            
            if (heroSubtitle && content.heroSubtitle) {
                heroSubtitle.textContent = content.heroSubtitle;
            }
            
            if (statNumbers[0] && content.statYears) {
                statNumbers[0].textContent = content.statYears;
            }
            if (statNumbers[1] && content.statVehicles) {
                statNumbers[1].textContent = content.statVehicles;
            }
        }
    } catch (e) {
        console.log('No hay contenido guardado');
    }
    
    // Cargar servicios editados desde localStorage
    try {
        const services = JSON.parse(localStorage.getItem('verdun_services') || 'null');
        if (services) {
            const serviceCards = document.querySelectorAll('.service-card-flip');
            services.forEach((service, index) => {
                if (serviceCards[index]) {
                    const backCard = serviceCards[index].querySelector('.service-card-back');
                    if (backCard) {
                        const p = backCard.querySelector('p');
                        const featuresDiv = backCard.querySelector('.service-features');
                        
                        if (p && service.desc) p.textContent = service.desc;
                        
                        if (featuresDiv && service.features) {
                            featuresDiv.innerHTML = service.features.map(f => 
                                `<span class="feature-tag">${f}</span>`
                            ).join('');
                        }
                    }
                }
            });
        }
    } catch (e) {
        console.log('No hay servicios guardados');
    }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { loadAdminContent(); });
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
    // createFloatingWhatsAppButton(); // Eliminado
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
// MANEJO DE IMÁGENES (LOCALSTORAGE)
// ============================================

function handleImageUpload(event, imageType) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
        showStatus('❌ Solo se permiten archivos de imagen', 'error');
        return;
    }
    
    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showStatus('❌ Archivo muy grande (máx 5MB)', 'error');
        return;
    }
    
    // Redimensionar imagen
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            const MAX_HEIGHT = 450;
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height = (height * MAX_WIDTH) / width;
                width = MAX_WIDTH;
            }
            if (height > MAX_HEIGHT) {
                width = (width * MAX_HEIGHT) / height;
                height = MAX_HEIGHT;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const base64 = canvas.toDataURL('image/jpeg', 0.6);
            
            // Guardar en localStorage
            let images = JSON.parse(localStorage.getItem('verdun_images') || '{}');
            images[imageType] = {
                name: file.name,
                size: (file.size / 1024).toFixed(2) + ' KB',
                data: base64,
                timestamp: new Date().toLocaleString('es-AR')
            };
            localStorage.setItem('verdun_images', JSON.stringify(images));
            
            // Actualizar UI
            updateImageUI(imageType, base64, file.size);
            showStatus(`✅ ${imageType} cargado correctamente`, 'success');
            
            // Actualizar en la página
            updatePageImages();
        };
        img.src = e.target.result;
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
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'admin-status ' + type;
        
        setTimeout(() => {
            statusElement.className = 'admin-status';
        }, 3000);
    }
}

function loadSavedImages() {
    const images = JSON.parse(localStorage.getItem('verdun_images') || '{}');
    
    Object.keys(images).forEach(imageType => {
        const image = images[imageType];
        updateImageUI(imageType, image.data, parseFloat(image.size) * 1024);
    });
}

function updatePageImages() {
    const images = JSON.parse(localStorage.getItem('verdun_images') || '{}');
    
    // Actualizar todas las imágenes en la página
    Object.keys(images).forEach(imageType => {
        const base64 = images[imageType].data;
        
        // Buscar todos los img con src de images/
        document.querySelectorAll(`img[src*="images/${imageType}.png"]`).forEach(img => {
            img.src = base64;
        });
        document.querySelectorAll(`img[src*="images/${imageType}.jpg"]`).forEach(img => {
            img.src = base64;
        });
    });
}

function exportImages() {
    const images = JSON.parse(localStorage.getItem('verdun_images') || '{}');
    
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
        localStorage.removeItem('verdun_images');
        
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
    loadInventoryFromSheets();
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
