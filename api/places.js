export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    res.status(200).json({ predictions: [] });
    return;
  }

  const input = String(req.query?.input || "").trim();
  if (!input || input.length < 2) {
    res.status(200).json({ predictions: [] });
    return;
  }

  try {
    const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
    url.searchParams.set("text", input);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("filter", "countrycode:gb");
    url.searchParams.set("type", "amenity");
    url.searchParams.set("limit", "5");

    const upstream = await fetch(url.toString());
    const data = await upstream.json();
    const predictions = Array.isArray(data?.features)
      ? data.features.slice(0, 5).map((f) => ({
          description: f?.properties?.formatted || f?.properties?.address_line1 || "",
          placeId: f?.properties?.place_id || f?.properties?.datasource?.raw?.osm_id || "",
        })).filter((p) => p.description)
      : [];

    res.status(200).json({ predictions });
  } catch (e) {
    res.status(200).json({ predictions: [], error: e?.message || "places failed" });
  }
}
