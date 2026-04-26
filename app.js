// Inicializar EmailJS (Se debe reemplazar con la clave real del usuario en el futuro)
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; 
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

const TOTAL_TABLES = 12; // 12 mesas (3 zonas x 4 mesas)
let selectedTable = null;
let currentPrices = { vip: 3000, medio: 2000, general: 1000 };

document.addEventListener('DOMContentLoaded', () => {
    if(typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }

    // Cargar precios configurados
    loadPrices();

    const form = document.getElementById('reservationForm');
    const dateInput = document.getElementById('date');
    const paymentMethod = document.getElementById('paymentMethod');
    const cardDetails = document.getElementById('cardDetails');

    // Lógica del Método de Pago
    if(paymentMethod) {
        paymentMethod.addEventListener('change', (e) => {
            if(e.target.value === 'tarjeta') {
                cardDetails.style.display = 'flex';
                document.getElementById('cardNumber').required = true;
                document.getElementById('cardExp').required = true;
                document.getElementById('cardCvv').required = true;
            } else {
                cardDetails.style.display = 'none';
                document.getElementById('cardNumber').required = false;
                document.getElementById('cardExp').required = false;
                document.getElementById('cardCvv').required = false;
            }
        });
    }

    if(dateInput) {
        // Establecer la fecha de hoy por defecto automáticamente
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        dateInput.value = today; // Fecha automática
        
        // Renderizar las mesas de hoy inmediatamente
        renderTables(today);
        
        dateInput.addEventListener('change', (e) => {
            renderTables(e.target.value);
            resetForm();
        });
    }

    if(form) {
        form.addEventListener('submit', handleReservation);
    }
});

function loadPrices() {
    const saved = localStorage.getItem('vickingos_precios');
    if(saved) {
        currentPrices = JSON.parse(saved);
    }
}

function getTableZone(tableId) {
    if (tableId >= 1 && tableId <= 4) return 'VIP';
    if (tableId >= 5 && tableId <= 8) return 'Medio';
    return 'General';
}

function getTablePrice(tableId) {
    const zone = getTableZone(tableId);
    if(zone === 'VIP') return currentPrices.vip;
    if(zone === 'Medio') return currentPrices.medio;
    return currentPrices.general;
}

function getOccupiedTables(date) {
    const reservations = JSON.parse(localStorage.getItem('vickingos_reservas')) || [];
    return reservations
        .filter(res => res.date === date)
        .map(res => parseInt(res.tableNumber));
}

function createTableDOM(i, isOccupied) {
    const group = document.createElement('div');
    group.className = 'table-group';
    
    // Asignar clase de zona
    const zone = getTableZone(i);
    group.classList.add('zone-' + zone.toLowerCase());

    if(isOccupied) {
        group.classList.add('occupied');
        group.title = 'Mesa Ocupada';
    } else {
        group.classList.add('available');
        group.title = `Mesa Disponible - Zona ${zone} ($${getTablePrice(i)})`;
    }

    // Sillas
    ['top', 'bottom', 'left', 'right'].forEach(pos => {
        const chair = document.createElement('div');
        chair.className = `chair ${pos}`;
        group.appendChild(chair);
    });

    // Centro de mesa
    const core = document.createElement('div');
    core.className = 'table-core';
    core.textContent = i;
    group.appendChild(core);

    return group;
}

function renderTables(selectedDate) {
    const container = document.getElementById('tablesContainer');
    if(!container) return;
    
    container.innerHTML = '';
    const occupiedTables = getOccupiedTables(selectedDate);
    selectedTable = null;

    for(let i = 1; i <= TOTAL_TABLES; i++) {
        const isOccupied = occupiedTables.includes(i);
        const group = createTableDOM(i, isOccupied);
        
        if(!isOccupied) {
            group.addEventListener('click', () => selectTabla(i, group));
        }
        
        container.appendChild(group);
    }
}

