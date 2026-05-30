/* ============================================
   PANEL ADMINISTRATIVO - LÓGICA
   ============================================ */

const ADMIN_PASSWORD = 'verdun2024';
const IMAGES_STORAGE_KEY = 'verdun_images';
const VEHICLES_STORAGE_KEY = 'verdun_vehicles';
const CUSTOM_VEHICLES_KEY = 'verdun_custom_vehicles';

let pendingLogoData = null;
let pendingLogoUrl = null;
let imagesUiInitialized = false;
const dataCache = {};

const SITE_IMAGE_SLOTS = [
    { key: 'hero_visual', label: 'Hero Visual', fileHint: 'hero_visual.png' },
    { key: 'service_1', label: 'Servicio 1 — Autos 0KM', fileHint: 'service_1.png' },
    { key: 'service_2', label: 'Servicio 2 — Autos Usados', fileHint: 'service_2.png' },
    { key: 'service_3', label: 'Servicio 3 — Motos Eléctricas', fileHint: 'service_3.png' },
    { key: 'service_4', label: 'Servicio 4 — Patinetas', fileHint: 'service_4.png' },
    { key: 'service_5', label: 'Servicio 5 — Vehículos Especiales', fileHint: 'service_5.png' }
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
    { id: 10, category: 'Motos Eléctricas', marca: 'Energica', modelo: 'EVA', precio: 450000, anio: 2024, km: '0 KM', color: 'Negro' },
    { id: 11, category: 'Motos Eléctricas', marca: 'Super Soco', modelo: 'TC Max', precio: 280000, anio: 2024, km: '0 KM', color: 'Rojo' },
    { id: 12, category: 'Motos Eléctricas', marca: 'Volta', modelo: 'V1', precio: 350000, anio: 2023, km: '5000', color: 'Blanco' },
    { id: 13, category: 'Patinetas Eléctricas', marca: 'Xiaomi', modelo: 'Mi 3 Pro', precio: 95000, anio: 2024, km: '0 KM', color: 'Negro' },
    { id: 14, category: 'Patinetas Eléctricas', marca: 'Ninebot', modelo: 'Max G30', precio: 125000, anio: 2024, km: '0 KM', color: 'Gris' },
    { id: 15, category: 'Patinetas Eléctricas', marca: 'Segway', modelo: 'Ninebot Pro', precio: 140000, anio: 2023, km: '2000', color: 'Blanco' },
    { id: 16, category: 'Patinetas Eléctricas', marca: 'Hiboy', modelo: 'S2 Pro', precio: 110000, anio: 2024, km: '0 KM', color: 'Negro' },
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
    const metrics = await loadStoredData('metrics', [
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
        { desc: 'Eficiencia y potencia eléctrica para la ciudad. Bajos costos operativos.', features: ['Eco-friendly', 'Rápida', 'Potente'] },
        { desc: 'Movilidad urbana sostenible y económica. Perfecta para desplazamientos.', features: ['Sostenible', 'Práctica', 'Urbana'] },
        { desc: 'Camionetas 4x4, furgones, minibuses y vehículos comerciales. Presupuesto a medida.', features: ['4x4', 'Comerciales', 'A medida'] }
    ];
    const services = await loadStoredData('services', defaults);
    if (services.length !== 5) {
        services.length = 5;
        defaults.forEach((d, i) => { if (!services[i]) services[i] = d; });
        dataCache.services = services;
        try { localStorage.setItem('services', JSON.stringify(services)); } catch {}
        FB.set('services', services);
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
    const financing = await loadStoredData('financing_images', defaults);
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
    const financing = await loadStoredData('financing_images', {});
    financing[type] = { ...(financing[type] || {}), title, description, features, updatedAt: new Date().toISOString() };
    await saveStoredData('financing_images', financing);
    await addChange(`Opción de financiación "${type}" actualizada`);
    alert('✓ Guardado');
}

async function handleFinancingImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const type = event.target.dataset.financingType;
    if (file.type !== 'image/png') { alert('❌ Solo PNG'); return; }
    if (file.size > 500 * 1024) { alert('❌ Máx 500KB'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        const financing = await loadStoredData('financing_images', {});
        if (!financing[type]) financing[type] = {};
        financing[type].fallback_base64 = base64;
        financing[type].name = file.name;
        financing[type].size = (file.size / 1024).toFixed(1) + 'KB';
        financing[type].uploadedAt = new Date().toISOString();
        await saveStoredData('financing_images', financing);
        const previewImg = document.getElementById(`preview-${type}`);
        if (previewImg) { previewImg.src = base64; previewImg.style.display = 'block'; }
        const ph = document.getElementById(`ph-${type}`);
        if (ph) ph.style.display = 'none';
        // Upload to Storage in background
        FB.uploadFile(`financing/${type}`, file).then(url => {
            financing[type].url = url;
            saveStoredData('financing_images', financing);
        }).catch(() => {});
        alert('✓ Imagen cargada');
    };
    reader.readAsDataURL(file);
}

async function loadContent() {
    const content = await loadStoredData('content', {
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
    const stats = await loadStoredData('editStats', { count: 0, lastEdit: null });
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

    const metrics = await loadStoredData('metrics', []);
    if (!metrics[index]) metrics[index] = {};
    metrics[index].icon = icon;
    metrics[index].text = text;
    await saveStoredData('metrics', metrics);

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
    const services = await loadStoredData('services', []);
    if (!services[index]) services[index] = {};
    services[index].desc = desc;
    services[index].features = features;
    await saveStoredData('services', services);

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

    await saveStoredData('content', content);
    await addChange('Contenido principal actualizado');
    alert('✓ Contenido guardado correctamente');
}

async function loadTestimonios() {
    const testimonios = await loadStoredData('testimonios', [
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

    const testimonios = await loadStoredData('testimonios', []);
    if (!testimonios[index]) testimonios[index] = {};
    testimonios[index].text = text;
    testimonios[index].author = author;
    testimonios[index].role = role;
    await saveStoredData('testimonios', testimonios);

    await addChange(`Testimonio ${index + 1} actualizado`);
    alert('✓ Testimonio guardado correctamente');
}

async function addChange(message) {
    const changes = await loadStoredData('changes', []);
    changes.unshift({
        message,
        timestamp: new Date().toLocaleString('es-AR')
    });

    if (changes.length > 20) changes.pop();

    await saveStoredData('changes', changes);

    const stats = await loadStoredData('editStats', { count: 0, lastEdit: null });
    stats.count += 1;
    stats.lastEdit = new Date().toISOString();
    await saveStoredData('editStats', stats);

    await loadChangeStats();
}

async function loadChangesList() {
    const changes = await loadStoredData('changes', []);
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
    await saveStoredData('editStats', stats);
    await loadChangeStats();
    alert('✓ Historial limpiado');
}

async function loadStoredData(key, defaultValue) {
    if (dataCache[key] !== undefined) return dataCache[key];
    const data = await FB.get(key, defaultValue);
    dataCache[key] = data;
    try {
        const json = JSON.stringify(data);
        if (json.length < 1_000_000) localStorage.setItem(key, json);
    } catch {}
    return data;
}

async function saveStoredData(key, value) {
    dataCache[key] = value;
    try {
        const json = JSON.stringify(value);
        if (json.length < 1_000_000) localStorage.setItem(key, json);
    } catch {}
    FB.set(key, value);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function getSiteImages() {
    return loadStoredData(IMAGES_STORAGE_KEY, {});
}

async function setSiteImages(images) {
    await saveStoredData(IMAGES_STORAGE_KEY, images);
}

async function getVehicleOverrides() {
    return loadStoredData(VEHICLES_STORAGE_KEY, {});
}

async function setVehicleOverrides(data) {
    await saveStoredData(VEHICLES_STORAGE_KEY, data);
}

function readImageAsBase64(file, onSuccess, onError) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        onError('Solo se permiten imágenes');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        onError('Archivo muy grande (máx 5MB)');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onSuccess(e.target.result, file);
    reader.onerror = () => onError('Error al leer el archivo');
    reader.readAsDataURL(file);
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
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            readImageAsBase64(
                file,
                async (base64) => {
                    pendingLogoData = base64;
                    pendingLogoUrl = null;
                    updateLogoPreview(base64);
                    FB.uploadFile('site/logo', file).then(url => {
                        pendingLogoUrl = url;
                    }).catch(() => {});
                },
                (msg) => alert(msg)
            );
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
            readImageAsBase64(
                file,
                async (base64) => {
                    const images = await getSiteImages();
                    images[key] = { data: base64, timestamp: new Date().toLocaleString('es-AR') };
                    await setSiteImages(images);
                    renderSiteImagesGrid();
                    FB.uploadFile(`site/${key}`, file).then(url => {
                        images[key] = { url, timestamp: new Date().toLocaleString('es-AR') };
                        setSiteImages(images);
                        renderSiteImagesGrid();
                    }).catch(() => {});
                    await addChange(`Imagen de sitio "${key}" actualizada`);
                    alert('✓ Imagen guardada');
                },
                (msg) => alert(msg)
            );
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
                deleteCustomVehicle(parseInt(deleteBtn.dataset.id, 10));
            }
        });

        vehiclesEditor.addEventListener('change', async (e) => {
            if (!e.target.classList.contains('vehicle-image-input')) return;
            const id = parseInt(e.target.dataset.id, 10);
            const file = e.target.files[0];
            readImageAsBase64(
                file,
                async (base64) => {
                    const customVehicles = await loadStoredData(CUSTOM_VEHICLES_KEY, []);
                    const isCustom = customVehicles.some(v => v.id === id);
                    if (isCustom) {
                        const updated = customVehicles.map(v => {
                            if (v.id !== id) return v;
                            return { ...v, image: base64 };
                        });
                        await saveStoredData(CUSTOM_VEHICLES_KEY, updated);
                    } else {
                        const overrides = await getVehicleOverrides();
                        if (!overrides[id]) overrides[id] = {};
                        overrides[id].image = base64;
                        await setVehicleOverrides(overrides);
                    }
                    renderVehiclesEditor();
                    FB.uploadFile(`vehicles/${id}`, file).then(url => {
                        loadStoredData(CUSTOM_VEHICLES_KEY, []).then(cv => {
                            if (cv.some(v => v.id === id)) {
                                saveStoredData(CUSTOM_VEHICLES_KEY, cv.map(v => v.id === id ? { ...v, image: url } : v));
                            } else {
                                getVehicleOverrides().then(ov => {
                                    if (ov[id]) { ov[id].image = url; setVehicleOverrides(ov); }
                                });
                            }
                            renderVehiclesEditor();
                        });
                    }).catch(() => {});
                    await addChange(`Foto del vehículo #${id} actualizada`);
                },
                (msg) => alert(msg)
            );
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

    const overrides = await getVehicleOverrides();
    const customVehicles = await loadStoredData(CUSTOM_VEHICLES_KEY, []);
    let nextCustomId = 100;

    let html = '';

    // Vehículos por defecto
    DEFAULT_VEHICLES.forEach((v) => {
        const o = overrides[v.id] || {};
        const nombre = o.nombre !== undefined ? o.nombre : getVehicleDefaultName(v);
        const precio = o.precio !== undefined ? o.precio : v.precio;
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
                        <label>Precio (ARS)</label>
                        <input type="number" class="vehicle-precio" data-id="${v.id}" value="${precio}" min="0">
                        <label>Año</label>
                        <input type="number" class="vehicle-anio" data-id="${v.id}" value="${anio}" min="1990" max="2030">
                        <label>KM</label>
                        <input type="text" class="vehicle-km" data-id="${v.id}" value="${escapeHtml(km)}">
                        <label>Color</label>
                        <input type="text" class="vehicle-color" data-id="${v.id}" value="${escapeHtml(color)}">
                        <label>Descripción</label>
                        <textarea class="vehicle-descripcion" data-id="${v.id}" rows="2">${escapeHtml(descripcion)}</textarea>
                        <button type="button" class="btn-update vehicle-save-btn" data-id="${v.id}">✓ Guardar vehículo</button>
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
                        <label>Precio (ARS)</label>
                        <input type="number" class="vehicle-precio" data-id="${cv.id}" value="${cv.precio}" min="0">
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
    const precio = parseInt(card.querySelector('.vehicle-precio').value, 10);
    const anio = parseInt(card.querySelector('.vehicle-anio').value, 10);
    const km = card.querySelector('.vehicle-km').value.trim();
    const color = card.querySelector('.vehicle-color').value.trim();
    const descripcion = card.querySelector('.vehicle-descripcion').value.trim();

    if (!nombre || isNaN(precio)) {
        alert('Completá nombre y precio');
        return;
    }

    // Custom vehicle?
    const customVehicles = await loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const isCustom = customVehicles.some(v => v.id === id);

    if (isCustom) {
        const updated = customVehicles.map(v => {
            if (v.id !== id) return v;
            // Parse name back to marca + modelo
            const parts = nombre.split(' ');
            return {
                ...v,
                marca: parts[0] || v.marca,
                modelo: parts.slice(1).join(' ') || v.modelo,
                precio: precio,
                anio: anio,
                km: km,
                color: color,
                descripcion: descripcion
            };
        });
        await saveStoredData(CUSTOM_VEHICLES_KEY, updated);
    } else {
        const overrides = await getVehicleOverrides();
        if (!overrides[id]) overrides[id] = {};
        overrides[id].nombre = nombre;
        overrides[id].precio = precio;
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
    const precio = parseInt(document.getElementById('newVehiclePrecio').value, 10);
    const km = document.getElementById('newVehicleKm').value.trim();
    const color = document.getElementById('newVehicleColor').value.trim();
    const descripcion = document.getElementById('newVehicleDesc').value.trim();

    if (!marca || !modelo || isNaN(precio)) {
        alert('Completá marca, modelo y precio');
        return;
    }

    const customVehicles = await loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const maxId = customVehicles.reduce((max, v) => Math.max(max, v.id), 100);
    const newId = maxId + 1;

    const categoryTexts = {
        'autos-0km': 'Autos 0KM',
        'autos-usados': 'Autos Usados',
        'motos-electricas': 'Motos Eléctricas',
        'patinetas-electricas': 'Patinetas Eléctricas',
        'vehiculos-especiales': 'Vehículos Especiales'
    };

    customVehicles.push({
        id: newId,
        category: category,
        categoryText: categoryTexts[category] || category,
        marca: marca,
        modelo: modelo,
        anio: anio,
        precio: precio,
        km: km || '0 KM',
        color: color || '—',
        descripcion: descripcion
    });

    await saveStoredData(CUSTOM_VEHICLES_KEY, customVehicles);
    closeAddVehicleForm();
    await renderVehiclesEditor();
    await addChange(`Vehículo agregado: ${marca} ${modelo} (#${newId})`);
    alert('✓ Vehículo agregado correctamente');
}

async function deleteCustomVehicle(id) {
    if (!confirm('¿Eliminar este vehículo personalizado?')) return;

    let customVehicles = await loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const removed = customVehicles.find(v => v.id === id);
    customVehicles = customVehicles.filter(v => v.id !== id);
    await saveStoredData(CUSTOM_VEHICLES_KEY, customVehicles);
    await renderVehiclesEditor();
    if (removed) {
        await addChange(`Vehículo eliminado: ${removed.marca} ${removed.modelo} (#${id})`);
    }
    alert('✓ Vehículo eliminado');
}

async function loadImagesSection() {
    await loadLogoPreview();
    await renderSiteImagesGrid();
    await renderVehiclesEditor();
    migrateToStorage();
}

async function migrateToStorage() {
    const images = await getSiteImages();
    const tasks = [];
    for (const key of Object.keys(images)) {
        const img = images[key];
        if (img && img.data && !img.url) {
            tasks.push(
                FB.uploadBase64(`site/${key}`, img.data).then(url => {
                    images[key] = { url, timestamp: img.timestamp || new Date().toLocaleString('es-AR') };
                }).catch(() => {})
            );
        }
    }
    if (tasks.length) {
        await Promise.allSettled(tasks);
        await setSiteImages(images);
        renderSiteImagesGrid();
    }
    const overrides = await getVehicleOverrides();
    const ovTasks = [];
    for (const id of Object.keys(overrides)) {
        const o = overrides[id];
        if (o && o.image && o.image.startsWith('data:')) {
            ovTasks.push(
                FB.uploadBase64(`vehicles/${id}`, o.image).then(url => { o.image = url; }).catch(() => {})
            );
        }
    }
    if (ovTasks.length) {
        await Promise.allSettled(ovTasks);
        await setVehicleOverrides(overrides);
    }
    const customVehicles = await loadStoredData(CUSTOM_VEHICLES_KEY, []);
    const cvTasks = [];
    for (const cv of customVehicles) {
        if (cv.image && cv.image.startsWith('data:')) {
            cvTasks.push(
                FB.uploadBase64(`vehicles/custom/${cv.id}`, cv.image).then(url => { cv.image = url; }).catch(() => {})
            );
        }
    }
    if (cvTasks.length) {
        await Promise.allSettled(cvTasks);
        await saveStoredData(CUSTOM_VEHICLES_KEY, customVehicles);
    }
    if (ovTasks.length || cvTasks.length) renderVehiclesEditor();
}
