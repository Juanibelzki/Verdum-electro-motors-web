/* ============================================
   PANEL ADMINISTRATIVO - LÓGICA
   ============================================ */

// Contraseña Admin (puedes cambiarla)
const ADMIN_PASSWORD = 'verdun2024';

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

async function initAdmin() {
    // Verificar si está autenticado
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    
    if (isAuthenticated) {
        showAdminPanel();
        await loadAllData();
    } else {
        showLoginScreen();
    }
    
    // Event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', navigateSection);
    });
}

// ============================================
// LOGIN
// ============================================
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

// ============================================
// UI FUNCTIONS
// ============================================
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
}

function navigateSection(e) {
    const section = e.target.dataset.section;
    
    // Actualizar botones activos
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Actualizar secciones
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const sectionMap = {
        'metricas': 'metricas-section',
        'servicios': 'servicios-section',
        'contenido': 'contenido-section',
        'estadisticas': 'estadisticas-section'
    };
    
    document.getElementById(sectionMap[section]).classList.add('active');
    
    // Actualizar título
    const titles = {
        'metricas': 'Gestionar Métricas',
        'servicios': 'Editar Servicios',
        'contenido': 'Editar Contenido',
        'estadisticas': 'Cambios Realizados'
    };
    
    document.getElementById('sectionTitle').textContent = titles[section];
}

// ============================================
// CARGAR DATOS
// ============================================
async function loadAllData() {
    await loadMetrics();
    await loadServices();
    await loadContent();
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
        document.getElementById(`metricIcon${index}`).textContent = metric.icon;
        document.getElementById(`metricText${index}`).textContent = metric.text;
        document.getElementById(`metricIconInput${index}`).value = metric.icon;
        document.getElementById(`metricTextInput${index}`).value = metric.text;
    });
}

async function loadServices() {
    const services = await loadStoredData('services', [
        { desc: 'Nacionales e importados. Las mejores marcas con financiación propia.', features: ['VW', 'Nissan', 'Chevrolet'] },
        { desc: 'Revisados y garantizados. Todas las marcas con documentación completa.', features: ['Garantía', 'Revisados', 'Legales'] },
        { desc: 'Eficiencia y potencia eléctrica para la ciudad. Bajos costos operativos.', features: ['Eco-friendly', 'Rápida', 'Potente'] }
    ]);
    
    services.forEach((service, index) => {
        document.getElementById(`serviceDesc${index}`).value = service.desc;
        document.getElementById(`serviceFeatures${index}`).value = service.features.join(',');
    });
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

// ============================================
// ACTUALIZAR DATOS
// ============================================
async function updateMetric(index) {
    const icon = document.getElementById(`metricIconInput${index}`).value;
    const text = document.getElementById(`metricTextInput${index}`).value;
    
    if (!icon || !text) {
        alert('Completa todos los campos');
        return;
    }
    
    // Actualizar en el DOM del admin
    document.getElementById(`metricIcon${index}`).textContent = icon;
    document.getElementById(`metricText${index}`).textContent = text;
    
    // Guardar en Firebase
    const metrics = await loadStoredData('metrics', []);
    if (!metrics[index]) metrics[index] = {};
    metrics[index].icon = icon;
    metrics[index].text = text;
    await saveStoredData('metrics', metrics);
    
    // Registrar cambio
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
    
    const features = featuresStr.split(',').map(f => f.trim());
    
    // Guardar en Firebase
    const services = await loadStoredData('services', []);
    if (!services[index]) services[index] = {};
    services[index].desc = desc;
    services[index].features = features;
    await saveStoredData('services', services);
    
    // Registrar cambio
    await addChange(`Servicio ${index + 1} actualizado`);
    
    alert('✓ Servicio guardado correctamente');
}

async function updateContent() {
    const content = {
        heroTitle: document.getElementById('heroTitle').value,
        heroHighlight: document.getElementById('heroHighlight').value,
        heroSubtitle: document.getElementById('heroSubtitle').value,
        statYears: parseInt(document.getElementById('statYears').value),
        statVehicles: parseInt(document.getElementById('statVehicles').value)
    };
    
    if (!content.heroTitle || !content.heroHighlight) {
        alert('Completa todos los campos requeridos');
        return;
    }
    
    await saveStoredData('content', content);
    
    // Registrar cambio
    await addChange('Contenido principal actualizado');
    
    alert('✓ Contenido guardado correctamente');
}

// ============================================
// CAMBIOS Y HISTORIAL
// ============================================
async function addChange(message) {
    const changes = await loadStoredData('changes', []);
    const timestamp = new Date().toLocaleString('es-AR');
    
    changes.unshift({
        message: message,
        timestamp: timestamp
    });
    
    // Mantener solo los últimos 20 cambios
    if (changes.length > 20) {
        changes.pop();
    }
    
    await saveStoredData('changes', changes);
    
    // Actualizar estadísticas
    const stats = await loadStoredData('editStats', { count: 0, lastEdit: null });
    stats.count += 1;
    stats.lastEdit = new Date().toISOString();
    await saveStoredData('editStats', stats);
    
    // Recargar vista de cambios
    await loadChangeStats();
}

async function loadChangesList() {
    const changes = await loadStoredData('changes', []);
    const list = document.getElementById('changesList');
    
    if (changes.length === 0) {
        list.innerHTML = '<p class="empty-message">No hay cambios registrados aún</p>';
        return;
    }
    
    list.innerHTML = changes.map((change, index) => `
        <div class="change-item">
            <span class="change-number">#${index + 1}</span>
            <div class="change-info">
                <p class="change-message">${change.message}</p>
                <p class="change-time">${change.timestamp}</p>
            </div>
        </div>
    `).join('');
}

async function clearChangesLog() {
    localStorage.removeItem('changes');
    const stats = { count: 0, lastEdit: null };
    await saveStoredData('editStats', stats);
    await loadChangeStats();
    alert('✓ Historial limpiado');
}

// ============================================
// HELPER FUNCTIONS (LOCALSTORAGE)
// ============================================
function loadStoredData(key, defaultValue) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return data !== null ? data : defaultValue;
    } catch {
        return defaultValue;
    }
}

function saveStoredData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
