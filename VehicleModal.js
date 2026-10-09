/**
 * VehicleModal - Componente de ficha técnica para modal de vehículo
 * Renderiza la información respetando la estructura de datos y diseño especificada.
 * Versión vanilla JS compatible con el proyecto existente (script.js / index.html).
 *
 * Uso: const vm = new VehicleModal(vehicleData, containerElement);
 *      vm.render();
 */

class VehicleModal {
    /**
     * @param {Object} vehicle - Objeto de vehículo con datos de Supabase
     * @param {HTMLElement} [container] - Elemento DOM donde insertar el modal
     */
    constructor(vehicle, container) {
        this.vehicle = vehicle;
        this.container = container || document.body;
        this.init();
    }

    init() {
        // Mapear categoría a "SUVs", "Pickups", etc. según la key del categories table
        const categoryMap = {
            '0km': '0 KM',
            'usados': 'Usados',
            'motos': 'Motos',
            'patacletas': 'Patinetas Eléctricas',
            'especiales': 'Vehículos Especiales'
        };
        this.categoryLabel = categoryMap[this.vehicle.category_id] || 'Usados';

        // Determinar condición y badges superiores
        this.condition = this.vehicle.esCeroKm ? '0 KM' : (this.vehicle.condicion || 'Usado');
        this.isUsed = this.condition === 'Usado';
        this.is0km = this.condition === '0 KM';
        this.isDemo = this.vehicle.esDemo === true || (this.vehicle.condicion && this.vehicle.condicion.toLowerCase().includes('demo'));

        // Categoría principal (SUVs, Pickups, Sedanes, etc.)
        this.category = this.vehicle.tipo || this.categoryLabel;

        // Badges condicionales
        this.serviceBadge = this.vehicle.serviceHistory === true ? 'SERVICES AL DÍA' : '';
        this.ownerBadge = this.vehicle.singleOwner === true ? '1 DUEÑO' : '';

        // Marca y modelo
        this.brand = this.vehicle.marca || '—';
        this.model = this.vehicle.modelo || '—';

        // Versión (concatena versión/trail si vienen, si no, año + configuración)
        this.version = this.vehicle.version || `${this.vehicle.año || '—'} ${this.vehicle.color || ''} ${this.vehicle.caja || ''}`.trim();

        // Precio y cálculo de cuotas (formato USD simple: precio / 1413 × 24 simulado)
        this.priceUsd = this.vehicle.precio_numero || 0;
        this.priceArs = this.vehicle.precio || '—';
        this.cuotasRef = this.calculateCuotasReference();

        // Especificaciones técnicas (two-column grid)
        this.specs = {
            año: this.vehicle.año || '—',
            km: this.vehicle.km || '—',
            motor: this.vehicle.motor || '—',
            caja: this.vehicle.caja || '—',
            combustible: this.vehicle.combustible || '—',
            traccion: this.vehicle.traccion || '—',
            potencia: this.vehicle.potencia || '—',
            torque: this.vehicle.torque || '—',
            color_exterior: this.vehicle.color || '—',
            interior: this.vehicle.interior || '—',
            puertas: this.vehicle.puertas || '—',
            ubicaciones: this.vehicle.ubicaciones || '—',
            consumo: this.vehicle.consumo || '—',
            baul: this.vehicle.baul || this.vehicle.caja /* fallback: si es pickup, "Caja" */
        };

        // Equipamiento (features list from admin)
        this.equipment = this.vehicle.equipamiento || this.vehicle.features || [];

        // Metadatos de stock
        this.stockId = this.vehicle.id || '—';
        this.diasPublicado = this.vehicle.dias_publicado || '—';
        this.origen = this.vehicle.origen || 'Web';

        // Mensaje WhatsApp preconfigurado
        this.whatsappMsg = this.vehicle.whatsapp_msg || this.buildWhatsAppMessage();
    }

    calculateCuotasReference() {
        // Fórmula de referencia: precio_usd × 24 cuotas (simulación bancaria simple)
        // Ejemplo: 1413 USD × 24 cuotas = cuota base ~58.87 USD
        if (this.priceUsd <= 0) return '—';
        const cuota = (this.priceUsd / 24).toFixed(2);
        return `${this.priceUsd} USD × 24 cuotas ~${cuota} USD/cada una`;
    }

