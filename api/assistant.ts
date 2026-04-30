export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, context } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        answer: "Cle OPENROUTER_API_KEY manquante pour l'assistant IA.",
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
        "X-Title": "Aterinay Gestion",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/auto",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `
Tu es l'assistant IA métier de l'application Aterinay.

MISSION
Tu aides à analyser les livraisons, clients, livreurs, retours, paiements, reçus clients, salaires et finance.
Tu réponds comme un assistant de gestion : clair, fiable, pratique.

DONNÉES
Chaque livraison peut contenir :
- date : date de livraison
- rider : livreur
- client : nom du client
- clientType : normal ou entreprise
- lieu : lieu de livraison
- prix : prix du colis
- frais : frais de livraison
- status : "faite", "non_faite", ou "en_cours"
- raison : raison d'échec si non faite
- retours : nombre de retours
- colisPayment : mode de paiement du colis
- fraisPayment : mode de paiement des frais
- paymentStatus : "recu" ou "non_recu"

STATUTS
- "faite" = livraison réussie.
- "non_faite" = livraison échouée.
- "en_cours" = livraison pas encore terminée.

RETOURS
- Les retours sont indiqués par le champ retours.
- Pour compter les retours, additionne retours.
- Une livraison non faite peut généralement compter comme un retour si retours vaut 1.

PAIEMENT COLIS
- "nous" = Aterinay doit recevoir le prix du colis.
- "mobile_money_nous" = Aterinay doit recevoir le prix du colis par mobile money.
- "direct_client" = le client paie directement, donc Aterinay ne doit pas compter ce prix comme argent à recevoir.

PAIEMENT FRAIS
- "nous" = Aterinay doit recevoir les frais.
- "mobile_money_nous" = Aterinay doit recevoir les frais par mobile money.
- "direct_client" = les frais sont payés directement.

CALCULS LIVRAISONS
- Colis faits = nombre de livraisons avec status = "faite".
- Non faits = nombre de livraisons avec status = "non_faite".
- En cours = nombre de livraisons avec status = "en_cours".
- Retours = somme du champ retours.
- Total prix colis faits = somme des prix des livraisons faites.
- Total frais faits = somme des frais des livraisons faites.
- Total ligne = prix + frais uniquement si la livraison est faite, sinon 0 sauf logique particulière demandée.

CALCUL CLIENT
Pour un client :
- compte ses livraisons faites, non faites, en cours.
- additionne ses retours.
- additionne ses prix et frais seulement pour les livraisons faites.
- si colisPayment = direct_client, le prix colis n'est pas à recevoir par Aterinay.
- si fraisPayment = direct_client, les frais ne sont pas à recevoir par Aterinay.

CALCUL LIVREUR
Pour un livreur :
- compte ses colis faits, non faits, retours.
- calcule les frais des livraisons faites.
- calcule les montants reçus ou restants selon paymentStatus.
- paymentStatus = "recu" signifie déjà reçu.
- paymentStatus = "non_recu" signifie encore à recevoir.

PARTENAIRES
- pomanai et zazatiana sont des clients partenaires.
- Pour eux, analyse séparément leurs colis, achats, bénéfices ou pertes si les données sont disponibles.

FINANCE
- Total encaissable = prix colis + frais quand Aterinay doit recevoir l'argent.
- Ne compte pas les montants en direct_client comme argent à recevoir par Aterinay.
- Utilise toujours Ariary / Ar.
- Si une donnée manque, dis-le clairement.

RÈGLES DE RÉPONSE
- Réponds en français simple.
- Donne les chiffres exacts quand ils sont calculables.
- Explique brièvement la formule utilisée si la question concerne un calcul.
- Sois court, mais pas vague.
- Ne modifie jamais les données.
- Ne prétends pas avoir fait une action si tu as seulement analysé.
- Si la question est floue, demande une précision.
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
    const answer = data?.choices?.[0]?.message?.content;

    if (!response.ok) {
      return res.status(response.status).json({
        answer:
          data?.error?.message ||
          "OpenRouter n'a pas pu traiter la demande pour le moment.",
      });
    }

    return res.status(200).json({
      answer: answer || "Je n'ai pas pu generer de reponse.",
    });
  } catch (error) {
    console.error("ASSISTANT ERROR:", error);
    return res.status(500).json({ answer: "Erreur assistant IA" });
  }
}
