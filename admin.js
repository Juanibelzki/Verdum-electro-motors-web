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
            if (w > maxW || h > maxH) {
                const ratio = Math.min(maxW / w, maxH / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
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
        financing_own: { title: 'Métodos de Pago', description: 'Elegí la forma más conveniente para llevarte tu próximo vehículo:', features: ['Transferencia bancaria', 'Efectivo', 'Crédito prendario y financiación bancaria', 'Tomamos tu vehículo usado como parte de pago'] },
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
    try {
        const financing = await sbGetContent('financing_images') || {};
        financing[type] = { ...(financing[type] || {}), title, description, features, updatedAt: new Date().toISOString() };
        await sbSaveContent('financing_images', financing);
        try { localStorage.setItem('financing_images', JSON.stringify(financing)); } catch {}
        await addChange(`Opción de financiación "${type}" actualizada`);
        console.log(`[Supabase] financing_images guardado correctamente en admin_content (${type})`);
        alert('✓ Guardado en Supabase');
    } catch (err) {
        console.error('[Supabase] Error al guardar financing_images en admin_content:', err);
        alert('✗ Error al guardar en Supabase. Revisá la consola para más detalles.');
    }
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

function getVehiclePhotos(adminId) {
    const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const cv = customVehicles.find(v => v.id === adminId);
    if (cv) return cv.fotos || [];
    const overrides = getVehicleOverrides();
    const o = overrides[adminId] || {};
    return o.fotos || [];
}

function setVehiclePhotos(adminId, photos) {
    const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const isCustom = customVehicles.some(v => v.id === adminId);
    if (isCustom) {
        const updated = customVehicles.map(v => {
            if (v.id !== adminId) return v;
            const fotos = photos.slice(0, 5);
            return { ...v, fotos, image: fotos[0] || v.image };
        });
        saveStoredData(CUSTOM_VEHICLES_KEY, updated);
    } else {
        const overrides = getVehicleOverrides();
        if (!overrides[adminId]) overrides[adminId] = {};
        overrides[adminId].fotos = photos.slice(0, 5);
        if (photos[0]) overrides[adminId].image = photos[0];
        setVehicleOverrides(overrides);
    }
}

async function deleteVehiclePhoto(adminId, index) {
    const fotos = getVehiclePhotos(adminId);
    if (index < 0 || index >= fotos.length) return;
    const removed = fotos[index];
    const remaining = fotos.filter((_, i) => i !== index);
    setVehiclePhotos(adminId, remaining);

    try {
        const idMap = loadStoredData('supabase_vehicle_map', {});
        const supabaseVehicleId = idMap[adminId];
        if (supabaseVehicleId && removed && removed.startsWith('http')) {
            await supabaseClient.from('photos').delete().eq('url', removed);
            const marker = '/stock-photos/';
            const idx = removed.indexOf(marker);
            if (idx !== -1) {
                const storagePath = decodeURIComponent(removed.substring(idx + marker.length).split('?')[0]);
                await supabaseClient.storage.from('stock-photos').remove([storagePath]);
            }
        }
    } catch (err) {
        console.warn('Supabase photo delete failed:', err.message);
    }

    renderVehiclesEditor();
    addChange(`Foto ${index + 1} eliminada del vehículo #${adminId}`);
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
    let customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    let idMap = loadStoredData('supabase_vehicle_map', {});

    // Mapa category_id (uuid) -> slug admin
    const catMap = await getCategoryIdMap();
    const idToSlugMap = {};
    for (const slug in catMap) idToSlugMap[catMap[slug]] = slug;

    let rows = [];
    try {
        const { data } = await supabaseClient
            .from('vehicles')
            .select('id, slug, nombre, marca, modelo, año, km, color, descripcion, category_id, activo, status, tipo, seccion, photos(url, url_thumb, posicion)')
            .order('created_at', { ascending: false });
        rows = data || [];
    } catch (sbErr) {
        console.warn('Sync from Supabase failed:', sbErr.message);
        return;
    }

    const supabaseIdsEnResult = new Set(rows.map(r => r.id));

    // --- LIMPIEZA: Supabase como ÚNICA fuente de verdad ---
    // 1) Borrar customVehicles que no existen en Supabase (salvo fotos pendientes base64)
    customVehicles = customVehicles.filter(cv => {
        const tieneFotosPendientes = (cv.fotos || []).some(f => typeof f === 'string' && f.startsWith('data:'));
        if (tieneFotosPendientes) return true;
        return cv.uuid && supabaseIdsEnResult.has(cv.uuid);
    });

    // 2) Borrar overrides de default vehicles que no están en Supabase ni en deletedDefaults
    const deletedDefaults = await getDeletedDefaults();
    const defaultIdsEnSupabase = new Set();
    for (const row of rows) {
        const dv = DEFAULT_VEHICLES.find(
            d => String(d.marca).toLowerCase() === String(row.marca).toLowerCase()
                && String(d.modelo).toLowerCase() === String(row.modelo).toLowerCase()
        );
        if (dv) defaultIdsEnSupabase.add(dv.id);
    }
    for (const localId of Object.keys(overrides)) {
        const numId = Number(localId);
        if (DEFAULT_VEHICLES.some(dv => dv.id === numId)
            && !defaultIdsEnSupabase.has(numId) && !deletedDefaults.includes(numId)) {
            const o = overrides[numId] || {};
            const tieneFotosPendientes = (o.fotos || []).some(f => typeof f === 'string' && f.startsWith('data:'));
            if (!tieneFotosPendientes) {
                delete overrides[numId];
            }
        }
    }

    // 3) Borrar idMap entries que apuntan a IDs de Supabase que ya no existen
    for (const localId of Object.keys(idMap)) {
        const sbId = idMap[localId];
        if (!supabaseIdsEnResult.has(sbId)) {
            delete idMap[localId];
        }
    }

    saveStoredData(VEHICLES_STORAGE_KEY, overrides);
    saveStoredData(CUSTOM_VEHICLES_KEY, customVehicles);
    saveStoredData('supabase_vehicle_map', idMap);

    if (!rows.length) return;

    // --- MERGE: traer vehículos nuevos de Supabase ---
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
            o.status = row.status || 'publicado';
            o.tipo = row.tipo || 'auto';
            const photos = (row.photos || []).slice().sort((a, b) => a.posicion - b.posicion);
            const prevFotos = (overrides[dv.id] && overrides[dv.id].fotos) || [];
            const pendingLocal = prevFotos.filter(f => typeof f === 'string' && f.startsWith('data:'));
            if (photos[0] && photos[0].url) o.image = photos[0].url;
            o.fotos = photos.concat(pendingLocal).slice(0, 5);
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
            status: row.status || 'publicado',
            tipo: row.tipo || 'auto',
            image: photos[0] ? photos[0].url : '',
            fotos: photos.slice(0, 5)
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

    const vehiclesEditor = document.getElementById('vehiclesEditor');
    if (vehiclesEditor) {
        vehiclesEditor.addEventListener('click', (e) => {
            const addThumbBtn = e.target.closest('.btn-add-thumb');
            const delThumbBtn = e.target.closest('.btn-delete-thumb');
            const saveBtn = e.target.closest('.vehicle-save-btn');
            const deleteBtn = e.target.closest('.vehicle-delete-btn');
            if (addThumbBtn) {
                const input = vehiclesEditor.querySelector(`.vehicle-image-input[data-id="${addThumbBtn.dataset.id}"]`);
                if (input) input.click();
            }
            if (delThumbBtn) {
                deleteVehiclePhoto(parseInt(delThumbBtn.dataset.id, 10), parseInt(delThumbBtn.dataset.index, 10));
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
            const files = Array.from(e.target.files || []);
            if (!files.length) return;

            const card = e.target.closest('.vehicle-edit-card');

            // Vista previa inmediata con la primera imagen seleccionada
            const previewImg = card ? card.querySelector('.vehicle-preview-img') : null;
            const placeholder = card ? card.querySelector('.preview-placeholder') : null;
            if (previewImg && files[0]) {
                previewImg.src = URL.createObjectURL(files[0]);
                previewImg.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
            }

            const currentFotos = getVehiclePhotos(id);
            const availableSlots = 5 - currentFotos.length;
            if (availableSlots <= 0) {
                alert('⚠️ Máximo 5 fotos por vehículo');
                e.target.value = '';
                return;
            }

            const toProcess = files.slice(0, availableSlots);
            if (files.length > availableSlots) {
                alert(`⚠️ Máximo 5 fotos por vehículo. Se subieron ${availableSlots} de ${files.length} seleccionadas.`);
            }

            const newPhotos = [];
            for (const file of toProcess) {
                const err = validateImageFile(file, 5);
                if (err) { alert('❌ ' + err); continue; }
                const result = await resizeImage(file, 900, 1200, 0.85);
                newPhotos.push(await blobToBase64(result.blob));
            }
            if (!newPhotos.length) { e.target.value = ''; return; }

            // Subir a Supabase Storage (las fotos ya vienen procesadas como base64)
            const uploadedUrls = await uploadVehicleImageToSupabase(id, newPhotos);

            // Si el upload fue exitoso, guardamos las URLs (evita duplicar base64 en el próximo sync)
            const finalPhotos = uploadedUrls.length ? uploadedUrls : newPhotos;
            setVehiclePhotos(id, currentFotos.concat(finalPhotos));

            // Actualizar status local a 'publicado' si hay fotos subidas o pendientes
            setVehicleStatusLocal(id, 'publicado');

            renderVehiclesEditor();

            if (uploadedUrls.length > 0) {
                addChange(`Fotos del vehículo #${id} actualizadas → Publicado`);
            } else {
                addChange(`Fotos del vehículo #${id} actualizadas`);
            }
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

function setVehicleStatusLocal(adminId, status) {
    const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const isCustom = customVehicles.some(v => v.id === adminId);
    if (isCustom) {
        const updated = customVehicles.map(v => v.id !== adminId ? v : { ...v, status });
        saveStoredData(CUSTOM_VEHICLES_KEY, updated);
    } else {
        const overrides = getVehicleOverrides();
        if (!overrides[adminId]) overrides[adminId] = {};
        overrides[adminId].status = status;
        setVehicleOverrides(overrides);
    }
}

async function uploadVehicleImageToSupabase(adminId, photoFilesArray) {
    const uploadedUrls = [];
    try {
        const idMap = loadStoredData('supabase_vehicle_map', {});
        const supabaseVehicleId = idMap[adminId];
        if (!supabaseVehicleId) return uploadedUrls;

        const items = Array.isArray(photoFilesArray) ? photoFilesArray : [photoFilesArray];
        if (!items.length) return uploadedUrls;

        const { data: existing } = await supabaseClient
            .from('photos')
            .select('posicion')
            .eq('vehicle_id', supabaseVehicleId);
        let nextPos = existing && existing.length
            ? Math.max(...existing.map(p => p.posicion), -1) + 1
            : 0;

        for (const base64 of items) {
            if (nextPos >= 5) break;
            const blob = await (await fetch(base64)).blob();
            const fileName = `${nextPos}_${Date.now()}.webp`;
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
                posicion: nextPos
            });
            uploadedUrls.push(publicUrl);
            nextPos++;
        }
    } catch (err) {
        console.warn('Supabase image upload failed:', err.message);
    }

    // Si se subió al menos 1 foto, cambiar status a 'publicado'
    if (uploadedUrls.length > 0) {
        try {
            const idMap = loadStoredData('supabase_vehicle_map', {});
            const supabaseVehicleId = idMap[adminId];
            if (supabaseVehicleId) {
                await supabaseClient.from('vehicles').update({ status: 'publicado' }).eq('id', supabaseVehicleId);
                // Actualizar status en localStorage también
                const overrides = getVehicleOverrides();
                if (overrides[adminId]) {
                    overrides[adminId].status = 'publicado';
                    setVehicleOverrides(overrides);
                }
                const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
                const cvIdx = customVehicles.findIndex(v => v.id === adminId);
                if (cvIdx !== -1) {
                    customVehicles[cvIdx].status = 'publicado';
                    saveStoredData(CUSTOM_VEHICLES_KEY, customVehicles);
                }
            }
        } catch (statusErr) {
            console.warn('No se pudo actualizar status:', statusErr.message);
        }
    }

    return uploadedUrls;
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
    }

    await addChange(`Imagen "${key}" eliminada`);
    alert('✓ Imagen eliminada');
}

function getVehicleDefaultName(v) {
    return `${v.marca} ${v.modelo}`;
}

async function getDeletedDefaults() {
    const local = loadStoredData(DELETED_DEFAULT_VEHICLES_KEY, []);
    const remote = await sbGetContent('deleted_default_vehicles');
    const merged = [...new Set([...(Array.isArray(remote) ? remote : []), ...local])];
    return merged;
}

async function setDeletedDefaults(list) {
    saveStoredData(DELETED_DEFAULT_VEHICLES_KEY, list);
    try { await sbSaveContent('deleted_default_vehicles', list); } catch (e) { console.warn('No se pudo sincronizar eliminados:', e.message); }
}

function vehicleThumbsHtml(adminId, fotos) {
    const list = fotos || [];
    const thumbs = list.map((f, i) => {
        const src = typeof f === 'string' ? f : (f.url || '');
        return `
            <div class="thumb-item" data-id="${adminId}" data-index="${i}">
                <img src="${src}" alt="Foto ${i + 1}" loading="lazy">
                <button type="button" class="btn-delete-thumb" data-id="${adminId}" data-index="${i}" title="Eliminar foto">✕</button>
            </div>`;
    }).join('');
    const add = list.length < 5 ? `<button type="button" class="btn-add-thumb" data-id="${adminId}" title="Agregar foto">＋</button>` : '';
    return `<div class="vehicle-thumbs-grid">${thumbs}${add}</div>`;
}

function vehicleStatusBadgeHtml(status, fotos) {
    const hasFotos = fotos && fotos.length > 0;
    if (!hasFotos) {
        return '<span class="vehicle-status-badge badge-pendiente">⚠ Falta Fotos</span>';
    }
    return '<span class="vehicle-status-badge badge-publicado">✓ Foto cargada</span>';
}

function getPendingPhotosCount(overrides, customVehicles, deletedDefaults) {
    let count = 0;
    DEFAULT_VEHICLES.forEach(v => {
        if (deletedDefaults.includes(v.id)) return;
        const o = overrides[v.id] || {};
        const fotos = o.fotos || (o.image ? [o.image] : []);
        const status = o.status || 'publicado';
        if (status === 'pendiente_fotos' || fotos.length === 0) count++;
    });
    customVehicles.forEach(cv => {
        const fotos = cv.fotos || (cv.image ? [cv.image] : []);
        const status = cv.status || 'publicado';
        if (status === 'pendiente_fotos' || fotos.length === 0) count++;
    });
    return count;
}

function renderPendientesBanner(count, isActive) {
    if (count === 0) return '';
    const activeClass = isActive ? ' active' : '';
    const label = isActive
        ? `Mostrando solo vehículos pendientes <span class="banner-count">${count}</span>`
        : `⚡ Hay ${count} vehículo${count > 1 ? 's' : ''} nuevo${count > 1 ? 's' : ''} sincronizado${count > 1 ? 's' : ''} esperando fotos <span class="banner-count">${count}</span>`;
    return `<div class="pendientes-banner${activeClass}" onclick="togglePendientesFilter()">${label}</div>`;
}

let pendientesFilterActive = false;

function togglePendientesFilter() {
    pendientesFilterActive = !pendientesFilterActive;
    renderVehiclesEditor();
}

async function refreshVehiclesTable() {
    const container = document.getElementById('vehiclesTableContainer');
    const countEl = document.getElementById('vehiclesCount');
    if (!container) return;

    container.innerHTML = '<p style="color:var(--text-secondary)">Cargando...</p>';

    let rows = [];
    try {
        const { data } = await supabaseClient
            .from('vehicles')
            .select('id, slug, nombre, marca, modelo, año, km, color, tipo, activo, status, seccion, created_at, photos(url, posicion)')
            .order('created_at', { ascending: false });
        rows = data || [];
    } catch (e) {
        container.innerHTML = `<p style="color:#ef4444">Error al cargar: ${e.message}</p>`;
        return;
    }

    if (countEl) countEl.textContent = `${rows.length} vehículo${rows.length !== 1 ? 's' : ''} en total`;

    if (rows.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary)">No hay vehículos en Supabase</p>';
        return;
    }

    const seccionOptions = [
        { value: '', label: '— Auto' },
        { value: 'usados', label: 'Autos Usados' },
        { value: '0km', label: 'Autos 0 KM' },
        { value: 'motos', label: 'Motos' },
        { value: 'especiales', label: 'Veh. Especiales' }
    ];

    const rowsHtml = rows.map(v => {
        const fotos = (v.photos || []).sort((a, b) => a.posicion - b.posicion);
        const hasPhotos = fotos.length > 0 && fotos[0].url;
        const kmNum = parseFloat(String(v.km).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        const es0km = kmNum <= 100;
        const tipo = v.tipo || 'auto';
        const activo = v.activo !== false;
        const seccion = v.seccion || '';

        const tipoBadge = tipo === 'moto'
            ? '<span style="background:#f59e0b;color:#111;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600">Moto</span>'
            : '<span style="background:#374151;color:#d1d5db;padding:2px 8px;border-radius:10px;font-size:0.75rem">Auto</span>';

        const kmBadge = es0km
            ? '<span style="background:#22c55e;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600">0 KM</span>'
            : `<span style="color:var(--text-secondary)">${escapeHtml(v.km || '—')}</span>`;

        const fotoBadge = hasPhotos
            ? `<span style="background:#22c55e;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.75rem">✓ ${fotos.length} foto${fotos.length > 1 ? 's' : ''}</span>`
            : '<span style="background:#f97316;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.75rem">⚠ Sin fotos</span>';

        const activoBadge = activo
            ? '<span style="background:#22c55e;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.75rem">Publicado</span>'
            : '<span style="background:#6b7280;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.75rem">Oculto</span>';

        const previewImg = hasPhotos
            ? `<img src="${fotos[0].url}" style="width:48px;height:36px;object-fit:cover;border-radius:6px" alt="">`
            : '<span style="color:var(--text-secondary);font-size:0.75rem">—</span>';

        const seccionSelect = `<select onchange="updateVehicleSeccion('${v.id}', this.value)" style="padding:4px 6px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:0.8rem;min-width:120px">
            ${seccionOptions.map(o => `<option value="${o.value}" ${seccion === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>`;

        const previewBtn = `<button class="btn-secondary-outline" style="padding:4px 10px;font-size:0.8rem" onclick="openQuickPhotoModal('${seccion || (v.tipo === 'moto' ? 'motos' : 'usados')}')">👁</button>`;

        return `<tr style="border-bottom:1px solid var(--border)">
            <td style="padding:10px 8px">${previewImg}</td>
            <td style="padding:10px 8px;font-weight:500">${escapeHtml(v.marca || '')} ${escapeHtml(v.modelo || '')}</td>
            <td style="padding:10px 8px">${escapeHtml(String(v.año || ''))}</td>
            <td style="padding:10px 8px">${kmBadge}</td>
            <td style="padding:10px 8px">${tipoBadge}</td>
            <td style="padding:10px 8px">${fotoBadge}</td>
            <td style="padding:10px 8px">${activoBadge}</td>
            <td style="padding:10px 8px">${seccionSelect}</td>
            <td style="padding:10px 8px">${previewBtn}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;background:var(--surface);border-radius:12px;overflow:hidden;font-size:0.9rem">
            <thead>
                <tr style="background:var(--surface-alt);border-bottom:2px solid var(--border)">
                    <th style="padding:12px 8px;text-align:left;width:50px"></th>
                    <th style="padding:12px 8px;text-align:left">Marca / Modelo</th>
                    <th style="padding:12px 8px;text-align:left">Año</th>
                    <th style="padding:12px 8px;text-align:left">KM</th>
                    <th style="padding:12px 8px;text-align:left">Tipo</th>
                    <th style="padding:12px 8px;text-align:left">Fotos</th>
                    <th style="padding:12px 8px;text-align:left">Estado</th>
                    <th style="padding:12px 8px;text-align:left">Sección</th>
                    <th style="padding:12px 8px;text-align:left">Ver</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>
    `;
}

async function updateVehicleSeccion(vehicleId, newSeccion) {
    try {
        const { error } = await supabaseClient
            .from('vehicles')
            .update({ seccion: newSeccion || null })
            .eq('id', vehicleId);
        if (error) throw error;

        // Actualizar en localStorage overrides si existe
        const overrides = await getVehicleOverrides();
        for (const key in overrides) {
            if (overrides[key].uuid === vehicleId || overrides[key].supabaseId === vehicleId) {
                overrides[key].seccion = newSeccion || null;
            }
        }
        await setVehicleOverrides(overrides);

        const seccionLabel = newSeccion || 'automática';
        await addChange(`Vehículo #${vehicleId} movido a sección "${seccionLabel}"`);
    } catch (e) {
        console.error('Error actualizando sección:', e);
        alert('Error al guardar sección: ' + e.message);
    }
}

async function renderVehiclesEditor() {
    const container = document.getElementById('vehiclesEditor');
    if (!container) return;

    await syncVehiclesFromSupabase();

    const overrides = await getVehicleOverrides();
    const customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const deletedDefaults = await getDeletedDefaults();
    let nextCustomId = 100;

    const pendingCount = getPendingPhotosCount(overrides, customVehicles, deletedDefaults);
    let html = renderPendientesBanner(pendingCount, pendientesFilterActive);

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
        const defaultFotos = o.fotos || (o.image ? [o.image] : []);
        const status = o.status || 'publicado';
        const tipo = o.tipo || 'auto';
        const tipoBadge = tipo === 'moto' ? '<span class="vehicle-type-tag" style="background:#f59e0b;color:#111">Moto</span>' : '';

        if (pendientesFilterActive && status !== 'pendiente_fotos' && defaultFotos.length > 0) return;

        html += `
            <div class="vehicle-edit-card" data-id="${v.id}">
                <div class="vehicle-edit-header">
                    <span class="vehicle-category-tag">${v.category}</span>
                    ${tipoBadge}
                    ${vehicleStatusBadgeHtml(status, defaultFotos)}
                    <span class="vehicle-id-tag">#${v.id}</span>
                </div>
                <div class="vehicle-edit-body">
                    <div class="vehicle-edit-preview">
                        <img class="preview-img vehicle-preview-img" src="${imgSrc}" style="${imgSrc ? '' : 'display:none'}" alt="Vehículo ${v.id}">
                        <span class="preview-placeholder" style="${imgSrc ? 'display:none' : ''}">Sin foto</span>
                        ${vehicleThumbsHtml(v.id, defaultFotos)}
                        <input type="file" class="vehicle-image-input" accept="image/*" data-id="${v.id}" multiple hidden>
                    </div>
                    <div class="vehicle-edit-fields">
                        <label>Nombre</label>
                        <input type="text" class="vehicle-nombre" data-id="${v.id}" value="${escapeHtml(nombre)}">
                        <label>Año</label>
                        <input type="number" class="vehicle-anio" data-id="${v.id}" value="${anio}" min="1990" max="2030">
                        <label>KM</label>
                        <input type="text" class="vehicle-km" data-id="${v.id}" value="${escapeHtml(km)}">
                        <label>Categoría / Sección</label>
                        <select class="vehicle-seccion" data-id="${v.id}">
                            <option value="" ${(!o.seccion) ? 'selected' : ''}>— Automática (por KM/tipo)</option>
                            <option value="usados" ${(o.seccion === 'usados') ? 'selected' : ''}>Autos Usados</option>
                            <option value="0km" ${(o.seccion === '0km') ? 'selected' : ''}>Autos 0 KM</option>
                            <option value="motos" ${(o.seccion === 'motos') ? 'selected' : ''}>Motos</option>
                            <option value="especiales" ${(o.seccion === 'especiales') ? 'selected' : ''}>Veh. Especiales</option>
                        </select>
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
        const customFotos = cv.fotos || (cv.image ? [cv.image] : []);
        const status = cv.status || 'publicado';
        const tipo = cv.tipo || 'auto';
        const tipoBadge = tipo === 'moto' ? '<span class="vehicle-type-tag" style="background:#f59e0b;color:#111">Moto</span>' : '';

        if (pendientesFilterActive && status !== 'pendiente_fotos' && customFotos.length > 0) return;

        html += `
            <div class="vehicle-edit-card vehicle-custom" data-id="${cv.id}">
                <div class="vehicle-edit-header">
                    <span class="vehicle-category-tag">${cv.categoryText || cv.category}</span>
                    ${tipoBadge}
                    ${vehicleStatusBadgeHtml(status, customFotos)}
                    <span class="vehicle-id-tag" style="color:var(--primary-400)">#${cv.id} ✚</span>
                </div>
                <div class="vehicle-edit-body">
                    <div class="vehicle-edit-preview">
                        <img class="preview-img vehicle-preview-img" src="${imgSrc}" style="${imgSrc ? '' : 'display:none'}" alt="Vehículo ${cv.id}">
                        <span class="preview-placeholder" style="${imgSrc ? 'display:none' : ''}">Sin foto</span>
                        ${vehicleThumbsHtml(cv.id, customFotos)}
                        <input type="file" class="vehicle-image-input" accept="image/*" data-id="${cv.id}" multiple hidden>
                    </div>
                    <div class="vehicle-edit-fields">
                        <label>Nombre</label>
                        <input type="text" class="vehicle-nombre" data-id="${cv.id}" value="${escapeHtml(cv.marca + ' ' + cv.modelo)}">
                        <label>Año</label>
                        <input type="number" class="vehicle-anio" data-id="${cv.id}" value="${cv.anio || 2024}" min="1990" max="2030">
                        <label>KM</label>
                        <input type="text" class="vehicle-km" data-id="${cv.id}" value="${escapeHtml(cv.km || '0 KM')}">
                        <label>Categoría / Sección</label>
                        <select class="vehicle-seccion" data-id="${cv.id}">
                            <option value="" ${(!cv.seccion) ? 'selected' : ''}>— Automática (por KM/tipo)</option>
                            <option value="usados" ${(cv.seccion === 'usados') ? 'selected' : ''}>Autos Usados</option>
                            <option value="0km" ${(cv.seccion === '0km') ? 'selected' : ''}>Autos 0 KM</option>
                            <option value="motos" ${(cv.seccion === 'motos') ? 'selected' : ''}>Motos</option>
                            <option value="especiales" ${(cv.seccion === 'especiales') ? 'selected' : ''}>Veh. Especiales</option>
                        </select>
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
    const seccionEl = card.querySelector('.vehicle-seccion');
    const seccion = seccionEl ? seccionEl.value || null : null;

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
    let tipo = 'auto';
    let whatsapp_msg = `¡Hola! Quiero consultar el precio y disponibilidad del ${nombre} que vi en su web.`;

    if (isCustom) {
        const cv = customVehicles.find(v => v.id === id);
        if (cv) {
            categorySlug = cv.category;
            marca = cv.marca;
            modelo = cv.modelo;
            tipo = cv.tipo || 'auto';
        }
    } else {
        const dv = DEFAULT_VEHICLES.find(v => v.id === id);
        if (dv) {
            categorySlug = CATEGORY_TEXT_TO_SLUG[dv.category] || 'autos-usados';
            const parts = nombre.split(' ');
            marca = parts[0] || dv.marca;
            modelo = parts.slice(1).join(' ') || dv.modelo;
            tipo = dv.tipo || 'auto';
        }
    }

    whatsapp_msg = tipo === 'moto'
        ? `¡Hola! Quiero consultar el precio y disponibilidad de la moto ${marca} ${modelo} (${anio || ''}) que vi en su web.`
        : `¡Hola! Quiero consultar el precio y disponibilidad del ${marca} ${modelo} (${anio || ''}) que vi en su web.`;

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
            tipo,
            seccion,
            whatsapp_msg,
            activo: true,
            status: 'pendiente_fotos'
        };

        let result;
        if (existing) {
            result = await supabaseClient.from('vehicles').update(payload).eq('id', existing.id).select().single();
        } else {
            result = await supabaseClient.from('vehicles').insert([payload]).select().single();
        }
        if (result.error) throw result.error;
        supabaseVehicleId = result.data.id;

        // Almacenar el mapping admin_id -> supabase_id ANTES de subir fotos
        const idMap = loadStoredData('supabase_vehicle_map', {});
        idMap[id] = supabaseVehicleId;
        saveStoredData('supabase_vehicle_map', idMap);

        // Subir TODAS las fotos base64 pendientes que aún no estén en Supabase
        const fotosLocales = getVehiclePhotos(id);
        const pendingBase64 = (fotosLocales || []).filter(f => typeof f === 'string' && f.startsWith('data:'));
        if (pendingBase64.length) {
            const uploadedUrls = await uploadVehicleImageToSupabase(id, pendingBase64);
            if (uploadedUrls.length) {
                // Reemplazar las base64 subidas por sus URLs públicas en el estado local
                let i = 0;
                const finalFotos = (fotosLocales || []).map(f => {
                    if (typeof f === 'string' && f.startsWith('data:') && i < uploadedUrls.length) {
                        return uploadedUrls[i++];
                    }
                    return f;
                });
                setVehiclePhotos(id, finalFotos);
            }
        }

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
                tipo: tipo,
                seccion: seccion,
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
        overrides[id].tipo = tipo;
        overrides[id].seccion = seccion;
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
    document.getElementById('newVehiclePhoto').value = '';
    document.getElementById('newVehicleTipo').value = 'auto';
    const preview = document.getElementById('newVehiclePhotoPreview');
    if (preview) preview.style.display = 'none';
    window._newVehiclePhotoData = null;
}

function previewNewVehiclePhoto(event) {
    const file = event.target.files[0];
    const err = validateImageFile(file, 5);
    if (err) {
        alert('❌ ' + err);
        event.target.value = '';
        window._newVehiclePhotoData = null;
        const preview = document.getElementById('newVehiclePhotoPreview');
        if (preview) preview.style.display = 'none';
        return;
    }
    resizeImage(file, 900, 1200, 0.85).then(async (result) => {
        const base64 = await blobToBase64(result.blob);
        window._newVehiclePhotoData = base64;
        const preview = document.getElementById('newVehiclePhotoPreview');
        const img = document.getElementById('newVehiclePhotoPreviewImg');
        if (preview && img) {
            img.src = base64;
            preview.style.display = 'block';
        }
    });
}

async function saveNewVehicle() {
    const tipo = document.getElementById('newVehicleTipo').value || 'auto';
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
            tipo,
            whatsapp_msg: tipo === 'moto'
                ? `¡Hola! Quiero consultar el precio y disponibilidad de la moto ${marca} ${modelo} (${anio || ''}) que vi en su web.`
                : `¡Hola! Quiero consultar el precio y disponibilidad del ${marca} ${modelo} (${anio || ''}) que vi en su web.`,
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
    const photoData = window._newVehiclePhotoData || null;
    const vehicleData = {
        id: newId,
        category: category,
        categoryText: categoryTexts[category] || category,
        tipo: tipo,
        marca: marca,
        modelo: modelo,
        anio: anio,
        km: km || '0 KM',
        color: color || '—',
        descripcion: descripcion
    };
    if (photoData) {
        vehicleData.image = photoData;
        vehicleData.fotos = [photoData];
    }
    customVehicles.push(vehicleData);

    saveStoredData(CUSTOM_VEHICLES_KEY, customVehicles);
    closeAddVehicleForm();
    await renderVehiclesEditor();
    if (photoData) {
        uploadVehicleImageToSupabase(newId, photoData);
    }
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

    // Limpiar overrides e idMap por si quedaron referencias
    const overrides = await getVehicleOverrides();
    if (overrides[id]) { delete overrides[id]; await setVehicleOverrides(overrides); }
    const idMapLocal = loadStoredData('supabase_vehicle_map', {});
    if (idMapLocal[id]) { delete idMapLocal[id]; saveStoredData('supabase_vehicle_map', idMapLocal); }

    await renderVehiclesEditor();
    if (removed) {
        await addChange(`Vehículo eliminado: ${removed.marca} ${removed.modelo} (#${id})`);
    }
    alert('✓ Vehículo eliminado');
}

async function deleteVehicle(id) {
    let customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
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

    // --- localStorage + Supabase: marcar como eliminado ---
    const deletedDefaults = await getDeletedDefaults();
    if (!deletedDefaults.includes(id)) {
        deletedDefaults.push(id);
        await setDeletedDefaults(deletedDefaults);
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

    // Limpiar customVehicles si por algún motivo contiene este id
    customVehicles = loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const before = customVehicles.length;
    customVehicles = customVehicles.filter(v => v.id !== id);
    if (customVehicles.length !== before) {
        saveStoredData(CUSTOM_VEHICLES_KEY, customVehicles);
    }

    await renderVehiclesEditor();
    await addChange(`Vehículo eliminado del stock: ${dv.marca} ${dv.modelo}`);
    alert('✓ Vehículo eliminado');
}

async function massPublishVehicles() {
    const confirmed = confirm('¿Estás seguro de publicar todos los vehículos?\n\nEsto activará y hará visibles en la web todas las unidades sincronizadas.');
    if (!confirmed) return;

    const btn = document.querySelector('[onclick="massPublishVehicles()"]');
    const originalText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = '⏳ Publicando...'; btn.disabled = true; }

    try {
        const { data, error } = await supabaseClient
            .from('vehicles')
            .update({ activo: true })
            .eq('activo', false);

        if (error) throw error;

        const count = data ? data.length : 0;
        alert(`¡Todos los vehículos han sido publicados con éxito!${count > 0 ? ` (${count} unidades activadas)` : ''}`);
        await addChange(`Acción masiva: todos los vehículos publicados`);
        pendientesFilterActive = false;
        await renderVehiclesEditor();
    } catch (err) {
        console.error('Mass publish failed:', err);
        alert('❌ Error al publicar: ' + (err.message || 'Error desconocido'));
    } finally {
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
    }
}

async function loadImagesSection() {
    await loadLogoPreview();
    refreshVehiclesTable();
    await renderVehiclesEditor();
}

/* ============================================
   MODAL CARGA RÁPIDA DE FOTOS POR CATEGORÍA
   ============================================ */

let quickPhotoCategory = null;
let quickPhotoVehicles = [];
let quickPhotoOnlyPending = true;
let quickPhotoBound = false;

const QUICK_PHOTO_CATEGORY_TITLES = {
    'usados': 'Autos Usados',
    '0km': 'Autos 0 KM',
    'motos': 'Motos',
    'especiales': 'Veh. Especiales'
};

function bindQuickPhotoEvents() {
    if (quickPhotoBound) return;
    quickPhotoBound = true;

    document.addEventListener('change', (e) => {
        const input = e.target.closest('.quick-photo-input');
        if (!input || !input.files || !input.files[0]) return;
        const vid = input.getAttribute('data-vid');
        const file = input.files[0];
        quickPhotoUpload(vid, file);
        input.value = '';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeQuickPhotoModal();
    });

    document.addEventListener('click', (e) => {
        const modal = document.getElementById('quickPhotoModal');
        if (!modal || modal.style.display === 'none') return;
        if (e.target === modal) closeQuickPhotoModal();
    });
}

async function openQuickPhotoModal(category) {
    bindQuickPhotoEvents();
    quickPhotoCategory = category;
    quickPhotoOnlyPending = true;
    const modal = document.getElementById('quickPhotoModal');
    const title = document.getElementById('quickPhotoTitle');
    if (title) {
        title.textContent = `📸 Carga Rápida — ${QUICK_PHOTO_CATEGORY_TITLES[category] || category}`;
    }
    if (modal) modal.style.display = 'flex';

    const { data, error } = await supabaseClient
        .from('vehicles')
        .select('id, slug, nombre, marca, modelo, año, km, color, tipo, status, activo, seccion, photos(url, posicion)')
        .eq('activo', true);

    if (error) {
        alert('❌ Error cargando vehículos: ' + error.message);
        closeQuickPhotoModal();
        return;
    }

    quickPhotoVehicles = (data || []).filter(v => {
        const kmNum = parseFloat(String(v.km).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        const es0km = kmNum <= 100;
        const esMoto = v.tipo === 'moto';
        let cat;
        if (v.seccion === 'usados' || v.seccion === '0km' || v.seccion === 'motos' || v.seccion === 'especiales') {
            cat = v.seccion;
        } else if (esMoto) {
            cat = 'motos';
        } else if (es0km) {
            cat = '0km';
        } else {
            cat = 'usados';
        }
        return cat === category;
    });

    updateQuickPhotoFilterButtons();
    renderQuickPhotoList();
    document.body.style.overflow = 'hidden';
}

function closeQuickPhotoModal() {
    const modal = document.getElementById('quickPhotoModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    quickPhotoVehicles = [];
}

function setQuickPhotoFilter(onlyPending) {
    quickPhotoOnlyPending = onlyPending;
    updateQuickPhotoFilterButtons();
    renderQuickPhotoList();
}

function updateQuickPhotoFilterButtons() {
    const pBtn = document.getElementById('qpFilterPendingBtn');
    const aBtn = document.getElementById('qpFilterAllBtn');
    if (pBtn) pBtn.style.opacity = quickPhotoOnlyPending ? '1' : '0.5';
    if (aBtn) aBtn.style.opacity = quickPhotoOnlyPending ? '0.5' : '1';
}

function getQuickPhotoFotos(v) {
    return (v.photos || []).slice().sort((a, b) => a.posicion - b.posicion);
}

function renderQuickPhotoList() {
    const container = document.getElementById('quickPhotoList');
    const countEl = document.getElementById('qpCount');
    if (!container) return;

    let list = quickPhotoVehicles;
    if (quickPhotoOnlyPending) {
        list = quickPhotoVehicles.filter(v => {
            const fotos = getQuickPhotoFotos(v);
            return fotos.length === 0 || v.status === 'pendiente_fotos';
        });
    }

    if (countEl) countEl.textContent = `${list.length} vehículo${list.length !== 1 ? 's' : ''}`;

    if (!list.length) {
        container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:24px">No hay vehículos para mostrar. 🎉</p>';
        return;
    }

    container.innerHTML = list.map(v => {
        const fotos = getQuickPhotoFotos(v);
        const first = fotos[0];
        const imgSrc = first && first.url ? first.url : '';
        const displayName = v.nombre || `${v.marca || ''} ${v.modelo || ''}`.trim();
        const estado = fotos.length > 0
            ? `<span style="background:#22c55e;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.7rem">✓ ${fotos.length} foto${fotos.length > 1 ? 's' : ''}</span>`
            : '<span style="background:#f97316;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.7rem">⚠ Falta foto</span>';

        return `
            <div class="quick-photo-card" data-vid="${v.id}" style="display:flex;align-items:center;gap:14px;padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-bottom:10px">
                <div style="width:72px;height:52px;border-radius:8px;overflow:hidden;background:var(--surface-alt);flex-shrink:0;display:flex;align-items:center;justify-content:center">
                    ${imgSrc
                        ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover" alt="">`
                        : '<span style="color:var(--text-secondary);font-size:0.7rem">Sin foto</span>'}
                </div>
                <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(displayName)}</div>
                    <div style="color:var(--text-secondary);font-size:0.8rem;margin-top:2px">
                        ${v.año || '—'} · ${escapeHtml(v.km || '—')} · ${escapeHtml(v.color || '—')}
                    </div>
                    <div style="margin-top:4px">${estado}</div>
                </div>
                <input type="file" class="quick-photo-input" data-vid="${v.id}" accept="image/*" style="display:none">
                <button type="button" class="btn-update" style="padding:6px 12px;font-size:0.85rem;flex-shrink:0" onclick="quickPhotoSelect('${v.id}')">📤 Subir foto</button>
            </div>`;
    }).join('');
}

function quickPhotoSelect(vid) {
    const input = document.querySelector(`.quick-photo-input[data-vid="${vid}"]`);
    if (input) input.click();
}

async function quickPhotoUpload(vid, file) {
    const err = validateImageFile(file, 5);
    if (err) { alert('❌ ' + err); return; }

    const card = document.querySelector(`.quick-photo-card[data-vid="${vid}"]`);
    const btn = card ? card.querySelector('button') : null;
    if (btn) { btn.textContent = '⏳ Subiendo...'; btn.disabled = true; }

    try {
        const { data: existing } = await supabaseClient
            .from('photos')
            .select('posicion')
            .eq('vehicle_id', vid);
        let nextPos = existing && existing.length ? Math.max(...existing.map(p => p.posicion), -1) + 1 : 0;
        if (nextPos >= 5) {
            alert('⚠️ Máximo 5 fotos por vehículo');
            return;
        }

        const result = await resizeImage(file, 900, 1200, 0.85);
        const fileName = `${nextPos}_${Date.now()}.webp`;
        const storagePath = `vehicles/${vid}/${fileName}`;

        const { error: upErr } = await supabaseClient.storage
            .from('stock-photos')
            .upload(storagePath, result.blob, { upsert: true, contentType: result.blob.type });
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabaseClient.storage.from('stock-photos').getPublicUrl(storagePath);

        const { error: insErr } = await supabaseClient.from('photos').insert({
            vehicle_id: vid,
            url: publicUrl,
            url_thumb: publicUrl,
            posicion: nextPos
        });
        if (insErr) throw insErr;

        await supabaseClient.from('vehicles').update({ status: 'publicado' }).eq('id', vid);
        await addChange(`Foto subida al vehículo desde Carga Rápida (${vid})`);

        const { data: fresh } = await supabaseClient
            .from('vehicles')
            .select('id, slug, nombre, marca, modelo, año, km, color, tipo, status, activo, seccion, photos(url, posicion)')
            .eq('id', vid)
            .single();
        if (fresh) {
            const idx = quickPhotoVehicles.findIndex(v => v.id === vid);
            if (idx !== -1) quickPhotoVehicles[idx] = fresh;
        }

        renderQuickPhotoList();
        refreshVehiclesTable();
    } catch (err) {
        console.error('Quick photo upload failed:', err);
        alert('❌ Error al subir: ' + (err.message || 'Error desconocido'));
    } finally {
        if (btn) { btn.textContent = '📤 Subir foto'; btn.disabled = false; }
    }
}
