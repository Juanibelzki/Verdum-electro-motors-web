/* ============================================
   PANEL ADMINISTRATIVO - LÓGICA
   ============================================ */

const ADMIN_PASSWORD = 'verdun2024';
const IMAGES_STORAGE_KEY = 'verdun_images';
const VEHICLES_STORAGE_KEY = 'verdun_vehicles';
const CUSTOM_VEHICLES_KEY = 'verdun_custom_vehicles';
const DELETED_DEFAULT_VEHICLES_KEY = 'verdun_deleted_default_vehicles';

/* ============================================
   SUPABASE - CLIENTE ADMIN
   ============================================ */
const SUPABASE_URL = 'https://ymiakfjhgndqhdtoubkr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaWFrZmpoZ25kcWhkdG91YmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjkyNTIsImV4cCI6MjEwMDYwNTI1Mn0.Q0opccAEYWgkuyV1unwnpNu0OiWbio3E1pAURi8GPaI';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORY_TEXT_TO_SLUG = {
    'Autos 0KM': 'autos-0km',
    'Autos Usados': 'autos-usados',
    'Vehículos Especiales': 'vehiculos-especiales'
};

let categoryIdCache = null;

const CATEGORY_ADMIN_TO_DB = {
    'autos-0km': '0km',
    'autos-usados': 'usados',
    'vehiculos-especiales': 'especiales'
};

async function getCategoryIdMap() {
    if (categoryIdCache) return categoryIdCache;
    try {
        const { data } = await supabaseClient.from('categories').select('id, slug');
        const map = {};
        (data || []).forEach(cat => { map[cat.slug] = cat.id; });
        categoryIdCache = map;
        return map;
    } catch {
        return {};
    }
}

async function resolveCategoryId(slug) {
    const map = await getCategoryIdMap();
    const dbSlug = CATEGORY_ADMIN_TO_DB[slug] || slug;
    return map[dbSlug] || null;
}

let pendingLogoData = null;
let pendingLogoUrl = null;
let imagesUiInitialized = false;
const dataCache = {};

const contentCache = {};

async function sbGetContent(key) {
    if (contentCache[key] !== undefined) return contentCache[key];
    try {
        const { data } = await supabaseClient
            .from('admin_content')
            .select('data')
            .eq('key', key)
            .maybeSingle();
        contentCache[key] = data && data.data !== null && data.data !== undefined ? data.data : null;
        return contentCache[key];
    } catch {
        return null;
    }
}

async function sbSaveContent(key, data) {
    contentCache[key] = data;
    const { error } = await supabaseClient
        .from('admin_content')
        .upsert({ key, data, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
}

async function sbUploadImage(folder, filename, blob, contentType) {
    const { error } = await supabaseClient.storage
        .from('stock-photos')
        .upload(`${folder}/${filename}`, blob, { upsert: true, contentType });
    if (error) throw error;
    const { data: { publicUrl } } = supabaseClient.storage
        .from('stock-photos')
        .getPublicUrl(`${folder}/${filename}`);
    return publicUrl;
}

const SITE_IMAGE_SLOTS = [
    { key: 'hero_visual', label: 'Hero Visual', fileHint: 'hero_visual.png' },
    { key: 'service_1', label: 'Servicio 1 — Autos 0KM', fileHint: 'service_1.png' },
    { key: 'service_2', label: 'Servicio 2 — Autos Usados', fileHint: 'service_2.png' },
    { key: 'service_5', label: 'Servicio 3 — Vehículos Especiales', fileHint: 'service_5.png' }
];

const DEFAULT_VEHICLES = [
    { id: 1, category: 'Autos 0KM', marca: 'Volkswagen', modelo: 'Virtus', precio: 2850000, anio: 2024, km: '0 KM', color: 'Blanco' },
    { id: 2, category: 'Autos 0KM', marca: 'Nissan', modelo: 'Versa', precio: 2450000, anio: 2024, km: '0 KM', color: 'Plata' },
    { id: 3, category: 'Autos 0KM', marca: 'Chevrolet', modelo: 'Onix', precio: 2100000, anio: 2024, km: '0 KM', color: 'Negro' },
    { id: 4, category: 'Autos 0KM', marca: 'Toyota', modelo: 'Corolla', precio: 3150000, anio: 2024, km: '0 KM', color: 'Gris' },
    { id: 5, category: 'Autos Usados', marca: 'Volkswagen', modelo: 'Gol', precio: 1450000, anio: 2019, km: '85000', color: 'Rojo' },
    { id: 6, category: 'Autos Usados', marca: 'Ford', modelo: 'EcoSport', precio: 1850000, anio: 2020, km: '72500', color: 'Blanco' },
    { id: 7, category: 'Autos Usados', marca: 'Peugeot', modelo: '208', precio: 1250000, anio: 2018, km: '95000', color: 'Azul' },
    { id: 8, category: 'Autos Usados', marca: 'Honda', modelo: 'Civic', precio: 1650000, anio: 2019, km: '68000', color: 'Plateado' },
    { id: 9, category: 'Autos Usados', marca: 'Renault', modelo: 'Kwid', precio: 950000, anio: 2020, km: '45000', color: 'Negro' },
    { id: 17, category: 'Vehículos Especiales', marca: 'Ford', modelo: 'Ranger', precio: 4200000, anio: 2024, km: '0 KM', color: 'Gris' },
    { id: 18, category: 'Vehículos Especiales', marca: 'Toyota', modelo: 'Hilux', precio: 4800000, anio: 2024, km: '0 KM', color: 'Blanco' },
    { id: 19, category: 'Vehículos Especiales', marca: 'Fiat', modelo: 'Fiorino', precio: 1800000, anio: 2023, km: '15000', color: 'Blanco' }
];

const SECTION_MAP = {
    metricas: 'metricas-section',
    servicios: 'servicios-section',
    financiacion: 'financiacion-section',
    contenido: 'contenido-section',
    imagenes: 'imagenes-section',
    testimonios: 'testimonios-section',
    estadisticas: 'estadisticas-section'
};

const SECTION_TITLES = {
    metricas: 'Gestionar Métricas',
    servicios: 'Editar Servicios',
    financiacion: 'Editar Financiación',
    contenido: 'Editar Contenido',
    imagenes: 'Gestionar Imágenes',
    testimonios: 'Editar Testimonios',
    estadisticas: 'Cambios Realizados'
};

document.addEventListener('DOMContentLoaded', () => initAdmin());

async function initAdmin() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';

    if (isAuthenticated) {
        showAdminPanel();
        await loadAllData();
    } else {
        showLoginScreen();
    }

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    const adminNav = document.querySelector('.admin-nav');
    if (adminNav) {
        adminNav.addEventListener('click', navigateSection);
    }

    initImagesSection();
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('financing-file-input')) handleFinancingImageUpload(e);
    });
    bindGlobalActions();
}

