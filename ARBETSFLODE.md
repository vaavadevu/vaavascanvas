# Arbetsflöde – för oss som driver sajten

Den här filen beskriver hur man ändrar innehållet på vaavascanvas.se utan att
något hamnar i otakt. `README.md` vänder sig till utomstående som hittar repot;
det här är instruktionerna för oss.

## Grundregeln

**Allt som beskriver ett verk bor i `data/*.json`. Allt annat är genererat.**

`build_paintings_data.bat` (som kör `npm run build`) läser `data/` och skriver om:

- `paintings`-arrayen i `js/paintings.js`
- `PAINTINGS`- och `BOOKMARKS`-katalogerna i `functions/api/create-checkout.js`
- varje sida under `pictures/` samt butikens `pictures/index.html`
- utvalda verk på startsidan `index.html`
- `sitemap.xml`

Handredigerar man någon av dem skrivs ändringen över vid nästa bygge — eller,
värre, den ser ut att fungera lokalt medan det som ligger live säger något
annat. Det var precis det som hände när Solroskossan såldes: `js/paintings.js`
ändrades för hand, bygget kördes aldrig, och produktsidan fortsatte annonsera
`InStock` mot Google.

Undantagen — de delar av `js/paintings.js` som **inte** genereras och alltså
redigeras för hand — är konstantblocken högst upp: `STATUS`, `MEDIUM`, `SHAPE`
och `TYPE`. Samt förstås `js/translations.js`, som är helt handskriven.

## Markera ett verk som sålt

1. Ändra `"status"` till `"sold"` för verket i `data/paintings.json`.
2. Kör `build_paintings_data.bat`.
3. Kör `tests\run-all-tests.bat` (eller `npm test`).
4. Committa och pusha.

Giltiga statusvärden är `"for_sale"`, `"sold"` och `"personal"`. Allt annat
tolkas som till salu.

Samma tre steg gäller alla ändringar av ett befintligt verk: pris, titel, mått,
ram. Ändra i `data/paintings.json`, bygg, testa.

Keramik ligger i `data/clay.json` och bokmärken i `data/bookmarks.json` — samma
flöde, samma bygge.

## Lägga till en ny tavla

1. Skapa `images/paintings/<id>/original/` och lägg fotona där.

   Mappnamnet blir tavlans id och en del av bildernas adress, så det får bara
   innehålla `a–z`, `A–Z`, `0–9`, `-` och `_`, och måste börja med en bokstav.
   Inga mellanslag, inga å/ä/ö. Vi skriver dem i camelCase, som `solrosKossan`.

   Filnamnen behöver inte vara numrerade — scriptet döper om dem till `01`,
   `02`, `03`. Bilder som redan heter exakt två siffror behåller sin plats,
   resten läggs efter dem i bokstavsordning. **`01` blir omslaget**: miniatyren
   i butiken, bilden i varukorgen och `og:image` när sidan delas. Vill man
   styra vilken det blir, döp den till `01` innan man kör.

2. Kör `sync_paintings_images.bat` och välj `[1]`.

   Den bygger `desktop/`- och `mobile/`-versioner, numrerar om `original/`,
   uppdaterar `counts.json` och `metadata.json`, lägger in en placeholder-post
   i `data/paintings.json` och en `desc_<id>` i `js/translations.js`, kör
   bygget och kontrollerar till sist att bildstrukturen stämmer.

3. Fyll i placeholders. Posten i `data/paintings.json` har en `_todo`-rad som
   säger vad som saknas — som regel `title`, `width` och `height` i cm, och
   `originalPrice` i kronor. Beskrivningen `desc_<id>` i `js/translations.js`
   står som `TODO:` och ska skrivas på både svenska och engelska.

   Är det inte en målning: sätt `"type"` till `"clay"` eller `"bookmark"`.
   Är den rund: byt `"shape"` till `"circle"` och ersätt `width`/`height` med
   `"diameter"`. Finns den med ram: lägg till `"framedPrice"` och
   `"frameAvailable": true`.

   Ta bort `_todo`-raden när allt stämmer.

4. Kör `build_paintings_data.bat` igen, så att det du fyllt i når sidorna.

5. Kör `tests\run-all-tests.bat`, committa och pusha.

Placeholders är med flit ogiltiga — priset är `0` och beskrivningen står som
`TODO:` — så `npm test` faller tills de är ifyllda. Det är avsiktligt: en tavla
med dummyvärden ska inte kunna nå butiken.

## Nytt medium

Byter man medium till något som inte använts förut kraschar bygget med ett
felmeddelande som säger exakt vad som saknas. Två saker ska läggas till för
hand:

1. Konstanten i `MEDIUM`-blocket i `js/paintings.js`, t.ex.
   `ACRYLIC_CANVAS_PANEL: "medium_acrylic_canvas_panel"`.
2. Nyckeln i `js/translations.js` med `sv` och `en`.

Först därefter kan `"medium"` i `data/paintings.json` peka på värdet.

## Ta bort ett verk

Försvinner en bildmapp under `images/paintings/` tar nästa synk **bort** posten
ur `data/paintings.json`. Det är meningen — men det gäller också en mapp som
råkat flyttas eller döpas om. Scriptet skriver ut vad det tar bort, med titel,
pris och om verket var sålt, så det syns innan filen sparas.

Beskrivningen i `js/translations.js` står kvar. Gick något fel:
`git checkout data/paintings.json`.

## Innan du pushar

`tests\run-all-tests.bat` kör allt. De snabba sviterna hinner du alltid med:

| Kommando | Vad den svarar på |
| --- | --- |
| `node tests/validate.js` | Hänger data, bilder, sidor och sitemap ihop? |
| `node tests/checkout.js` | Kan en kund debiteras fel belopp? |
| `node tests/cart-math.js` | Räknar varukorgen rätt? |
| `node tests/cart-rules.js` | Går rätt saker att lägga i varukorgen? |
| `node tests/painting-model.js` | Är verkens data välformad? |
| `node tests/e2e.js` | Fungerar sidorna i en riktig webbläsare? (~30 s) |

`npm test` kör dem i tur och ordning. Se `TESTING.md` för vad var och en täcker.

Sajten ligger på Cloudflare Pages och byggs om vid push — det som inte är
committat finns inte live.

## Fraktavgifter

Tröskeln för fri frakt och fraktpriserna står på två ställen som **måste** vara
lika: `js/cart-math.js` (det varukorgen visar) och
`functions/api/create-checkout.js` (det Stripe debiterar). `tests/validate.js`
faller om de glider isär. Texten kunden läser står dessutom i
`js/translations.js` och `components/shipping-modal.html` och uppdateras för
hand.
