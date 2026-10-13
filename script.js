// ============================================
// VERDUN AUTOMOTORES - JAVASCRIPT INTERACTIVO
// ============================================

/* ============================================
   SUPABASE - CONEXIÓN Y CONSULTAS
   ============================================ */

const SUPABASE_URL = 'https://ymiakfjhgndqhdtoubkr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaWFrZmpoZ25kcWhkdG91YmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjkyNTIsImV4cCI6MjEwMDYwNTI1Mn0.Q0opccAEYWgkuyV1unwnpNu0OiWbio3E1pAURi8GPaI';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================
   AYUDANTES DE TEXTO
   ============================================ */

/**
 * Devuelve el título limpio del vehículo, evitando duplicados consecutivos.
 * Si vehicle.nombre ya existe y no está vacío, lo usa directamente.
 * Si no, construye marca modelo sin repetir palabras.
 */
function getCleanVehicleTitle(vehicle) {
    if (vehicle.nombre && vehicle.nombre.trim().length > 0) {
        const nombreLower = vehicle.nombre.toLowerCase().trim();
        const marcaLower = (vehicle.marca || '').toLowerCase().trim();
        const modeloLower = (vehicle.modelo || '').toLowerCase().trim();
        
        if (nombreLower.includes(marcaLower) && nombreLower.includes(modeloLower)) {
            return vehicle.nombre;
        }
        if (nombreLower.includes(marcaLower) || nombreLower.includes(modeloLower)) {
            return `${vehicle.marca || ''} ${vehicle.modelo || ''}`.trim();
        }
        return vehicle.nombre;
    }
    return `${vehicle.marca || ''} ${vehicle.modelo || ''}`.trim();
}

/**
 * Formatea el kilometraje de forma limpia:
 * - Si es 0 o "0", o el vehículo es 0km: muestra "0 km".
 * - Si viene como "175000", "175000 KM" o número 175000: formatea con separador de miles y " km".
 */