function bindGlobalActions() {
    window.updateMetric = updateMetric;
    window.updateService = updateService;
    window.updateContent = updateContent;
    window.clearChangesLog = clearChangesLog;
    window.removeSiteImage = removeSiteImage;
    window.saveLogo = saveLogo;
    window.updateTestimonio = updateTestimonio;
    window.updateFinancingOption = updateFinancingOption;
    window.showAddVehicleForm = showAddVehicleForm;
    window.closeAddVehicleForm = closeAddVehicleForm;
    window.saveNewVehicle = saveNewVehicle;
    window.deleteCustomVehicle = deleteCustomVehicle;
    window.deleteVehicle = deleteVehicle;
}

async function handleLogin(e) {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminAuthenticated', 'true');
        errorDiv.style.display = 'none';
        showAdminPanel();
        await loadAllData();
    } else {
        errorDiv.textContent = '❌ Contraseña incorrecta';
        errorDiv.style.display = 'block';
        document.getElementById('password').value = '';
    }
}

function handleLogout() {
    if (confirm('¿Deseas cerrar sesión?')) {
        localStorage.removeItem('adminAuthenticated');
        showLoginScreen();
        document.getElementById('loginForm').reset();
    }
}

function resizeImage(file, maxW, maxH, quality = 0.8) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let { width: w, height: h } = img;
            if (w > maxW) { h = h * maxW / w; w = maxW; }
            if (h > maxH) { w = w * maxH / h; h = maxH; }
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            c.toBlob((blob) => {
                resolve({ blob, width: w, height: h, originalName: file.name });
            }, 'image/webp', quality);
        };
        img.src = URL.createObjectURL(file);
    });
}

function blobToBase64(blob) {
    return new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.readAsDataURL(blob);
    });
}

function validateImageFile(file, maxMB = 5) {
    if (!file) return 'No se seleccionó archivo';
    if (!file.type.startsWith('image/')) return 'Solo se permiten imágenes';
    if (file.size > maxMB * 1024 * 1024) return `Archivo muy grande (máx ${maxMB}MB)`;
    return null;
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
}

function navigateSection(e) {
    const btn = e.target.closest('.admin-nav-btn');
    if (!btn) return;

    const section = btn.dataset.section;
    if (!section || !SECTION_MAP[section]) return;

    document.querySelectorAll('.admin-nav-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.admin-section').forEach((sec) => sec.classList.remove('active'));
    document.getElementById(SECTION_MAP[section]).classList.add('active');
    document.getElementById('sectionTitle').textContent = SECTION_TITLES[section];

    if (section === 'imagenes') {
        loadImagesSection();
    }
}

async function loadAllData() {
    await loadMetrics();
    await loadServices();
    await loadContent();
    await loadFinancingOptions();
    await loadImagesSection();
    await loadTestimonios();
    await loadChangeStats();
}

async function loadMetrics() {
    const metrics = await sbGetContent('metrics') || loadStoredData('metrics', [
        { icon: '🚗', text: '0KM y Usados' },
        { icon: '💳', text: 'Financiación sin banco' },
        { icon: '⚡', text: 'Motos y Bicicletas Eléctricas' },
        { icon: '📍', text: 'Av. Chacabuco 1725, Corrientes' }
    ]);

    metrics.forEach((metric, index) => {
        const iconEl = document.getElementById(`metricIcon${index}`);
        const textEl = document.getElementById(`metricText${index}`);
        const iconInput = document.getElementById(`metricIconInput${index}`);
        const textInput = document.getElementById(`metricTextInput${index}`);
        if (!iconEl || !textInput) return;

        iconEl.textContent = metric.icon;
        textEl.textContent = metric.text;
        iconInput.value = metric.icon;
        textInput.value = metric.text;
    });
}

async function loadServices() {
    const defaults = [
        { desc: 'Nacionales e importados. Las mejores marcas con financiación propia.', features: ['VW', 'Nissan', 'Chevrolet'] },
        { desc: 'Revisados y garantizados. Todas las marcas con documentación completa.', features: ['Garantía', 'Revisados', 'Legales'] },
        { desc: 'Camionetas 4x4, furgones, minibuses y vehículos comerciales. Presupuesto a medida.', features: ['4x4', 'Comerciales', 'A medida'] }
    ];
    const services = await sbGetContent('services') || loadStoredData('services', defaults);
    if (services.length !== 3) {
        services.length = 3;
        defaults.forEach((d, i) => { if (!services[i]) services[i] = d; });
        dataCache.services = services;
        try { await sbSaveContent('services', services); } catch {}
        try { localStorage.setItem('services', JSON.stringify(services)); } catch {}
    }

    services.forEach((service, index) => {
        const descEl = document.getElementById(`serviceDesc${index}`);
        const featEl = document.getElementById(`serviceFeatures${index}`);
        if (!descEl || !featEl) return;
        descEl.value = service.desc;
        featEl.value = service.features.join(',');
    });
}

/* ============================================
   EDITAR OPCIONES DE FINANCIACIÓN
   ============================================ */

async function loadFinancingOptions() {
    const defaults = {
        financing_own: { title: 'Financiación Propia', description: 'Sin banco. Aprobación en el día con cuotas fijas en pesos.', features: ['Aprobación inmediata', 'Cuotas fijas', 'Sin comisiones ocultas', 'Hasta 84 meses'] },
        financing_bank: { title: 'Crédito Bancario', description: 'Mejores tasas del mercado con nuestros bancos aliados.', features: ['Tasas competitivas', 'Múltiples opciones', 'Tramitación rápida', 'Asesoramiento gratuito'] },
        financing_permuta: { title: 'Permuta', description: 'Tu usado como parte de pago. Tasación justa y transparente.', features: ['Tasación real', 'Proceso transparente', 'Compra de tu usado', 'Trámites incluidos'] }
    };
    const financing = await sbGetContent('financing_images') || loadStoredData('financing_images', defaults);
    ['financing_own', 'financing_bank', 'financing_permuta'].forEach(type => {
        const data = financing[type] || {};
        const titleEl = document.getElementById(`${type}-title`);
        const descEl = document.getElementById(`${type}-desc`);
        const featEl = document.getElementById(`${type}-features`);
        if (titleEl) titleEl.value = data.title || '';
        if (descEl) descEl.value = data.description || '';
        if (featEl && data.features) featEl.value = data.features.join(',');
        const previewImg = document.getElementById(`preview-${type}`);
        if (previewImg && (data.url || data.fallback_base64)) {
            previewImg.src = data.url || data.fallback_base64;
            previewImg.style.display = 'block';
            const ph = document.getElementById(`ph-${type}`);
            if (ph) ph.style.display = 'none';
        }
    });
}