    buildWhatsAppMessage() {
        const name = `${this.brand} ${this.model} ${this.version}`.trim();
        const año = this.vehicle.año || '';
        const msg = `¡Hola! Quiero consultar el precio y disponibilidad del ${name}${año ? ' (' + año + ')' : ''} que vi en su web.`;
        return msg;
    }

    // Badges superiores HTML
    getBadgesHtml() {
        const badges = [];

        // Badge de condición
        const conditionBadge = this.is0km
            ? '<span class="vehicle-badge badge-0km">0 KM</span>'
            : (this.isDemo ? '<span class="vehicle-badge badge-demo">DEMO</span>' : '<span class="vehicle-badge badge-usado">Usado</span>');
        badges.push(conditionBadge);

        // Badge de categoría
        const categoryBadge = `<span class="vehicle-badge badge-suv">${this.category}</span>`;
        badges.push(categoryBadge);

        // Badges condicionales
        if (this.serviceBadge) {
            badges.push(`<span class="vehicle-badge badge-service">${this.serviceBadge}</span>`);
        }
        if (this.ownerBadge) {
            badges.push(`<span class="vehicle-badge badge-owner">${this.ownerBadge}</span>`);
        }

        return badges.join(' ');
    }

    // Header del modelo HTML
    getHeaderHtml() {
        return `
            <div class="vehicle-modal-header">
                <div class="vehicle-brand-model">
                    <span class="vehicle-brand">${this.brand.toUpperCase()}</span>
                    <span class="vehicle-model">${this.model.toUpperCase()}</span>
                </div>
                <div class="vehicle-version">${this.version}</div>
                <div class="vehicle-price">
                    <span class="vehicle-price-usd">${this.priceArs} USD</span>
                    <span class="vehicle-cuotas-ref">${this.cuotasRef}</span>
                </div>
            </div>
        `;
    }

    // Grilla de especificaciones en dos columnas HTML
    getSpecsHtml() {
        const specs = this.specs;
        const col1 = [];
        const col2 = [];

        // Distribuir en dos columnas equilibradas
        const specKeys = [
            'año', 'km', 'motor', 'caja', 'combustible', 'traccion',
            'potencia', 'torque', 'color_exterior', 'interior',
            'puertas', 'ubicaciones', 'consumo', 'baul'
        ];

        specKeys.forEach((key, idx) => {
            const label = this.getSpecLabel(key);
            const value = specs[key];
            const line = `<div class="spec-item"><span class="spec-label">${label}:</span> <span class="spec-value">${value}</span></div>`;

            if (idx % 2 === 0) {
                col1.push(line);
            } else {
                col2.push(line);
            }
        });

        return `
            <div class="vehicle-specs-grid">
                <div class="specs-col">
                    ${col1.join('')}
                </div>
                <div class="specs-col">
                    ${col2.join('')}
                </div>
            </div>
        `;
    }

    getSpecLabel(key) {
        const labels = {
            año: 'Año', km: 'Kilometraje', motor: 'Motor',
            caja: 'Caja', combustible: 'Combustible', traccion: 'Tracción',
            potencia: 'Potencia', torque: 'Torque',
            color_exterior: 'Color Exterior', interior: 'Interior',
            puertas: 'Puertas', ubicaciones: 'Ubicaciones',
            consumo: 'Consumo', baul: 'Baúl/Caja'
        };
        return labels[key] || key;
    }

    // Descripción del vendedor HTML
    getDescriptionHtml() {
        const origen = this.origen;
        const desc = this.vehicle.descripcion || 'Sin descripción disponible.';
        return `
            <div class="vehicle-modal-description">
                <div class="description-origin">${origen}</div>
                <p class="description-text">${desc}</p>
            </div>
        `;
    }