function formatKilometers(kmRaw) {
    if (kmRaw === null || kmRaw === undefined) return '0 km';
    const kmStr = String(kmRaw).trim();
    if (kmStr === '0' || kmStr === '0 KM' || kmStr.toLowerCase() === '0km') {
        return '0 km';
    }
    const digits = kmStr.replace(/[^0-9.,]/g, '');
    if (!digits) return '0 km';
    let clean = digits.replace(/[.,]/g, '');
    if (clean.includes('.')) {
        const parts = clean.split('.');
        if (parts[1] && parts[1].length === 3) {
            clean = parts[0] + parts[1];
        } else {
            clean = clean.replace(/\./g, '');
        }
    }
    const num = parseFloat(clean);
    if (isNaN(num)) return '0 km';
    const formatted = num.toLocaleString('es-AR', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    return formatted + ' km';
}

/**
 * Formatea el texto de descripción y equipamiento de un vehículo proveniente de Instagram.
 * Separa viñetas (•, -, *, ✓, ·) de párrafos descriptivos y renderiza HTML estructurado.
 *
 * @param {string} rawText - Texto crudo del campo descripcion de Supabase
 * @returns {string} HTML estructurado con vm-summary-box y/o vm-features-list
 */
function formatVehicleDescription(rawText) {
    if (!rawText || rawText.trim().length === 0) {
        return 'Consultá por más detalles y equipamiento de esta unidad.';
    }

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    const bulletLines = [];
    const paragraphLines = [];

    const hasBullets = lines.some(line => {
        const stripped = line.replace(/^[•\-\*\·\✓\s]+/, '');
        return line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('✓') || line.startsWith('·') || line.includes('•');
    });

    if (hasBullets) {
        for (const line of lines) {
            let items = [];
            if (line.includes('•')) {
                items = line.split('•').map(p => p.trim()).filter(p => p.length > 0);
            } else {
                items = [line];
            }
            for (const item of items) {
                const cleaned = sanitizeHtml(item).replace(/^[-\•*\·✓\s]+/, '').trim();
                if (cleaned) bulletLines.push(cleaned);
            }
        }
    } else {
        for (const line of lines) {
            if (/^[-•·\s]/.test(line)) {
                const cleaned = sanitizeHtml(line).replace(/^[-\•·\s]+/, '').trim();
                if (cleaned) bulletLines.push(cleaned);
            } else {
                paragraphLines.push(sanitizeHtml(line));
            }
        }
    }

    let html = '';

    if (paragraphLines.length > 0) {
        const safeFirstParagraph = paragraphLines[0];
        html += '<div class="vm-summary-box"><p>' + safeFirstParagraph + '</p></div>';
        if (paragraphLines.length > 1) {
            const rest = paragraphLines.slice(1).join(' <br> ');
            html += '<p style="margin-top: 8px; color: #cbd5e1; font-size: 0.95rem; line-height: 1.5;">' + rest + '</p>';
        }
    }

    if (bulletLines.length > 0) {
        const hasSummary = html.includes('vm-summary-box');
        if (hasSummary) {
            html += '<h4 class="vm-features-title">Equipamiento destacado</h4>' +
                '<ul class="vm-features-list">' +
                bulletLines.map(item => '<li class="vm-feature-item">' + item + '</li>').join('') +
                '</ul>';
        } else {
            html += '<h4 class="vm-features-title">Equipamiento destacado</h4>' +
                '<ul class="vm-features-list">' +
                bulletLines.map(item => '<li class="vm-feature-item">' + item + '</li>').join('') +
                '</ul>';
        }
    }

    if (!html && paragraphLines.length > 0) {
        html = '<div class="vm-summary-box"><p>' + paragraphLines[0] + '</p></div>';
    }

    return html;
}

/* ============================================
   FUNCIONES DE MODAL DE STOCK
   ============================================ */

let currentStockVehicles = [];

/**
 * Abre el modal de stock para la categoría especificada
 */
async function openStockModal(category) {
    const modal = document.getElementById('stockModal');
    const merged = await getMergedVehicleInventory();

    const keyMap = {
        'autos-0km': '0km',
        'autos-usados': 'usados',
        'vehiculos-especiales': 'especiales',
        'motos-electricas': 'motos',
        'motos': 'motos',
        'especiales': 'especiales'
    };
    const inventoryKey = keyMap[category] || category;
    const inventory = merged[inventoryKey];
    
    if (!inventory) {
        console.error('Categoría ' + category + ' no encontrada');
        return;
    }
    
    document.getElementById('stockModalTitle').textContent = inventory.title;
    currentStockVehicles = inventory.vehicles;
    
    const filterInput = document.getElementById('stockFilter');
    if (filterInput) filterInput.value = '';
    
    renderVehicles(currentStockVehicles, category);
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function filterStock() {
    const query = document.getElementById('stockFilter').value.toLowerCase().trim();
    if (!query) {
        renderVehicles(currentStockVehicles);
        return;
    }
    const filtered = currentStockVehicles.filter(v => {
        const name = getCleanVehicleDisplayName(v).toLowerCase();
        const desc = (v.descripcion || '').toLowerCase();
        return name.includes(query) || desc.includes(query);
    }
    );
    renderVehicles(filtered);
}

function getCleanVehicleDisplayName(vehicle) {
    return vehicle.nombre || (vehicle.marca + ' ' + vehicle.modelo);
}

/**
 * Cierra el modal de stock
 */
function closeStockModal() {
    const modal = document.getElementById('stockModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * Renderiza los vehículos en el contenedor del modal
 */
function renderVehicles(vehicles, category) {
    const container = document.getElementById('stockVehiclesContainer');

    if (!vehicles || vehicles.length === 0) {
        container.innerHTML = '<p class="empty-stock">No hay vehículos disponibles en esta categoría</p>';
        return;
    }

    let html = '';
    for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        const displayName = getCleanVehicleTitle(vehicle);
        const fotos = vehicle.fotos || [];
        const firstPhoto = fotos[0];
        const descripcionEl = vehicle.descripcion
            ? '<p class="vehicle-description">' + sanitizeHtml(vehicle.descripcion) + '</p>'
            : '';
        // Usar displayName directamente - sin replace problemático
        const safeName = displayName;
        const imageSrc = (firstPhoto && firstPhoto.url_thumb) || vehicle.image;
        // WhatsApp msg sin replace problemático
        const whatsappMsg = vehicle.whatsappMsg || '';
        const cardId = vehicle.id;
        const carouselControls = fotos.length > 1 ?
            '<button class="carousel-btn prev" onclick="event.stopPropagation(); prevVehiclePhoto(' + cardId + ')">&#10094;</button>' +
            '<button class="carousel-btn next" onclick="event.stopPropagation(); nextVehiclePhoto(' + cardId + ')">&#10095;</button>' +
            '<div class="carousel-dots">' +
            fotos.map((_, i) => '<span class="carousel-dot' + (i === 0 ? ' active' : '') + '"></span>').join('') +
            '</div>'
            : '';

        const condicionBadge = vehicle.esCeroKm
            ? '<span class="vehicle-badge badge-0km">0 KM</span>'
            : '<span class="vehicle-badge badge-usado">Usado</span>';
        const tipoBadge = vehicle.esMoto
            ? '<span class="vehicle-badge badge-moto">Moto</span>'
            : '';

        html += '<div class="vehicle-card" data-vehicle-id="' + cardId + '">' +
            '<div class="vehicle-image-wrapper" data-card-id="' + cardId + '">' +
                '<img' +
                    ' src="' + imageSrc + '"' +
                    ' alt="' + sanitizeHtml(displayName) + '"' +
                    ' class="vehicle-image carousel-img"' +
                    ' data-index="0"' +
                    ' fetchpriority="' + (i === 0 ? 'high' : 'auto') + '"' +
                    ' loading="' + (i === 0 ? 'eager' : 'lazy') + '"' +
                    ' decoding="async"' +
                '>' +
                carouselControls +
            '</div>' +
            '<div class="vehicle-info">' +
                '<h4 class="vehicle-title">' + sanitizeHtml(displayName) + '</h4>' +
                descripcionEl +
                '<div class="vehicle-details">' +
                    '<span class="detail-item">' +
                        '<strong>Año:</strong> ' + sanitizeHtml(String(vehicle.año)) +
                    '</span>' +
                    '<span class="detail-item">' +
                        '<strong>KM:</strong> ' + formatKilometers(vehicle.km) +
                    '</span>' +
                    '<span class="detail-item">' +
                        '<strong>Color:</strong> ' + sanitizeHtml(vehicle.color) +
                    '</span>' +
                '</div>' +
                '<div class="vehicle-actions">' +
                    '<button class="btn-detalle" onclick="event.stopPropagation(); openVehicleModal(' + cardId + ')">' +
                        'Ver detalles / Fotos' +
                    '</button>' +
                    '<button class="btn-consultar" onclick="event.stopPropagation(); consultarWhatsApp(\'' + safeName + '\', ' + (vehicle.año || 0) + ', \'' + whatsappMsg + '\')">' +
                        'Consultar por WhatsApp' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    requestAnimationFrame(() => {
        container.innerHTML = html;
    });
}

/**
 * Navega el carrusel de fotos de una card de stock
 */
function changeVehiclePhoto(cardId, dir) {
    const card = document.querySelector('.vehicle-image-wrapper[data-card-id="' + cardId + '"]');
    if (!card) return;
    const img = card.querySelector('.carousel-img');
    const fotos = (currentStockVehicles.find(v => v.id === Number(cardId)) || {}).fotos || [];
    const validFotos = fotos.filter(f => f && f.url);
    if (!img || validFotos.length < 2) return;

    let idx = parseInt(img.dataset.index, 10) || 0;
    idx = (idx + dir + validFotos.length) % validFotos.length;
    img.src = validFotos[idx].url;
    img.dataset.index = idx;

    card.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === idx);
    });
}

window.prevVehiclePhoto = (cardId) => changeVehiclePhoto(cardId, -1);
window.nextVehiclePhoto = (cardId) => changeVehiclePhoto(cardId, 1);

/* ============================================
   EVENT LISTENERS PARA MODAL
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('stockModal');
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeStockModal();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const vehicleModal = document.getElementById('vehicle-modal');
        if (vehicleModal && vehicleModal.style.display === 'flex') return;
        if (modal && modal.style.display === 'flex') {
            closeStockModal();
        }
    });
});

/* ============================================
   20. MODAL DETALLE / GALERÍA DE VEHÍCULO
   ============================================ */

let currentModalFotos = [];

/**
 * Busca un vehículo por id en la lista activa y, si no está, en todo el inventario
 */
function findVehicleById(vehicleId) {
    let vehicle = currentStockVehicles.find(v => v.id === Number(vehicleId));
    if (vehicle) return vehicle;

    try {
        const inventory = stockCache;
        if (inventory) {
            for (const key of Object.keys(inventory)) {
                const found = (inventory[key].vehicles || []).find(v => v.id === Number(vehicleId));
                if (found) return found;
            }
        }
    } catch { /* inventario no disponible */ }
    return null;
}

/**
 * Abre el modal de detalle con galería y ficha del vehículo
 */
function openVehicleModal(vehicleId) {
    const modal = document.getElementById('vehicle-modal');
    const vehicle = findVehicleById(vehicleId);
    if (!modal || !vehicle) return;

    const displayName = getCleanVehicleTitle(vehicle);
    const fotos = (vehicle.fotos || []).filter(f => f && f.url);
    currentModalFotos = fotos;

    const mainImage = document.getElementById('vmMainImage');
    mainImage.src = (fotos[0] && fotos[0].url) || vehicle.image || PLACEHOLDER_IMG;
    mainImage.alt = displayName;

    const thumbs = document.getElementById('vmThumbs');
    if (fotos.length > 1) {
        thumbs.innerHTML = fotos.map((f, i) =>
            '<img class="vm-thumb' + (i === 0 ? ' active' : '') + '"' +
                ' src="' + (f.url_thumb || f.url) + '"' +
                ' alt="Foto ' + (i + 1) + ' de ' + sanitizeHtml(displayName) + '"' +
                ' loading="lazy"' +
                ' onclick="switchVehicleThumb(' + i + ')"' +
            '>'
        ).join('');
        thumbs.style.display = 'flex';
    } else {
        thumbs.innerHTML = '';
        thumbs.style.display = 'none';
    }

    const badges = document.getElementById('vmBadges');
    const condicionBadge = vehicle.esCeroKm
        ? '<span class="vehicle-badge badge-0km">0 KM</span>'
        : '<span class="vehicle-badge badge-usado">Usado</span>';
    const tipoBadge = vehicle.esMoto ? '<span class="vehicle-badge badge-moto">Moto</span>' : '';
    badges.innerHTML = condicionBadge + tipoBadge;

    document.getElementById('vmTitle').textContent = displayName;
    document.getElementById('vmDetails').innerHTML =
        '<span class="vm-detail-item"><strong>Año:</strong> ' + sanitizeHtml(String(vehicle.año || '—')) + '</span>' +
        '<span class="vm-detail-item"><strong>KM:</strong> ' + formatKilometers(vehicle.km) + '</span>' +
        '<span class="vm-detail-item"><strong>Color:</strong> ' + sanitizeHtml(vehicle.color || '—') + '</span>' +
        '<span class="vm-detail-item"><strong>Tipo:</strong> ' + sanitizeHtml(vehicle.tipo || 'auto') + '</span>';

    const desc = document.getElementById('vmDescription');
    desc.innerHTML = formatVehicleDescription(vehicle.descripcion);
    desc.style.display = vehicle.descripcion ? 'block' : 'none';

    const whatsappBtn = document.getElementById('vmWhatsappBtn');
    const whatsappText = 'Hola, me interesa el vehículo: ' + displayName + (vehicle.año ? ' (' + vehicle.año + ')' : '');
    whatsappBtn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(whatsappText);

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function switchVehicleThumb(index) {
    if (!currentModalFotos.length) return;
    const safeIndex = Math.max(0, Math.min(index, currentModalFotos.length - 1));
    const foto = currentModalFotos[safeIndex];

    document.getElementById('vmMainImage').src = foto.url;
    document.querySelectorAll('#vmThumbs .vm-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === safeIndex);
    });
}

function closeVehicleModal() {
    const modal = document.getElementById('vehicle-modal');
    if (!modal) return;
    modal.style.display = 'none';
    currentModalFotos = [];

    const stockModal = document.getElementById('stockModal');
    if (!stockModal || stockModal.style.display !== 'flex') {
        document.body.style.overflow = 'auto';
    }
}

window.openVehicleModal = openVehicleModal;
window.switchVehicleThumb = switchVehicleThumb;
window.closeVehicleModal = closeVehicleModal;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('stockVehiclesContainer');
    if (container) {
        container.addEventListener('click', (e) => {
            if (e.target.closest('button, a')) return;
            const card = e.target.closest('.vehicle-card');
            if (!card || !card.dataset.vehicleId) return;
            openVehicleModal(card.dataset.vehicleId);
        });
    }

    const vehicleModal = document.getElementById('vehicle-modal');
    if (vehicleModal) {
        vehicleModal.addEventListener('click', (e) => {
            if (e.target === vehicleModal) closeVehicleModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (vehicleModal && vehicleModal.style.display === 'flex') {
            e.stopPropagation();
            closeVehicleModal();
        }
    }, true);
});

// ============================================
// FIN DEL SCRIPT
// ============================================