async function updateFinancingOption(type) {
    const title = document.getElementById(`${type}-title`).value.trim();
    const description = document.getElementById(`${type}-desc`).value.trim();
    const featuresStr = document.getElementById(`${type}-features`).value.trim();
    if (!title || !description) { alert('Completá título y descripción'); return; }
    const features = featuresStr.split(',').map(f => f.trim()).filter(Boolean);
    const financing = await sbGetContent('financing_images') || {};
    financing[type] = { ...(financing[type] || {}), title, description, features, updatedAt: new Date().toISOString() };
    await sbSaveContent('financing_images', financing);
    try { localStorage.setItem('financing_images', JSON.stringify(financing)); } catch {}
    await addChange(`Opción de financiación "${type}" actualizada`);
    alert('✓ Guardado');
}

async function handleFinancingImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const type = event.target.dataset.financingType;
    const err = validateImageFile(file, 2);
    if (err) { alert('❌ ' + err); event.target.value = ''; return; }

    const result = await resizeImage(file, 1200, 900, 0.85);
    const base64 = await blobToBase64(result.blob);
    let url = null;
    try {
        url = await sbUploadImage('financing', `${type}.webp`, result.blob, 'image/webp');
    } catch (e) {
        console.warn('No se pudo subir la imagen de financiación a Supabase:', e);
    }
    const financing = await sbGetContent('financing_images') || {};
    if (!financing[type]) financing[type] = {};
    if (url) financing[type].url = url;
    financing[type].fallback_base64 = base64;
    financing[type].name = file.name;
    financing[type].uploadedAt = new Date().toISOString();
    await sbSaveContent('financing_images', financing);
    try { localStorage.setItem('financing_images', JSON.stringify(financing)); } catch {}
    const previewImg = document.getElementById(`preview-${type}`);
    if (previewImg) { previewImg.src = base64; previewImg.style.display = 'block'; }
    const ph = document.getElementById(`ph-${type}`);
    if (ph) ph.style.display = 'none';
    alert('✓ Imagen cargada y optimizada');
    event.target.value = '';
}

async function loadContent() {
    const content = await sbGetContent('content') || loadStoredData('content', {
        heroTitle: 'Vehículos Premium',
        heroHighlight: 'Para tu Estilo',
        heroSubtitle: 'Autos 0KM, Usados garantizados y Motos Eléctricas. 30 años brindando la mejor experiencia en movilidad.',
        statYears: 30,
        statVehicles: 500
    });

    document.getElementById('heroTitle').value = content.heroTitle;
    document.getElementById('heroHighlight').value = content.heroHighlight;
    document.getElementById('heroSubtitle').value = content.heroSubtitle;
    document.getElementById('statYears').value = content.statYears;
    document.getElementById('statVehicles').value = content.statVehicles;
}

async function loadChangeStats() {
    const stats = loadStoredData('editStats', { count: 0, lastEdit: null });
    document.getElementById('editCount').textContent = stats.count;

    if (stats.lastEdit) {
        const date = new Date(stats.lastEdit);
        document.getElementById('lastEditTime').textContent = date.toLocaleTimeString('es-AR');
    }

    await loadChangesList();
}

async function updateMetric(index) {
    const icon = document.getElementById(`metricIconInput${index}`).value;
    const text = document.getElementById(`metricTextInput${index}`).value;

    if (!icon || !text) {
        alert('Completa todos los campos');
        return;
    }

    document.getElementById(`metricIcon${index}`).textContent = icon;
    document.getElementById(`metricText${index}`).textContent = text;

    const metrics = await sbGetContent('metrics') || [];
    if (!metrics[index]) metrics[index] = {};
    metrics[index].icon = icon;
    metrics[index].text = text;
    await sbSaveContent('metrics', metrics);
    try { saveStoredData('metrics', metrics); } catch {}

    await addChange(`Métrica ${index + 1} actualizada: "${text}"`);
    alert('✓ Métrica guardada correctamente');
}

async function updateService(index) {
    const desc = document.getElementById(`serviceDesc${index}`).value;
    const featuresStr = document.getElementById(`serviceFeatures${index}`).value;

    if (!desc || !featuresStr) {
        alert('Completa todos los campos');
        return;
    }

    const features = featuresStr.split(',').map((f) => f.trim());
    const services = await sbGetContent('services') || [];
    if (!services[index]) services[index] = {};
    services[index].desc = desc;
    services[index].features = features;
    await sbSaveContent('services', services);
    try { saveStoredData('services', services); } catch {}

    await addChange(`Servicio ${index + 1} actualizado`);
    alert('✓ Servicio guardado correctamente');
}

async function updateContent() {
    const content = {
        heroTitle: document.getElementById('heroTitle').value,
        heroHighlight: document.getElementById('heroHighlight').value,
        heroSubtitle: document.getElementById('heroSubtitle').value,
        statYears: parseInt(document.getElementById('statYears').value, 10),
        statVehicles: parseInt(document.getElementById('statVehicles').value, 10)
    };

    if (!content.heroTitle || !content.heroHighlight) {
        alert('Completa todos los campos requeridos');
        return;
    }

    await sbSaveContent('content', content);
    try { saveStoredData('content', content); } catch {}
    await addChange('Contenido principal actualizado');
    alert('✓ Contenido guardado correctamente');
}

