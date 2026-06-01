import { mkdirSync, writeFileSync } from "node:fs";

const cities = [
  { city: "Edmonton", lat: 53.5461, lon: -113.4938, hoods: ["Glenora", "Windermere", "Ritchie", "Oliver"] },
  { city: "Calgary", lat: 51.0447, lon: -114.0719, hoods: ["Altadore", "Kensington", "Mahogany", "Bridgeland"] },
  { city: "Airdrie", lat: 51.2917, lon: -114.0144, hoods: ["Coopers Crossing", "Bayside", "King's Heights", "Reunion"] },
  { city: "Sherwood Park", lat: 53.5412, lon: -113.2957, hoods: ["Broadmoor", "Summerwood", "Heritage Hills", "Lakeland"] },
  { city: "St. Albert", lat: 53.6305, lon: -113.6256, hoods: ["Lacombe Park", "Erin Ridge", "Oakmont", "Grandin"] }
];
const types = ["Detached", "SemiDetached", "Townhouse", "Condo"];
const conditions = ["Poor", "Average", "Good", "Renovated", "New"];
const streets = ["Aspen", "Cedar", "Prairie", "Ridge", "Summit", "Willow", "Moraine", "Heritage", "Larch", "Juniper"];

function priceBase(type) {
  return { Detached: 575000, SemiDetached: 455000, Townhouse: 365000, Condo: 265000 }[type];
}

function sizeFor(type, index) {
  const base = { Detached: 2050, SemiDetached: 1680, Townhouse: 1420, Condo: 910 }[type];
  return base + ((index % 7) - 3) * 95 + Math.floor(index / 10) * 12;
}

const rows = [];
for (let cityIndex = 0; cityIndex < cities.length; cityIndex += 1) {
  const city = cities[cityIndex];
  for (let i = 0; i < 16; i += 1) {
    const type = types[(i + cityIndex) % types.length];
    const condition = conditions[(i * 2 + cityIndex) % conditions.length];
    const livingAreaSqft = sizeFor(type, i + cityIndex * 3);
    const yearBuilt = 1978 + ((i * 7 + cityIndex * 5) % 45);
    const bedrooms = type === "Condo" ? 2 + (i % 2) : 3 + (i % 3 === 0 ? 1 : 0);
    const bathrooms = type === "Condo" ? 1.5 + (i % 2) * 0.5 : 2 + (i % 3) * 0.5;
    const lotSizeSqft = type === "Condo" ? 0 : Math.round(livingAreaSqft * (type === "Detached" ? 2.65 : 1.55));
    const parking = type === "Condo" ? 1 : type === "Townhouse" ? 1 + (i % 2) : 2;
    const monthsAgo = 1 + ((i * 3 + cityIndex * 2) % 24);
    const date = new Date(Date.UTC(2026, 4 - monthsAgo, 12 + (i % 12)));
    const conditionPremium = { Poor: -65000, Average: 0, Good: 28000, Renovated: 62000, New: 85000 }[condition];
    const cityPremium = { Edmonton: 0, Calgary: 65000, Airdrie: -35000, "Sherwood Park": 25000, "St. Albert": 45000 }[city.city];
    const salePrice = Math.round((priceBase(type) + cityPremium + conditionPremium + (livingAreaSqft - 1500) * 145 + (yearBuilt - 1990) * 1500) / 1000) * 1000;

    rows.push({
      id: `AB-${String(rows.length + 1).padStart(3, "0")}`,
      address: `${100 + i * 17} ${streets[(i + cityIndex) % streets.length]} ${type === "Condo" ? "Landing" : "Drive"}`,
      city: city.city,
      neighbourhood: city.hoods[i % city.hoods.length],
      propertyType: type,
      yearBuilt,
      bedrooms,
      bathrooms,
      livingAreaSqft,
      lotSizeSqft,
      parking,
      saleDate: date.toISOString().slice(0, 10),
      salePrice,
      latitude: Number((city.lat + ((i % 5) - 2) * 0.018 + cityIndex * 0.002).toFixed(6)),
      longitude: Number((city.lon + ((i % 4) - 1.5) * 0.021 - cityIndex * 0.002).toFixed(6)),
      condition
    });
  }
}

mkdirSync("data", { recursive: true });
writeFileSync("data/synthetic_alberta_residential_comps.json", `${JSON.stringify(rows, null, 2)}\n`);