    // Equipamiento HTML
    getEquipmentHtml() {
        const items = this.equipment;
        if (!items || items.length === 0) {
            return '<div class="vehicle-modal-equipment"><p class="empty-equipment">Sin datos de equipamiento.</p></div>';
        }

        const bulletItems = items.map(item => `<li>${item}</li>`).join('');

        return `
            <div class="vehicle-modal-equipment">
                <div class="equipment-header">
                    <span class="equipment-label">EQUIPAMIENTO</span>
                    <span class="equipment-count">${items.length} ÍTEMS</span>
                </div>
                <ul class="equipment-list">
                    ${bulletItems}
                </ul>
            </div>
        `;
    }

    // Metadatos de stock HTML
    getStockMetadataHtml() {
        return `
            <div class="vehicle-modal-stock">
                <span class="stock-id">#${this.stockId}</span>
                <span class="stock-dias">${this.diasPublicado} días</span>
                <span class="stock-origen">${this.origen}</span>
            </div>
        `;
    }

    // CTA Principal WhatsApp HTML
    getCtaHtml() {
        const safeName = (this.vehicle.nombre || `${this.brand} ${this.model}`).replace(/'/g, "\\'");
        const safeMsg = this.whatsappMsg.replace(/'/g, "\\'");
        const año = this.vehicle.año || 0;

        return `
            <div class="vehicle-modal-cta">
                <button class="btn-consultar-modal" onclick="consultarWhatsApp('${safeName}', ${año}, '${safeMsg}')">
                    Consultar por WhatsApp
                </button>
            </div>
        `;
    }

    // Modal wrapper HTML completo
    getModalHtml() {
        return `
            <div id="vehicleModal" class="vehicle-modal-overlay">
                <div class="vehicle-modal-content">
                    <button class="modal-close" onclick="document.getElementById('vehicleModal').style.display='none'" aria-label="Cerrar modal">&times;</button>

                    ${this.getBadgesHtml()}

                    ${this.getHeaderHtml()}

                    ${this.getSpecsHtml()}

                    ${this.getDescriptionHtml()}

                    ${this.getEquipmentHtml()}

                    ${this.getStockMetadataHtml()}

                    ${this.getCtaHtml()}
                </div>
            </div>
        `;
    }

    /**
     * Abre el modal en el contenedor especificado
     */
    open() {
        const modalHtml = this.getModalHtml();
        this.container.innerHTML = modalHtml;

        // Asegurar que el overlay tenga z-index alto y capture clicks fuera
        const overlay = document.getElementById('vehicleModal');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.zIndex = '10000';

            // Cerrar al hacer clic fuera del contenido
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                }
            });

            // Cerrar con Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay.style.display !== 'none') {
                    overlay.style.display = 'none';
                }
            });
        }
    }

    /**
     * Cierra el modal y restaura el contenido anterior
     */
    close() {
        const overlay = document.getElementById('vehicleModal');
        if (overlay) {
            overlay.style.display = 'none';
            // Limpiar listeners de keydown para evitar acumulados
            document.removeEventListener('keydown', (e) => {
                if (e.key === 'Escape') overlay.style.display = 'none';
            });
        }
    }
}

/**
 * Inicializar modal al hacer click en una card de vehículo del stock
 * Compatible con la estructura existente en script.js
 */
function initVehicleModalFromStock() {
    // Delegation: cuando se hace click en .vehicle-card del modal stock,
    // abrimos el VehicleModal con los datos de ese vehículo
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.vehicle-card');
        if (!card) return;

        const cardId = card.dataset.cardId;
        if (!cardId) return;

        const vehicle = window.currentStockVehicles.find(v => String(v.id) === cardId);
        if (!vehicle) return;

        // Crear y abrir modal
        const modal = new VehicleModal(vehicle);
        modal.open();
    });
}

/**
 * Helper: abrir modal de ficha técnica desde fuera (ej. desde admin o otras páginas)
 * @param {Object} vehicleData - Datos del vehículo
 * @param {HTMLElement} [container] - Donde insertar (default: body)
 */
function openVehicleModal(vehicleData, container) {
    const modal = new VehicleModal(vehicleData, container);
    modal.open();
}

export { VehicleModal, initVehicleModalFromStock, openVehicleModal };