async function loadTestimonios() {
    const testimonios = await sbGetContent('testimonios') || loadStoredData('testimonios', [
        { text: 'Excelente atención y vehículos de primera calidad. Compré mi Volkswagen con Verdun y no me arrepiento. Recomiendo a todos mis amigos.', author: 'Carlos M.', role: 'Cliente satisfecho' },
        { text: 'La financiación sin banco fue súper rápida. En una tarde resolvimos todo y me llevé el auto. Transparencia total.', author: 'María L.', role: 'Compradora 0KM' },
        { text: 'Traté con muchas concesionarias. Verdun se destaca por profesionalismo y honestidad. El mejor lugar para comprar en Corrientes.', author: 'Juan P.', role: 'Cliente recurrente' }
    ]);

    testimonios.forEach((t, index) => {
        const textEl = document.getElementById(`testimonioText${index}`);
        const authorEl = document.getElementById(`testimonioAuthor${index}`);
        const roleEl = document.getElementById(`testimonioRole${index}`);
        if (!textEl) return;
        textEl.value = t.text;
        if (authorEl) authorEl.value = t.author;
        if (roleEl) roleEl.value = t.role;
    });
}

async function updateTestimonio(index) {
    const text = document.getElementById(`testimonioText${index}`).value;
    const author = document.getElementById(`testimonioAuthor${index}`).value;
    const role = document.getElementById(`testimonioRole${index}`).value;

    if (!text || !author) {
        alert('Completa el texto y el autor');
        return;
    }

    const testimonios = await sbGetContent('testimonios') || [];
    if (!testimonios[index]) testimonios[index] = {};
    testimonios[index].text = text;
    testimonios[index].author = author;
    testimonios[index].role = role;
    await sbSaveContent('testimonios', testimonios);
    try { saveStoredData('testimonios', testimonios); } catch {}

    await addChange(`Testimonio ${index + 1} actualizado`);
    alert('✓ Testimonio guardado correctamente');
}

async function addChange(message) {
    const changes = loadStoredData('changes', []);
    changes.unshift({
        message,
        timestamp: new Date().toLocaleString('es-AR')
    });

    if (changes.length > 20) changes.pop();

    saveStoredData('changes', changes);

    const stats = loadStoredData('editStats', { count: 0, lastEdit: null });
    stats.count += 1;
    stats.lastEdit = new Date().toISOString();
    saveStoredData('editStats', stats);

    await loadChangeStats();
}

async function loadChangesList() {
    const changes = loadStoredData('changes', []);
    const list = document.getElementById('changesList');

    if (changes.length === 0) {
        list.innerHTML = '<p class="empty-message">No hay cambios registrados aún</p>';
        return;
    }

    list.innerHTML = changes
        .map(
            (change, index) => `
        <div class="change-item">
            <span class="change-number">#${index + 1}</span>
            <div class="change-info">
                <p class="change-message">${escapeHtml(change.message)}</p>
                <p class="change-time">${escapeHtml(change.timestamp)}</p>
            </div>
        </div>
    `
        )
        .join('');
}

async function clearChangesLog() {
    localStorage.removeItem('changes');
    const stats = { count: 0, lastEdit: null };
    saveStoredData('editStats', stats);
    await loadChangeStats();
    alert('✓ Historial limpiado');
}

function loadStoredData(key, defaultValue) {
    if (dataCache[key] !== undefined) return dataCache[key];
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            const data = JSON.parse(stored);
            dataCache[key] = data;
            return data;
        }
    } catch {}
    return defaultValue;
}

