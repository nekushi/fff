// Initialize Supabase client
const supabase = window.supabase.createClient(
    'https://zehjuqavoktgxjqwcqpo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaGp1cWF2b2t0Z3hqcXdjcXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDA2ODAsImV4cCI6MjA2MTc3NjY4MH0.n2Nb0QgaZFVW4zC0NyQGAy38tka_gwkhiTrBC8rU-GM'
);

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

        console.log('[DEBUG] Using staff_email for filtering:', email);
        // Fetch from newAppointments and filter by staff_email
        const { data: appointments, error } = await supabase
            .from('newAppointments')
            .select('*')
            .eq('staff_email', email)
            .order('appointmentDate', { ascending: true });

        if (error) throw error;

        console.log('[DEBUG] Appointments fetched from Supabase:', appointments);

        const transactionTableBody = document.getElementById('transactionTableBody');

        if (!appointments || appointments.length === 0) {
            console.warn('[DEBUG] No appointments found for this staff.');
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