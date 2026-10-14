/* ============================================
   VERDUN AUTOMOTORES - JAVASCRIPT INTERACTIVO
   ============================================ */

// ============================================
// SUPABASE - CONEXIÓN Y CONSULTAS
// ============================================

const SUPABASE_URL = 'https://ymiakfjhgndqhdtoubkr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaWFrZmpoZ25kcWhkdG91YmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjkyNTIsImV4cCI6MjEwMDYwNTI1Mn0.Q0opccAEYWgkuyV1unwnpNu0OiWbio3E1pAURi8GPaI';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FINANCING_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'1200\' height=\'900\'%3E%3Cdefs%3E%3ClinearGradient id=\'g\' x1=\'0\' y1=\'0\' x2=\'1\' y2=\'1\'%3E%3Cstop offset=\'0\' stop-color=\'%2312181f\'/%3E%3Cstop offset=\'1\' stop-color=\'%2325d366\' stop-opacity=\'0.25\'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=\'1200\' height=\'900\' fill=\'url(%23g)\'/%3E%3Ctext x=\'600\' y=\'440\' font-family=\'Arial,%20Helvetica,%20sans-serif\' font-size=\'72\' font-weight=\'bold\' fill=\'%23ffffff\' text-anchor=\'middle\'%3EVERDUN%3C/text%3E%3Ctext x=\'600\' y=\'500\' font-family=\'Arial,%20Helvetica,%20sans-serif\' font-size=\'32\' fill=\'%2325d366\' text-anchor=\'middle\'%3EAUTOMOTORES%3C/text%3E%3C/svg%3E';
window.FINANCING_PLACEHOLDER = FINANCING_PLACEHOLDER;

const PLACEHOLDER_IMG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%231a1d21' width='400' height='300'/%3E%3Ctext x='200' y='140' text-anchor='middle' fill='%236b7280' font-family='system-ui' font-size='14'%3EFotos disponibles%3Cbr%2F%3Ea la brevedad%3C/text%3E%3C/svg%3E`;

let stockCache = null;

function sanitizeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadStockFromSupabase(forceRefresh = false) {
    if (stockCache && !forceRefresh) return stockCache;

    // 1) Traer TODOS los vehículos de golpe, sin filtro de categoría
    const { data: vehicles, error } = await supabaseClient
        .from('vehicles')
        .select('*, seccion')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error cargando vehículos:', error);
        return { 'todos': { title: 'Todos', vehicles: [] } };
    }

    console.log('TOTAL VEHÍCULOS RECIBIDOS:', vehicles ? vehicles.length : 0, vehicles);

    // 2) Traer TODAS las fotos de golpe
    const vehicleIds = (vehicles || []).map(v => v.id);
    let photosMap = {};
    if (vehicleIds.length > 0) {
        const { data: allPhotos } = await supabaseClient
            .from('photos')
            .select('vehicle_id, url, url_thumb, posicion')
            .in('vehicle_id', vehicleIds);

        for (const p of allPhotos || []) {
            if (!photosMap[p.vehicle_id]) photosMap[p.vehicle_id] = [];
            photosMap[p.vehicle_id].push(p);
        }
    }

    // 3) Mapear cada vehículo con sus fotos
    let idCounter = 0;
    const allVehicles = (vehicles || []).map(v => {
        idCounter++;
        const fotos = (photosMap[v.id] || []).sort((a, b) => a.posicion - b.posicion);
        const firstPhoto = fotos[0];
        const photoUrl = (firstPhoto && firstPhoto.url) ? firstPhoto.url : PLACEHOLDER_IMG;
        const fotosConUrl = fotos.filter(p => p.url);
        const kmRaw = String(v.km || '').trim();
        let kmCleaned = kmRaw.replace(/[^0-9.,]/g, '');
        if (kmCleaned.includes('.') && kmCleaned.includes(',')) {
            kmCleaned = kmCleaned.replace(/\./g, '');
        }
        if (kmCleaned.includes('.') && !kmCleaned.includes(',')) {
            const parts = kmCleaned.split('.');
            if (parts.length === 2 && parts[1].length === 3) {
                kmCleaned = parts[0] + parts[1];
            }
        }
        const kmNum = parseFloat(kmCleaned.replace(',', '.')) || 0;
        const esCeroKm = (v.seccion === '0km')
            || (v.seccion !== 'usados' && kmNum === 0);
        const tipo = v.tipo || 'auto';
        const esMoto = tipo === 'moto';

        return {
            id: idCounter,
            uuid: v.id,
            marca: v.marca || '',
            modelo: v.modelo || '',
            nombre: v.nombre || `${v.marca || ''} ${v.modelo || ''}`.trim(),
            año: v.año,
            km: v.km || '0 KM',
            color: v.color || '—',
            tipo,
            esMoto,
            seccion: v.seccion || null,
            descripcion: v.descripcion || '',
            image: photoUrl,
            fotos: fotosConUrl,
            slug: v.slug || '',
            esCeroKm,
            activo: v.activo !== false,
            status: v.status || 'publicado',
            whatsappMsg: v.whatsapp_msg || (esMoto
                ? `¡Hola! Quiero consultar el precio y disponibilidad de la moto ${v.marca} ${v.modelo} (${v.año || ''}) que vi en su web.`
                : `¡Hola! Quiero consultar el precio y disponibilidad del ${v.marca} ${v.modelo} (${v.año || ''}) que vi en su web.`)
        };
    });

    // 4) Clasificar: prioridad SECCIÓN MANUAL > auto-detect por tipo/km
    const seenIds = new Set();
    const seenKeys = new Set();
    const uniques = [];

    for (const v of allVehicles) {
        const canonicalKey = `${(v.marca||'').trim().toLowerCase()}|${(v.modelo||'').trim().toLowerCase()}|${v.año||v.anio}`;
        if (!seenIds.has(v.uuid) && !seenKeys.has(canonicalKey)) {
            seenIds.add(v.uuid);
            seenKeys.add(canonicalKey);
            uniques.push(v);
        }
    }

    const autos0km = uniques.filter(v => {
        if (v.seccion === '0km') return true;
        if (v.seccion && v.seccion !== '0km') return false;
        return !v.esMoto && v.esCeroKm;
    });
    const autosUsados = uniques.filter(v => {
        if (v.seccion === 'usados') return true;
        if (v.seccion && v.seccion !== 'usados') return false;
        return !v.esMoto && !v.esCeroKm;
    });
    const motos = uniques.filter(v => {
        if (v.seccion === 'motos') return true;
        if (v.seccion && v.seccion !== 'motos') return false;
        return v.esMoto;
    });
    const especiales = uniques.filter(v => {
        if (v.seccion === 'especiales') return true;
        if (v.seccion && v.seccion !== 'especiales') return false;
        return false;
    });

    const inventory = {
        'todos': { title: 'Todos', vehicles: uniques },
        '0km': { title: 'Autos 0KM', vehicles: autos0km },
        'usados': { title: 'Autos Usados', vehicles: autosUsados },
        'motos': { title: 'Motos', vehicles: motos },
        'especiales': { title: 'Veh. Especiales', vehicles: especiales }
    };

    // 5) Log de auditoría
    console.log('═══════════════════════════════════════');
    console.log('TOTAL VEHÍCULOS:', uniques.length);
    console.log('  Todos:', uniques.length);
    console.log('  0 KM:', autos0km.length);
    console.log('  Usados:', autosUsados.length);
    console.log('  Motos:', motos.length);
    console.log('  Especiales:', especiales.length);
    console.log('═══════════════════════════════════════');

    stockCache = inventory;

    // Renderizar todo el stock activo en la grilla principal automáticamente
    if (typeof setCategoryFilter === 'function') {
        setCategoryFilter(currentCategory || 'todos');
    }

    return inventory;
}

async function getMergedVehicleInventory() {
    return await loadStockFromSupabase();
}

