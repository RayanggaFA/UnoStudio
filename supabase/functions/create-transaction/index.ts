import { serve } from "https://deno.land/x/supabase_edge_functions@1.3.3/mod.ts";

serve(async (req) => {
  try {
    const { order_id, gross_amount, customer_name, customer_email } =
      await req.json();

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!serverKey) {
      return new Response(JSON.stringify({ error: "Server key missing" }), {
        status: 500,
      });
    }

    const auth = "Basic " + btoa(serverKey + ":");

    const midtransResponse = await fetch(
      "https://api.sandbox.midtrans.com/v2/charge",
      {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_type: "bank_transfer",
          transaction_details: {
            order_id,
            gross_amount,
          },
          customer_details: {
            first_name: customer_name,
            email: customer_email,
          },
          bank_transfer: {
            bank: "bca",
          },
        }),
      }
    );

    const data = await midtransResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
});