function saveStoredData(key, value) {
    dataCache[key] = value;
    try {
        const json = JSON.stringify(value);
        if (json.length < 10_000_000) {
            localStorage.setItem(key, json);
        } else {
            console.error(`Storage limit exceeded for "${key}": ${(json.length / 1_000_000).toFixed(1)}MB`);
        }
    } catch {}
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function getSiteImages() {
    return await sbGetContent('site_images') || loadStoredData(IMAGES_STORAGE_KEY, {});
}

async function setSiteImages(images) {
    await sbSaveContent('site_images', images);
    try { saveStoredData(IMAGES_STORAGE_KEY, images); } catch {}
}

function getVehicleOverrides() {
    return loadStoredData(VEHICLES_STORAGE_KEY, {});
}

function setVehicleOverrides(data) {
    saveStoredData(VEHICLES_STORAGE_KEY, data);
}

const VEHICLE_CATEGORY_NAMES = {
    'autos-0km': 'Autos 0KM',
    'autos-usados': 'Autos Usados',
    'motos-electricas': 'Motos Eléctricas',
    'patinetas-electricas': 'Patinetas Eléctricas',
    'vehiculos-especiales': 'Vehículos Especiales'
};

async function syncVehiclesFromSupabase() {
    let overrides = loadStoredData(VEHICLES_STORAGE_KEY, {});
    const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    let idMap = loadStoredData('supabase_vehicle_map', {});

    // Mapa category_id (uuid) -> slug admin
    const catMap = await getCategoryIdMap();
    const idToSlugMap = {};
    for (const slug in catMap) idToSlugMap[catMap[slug]] = slug;

    let rows = [];
    try {
        const { data } = await supabaseClient
            .from('vehicles')
            .select('id, slug, nombre, marca, modelo, año, km, color, descripcion, category_id, photos(url, url_thumb, posicion)')
            .eq('activo', true);
        rows = data || [];
    } catch (sbErr) {
        console.warn('Sync from Supabase failed:', sbErr.message);
        return;
    }
    if (!rows.length) return;

    const knownSupabaseIds = new Set(Object.values(idMap));
    const takenLocalIds = new Set(customVehicles.map(v => v.id));
    let maxId = customVehicles.reduce((mx, v) => Math.max(mx, v.id), 100);

    for (const row of rows) {
        const isDefaultMatch = DEFAULT_VEHICLES.some(
            dv => String(dv.marca).toLowerCase() === String(row.marca).toLowerCase()
                && String(dv.modelo).toLowerCase() === String(row.modelo).toLowerCase()
        );

        if (isDefaultMatch) {
            const dv = DEFAULT_VEHICLES.find(
                d => String(d.marca).toLowerCase() === String(row.marca).toLowerCase()
                    && String(d.modelo).toLowerCase() === String(row.modelo).toLowerCase()
            );
            const o = overrides[dv.id] || {};
            o.nombre = row.nombre || o.nombre;
            o.anio = row.año || o.anio;
            o.km = row.km || o.km;
            o.color = row.color || o.color;
            o.descripcion = row.descripcion || o.descripcion;
            const photos = (row.photos || []).slice().sort((a, b) => a.posicion - b.posicion);
            if (photos[0] && photos[0].url) o.image = photos[0].url;
            overrides[dv.id] = o;
            idMap[dv.id] = row.id;
            continue;
        }

        if (knownSupabaseIds.has(row.id)) continue;

        maxId++;
        while (takenLocalIds.has(maxId)) maxId++;

        const photos = (row.photos || []).slice().sort((a, b) => a.posicion - b.posicion);
        const catSlug = idToSlugMap[row.category_id] || 'autos-usados';
        customVehicles.push({
            id: maxId,
            uuid: row.id,
            slug: row.slug,
            category: catSlug,
            categoryText: VEHICLE_CATEGORY_NAMES[catSlug] || catSlug,
            marca: row.marca || '',
            modelo: row.modelo || '',
            anio: row.año || 2024,
            km: row.km || '0 KM',
            color: row.color || '—',
            descripcion: row.descripcion || '',
            image: photos[0] ? photos[0].url : ''
        });
        idMap[maxId] = row.id;
        takenLocalIds.add(maxId);
    }

    saveStoredData(VEHICLES_STORAGE_KEY, overrides);
    saveStoredData(CUSTOM_VEHICLES_KEY, customVehicles);
    saveStoredData('supabase_vehicle_map', idMap);
}

function initImagesSection() {
    if (imagesUiInitialized) return;

    const imagenesSection = document.getElementById('imagenes-section');
    if (!imagenesSection) return;

    const logoInput = document.getElementById('logoFileInput');
    const logoUploadBtn = document.getElementById('logoUploadBtn');
    const logoRemoveBtn = document.getElementById('logoRemoveBtn');
    const logoSaveBtn = document.getElementById('logoSaveBtn');

    if (logoUploadBtn && logoInput) {
        logoUploadBtn.addEventListener('click', () => logoInput.click());
        logoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            const err = validateImageFile(file, 2);
            if (err) { alert('❌ ' + err); e.target.value = ''; return; }
            const result = await resizeImage(file, 400, 200, 0.85);
            const base64 = await blobToBase64(result.blob);
            pendingLogoData = base64;
            pendingLogoUrl = null;
            try {
                pendingLogoUrl = await sbUploadImage('site', 'logo.webp', result.blob, 'image/webp');
            } catch (err) {
                console.warn('No se pudo subir el logo a Supabase:', err);
            }
            updateLogoPreview(base64);
            e.target.value = '';
        });
    }

    if (logoRemoveBtn) {
        logoRemoveBtn.addEventListener('click', () => removeSiteImage('logo'));
    }

    if (logoSaveBtn) {
        logoSaveBtn.addEventListener('click', saveLogo);
    }

    const siteGrid = document.getElementById('siteImagesGrid');
    if (siteGrid) {
        siteGrid.addEventListener('click', (e) => {
            const uploadBtn = e.target.closest('.site-upload-btn');
            const removeBtn = e.target.closest('.site-remove-btn');
            if (uploadBtn) {
                const input = siteGrid.querySelector(`.site-image-input[data-key="${uploadBtn.dataset.key}"]`);
                if (input) input.click();
            }
            if (removeBtn) {
                removeSiteImage(removeBtn.dataset.key);
            }
        });

        siteGrid.addEventListener('change', async (e) => {
            if (!e.target.classList.contains('site-image-input')) return;
            const key = e.target.dataset.key;
            const file = e.target.files[0];
            const err = validateImageFile(file, 5);
            if (err) { alert('❌ ' + err); e.target.value = ''; return; }
            const result = await resizeImage(file, 1920, 1080, 0.85);
            const base64 = await blobToBase64(result.blob);
            let url = null;
            try {
                url = await sbUploadImage('site', `${key}.webp`, result.blob, 'image/webp');
            } catch (e) {
                console.warn('No se pudo subir la imagen a Supabase:', e);
            }
            const images = await getSiteImages();
            images[key] = { url: url || null, data: base64, timestamp: new Date().toLocaleString('es-AR') };
            await setSiteImages(images);
            await renderSiteImagesGrid();
            await addChange(`Imagen de sitio "${key}" actualizada`);
            e.target.value = '';
        });
    }

    const vehiclesEditor = document.getElementById('vehiclesEditor');
    if (vehiclesEditor) {
        vehiclesEditor.addEventListener('click', (e) => {
            const photoBtn = e.target.closest('.vehicle-photo-btn');
            const saveBtn = e.target.closest('.vehicle-save-btn');
            const deleteBtn = e.target.closest('.vehicle-delete-btn');
            if (photoBtn) {
                const input = vehiclesEditor.querySelector(`.vehicle-image-input[data-id="${photoBtn.dataset.id}"]`);
                if (input) input.click();
            }
            if (saveBtn) {
                saveVehicle(parseInt(saveBtn.dataset.id, 10));
            }
            if (deleteBtn) {
                deleteVehicle(parseInt(deleteBtn.dataset.id, 10));
            }
        });

        vehiclesEditor.addEventListener('change', async (e) => {
            if (!e.target.classList.contains('vehicle-image-input')) return;
            const id = parseInt(e.target.dataset.id, 10);
            const file = e.target.files[0];
            const err = validateImageFile(file, 5);
            if (err) { alert('❌ ' + err); e.target.value = ''; return; }
            const result = await resizeImage(file, 600, 450, 0.6);
            const base64 = await blobToBase64(result.blob);
            const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
            const isCustom = customVehicles.some(v => v.id === id);
            if (isCustom) {
                const updated = customVehicles.map(v => {
                    if (v.id !== id) return v;
                    return { ...v, image: base64 };
                });
                saveStoredData(CUSTOM_VEHICLES_KEY, updated);
            } else {
                const overrides = getVehicleOverrides();
                if (!overrides[id]) overrides[id] = {};
                overrides[id].image = base64;
                setVehicleOverrides(overrides);
            }
            renderVehiclesEditor();

            // Subir a Supabase Storage si tenemos el mapping
            uploadVehicleImageToSupabase(id, base64);

            addChange(`Foto del vehículo #${id} actualizada`);
            e.target.value = '';
        });
    }

    imagesUiInitialized = true;
}

function updateLogoPreview(base64) {
    const img = document.getElementById('logoPreview');
    const placeholder = document.getElementById('logoPlaceholder');
    if (!img) return;

    if (base64) {
        img.src = base64;
        img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    } else {
        img.style.display = 'none';
        img.removeAttribute('src');
        if (placeholder) placeholder.style.display = 'block';
    }
}

async function loadLogoPreview() {
    const images = await getSiteImages();
    const logo = images.logo;
    if (logo && (logo.url || logo.data)) {
        const src = logo.url || logo.data;
        updateLogoPreview(src);
        pendingLogoData = logo.data || null;
        pendingLogoUrl = logo.url || null;
    }
}