function getCleanVehicleTitle(vehicle) {
    if (!vehicle) return '';
    const marca = (vehicle.marca || '').trim();
    const modelo = (vehicle.modelo || '').trim();
    let raw = (vehicle.nombre || '').trim();

    if (!raw) {
        return `${marca} ${modelo}`.trim();
    }

    // Limpiar repetición consecutiva de marca
    if (marca && marca.length > 1) {
        const escapedMarca = marca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const dupMarcaRegex = new RegExp(`(${escapedMarca})\\s+(${escapedMarca})`, 'i');
        while (dupMarcaRegex.test(raw)) {
            raw = raw.replace(dupMarcaRegex, '$1').trim();
        }
    }

    // Limpiar repetición consecutiva de modelo (ej: "Toyota Corolla XEi 1.8 CVT Corolla XEi 1.8 CVT")
    if (modelo && modelo.length > 2) {
        const escapedModelo = modelo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const dupModeloRegex = new RegExp(`(${escapedModelo})\\s+(${escapedModelo})`, 'i');
        while (dupModeloRegex.test(raw)) {
            raw = raw.replace(dupModeloRegex, '$1').trim();
        }
    }

    // Limpiar duplicación de frases consecutivas
    const words = raw.split(/\s+/);
    if (words.length >= 4) {
        for (let len = 2; len <= Math.floor(words.length / 2); len++) {
            const first = words.slice(words.length - 2 * len, words.length - len).join(' ').toLowerCase();
            const second = words.slice(words.length - len).join(' ').toLowerCase();
            if (first === second) {
                raw = words.slice(0, words.length - len).join(' ').trim();
                break;
            }
        }
    }

    const rawLower = raw.toLowerCase();
    const marcaLower = marca.toLowerCase();

    // Si ya incluye la marca, retornar limpio
    if (marcaLower && rawLower.includes(marcaLower)) {
        return raw;
    }

    // Si no incluye la marca, anteponerla
    if (marca) {
        return `${marca} ${raw}`.trim();
    }

    return raw;
}

/**
 * Formatea el kilometraje de forma limpia con separador de miles (es-AR).
 */
