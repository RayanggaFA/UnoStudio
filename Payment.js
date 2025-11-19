// payment.js
// Mengirim data form ke Supabase Function untuk membuat transaksi Midtrans

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        fullname: document.getElementById('fullname').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        studio_type: document.getElementById('studio_type').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        duration: document.getElementById('duration').value
    };

    const response = await fetch('https://gqkpcvcnuchbboslopcx.functions.supabase.co/create-transaction', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.token) {
        window.snap.pay(result.token);
    } else {
        alert('Gagal membuat transaksi');
        console.log(result);
    }
});
