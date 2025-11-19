import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const body = await req.json();

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    const auth = "Basic " + btoa(serverKey + ":");

    const midtransResponse = await fetch(
      "https://api.sandbox.midtrans.com/v1/payment-links",
      {
        method: "POST",
        headers: {
          "Authorization": auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: crypto.randomUUID(),
            gross_amount: 100000
          },
          customer_details: {
            first_name: body.fullname,
            email: body.email,
            phone: "08123"
          }
        }),
      }
    );

    const data = await midtransResponse.json();

    return new Response(JSON.stringify({ token: data.token }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
