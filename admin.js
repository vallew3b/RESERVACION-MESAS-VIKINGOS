document.addEventListener('DOMContentLoaded', () => {
    loadReservations();
    loadPrices();

    document.getElementById('priceForm').addEventListener('submit', savePrices);
});

function loadPrices() {
    const saved = localStorage.getItem('vickingos_precios');
    const defaultPrices = { vip: 3000, medio: 2000, general: 1000 };
    const prices = saved ? JSON.parse(saved) : defaultPrices;

    document.getElementById('priceVip').value = prices.vip;
    document.getElementById('priceMedio').value = prices.medio;
    document.getElementById('priceGeneral').value = prices.general;
}

function savePrices(e) {
    e.preventDefault();
    
    const prices = {
        vip: parseInt(document.getElementById('priceVip').value),
        medio: parseInt(document.getElementById('priceMedio').value),
        general: parseInt(document.getElementById('priceGeneral').value)
    };

    localStorage.setItem('vickingos_precios', JSON.stringify(prices));
    alert('¡Precios actualizados exitosamente! Los nuevos clientes verán estos precios.');
}

function loadReservations() {
    const grid = document.getElementById('reservationsGrid');
    const reservations = JSON.parse(localStorage.getItem('vickingos_reservas')) || [];

    grid.innerHTML = '';

    if (reservations.length === 0) {
        grid.innerHTML = '<p style="color: #a0a0a0; grid-column: 1/-1; text-align: center;">No hay reservas registradas aún.</p>';
        return;
    }

    reservations.reverse().forEach(res => {
        const card = document.createElement('div');
        card.className = 'res-card';
        
        // El estado ahora puede ser 'Pendiente', 'Pagado' o 'Confirmada'
        let badgeClass = 'pending';
        if(res.status === 'Pagado' || res.status === 'Confirmada') {
            badgeClass = 'confirmed';
        }
        
        const priceDisplay = res.price ? `<p><strong>Total:</strong> <span style="color:var(--primary-color)">$${res.price}</span></p>` : '';
        const methodDisplay = res.paymentMethod ? `<p><strong>Método:</strong> ${res.paymentMethod}</p>` : '';

        card.innerHTML = `
            <span class="badge ${badgeClass}">${res.status}</span>
            <h4>${res.name}</h4>
            <p style="color: var(--primary-color); font-weight: bold; font-size: 1.1rem; margin-bottom: 0.5rem;">Mesa: ${res.tableNumber || 'N/A'}</p>
            ${priceDisplay}
            ${methodDisplay}
            <hr style="border-color: var(--glass-border); margin: 0.5rem 0;">
            <p><strong>Fecha:</strong> ${res.date}</p>
            <p><strong>Email:</strong> ${res.email}</p>
            <p><strong>Teléfono:</strong> ${res.phone}</p>
            <p><strong>ID:</strong> ${res.id}</p>
            
            ${(res.status === 'Pendiente' || res.status === 'Pagado') ? `
            <div class="card-actions">
                ${res.status === 'Pendiente' ? `<button class="btn-small btn-success" onclick="confirmReservation('${res.id}')">Marcar Pagado</button>` : `<button class="btn-small btn-success" onclick="confirmReservation('${res.id}')">Confirmar Asistencia</button>`}
                <button class="btn-small btn-danger" onclick="deleteReservation('${res.id}')">Cancelar</button>
            </div>
            ` : `
            <div class="card-actions">
                 <button class="btn-small btn-danger" onclick="deleteReservation('${res.id}')">Eliminar</button>
            </div>
            `}
        `;

        grid.appendChild(card);
    });
}

function confirmReservation(id) {
    let reservations = JSON.parse(localStorage.getItem('vickingos_reservas')) || [];
    
    reservations = reservations.map(res => {
        if (res.id === id) {
            res.status = 'Confirmada';
        }
        return res;
    });

    localStorage.setItem('vickingos_reservas', JSON.stringify(reservations));
    loadReservations();
}

function deleteReservation(id) {
    if(!confirm('¿Estás seguro de cancelar y eliminar esta reserva?')) return;

    let reservations = JSON.parse(localStorage.getItem('vickingos_reservas')) || [];
    reservations = reservations.filter(res => res.id !== id);
    
    localStorage.setItem('vickingos_reservas', JSON.stringify(reservations));
    loadReservations();
}
