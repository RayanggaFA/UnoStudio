document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        fullname: document.getElementById('fullname').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };

    const response = await fetch("https://gqkpcvcnuchbboslopcx.functions.supabase.co/create-transaction", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.payment_url) {
        window.location.href = result.payment_url; // Payment Link Midtrans
    } else {
        alert("Gagal membuat transaksi");
        console.log(result);
    }
});