function formatKilometers(kmRaw) {
    if (kmRaw === null || kmRaw === undefined || kmRaw === '') return '0 km';
    const kmStr = String(kmRaw).trim();
    if (kmStr === '0' || kmStr === '0 KM' || kmStr.toLowerCase() === '0km' || kmStr === '0 km') {
        return '0 km';
    }
    let clean = kmStr.replace(/[^0-9.,]/g, '');
    if (!clean) return '0 km';

    if (clean.includes('.') && clean.includes(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes('.')) {
        const parts = clean.split('.');
        if (parts.length > 1 && parts.every((p, idx) => idx === 0 || p.length === 3)) {
            clean = parts.join('');
        }
    } else if (clean.includes(',')) {
        const parts = clean.split(',');
        if (parts.length > 1 && parts.every((p, idx) => idx === 0 || p.length === 3)) {
            clean = parts.join('');
        } else {
            clean = clean.replace(',', '.');
        }
    }

    const num = Math.round(parseFloat(clean));
    if (isNaN(num) || num <= 0) return '0 km';
    const formatted = num.toLocaleString('es-AR', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    return `${formatted} km`;
}

const BULLET_REGEX = /^[•●▪\-\*\✓\✔➤👉·]\s*/;

/**
 * Detecta si una línea es ruido de encabezado de publicación de Instagram
 * (handle de la concesionaria, kilometraje suelto o título con año repetido).
 */
function isInstagramHeaderNoise(line, vehicle) {
    const trimmed = (line || '').trim();
    if (!trimmed) return true;

    const lower = trimmed.toLowerCase();

    // 1. Instagram username / handle suelto
    if (/^@?verdun(_automotores)?$/i.test(lower)) return true;

    // 2. Kilometraje suelto (ej: "30.000 km", "0 km", "125.000 KM")
    if (/^\d+[\d.,]*\s*km$/i.test(trimmed)) return true;

    // 3. Encabezados de IG con pipe y año (ej: "Toyota SW4 SRX 2.8 4x4 AT | 2025")
    if (vehicle) {
        const marca = (vehicle.marca || '').toLowerCase().trim();
        const modelo = (vehicle.modelo || '').toLowerCase().trim();
        if (trimmed.includes('|')) {
            const beforePipe = trimmed.split('|')[0].toLowerCase();
            if ((marca && beforePipe.includes(marca)) || (modelo && beforePipe.includes(modelo)) || beforePipe.includes('verdun')) {
                return true;
            }
        }
        if (marca && modelo) {
            const combined = `${marca} ${modelo}`.toLowerCase();
            if (lower === combined || lower === `${combined} | ${vehicle.año || ''}`.trim()) {
                return true;
            }
        }
    } else if (trimmed.includes('|') && /\|\s*20\d\d/i.test(trimmed)) {
        return true;
    }

    return false;
}

/**
 * Parsea el texto copiado de Instagram clasificando párrafos comerciales y viñetas de equipamiento.
 */
function parseVehicleDescription(rawText, vehicle) {
    if (!rawText || !rawText.trim()) {
        return { paragraphs: [], features: [] };
    }

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const paragraphs = [];
    const features = [];

    lines.forEach((line, index) => {
        // Descartar encabezados redundantes de Instagram en las primeras líneas
        if (index < 3 && isInstagramHeaderNoise(line, vehicle)) {
            return;
        }

        // Si la línea contiene múltiples viñetas separadas por • (ej: "• Climatizador • Cuero • Cámara")
        if (line.includes('•')) {
            const parts = line.split('•').map(p => p.trim()).filter(p => p.length > 0);
            for (const part of parts) {
                const cleaned = part.replace(BULLET_REGEX, '').trim();
                if (cleaned && !isInstagramHeaderNoise(cleaned, vehicle)) {
                    features.push(cleaned);
                }
            }
        } else if (BULLET_REGEX.test(line)) {
            const cleaned = line.replace(BULLET_REGEX, '').trim();
            if (cleaned && !isInstagramHeaderNoise(cleaned, vehicle)) {
                features.push(cleaned);
            }
        } else {
            paragraphs.push(line);
        }
    });

    return { paragraphs, features };
}

/**
 * Genera un resumen limpio para la tarjeta exterior del catálogo:
 * - Si hay párrafos comerciales, usa el primero como preview.
 * - Si solo hay viñetas, une los primeros 3 o 4 ítems con " · ".
 */
function getCardExcerpt(rawText, vehicle) {
    const { paragraphs, features } = parseVehicleDescription(rawText, vehicle);

    if (paragraphs.length > 0) {
        return paragraphs.join(' ');
    }

    if (features.length > 0) {
        const items = features.slice(0, 4);
        return items.join(' · ');
    }

    return '';
}

/**
 * Renderiza la descripción estructurada del modal (#vehicle-modal):
 * - Arriba: Párrafos comerciales dentro de .vm-summary-box
 * - Abajo: Lista de características dentro de .vm-features-section
 */
function formatVehicleDescription(rawText, vehicle) {
    const { paragraphs, features } = parseVehicleDescription(rawText, vehicle);

    let html = '';

    if (paragraphs.length > 0) {
        const paragraphsHtml = paragraphs
            .map(p => `<p>${sanitizeHtml(p)}</p>`)
            .join('');
        html += `<div class="vm-summary-box">${paragraphsHtml}</div>`;
    }

    if (features.length > 0) {
        html += `
            <div class="vm-features-section">
                <h4 class="vm-features-title">Equipamiento y Características</h4>
                <ul class="vm-features-list">
                    ${features.map(f => `
                        <li class="vm-feature-item">
                            <span class="vm-feature-bullet">✓</span>
                            <span>${sanitizeHtml(f)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    return html.trim();
}

function getVehicleDisplayName(vehicle) {
    return getCleanVehicleTitle(vehicle);
}

const WHATSAPP_NUMBER = '5493795300020';

function consultarWhatsApp(vehicleName, año, customMsg) {
    const mensaje = customMsg || `¡Hola! Quiero consultar el precio y disponibilidad del ${vehicleName}${año ? ' (' + año + ')' : ''} que vi en su web.`;
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
let currentCategory = 'todos';

/**
 * Aplica los filtros combinados (categoría activa + texto de búsqueda)
 */
function applyStockFilters() {
    if (!stockCache) return;
    const catData = stockCache[currentCategory] || stockCache['todos'];
    const baseVehicles = (catData && catData.vehicles) ? catData.vehicles : [];

    const filterInput = document.getElementById('stockFilter');
    const query = filterInput ? filterInput.value.toLowerCase().trim() : '';

    if (!query) {
        currentStockVehicles = baseVehicles;
    } else {
        currentStockVehicles = baseVehicles.filter(v => {
            const name = getVehicleDisplayName(v).toLowerCase();
            const desc = (v.descripcion || '').toLowerCase();
            const marca = (v.marca || '').toLowerCase();
            const modelo = (v.modelo || '').toLowerCase();
            return name.includes(query) || desc.includes(query) || marca.includes(query) || modelo.includes(query);
        });
    }

    renderVehicles(currentStockVehicles, currentCategory);
}

/**
 * Filtrado dinámico por texto de búsqueda
 */
function filterStock() {
    applyStockFilters();
}

/**
 * Establece la pastilla (categoría) activa y filtra en memoria sin recargar
 */
function setCategoryFilter(category) {
    const keyMap = {
        'all': 'todos',
        'todos': 'todos',
        'autos-0km': '0km',
        '0km': '0km',
        'autos-usados': 'usados',
        'usados': 'usados',
        'vehiculos-especiales': 'especiales',
        'especiales': 'especiales',
        'motos-electricas': 'motos',
        'motos': 'motos'
    };
    currentCategory = keyMap[category] || category || 'todos';

    // Actualizar estado visual de las pastillas
    document.querySelectorAll('.catalog-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === currentCategory);
    });

    applyStockFilters();
}

/**
 * Abre el catálogo filtrando por categoría y desplazando suavemente la vista
 */
async function openStockModal(category) {
    if (!stockCache) {
        await loadStockFromSupabase();
    }
    setCategoryFilter(category);

    const catalogSection = document.getElementById('servicios') || document.getElementById('stockVehiclesContainer');
    if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Cierra modal de forma segura si estuviera abierto
 */
function closeStockModal() {
    const modal = document.getElementById('stockModal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = 'auto'; // Restaurar scroll
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

    // Acumular todo el HTML en un solo string para un único reflow
    let html = '';
    for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        const displayName = getVehicleDisplayName(vehicle);
        const fotos = vehicle.fotos || [];
        const firstPhoto = fotos[0];
        const excerpt = getCardExcerpt(vehicle.descripcion, vehicle);
        const descripcionEl = excerpt
            ? `<p class="vehicle-description">${sanitizeHtml(excerpt)}</p>`
            : '';
        const safeName = String(displayName).replace(/'/g, "\\'");
        const imageSrc = (firstPhoto && firstPhoto.url_thumb) || vehicle.image;
        const whatsappMsg = vehicle.whatsappMsg
            ? String(vehicle.whatsappMsg).replace(/'/g, "\\'")
            : '';
        const cardId = vehicle.id;
        const carouselControls = fotos.length > 1 ? `
            <button class="carousel-btn prev" onclick="event.stopPropagation(); prevVehiclePhoto(${cardId})">&#10094;</button>
            <button class="carousel-btn next" onclick="event.stopPropagation(); nextVehiclePhoto(${cardId})">&#10095;</button>
            <div class="carousel-dots">
                ${fotos.map((_, i) => `<span class="carousel-dot${i === 0 ? ' active' : ''}"></span>`).join('')}
            </div>
        ` : '';

        const condicionBadge = vehicle.esCeroKm
            ? '<span class="vehicle-badge badge-0km">0 KM</span>'
            : '<span class="vehicle-badge badge-usado">Usado</span>';
        const tipoBadge = vehicle.esMoto
            ? '<span class="vehicle-badge badge-moto">Moto</span>'
            : '';

        html += `
            <div class="vehicle-card" data-vehicle-id="${cardId}">
                <div class="vehicle-image-wrapper" data-card-id="${cardId}">
                    ${condicionBadge}
                    ${tipoBadge}
                    <img
                        src="${imageSrc}"
                        alt="${sanitizeHtml(displayName)}"
                        class="vehicle-image carousel-img"
                        data-index="0"
                        fetchpriority="${i === 0 ? 'high' : 'auto'}"
                        loading="${i === 0 ? 'eager' : 'lazy'}"
                        decoding="async"
                        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%231a1d21%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%22200%22 y=%22140%22 text-anchor=%22middle%22 fill=%22%236b7280%22 font-family=%22system-ui%22 font-size=%2214%22%3EFotos disponibles%3Cbr/%3Ea la brevedad%3C/text%3E%3C/svg%3E'"
                    >
                    ${carouselControls}
                </div>
                <div class="vehicle-info">
                    <h4 class="vehicle-title">${sanitizeHtml(displayName)}</h4>
                    ${descripcionEl}
                    <div class="vehicle-details">
                        <span class="detail-item">
                            <strong>Año:</strong> ${sanitizeHtml(String(vehicle.año))}
                        </span>
                        <span class="detail-item">
                            <strong>KM:</strong> ${sanitizeHtml(formatKilometers(vehicle.km))}
                        </span>
                        <span class="detail-item">
                            <strong>Color:</strong> ${sanitizeHtml(vehicle.color)}
                        </span>
                    </div>
                    <div class="vehicle-actions">
                        <button
                            class="btn-consultar"
                            onclick="event.stopPropagation(); consultarWhatsApp('${safeName}', ${vehicle.año || 0}, '${whatsappMsg}')"
                        >
                            Consultar por WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Un solo reflow: insertar todo el HTML de golpe
    requestAnimationFrame(() => {
        container.innerHTML = html;
        // Si hay inicializaciones de observers o animaciones, agregarlas aquí
        // setupCardAnimations();
    });
}

/**
 * Navega el carrusel de fotos de una card de stock
 */
function changeVehiclePhoto(cardId, dir) {
    const card = document.querySelector(`.vehicle-image-wrapper[data-card-id="${cardId}"]`);
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
    
    // Cerrar modal con tecla Escape (no cierra el stock si el detalle esta abierto)
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const vehicleModal = document.getElementById('vehicle-modal');
        if (vehicleModal && vehicleModal.style.display === 'flex') return;
        if (modal && modal.style.display === 'flex') {
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

async function sbGetAdminContent(key) {
    try {
        const { data } = await supabaseClient
            .from('admin_content')
            .select('data')
            .eq('key', key)
            .maybeSingle();
        if (data && data.data !== null && data.data !== undefined) {
            try { localStorage.setItem(key, JSON.stringify(data.data)); } catch {}
            return data.data;
        }
    } catch {
        // offline: usar fallback local
    }
    return null;
}

async function loadAdminContent() {
    const [services, content, testimonios, financing, images] = await Promise.all([
        sbGetAdminContent('services'),
        sbGetAdminContent('content'),
        sbGetAdminContent('testimonios'),
        sbGetAdminContent('financing_images'),
        sbGetAdminContent('site_images')
    ]);

    applyFinancingData(financing || getAdminData('financing_images', {}));
    applyContentData(content || getAdminData('content', {}), services || getAdminData('services', []), testimonios || getAdminData('testimonios', []));
    applySiteImages(images || getAdminData('verdun_images', {}));
}

function applySiteImages(images) {
    if (!images || Object.keys(images).length === 0) return;

    const logo = document.querySelector('.logo-image');
    if (logo) {
        const logoData = images.logo;
        if (logoData && (logoData.url || logoData.data)) {
            logo.src = logoData.url || logoData.data;
        }
    }

    const heroImg = document.querySelector('.hero-image');
    const heroData = images.hero_visual;
    if (heroImg && heroData && (heroData.url || heroData.data)) {
        heroImg.src = heroData.url || heroData.data;
    }

    const serviceImages = document.querySelectorAll('.service-card-front .service-image');
    serviceImages.forEach((img, index) => {
        const key = `service_${index + 1}`;
        const slot = images[key];
        if (img && slot && (slot.url || slot.data)) {
            img.src = slot.url || slot.data;
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAdminContent);
} else {
    loadAdminContent();
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
    const hasContent = content && Object.keys(content).length > 0;
    const hasServices = services && services.length > 0;
    const hasTestimonios = testimonios && testimonios.length > 0;
    if (!hasContent && !hasServices && !hasTestimonios) return;

    // Agrupar todas las escrituras DOM en un solo frame para evitar reflows
    requestAnimationFrame(() => {
        if (hasContent) {
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

        if (hasServices) {
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

        if (hasTestimonios) {
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
    });
}

// ============================================
// 1. NAVBAR STICKY CON SCROLL
// ============================================
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}, { passive: true });

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

// Observar todos los elementos con fade-in (sin writes al DOM, CSS maneja el estado inicial)
document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

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

    container.innerHTML = '';

    // Usar DocumentFragment para un único reflow al insertar 50 partículas
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

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

        fragment.appendChild(particle);
    }

    container.appendChild(fragment);
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
// Pre-create ripple style once
if (!document.querySelector('style[data-ripple]')) {
    const rippleStyle = document.createElement('style');
    rippleStyle.setAttribute('data-ripple', 'true');
    rippleStyle.textContent = `
        @keyframes ripple {
            to { width: 300px; height: 300px; opacity: 0; }
        }
    `;
    document.head.appendChild(rippleStyle);
}

document.querySelectorAll('.nav-cta, .btn-primary, .btn-secondary').forEach(btn => {
    btn.addEventListener('mousedown', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Diferir escrituras DOM al siguiente frame para evitar forced reflow
        requestAnimationFrame(() => {
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

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });
});

// ============================================
// 9. BOTÓN WHATSAPP FLOTANTE (OPCIONAL)
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
    
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', function() {
        if (navLinks.style.display === 'flex') {
            navLinks.style.display = 'none';
        } else {
            navLinks.style.cssText = `
                display: flex !important;
                position: absolute;
                top: calc(100% + 10px);
                left: 0;
                right: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                flex-direction: column;
                padding: 24px;
                gap: 16px;
                border-radius: 24px;
                box-shadow: 0 16px 40px rgba(0,0,0,0.25);
                border: 1px solid rgba(0,0,0,0.1);
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
// 13. INICIALIZACIÓN GENERAL
// ============================================

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
// 20. MODAL DETALLE / GALERÍA DE VEHÍCULO
// ============================================

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

    // Galeria: imagen principal + miniaturas (un solo innerHTML = un reflow)
    const mainImage = document.getElementById('vmMainImage');
    mainImage.src = (fotos[0] && fotos[0].url) || vehicle.image || PLACEHOLDER_IMG;
    mainImage.alt = displayName;

    const thumbs = document.getElementById('vmThumbs');
    if (fotos.length > 1) {
        thumbs.innerHTML = fotos.map((f, i) => `
            <img
                class="vm-thumb${i === 0 ? ' active' : ''}"
                src="${f.url_thumb || f.url}"
                alt="Foto ${i + 1} de ${sanitizeHtml(displayName)}"
                loading="lazy"
                onclick="switchVehicleThumb(${i})"
            >
        `).join('');
        thumbs.style.display = 'flex';
    } else {
        thumbs.innerHTML = '';
        thumbs.style.display = 'none';
    }

    // Badges de condicion / tipo
    const badges = document.getElementById('vmBadges');
    const condicionBadge = vehicle.esCeroKm
        ? '<span class="vehicle-badge badge-0km">0 KM</span>'
        : '<span class="vehicle-badge badge-usado">Usado</span>';
    const tipoBadge = vehicle.esMoto ? '<span class="vehicle-badge badge-moto">Moto</span>' : '';
    badges.innerHTML = condicionBadge + tipoBadge;

    // Titulo y ficha tecnica
    document.getElementById('vmTitle').textContent = displayName;
    const condicionLabel = vehicle.esCeroKm ? '0 KM' : 'Usado';
    const tipoLabel = vehicle.esMoto ? 'Moto' : (vehicle.tipo || 'Auto');
    document.getElementById('vmDetails').innerHTML = `
        <span class="vm-detail-item"><strong>Año:</strong> ${sanitizeHtml(String(vehicle.año || '—'))}</span>
        <span class="vm-detail-item"><strong>KM:</strong> ${formatKilometers(vehicle.km)}</span>
        <span class="vm-detail-item"><strong>Color:</strong> ${sanitizeHtml(vehicle.color || '—')}</span>
        <span class="vm-detail-item"><strong>Condición:</strong> ${sanitizeHtml(condicionLabel)} · ${sanitizeHtml(tipoLabel)}</span>
    `;

    // Descripción: Resumen comercial a la izquierda (bajo miniaturas) y equipamiento a la derecha
    const { paragraphs, features } = parseVehicleDescription(vehicle.descripcion, vehicle);

    const summaryLeft = document.getElementById('vmSummaryLeft');
    if (summaryLeft) {
        if (paragraphs.length > 0) {
            summaryLeft.innerHTML = paragraphs.map(p => `<p>${sanitizeHtml(p)}</p>`).join('');
            summaryLeft.style.display = 'block';
        } else {
            summaryLeft.innerHTML = '';
            summaryLeft.style.display = 'none';
        }
    }

    const desc = document.getElementById('vmDescription');
    if (desc) {
        if (features.length > 0) {
            desc.innerHTML = `
                <div class="vm-features-section">
                    <h4 class="vm-features-title">Equipamiento y Características</h4>
                    <ul class="vm-features-list">
                        ${features.map(f => `
                            <li class="vm-feature-item">
                                <span class="vm-feature-bullet">✓</span>
                                <span>${sanitizeHtml(f)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            desc.style.display = 'block';
        } else {
            desc.innerHTML = '';
            desc.style.display = 'none';
        }
    }

    // Enlace WhatsApp directo con el nombre del vehiculo
    const whatsappBtn = document.getElementById('vmWhatsappBtn');
    const whatsappText = `Hola, me interesa el vehículo: ${displayName}${vehicle.año ? ' (' + vehicle.año + ')' : ''}`;
    whatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Cambia la imagen principal del modal por la miniatura clickeada
 */
function switchVehicleThumb(index) {
    if (!currentModalFotos.length) return;
    const safeIndex = Math.max(0, Math.min(index, currentModalFotos.length - 1));
    const foto = currentModalFotos[safeIndex];

    document.getElementById('vmMainImage').src = foto.url;
    document.querySelectorAll('#vmThumbs .vm-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === safeIndex);
    });
}

/**
 * Cierra el modal de detalle. Restaura el scroll solo si el modal de stock tambien esta cerrado.
 */
function closeVehicleModal() {
    const modal = document.getElementById('vehicle-modal');
    if (!modal) return;
    modal.style.display = 'none';
    currentModalFotos = [];

    const summaryLeft = document.getElementById('vmSummaryLeft');
    if (summaryLeft) {
        summaryLeft.innerHTML = '';
        summaryLeft.style.display = 'none';
    }

    const desc = document.getElementById('vmDescription');
    if (desc) {
        desc.innerHTML = '';
    }

    const stockModal = document.getElementById('stockModal');
    if (!stockModal || stockModal.style.display !== 'flex') {
        document.body.style.overflow = 'auto';
    }
}

window.openVehicleModal = openVehicleModal;
window.switchVehicleThumb = switchVehicleThumb;
window.closeVehicleModal = closeVehicleModal;
window.setCategoryFilter = setCategoryFilter;
window.filterStock = filterStock;
window.openStockModal = openStockModal;
window.closeStockModal = closeStockModal;

document.addEventListener('DOMContentLoaded', () => {
    // Delegación de clics en las pastillas (pills) de categoría
    const pillsContainer = document.getElementById('catalogPills');
    if (pillsContainer) {
        pillsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.catalog-pill');
            if (!btn || !btn.dataset.category) return;
            setCategoryFilter(btn.dataset.category);
        });
    }

    // Clic en la card (toda el area) abre el detalle; flechas del carrusel y
    // botones usan stopPropagation en renderVehicles y no llegan aca
    const container = document.getElementById('stockVehiclesContainer');
    if (container) {
        container.addEventListener('click', (e) => {
            if (e.target.closest('button, a')) return;
            const card = e.target.closest('.vehicle-card');
            if (!card || !card.dataset.vehicleId) return;
            openVehicleModal(card.dataset.vehicleId);
        });
    }

    // Clic en el fondo oscuro cierra el modal de detalle
    const vehicleModal = document.getElementById('vehicle-modal');
    if (vehicleModal) {
        vehicleModal.addEventListener('click', (e) => {
            if (e.target === vehicleModal) closeVehicleModal();
        });
    }

    // Escape: primero el detalle, luego el stock
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (vehicleModal && vehicleModal.style.display === 'flex') {
            e.stopPropagation();
            closeVehicleModal();
        }
    }, true);
});

// Cargar todo el stock de Supabase al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadStockFromSupabase();
    });
} else {
    loadStockFromSupabase();
}

// ============================================
// FIN DEL SCRIPT
// ============================================