function selectTabla(tableId, groupElement) {
    // Quitar selección previa
    document.querySelectorAll('.table-group.selected').forEach(el => el.classList.remove('selected'));
    
    // Marcar nueva selección
    groupElement.classList.add('selected');
    selectedTable = tableId;

    const price = getTablePrice(tableId);

    // Actualizar UI del formulario
    document.getElementById('tableNumberDisplay').textContent = tableId;
    document.getElementById('tablePriceDisplay').textContent = `Precio: $${price} (Zona ${getTableZone(tableId)})`;
    document.getElementById('selectedTableId').value = tableId;
    
    // Habilitar campos
    document.getElementById('name').disabled = false;
    document.getElementById('email').disabled = false;
    document.getElementById('phone').disabled = false;
    document.getElementById('paymentMethod').disabled = false;
    document.getElementById('submitBtn').disabled = false;
}

function resetForm() {
    selectedTable = null;
    document.getElementById('tableNumberDisplay').textContent = 'Ninguna';
    document.getElementById('tablePriceDisplay').textContent = 'Precio: $--';
    document.getElementById('selectedTableId').value = '';
    
    const fields = ['name', 'email', 'phone', 'paymentMethod'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            if(el.tagName === 'INPUT') el.value = '';
            el.disabled = true;
        }
    });
    
    // Resetear tarjeta
    document.getElementById('paymentMethod').value = 'efectivo';
    document.getElementById('cardDetails').style.display = 'none';
    document.getElementById('cardNumber').value = '';
    document.getElementById('cardExp').value = '';
    document.getElementById('cardCvv').value = '';
    
    const submitBtn = document.getElementById('submitBtn');
    if(submitBtn) submitBtn.disabled = true;
}

function handleReservation(e) {
    e.preventDefault();

    if(!selectedTable) {
        alert('Por favor selecciona una mesa del mapa.');
        return;
    }

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const date = document.getElementById('date').value;
    const paymentSelect = document.getElementById('paymentMethod').value;
    const btn = document.getElementById('submitBtn');
    const btnSpan = btn.querySelector('span');
    const price = getTablePrice(selectedTable);

    // Estado de carga y simulación
    btn.disabled = true;
    btn.classList.add('loading');
    
    if(paymentSelect === 'tarjeta') {
        btnSpan.textContent = 'PROCESANDO PAGO...';
    } else {
        btnSpan.textContent = 'RESERVANDO...';
    }

    // Determinar método y estado
    const methodStr = paymentSelect === 'tarjeta' ? 'Tarjeta' : 'Efectivo en Local';
    const statusStr = paymentSelect === 'tarjeta' ? 'Pagado' : 'Pendiente';

    // Crear objeto de reserva
    const reservation = {
        id: 'RES-' + Math.floor(Math.random() * 1000000),
        tableNumber: selectedTable,
        name,
        email,
        phone,
        date,
        price,
        paymentMethod: methodStr,
        status: statusStr
    };

    // Simular tiempo de red y procesamiento del banco (más largo si es tarjeta)
    const delay = paymentSelect === 'tarjeta' ? 2500 : 1000;

    setTimeout(() => {
        saveReservation(reservation);
        sendEmail(reservation);

        btn.disabled = false;
        btn.classList.remove('loading');
        btnSpan.textContent = 'PAGAR Y RESERVAR';
        
        document.getElementById('successModal').classList.add('active');
        
        // Recargar mapa de mesas
        renderTables(date);
        resetForm();
    }, delay);
}

function saveReservation(reservation) {
    let reservations = JSON.parse(localStorage.getItem('vickingos_reservas')) || [];
    reservations.push(reservation);
    localStorage.setItem('vickingos_reservas', JSON.stringify(reservations));
}

function sendEmail(reservation) {
    if(EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.log("-----------------------------------------");
        console.log("SIMULACIÓN DE CORREO ENVIADO A: " + reservation.email);
        console.log(`Hola ${reservation.name}, reserva para la fecha ${reservation.date}.`);
        console.log(`MESA ASIGNADA: Mesa ${reservation.tableNumber}`);
        console.log(`TOTAL: $${reservation.price} | PAGO: ${reservation.paymentMethod}`);
        console.log("-----------------------------------------");
        return;
    }

    // Real EmailJS logic goes here...
}

function closeModal() {
    document.getElementById('successModal').classList.remove('active');
}
