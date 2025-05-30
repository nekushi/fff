// Function to show/hide sections
function showSection(sectionId) {
    console.log('Showing section:', sectionId); // Debug log

    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    // Update navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    const activeNavItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

// Add click event listeners to navigation items
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    const email = localStorage.getItem('email');

    if (!isLoggedIn || userRole !== 'staff' || !email) {
        window.location.href = 'login.html';
        return;
    }

    // Add click handlers to all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            
            if (sectionId) {
                showSection(sectionId);
                if (sectionId === 'appointments') {
                    loadAppointments();
                } else if (sectionId === 'inventory') {
                    loadInventory();
                }
            }
        });
    });

    // Show profile section by default and load initial data
    showSection('profile');
    loadAppointments();
});

// Function to load appointments
async function loadAppointments() {
    try {
        const email = localStorage.getItem('email');
        if (!email) {
            throw new Error('User email not found');
        }

        // Fetch from newAppointments without staff_email filter
        const { data: appointments, error } = await supabase
            .from('newAppointments')
            .select('*')
            .order('appointmentDate', { ascending: true });

        if (error) throw error;

        console.log('[DEBUG] Appointments fetched from Supabase:', appointments);

        const transactionTableBody = document.getElementById('transactionTableBody');

        if (!appointments || appointments.length === 0) {
            console.warn('[DEBUG] No appointments found.');
            transactionTableBody.innerHTML = '<tr><td colspan="6" class="center-text">No appointments found</td></tr>';
            return;
        }

        // Clear the table
        transactionTableBody.innerHTML = '';

        // Add all appointments to the table
        appointments.forEach(appointment => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDateTime(appointment.appointmentDate)}</td>
                <td>${appointment.customer || 'N/A'}</td>
                <td>${appointment.pet || 'N/A'}</td>
                <td>${appointment.serviceType || 'N/A'}</td>
                <td>₱${appointment.price ? appointment.price.toFixed(2) : '0.00'}</td>
                <td>${appointment.status || 'N/A'}</td>
            `;
            transactionTableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error loading appointments:', error);
        const transactionTableBody = document.getElementById('transactionTableBody');
        if (transactionTableBody) {
            transactionTableBody.innerHTML = '<tr><td colspan="6" class="center-text">Error loading appointments. Please try again.</td></tr>';
        }
    }
}

// Function to update appointment status
async function updateAppointmentStatus(appointmentId, newStatus) {
    try {
        const { error } = await supabase
            .from('newAppointments')
            .update({ status: newStatus })
            .eq('id', appointmentId);

        if (error) throw error;

        // Reload appointments after successful update
        await loadAppointments();
        alert(`Appointment status updated to ${newStatus}`);

    } catch (error) {
        console.error('Error updating appointment status:', error);
        alert('Error updating appointment status. Please try again later.');
    }
}

// Function to delete appointment
async function deleteAppointment(appointmentId) {
    if (!confirm('Are you sure you want to delete this appointment?')) {
        return;
    }
    try {
        const { error } = await supabase
            .from('newAppointments')
            .delete()
            .eq('id', appointmentId);
        if (error) throw error;
        await loadAppointments();
        alert('Appointment deleted successfully');
    } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Error deleting appointment. Please try again.');
    }
}

// Function to format date and time
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

// Function to load inventory data
async function loadInventory() {
    try {
        const { data: inventory, error } = await supabase
            .from('inventory')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.warn('Error fetching from Supabase, using localStorage fallback:', error);
            // Use localStorage as fallback
            const localInventory = JSON.parse(localStorage.getItem('inventory')) || [
                { name: 'Shampoo', qty: 3 },
                { name: 'Conditioner', qty: 8 },
                { name: 'Toys', qty: 15 },
                { name: 'Treats', qty: 5 }
            ];
            renderInventoryTable(localInventory);
            return;
        }

        renderInventoryTable(inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        // Use localStorage as fallback on any error
        const localInventory = JSON.parse(localStorage.getItem('inventory')) || [
            { name: 'Shampoo', qty: 3 },
            { name: 'Conditioner', qty: 8 },
            { name: 'Toys', qty: 15 },
            { name: 'Treats', qty: 5 }
        ];
        renderInventoryTable(localInventory);
    }
}

// Helper function to render the inventory table
function renderInventoryTable(inventory) {
    const inventoryTableBody = document.getElementById('inventoryTableBody');
    
    if (!inventory || inventory.length === 0) {
        inventoryTableBody.innerHTML = '<tr><td colspan="3" class="center-text">No inventory items found.</td></tr>';
        return;
    }

    inventoryTableBody.innerHTML = inventory.map(item => {
        const status = item.qty <= 5 ? 'Low Stock' : 'In Stock';
        const statusClass = item.qty <= 5 ? 'status-low' : 'status-ok';
        
        return `
            <tr>
                <td>${item.name || 'N/A'}</td>
                <td>${item.qty || 0}</td>
                <td class="${statusClass}">${status}</td>
            </tr>
        `;
    }).join('');
} 