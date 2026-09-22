import { test, expect } from "@playwright/test";

const PERSON_ID="https://kaisabuhussein.com/#person";
const WEBSITE_ID="https://kaisabuhussein.com/#website";
const HOME="https://kaisabuhussein.com/";
const RESUME="https://kaisabuhussein.com/resume/";
const OG="https://kaisabuhussein.com/assets/og.png";

const graphFrom = async page => {
  const raw=await page.locator('script[type="application/ld+json"]').textContent();
  const parsed=JSON.parse(raw);
  return parsed["@graph"];
};

test.describe("Phase B metadata and entity graph",()=>{
  test("homepage ships complete OG/Twitter metadata in source HTML",async({page})=>{
    const response=await page.request.get("/");
    expect(response.status()).toBe(200);
    const source=await response.text();
    expect(source).toContain('property="og:site_name" content="Kais Abu-Hussein"');
    expect(source).toContain(`property="og:url" content="${HOME}"`);
    expect(source).toContain(`property="og:image" content="${OG}"`);
    expect(source).toContain('property="og:image:width" content="1200"');
    expect(source).toContain('property="og:image:height" content="630"');
    expect(source).toContain(`name="twitter:image" content="${OG}"`);
    expect(source).toContain('name="robots" content="index,follow,max-image-preview:large');
  });

  test("homepage identity graph uses locked IDs and only verified identity fields",async({page})=>{
    await page.goto("/?force=static");
    const graph=await graphFrom(page);
    const website=graph.find(x=>x["@type"]==="WebSite");
    const profile=graph.find(x=>x["@type"]==="ProfilePage");
    const person=graph.find(x=>x["@type"]==="Person");

    expect(website["@id"]).toBe(WEBSITE_ID);
    expect(website.url).toBe(HOME);
    expect(website.name).toBe("Kais Abu-Hussein");

    expect(profile["@id"]).toBe("https://kaisabuhussein.com/#profile");
    expect(profile.url).toBe(HOME);
    expect(profile.mainEntity["@id"]).toBe(PERSON_ID);
    expect(profile.isPartOf["@id"]).toBe(WEBSITE_ID);

    expect(person["@id"]).toBe(PERSON_ID);
    expect(person.name).toBe("Kais Abu-Hussein");
    expect(person.alternateName).toBe("Kais Abu Hussein");
    expect(person.url).toBe(HOME);
    expect(person.description).toContain("15+ years");
    expect(person.sameAs).toBeUndefined();
    expect(person.image).toBeUndefined();
  });

  test("resume metadata is unique and links back to the persistent Person node",async({page})=>{
    await page.goto("/resume/");
    await expect(page).toHaveTitle("Résumé | Kais Abu-Hussein");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href",RESUME);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content",RESUME);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content",OG);
    const desc=await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toContain("CFO");
    expect(desc).toContain("family office investing");

    const graph=await graphFrom(page);
    const webPage=graph.find(x=>x["@type"]==="WebPage");
    const person=graph.find(x=>x["@type"]==="Person");
    expect(webPage["@id"]).toBe("https://kaisabuhussein.com/resume/#webpage");
    expect(webPage.about["@id"]).toBe(PERSON_ID);
    expect(webPage.isPartOf["@id"]).toBe(WEBSITE_ID);
    expect(person["@id"]).toBe(PERSON_ID);
  });

  test("canonical social image is a real 1200x630 PNG",async({page})=>{
    const response=await page.request.get("/assets/og.png");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    const b=Buffer.from(await response.body());
    expect(b.subarray(0,8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(b.readUInt32BE(16)).toBe(1200);
    expect(b.readUInt32BE(20)).toBe(630);
    expect(b.length).toBeGreaterThan(10000);
  });
});
