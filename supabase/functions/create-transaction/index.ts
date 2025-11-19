import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const body = await req.json();

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    const authHeader = "Basic " + btoa(serverKey + ":");

    const midtransRes = await fetch(
      "https://api.sandbox.midtrans.com/v1/payment-links",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: crypto.randomUUID(),
            gross_amount: 100000
          },
          customer_details: {
            first_name: body.fullname,
            email: body.email,
            phone: body.phone,
          }
        })
      }
    );

    const data = await midtransRes.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500
    });
  }
});
