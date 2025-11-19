import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const body = await req.json();

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");

    const auth = "Basic " + btoa(serverKey + ":");

    const midtrans = await fetch(
      "https://api.sandbox.midtrans.com/v1/payment-links",
      {
        method: "POST",
        headers: {
          "Authorization": auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: "ORDER-" + body.reservation_id + "-" + Date.now(),
            gross_amount: body.gross_amount,
          },
          item_details: [{
            id: body.reservation_id,
            name: body.service_name,
            quantity: 1,
            price: body.gross_amount,
          }]
        })
      }
    );

    const result = await midtrans.json();
    return Response.json(result);

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
