export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, context } = req.body;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "developer",
            content: `
Tu es l'assistant IA de gestion Aterinay.
Tu aides à analyser les livraisons, clients, livreurs, retours, paiements, reçus clients et finances.

Règles :
- Réponds en français simple.
- Sois court et utile.
- Utilise les montants en Ariary.
- Ne modifie jamais les données.
- Si l'utilisateur demande une action, propose seulement quoi faire.
            `,
          },
          {
            role: "user",
            content: `
Question : ${question}

Données Aterinay :
${JSON.stringify(context, null, 2)}
            `,
          },
        ],
      }),
    });

    const data = await response.json();

    return res.status(200).json({
      answer: data.output_text || "Je n'ai pas pu générer de réponse.",
    });
  } catch (error) {
    console.error("ASSISTANT ERROR:", error);
    return res.status(500).json({ error: "Erreur assistant IA" });
  }
}