async function uploadVehicleImageToSupabase(adminId, base64Data) {
    try {
        const idMap = loadStoredData('supabase_vehicle_map', {});
        const supabaseVehicleId = idMap[adminId];
        if (!supabaseVehicleId) return;

        const blob = await (await fetch(base64Data)).blob();
        const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
        const fileName = `${Date.now()}-${adminId}.${ext}`;
        const storagePath = `vehicles/${supabaseVehicleId}/${fileName}`;

        const { error: upErr } = await supabaseClient.storage
            .from('stock-photos')
            .upload(storagePath, blob, { upsert: true, contentType: blob.type });
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabaseClient.storage.from('stock-photos').getPublicUrl(storagePath);

        await supabaseClient.from('photos').insert({
            vehicle_id: supabaseVehicleId,
            url: publicUrl,
            url_thumb: publicUrl,
            posicion: 0
        });
    } catch (err) {
        console.warn('Supabase image upload failed:', err.message);
    }
}

async function saveLogo() {
    if (!pendingLogoData) {
        alert('Subí un logo antes de guardar');
        return;
    }
    const images = await getSiteImages();
    if (pendingLogoUrl) {
        images.logo = { url: pendingLogoUrl, timestamp: new Date().toLocaleString('es-AR') };
    } else {
        images.logo = { data: pendingLogoData, timestamp: new Date().toLocaleString('es-AR') };
    }
    await setSiteImages(images);
    await addChange('Logo de empresa actualizado');
    alert('✓ Logo guardado correctamente');
}

async function removeSiteImage(key) {
    const images = await getSiteImages();
    delete images[key];
    await setSiteImages(images);

    if (key === 'logo') {
        pendingLogoData = null;
        pendingLogoUrl = null;
        updateLogoPreview(null);
    } else {
        await renderSiteImagesGrid();
    }

    await addChange(`Imagen "${key}" eliminada`);
    alert('✓ Imagen eliminada');
}

async function renderSiteImagesGrid() {
    const grid = document.getElementById('siteImagesGrid');
    if (!grid) return;

    const images = await getSiteImages();

    grid.innerHTML = SITE_IMAGE_SLOTS.map((slot) => {
        const stored = images[slot.key];
        const previewSrc = stored && (stored.url || stored.data) ? (stored.url || stored.data) : '';
        const previewStyle = previewSrc ? '' : 'display:none';
        const placeholderStyle = previewSrc ? 'display:none' : '';
        return `
            <div class="site-image-card" data-key="${slot.key}">
                <h4>${slot.label}</h4>
                <p class="image-file-hint">${slot.fileHint}</p>
                <div class="image-preview-box site-preview-box">
                    <img class="preview-img site-slot-preview" src="${previewSrc}" alt="${slot.label}" style="${previewStyle}">
                    <span class="preview-placeholder" style="${placeholderStyle}">Sin imagen</span>
                </div>
                <input type="file" class="site-image-input" accept="image/*" data-key="${slot.key}" hidden>
                <div class="image-card-actions">
                    <button type="button" class="btn-update site-upload-btn" data-key="${slot.key}">📤 Subir</button>
                    <button type="button" class="btn-secondary-outline site-remove-btn" data-key="${slot.key}">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function getVehicleDefaultName(v) {
    return `${v.marca} ${v.modelo}`;
}

async function renderVehiclesEditor() {
    const container = document.getElementById('vehiclesEditor');
    if (!container) return;

    await syncVehiclesFromSupabase();

    const overrides = await getVehicleOverrides();
    const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const deletedDefaults = loadStoredData(DELETED_DEFAULT_VEHICLES_KEY, []);
    let nextCustomId = 100;

    let html = '';

    // Vehículos por defecto
    DEFAULT_VEHICLES.forEach((v) => {
        if (deletedDefaults.includes(v.id)) return;
        const o = overrides[v.id] || {};
        const nombre = o.nombre !== undefined ? o.nombre : getVehicleDefaultName(v);
        const anio = o.anio !== undefined ? o.anio : (v.anio || 2024);
        const km = o.km !== undefined ? o.km : (v.km || '0 KM');
        const color = o.color !== undefined ? o.color : (v.color || '—');
        const descripcion = o.descripcion || '';
        const imgSrc = o.image || '';

        html += `
            <div class="vehicle-edit-card" data-id="${v.id}">
                <div class="vehicle-edit-header">
                    <span class="vehicle-category-tag">${v.category}</span>
                    <span class="vehicle-id-tag">#${v.id}</span>
                </div>
                <div class="vehicle-edit-body">
                    <div class="vehicle-edit-preview">
                        <img class="preview-img vehicle-preview-img" src="${imgSrc}" style="${imgSrc ? '' : 'display:none'}" alt="Vehículo ${v.id}">
                        <span class="preview-placeholder" style="${imgSrc ? 'display:none' : ''}">Sin foto</span>
                        <input type="file" class="vehicle-image-input" accept="image/*" data-id="${v.id}" hidden>
                        <button type="button" class="btn-update vehicle-photo-btn" data-id="${v.id}">📷 Subir foto</button>
                    </div>
                    <div class="vehicle-edit-fields">
                        <label>Nombre</label>
                        <input type="text" class="vehicle-nombre" data-id="${v.id}" value="${escapeHtml(nombre)}">
                        <label>Año</label>
                        <input type="number" class="vehicle-anio" data-id="${v.id}" value="${anio}" min="1990" max="2030">
                        <label>KM</label>
                        <input type="text" class="vehicle-km" data-id="${v.id}" value="${escapeHtml(km)}">
                        <label>Color</label>
                        <input type="text" class="vehicle-color" data-id="${v.id}" value="${escapeHtml(color)}">
                        <label>Descripción</label>
                        <textarea class="vehicle-descripcion" data-id="${v.id}" rows="2">${escapeHtml(descripcion)}</textarea>
                        <button type="button" class="btn-update vehicle-save-btn" data-id="${v.id}">✓ Guardar vehículo</button>
                        <button type="button" class="btn-reset vehicle-delete-btn" data-id="${v.id}" style="margin-top:8px">🗑️ Eliminar</button>
                    </div>
                </div>
            </div>
        `;
    });

    // Vehículos personalizados
    customVehicles.forEach((cv) => {
        nextCustomId = Math.max(nextCustomId, cv.id + 1);
        const imgSrc = cv.image || '';
        html += `
            <div class="vehicle-edit-card vehicle-custom" data-id="${cv.id}">
                <div class="vehicle-edit-header">
                    <span class="vehicle-category-tag">${cv.categoryText || cv.category}</span>
                    <span class="vehicle-id-tag" style="color:var(--primary-400)">#${cv.id} ✚</span>
                </div>
                <div class="vehicle-edit-body">
                    <div class="vehicle-edit-preview">
                        <img class="preview-img vehicle-preview-img" src="${imgSrc}" style="${imgSrc ? '' : 'display:none'}" alt="Vehículo ${cv.id}">
                        <span class="preview-placeholder" style="${imgSrc ? 'display:none' : ''}">Sin foto</span>
                        <input type="file" class="vehicle-image-input" accept="image/*" data-id="${cv.id}" hidden>
                        <button type="button" class="btn-update vehicle-photo-btn" data-id="${cv.id}">📷 Subir foto</button>
                    </div>
                    <div class="vehicle-edit-fields">
                        <label>Nombre</label>
                        <input type="text" class="vehicle-nombre" data-id="${cv.id}" value="${escapeHtml(cv.marca + ' ' + cv.modelo)}">
                        <label>Año</label>
                        <input type="number" class="vehicle-anio" data-id="${cv.id}" value="${cv.anio || 2024}" min="1990" max="2030">
                        <label>KM</label>
                        <input type="text" class="vehicle-km" data-id="${cv.id}" value="${escapeHtml(cv.km || '0 KM')}">
                        <label>Color</label>
                        <input type="text" class="vehicle-color" data-id="${cv.id}" value="${escapeHtml(cv.color || '—')}">
                        <label>Descripción</label>
                        <textarea class="vehicle-descripcion" data-id="${cv.id}" rows="2">${escapeHtml(cv.descripcion || '')}</textarea>
                        <button type="button" class="btn-update vehicle-save-btn" data-id="${cv.id}">✓ Guardar</button>
                        <button type="button" class="btn-reset vehicle-delete-btn" data-id="${cv.id}" style="margin-top:8px">🗑️ Eliminar</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function saveVehicle(id) {
    const card = document.querySelector(`.vehicle-edit-card[data-id="${id}"]`);
    if (!card) return;

    const nombre = card.querySelector('.vehicle-nombre').value.trim();
    const anio = parseInt(card.querySelector('.vehicle-anio').value, 10);
    const km = card.querySelector('.vehicle-km').value.trim();
    const color = card.querySelector('.vehicle-color').value.trim();
    const descripcion = card.querySelector('.vehicle-descripcion').value.trim();

    if (!nombre || isNaN(anio)) {
        alert('Completá nombre y año');
        return;
    }

    // Custom vehicle?
    const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const isCustom = customVehicles.some(v => v.id === id);

    // --- SUPABASE: guardar vehículo ---
    let categorySlug = 'autos-usados';
    let marca = 'Generica';
    let modelo = nombre;
    let whatsapp_msg = `Hola! Quiero consultar por el ${nombre}`;

    if (isCustom) {
        const cv = customVehicles.find(v => v.id === id);
        if (cv) {
            categorySlug = cv.category;
            marca = cv.marca;
            modelo = cv.modelo;
        }
    } else {
        const dv = DEFAULT_VEHICLES.find(v => v.id === id);
        if (dv) {
            categorySlug = CATEGORY_TEXT_TO_SLUG[dv.category] || 'autos-usados';
            const parts = nombre.split(' ');
            marca = parts[0] || dv.marca;
            modelo = parts.slice(1).join(' ') || dv.modelo;
        }
    }

    const catId = await resolveCategoryId(categorySlug);
    const slug = `${marca}-${modelo}-${anio}`.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');


    // Upsert en Supabase
    let supabaseVehicleId = null;
    try {
        const { data: existing } = await supabaseClient
            .from('vehicles')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        const payload = {
            category_id: catId,
            slug,
            nombre,
            marca,
            modelo,
            año: anio,
            km,
            color,
            descripcion,
            whatsapp_msg,
            activo: true
        };

        let result;
        if (existing) {
            result = await supabaseClient.from('vehicles').update(payload).eq('id', existing.id).select().single();
        } else {
            result = await supabaseClient.from('vehicles').insert([payload]).select().single();
        }
        if (result.error) throw result.error;
        supabaseVehicleId = result.data.id;

        // Subir imagen si existe
        const imgEl = card.querySelector('.vehicle-preview-img');
        if (imgEl && imgEl.src && imgEl.src.startsWith('data:')) {
            const blob = await (await fetch(imgEl.src)).blob();
            const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
            const fileName = `${Date.now()}-${id}.${ext}`;
            const storagePath = `vehicles/${supabaseVehicleId}/${fileName}`;

            const { error: upErr } = await supabaseClient.storage
                .from('stock-photos')
                .upload(storagePath, blob, { upsert: true, contentType: blob.type });
            if (!upErr) {
        const { data: { publicUrl } } = supabaseClient.storage.from('stock-photos').getPublicUrl(storagePath);
                await supabaseClient.from('photos').insert({
                    vehicle_id: supabaseVehicleId,
                    url: publicUrl,
                    url_thumb: publicUrl,
                    posicion: 0
                });
            }
        }

        // Almacenar el mapping admin_id -> supabase_id
        const idMap = loadStoredData('supabase_vehicle_map', {});
        idMap[id] = supabaseVehicleId;
        saveStoredData('supabase_vehicle_map', idMap);

    } catch (sbErr) {
        console.warn('Supabase save failed, falling back to localStorage:', sbErr.message);
    }

    // --- localStorage fallback ---
    if (isCustom) {
        const updated = customVehicles.map(v => {
            if (v.id !== id) return v;
            const parts = nombre.split(' ');
            return {
                ...v,
                marca: parts[0] || v.marca,
                modelo: parts.slice(1).join(' ') || v.modelo,
                anio: anio,
                km: km,
                color: color,
                descripcion: descripcion
            };
        });
        saveStoredData(CUSTOM_VEHICLES_KEY, updated);
    } else {
        const overrides = await getVehicleOverrides();
        if (!overrides[id]) overrides[id] = {};
        overrides[id].nombre = nombre;
        overrides[id].anio = anio;
        overrides[id].km = km;
        overrides[id].color = color;
        overrides[id].descripcion = descripcion;
        await setVehicleOverrides(overrides);
    }

    await addChange(`Vehículo #${id} actualizado: ${nombre}`);
    alert('✓ Vehículo guardado');
}

function showAddVehicleForm() {
    document.getElementById('addVehicleModal').style.display = 'flex';
}

function closeAddVehicleForm() {
    document.getElementById('addVehicleModal').style.display = 'none';
}

async function saveNewVehicle() {
    const category = document.getElementById('newVehicleCategory').value;
    const marca = document.getElementById('newVehicleMarca').value.trim();
    const modelo = document.getElementById('newVehicleModelo').value.trim();
    const anio = parseInt(document.getElementById('newVehicleAnio').value, 10);
    const km = document.getElementById('newVehicleKm').value.trim();
    const color = document.getElementById('newVehicleColor').value.trim();
    const descripcion = document.getElementById('newVehicleDesc').value.trim();

    if (!marca || !modelo || isNaN(anio)) {
        alert('Completá marca, modelo y año');
        return;
    }

    const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const maxId = customVehicles.reduce((max, v) => Math.max(max, v.id), 100);
    const newId = maxId + 1;

    const categoryTexts = {
        'autos-0km': 'Autos 0KM',
        'autos-usados': 'Autos Usados',
        'motos-electricas': 'Motos Eléctricas',
        'patinetas-electricas': 'Patinetas Eléctricas',
        'vehiculos-especiales': 'Vehículos Especiales'
    };

    const nombre = `${marca} ${modelo}`;
    const catId = await resolveCategoryId(category);
    const slug = `${marca}-${modelo}-${anio}`.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // --- SUPABASE ---
    try {
        const payload = {
            category_id: catId,
            slug,
            nombre,
            marca,
            modelo,
            año: anio,
            km: km || '0 KM',
            color: color || '—',
            descripcion,
            whatsapp_msg: `Hola! Quiero consultar por el ${nombre}`,
            activo: true
        };

        const { data, error } = await supabaseClient.from('vehicles').insert([payload]).select().single();
        if (error) throw error;

        const idMap = loadStoredData('supabase_vehicle_map', {});
        idMap[newId] = data.id;
        saveStoredData('supabase_vehicle_map', idMap);
    } catch (sbErr) {
        console.warn('Supabase insert failed:', sbErr.message);
    }

    // --- localStorage fallback ---
    customVehicles.push({
        id: newId,
        category: category,
        categoryText: categoryTexts[category] || category,
        marca: marca,
        modelo: modelo,
        anio: anio,
        km: km || '0 KM',
        color: color || '—',
        descripcion: descripcion
    });

    saveStoredData(CUSTOM_VEHICLES_KEY, customVehicles);
    closeAddVehicleForm();
    await renderVehiclesEditor();
    await addChange(`Vehículo agregado: ${marca} ${modelo} (#${newId})`);
    alert('✓ Vehículo agregado correctamente');
}

async function deleteCustomVehicle(id) {
    if (!confirm('¿Eliminar este vehículo personalizado?')) return;

    // --- SUPABASE ---
    try {
        const idMap = loadStoredData('supabase_vehicle_map', {});
        const supabaseId = idMap[id];
        if (supabaseId) {
            // Borrar fotos asociadas
            await supabaseClient.from('photos').delete().eq('vehicle_id', supabaseId);
            // Borrar vehículo
            await supabaseClient.from('vehicles').delete().eq('id', supabaseId);
            delete idMap[id];
            saveStoredData('supabase_vehicle_map', idMap);
        }
    } catch (sbErr) {
        console.warn('Supabase delete failed:', sbErr.message);
    }

    // --- localStorage ---
    let customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const removed = customVehicles.find(v => v.id === id);
    customVehicles = customVehicles.filter(v => v.id !== id);
    saveStoredData(CUSTOM_VEHICLES_KEY, customVehicles);
    await renderVehiclesEditor();
    if (removed) {
        await addChange(`Vehículo eliminado: ${removed.marca} ${removed.modelo} (#${id})`);
    }
    alert('✓ Vehículo eliminado');
}

async function deleteVehicle(id) {
    const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const isCustom = customVehicles.some(v => v.id === id);
    if (isCustom) return deleteCustomVehicle(id);

    const dv = DEFAULT_VEHICLES.find(v => v.id === id);
    if (!dv) return;
    if (!confirm(`¿Eliminar "${dv.marca} ${dv.modelo}" del stock?\n\nPodés volver a agregarlo desde "➕ Agregar Vehículo".`)) return;

    // --- SUPABASE: borrar el vehículo por defecto si fue guardado ---
    const idMap = loadStoredData('supabase_vehicle_map', {});
    const supabaseId = idMap[id];
    if (supabaseId) {
        try {
            await supabaseClient.from('photos').delete().eq('vehicle_id', supabaseId);
            await supabaseClient.from('vehicles').delete().eq('id', supabaseId);
        } catch (sbErr) {
            console.warn('Supabase delete failed:', sbErr.message);
        }
    } else {
        // Intentar por slug (por si se guardó sin mapping)
        try {
            const slug = `${dv.marca}-${dv.modelo}-${dv.anio}`.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
            const { data: existing } = await supabaseClient.from('vehicles').select('id').eq('slug', slug).maybeSingle();
            if (existing) {
                await supabaseClient.from('photos').delete().eq('vehicle_id', existing.id);
                await supabaseClient.from('vehicles').delete().eq('id', existing.id);
            }
        } catch (sbErr) {
            console.warn('Supabase slug delete failed:', sbErr.message);
        }
    }

    // --- localStorage: marcar como eliminado ---
    const deletedDefaults = loadStoredData(DELETED_DEFAULT_VEHICLES_KEY, []);
    if (!deletedDefaults.includes(id)) {
        deletedDefaults.push(id);
        saveStoredData(DELETED_DEFAULT_VEHICLES_KEY, deletedDefaults);
    }

    if (idMap[id]) {
        delete idMap[id];
        saveStoredData('supabase_vehicle_map', idMap);
    }
    const overrides = await getVehicleOverrides();
    if (overrides[id]) {
        delete overrides[id];
        await setVehicleOverrides(overrides);
    }

    await renderVehiclesEditor();
    await addChange(`Vehículo eliminado del stock: ${dv.marca} ${dv.modelo}`);
    alert('✓ Vehículo eliminado');
}

async function loadImagesSection() {
    await loadLogoPreview();
    await renderSiteImagesGrid();
    await renderVehiclesEditor();
}
