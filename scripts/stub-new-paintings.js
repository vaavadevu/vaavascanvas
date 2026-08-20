#!/usr/bin/env node

/**
 * stub-new-paintings.js
 *
 * Håller data/paintings.json och js/translations.js i takt med bildmapparna.
 *
 *   1. Varje bildmapp utan post i data/paintings.json får en placeholder.
 *   2. Varje descKey som datafilen pekar på, men som saknar översättning, får
 *      en placeholder i js/translations.js.
 *   3. Varje post vars bildmapp är borta tas bort ur data/paintings.json.
 *
 * Punkt 3 raderar data. Beskrivningen i js/translations.js lämnas kvar — den
 * är skriven för hand, och läggs mappen tillbaka används den igen som den är.
 * Vad som togs bort skrivs ut i sin helhet, så en mapp som råkat försvinna
 * syns direkt och posten går att hämta tillbaka med
 * `git checkout data/paintings.json`.
 *
 * Bägge placeholders är med flit OGILTIGA: priset är 0 och beskrivningen står
 * som "TODO:". Då faller `npm test` tills de är ifyllda, istället för att en
 * målning med dummyvärden råkar gå live. En beskrivning som nådde butiken med
 * texten "TODO: skriv beskrivningen" vore värre än ingen alls.
 *
 * Raden "_todo" i paintings.json är checklistan, och plockas bort av dig när
 * allt stämmer.
 *
 * Användning:
 *   node scripts/stub-new-paintings.js            lägger till det som saknas
 *   node scripts/stub-new-paintings.js --check    rapporterar bara
 *   node scripts/stub-new-paintings.js --root X   kör mot en annan projektmapp
 *
 * Avslutningskoder:
 *   0 = ingenting saknades
 *   1 = något gick fel
 *   2 = placeholders lades till (eller saknas, med --check)
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
// Samma koll, men formulerad som "det har skulle handa" och utan felkod, sa
// menyn i sync_paintings_images.bat kan visa den innan man valjer nagot
const planOnly = args.includes('--plan');
const rootIndex = args.indexOf('--root');
const root = rootIndex === -1 ? path.join(__dirname, '..') : args[rootIndex + 1];

const dataPath = path.join(root, 'data', 'paintings.json');
const imagesDir = path.join(root, 'images', 'paintings');
const translationsPath = path.join(root, 'js', 'translations.js');

const IMAGE_PATTERN = /\.(jpe?g|png|webp)$/i;

// Mappnamnet blir målningens id, som i sin tur blir en URL och en nyckel i
// genererad JavaScript. Mellanslag och å/ä/ö går inte att använda där.
const VALID_ID = /^[A-Za-z][A-Za-z0-9_-]*$/;

const TODO_PREFIX = 'TODO:';
const TODO_SV = `${TODO_PREFIX} skriv beskrivningen på svenska`;
const TODO_EN = `${TODO_PREFIX} write the description in English`;

// ── Bildmappar ───────────────────────────────────────────────────────────────

function imageFolderIds() {
  if (!fs.existsSync(imagesDir)) return [];
  return fs.readdirSync(imagesDir)
    .filter(name => fs.statSync(path.join(imagesDir, name)).isDirectory())
    .filter(name => {
      // Bara mappar som faktiskt bär bilder — halvfärdiga mappar ska inte
      // smyga in en post i datafilen
      const originals = path.join(imagesDir, name, 'original');
      const built = path.join(imagesDir, name, 'desktop', '01.jpg');
      const hasOriginals = fs.existsSync(originals) &&
        fs.readdirSync(originals).some(f => IMAGE_PATTERN.test(f));
      return hasOriginals || fs.existsSync(built);
    })
    .sort();
}

// ── data/paintings.json ──────────────────────────────────────────────────────

// Placeholdern följer samma fältordning som de riktiga posterna
function stubFor(id) {
  return {
    id,
    title: 'FYLL I: titel',
    descKey: `desc_${id}`,
    width: 0,
    height: 0,
    shape: 'rectangular',
    originalPrice: 0,
    status: 'for_sale',
    medium: 'medium_acrylic_canvas',
    _todo:
      `Fyll i: title, width och height i cm, originalPrice i kronor. ` +
      `Skriv beskrivningen desc_${id} i js/translations.js, den star som TODO. ` +
      `Ar det inte en malning: satt "type" till "clay" eller "bookmark". ` +
      `Ar den rund: byt "shape" till "circle" och ersatt width/height med ` +
      `"diameter". Ta bort den har raden nar allt stammer.`,
  };
}

function stubText(stub) {
  // Textinfogning istället för att skriva om hela filen: då rörs inte en enda
  // rad av det som redan står där
  return JSON.stringify(stub, null, 2)
    .split('\n')
    .map(line => '  ' + line)
    .join('\r\n');
}

function appendStubs(raw, stubs) {
  const close = raw.lastIndexOf(']');
  if (close === -1) throw new Error('data/paintings.json saknar avslutande ]');

  const head = raw.slice(0, close).replace(/\s+$/, '');
  const tail = raw.slice(close);
  const separator = head.endsWith('[') ? '\r\n' : ',\r\n';

  return head + separator + stubs.map(stubText).join(',\r\n') + '\r\n' + tail;
}

// ── Ta bort poster ───────────────────────────────────────────────────────────

// Varje objekt direkt i listan, som {start, end} i råtexten. Skannern hoppar
// över stränginnehåll, så en klammer inne i en beskrivning eller en _todo-rad
// inte räknas som slutet på en post.
function topLevelObjects(raw) {
  const ranges = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) ranges.push({ start, end: i + 1 });
    }
  }

  return ranges;
}

// Textborttagning av samma skäl som appendStubs gör textinfogning: posterna som
// blir kvar ska stå kvar rad för rad som de gjorde.
function removeEntry(raw, id) {
  const marker = new RegExp(`"id"\\s*:\\s*"${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
  const hit = marker.exec(raw);
  if (!hit) throw new Error(`Hittar inte posten "${id}" i data/paintings.json`);

  const range = topLevelObjects(raw).find(r => hit.index >= r.start && hit.index < r.end);
  if (!range) throw new Error(`Kan inte avgöra var posten "${id}" börjar och slutar`);

  // Hela rader bort: från radens början till och med radbrytningen efter posten
  const from = raw.lastIndexOf('\n', range.start) + 1;
  let to = range.end;
  const comma = /^[ \t]*,/.exec(raw.slice(to));
  if (comma) to += comma[0].length;
  const eol = /^[ \t]*\r?\n/.exec(raw.slice(to));
  if (eol) to += eol[0].length;

  // Stod posten sist blir kommatecknet före den hängande. Bara kommatecknet
  // ska bort — radbrytningen efter ] hör till filen, inte till posten.
  return (raw.slice(0, from) + raw.slice(to)).replace(/,(\s*\]\s*)$/, '$1');
}

// Bevisa efteråt istället för att lita på regexen: filen ska fortfarande vara
// JSON, och exakt de utpekade posterna ska vara borta.
function removeEntries(raw, ids, before) {
  const out = ids.reduce(removeEntry, raw);

  let after;
  try {
    after = JSON.parse(out);
  } catch (err) {
    throw new Error(`Borttagningen gjorde data/paintings.json trasig: ${err.message}`);
  }

  const left = new Set(after.map(entry => entry.id));
  const stillThere = ids.filter(id => left.has(id));
  const alsoGone = before.filter(id => !left.has(id) && !ids.includes(id));

  if (stillThere.length > 0) throw new Error(`Posten blev kvar: ${stillThere.join(', ')}`);
  if (alsoGone.length > 0) throw new Error(`Fel poster togs bort: ${alsoGone.join(', ')}`);

  return out;
}

// ── js/translations.js ───────────────────────────────────────────────────────

function translationEntry(key) {
  return [
    `  ${key}: {`,
    `    sv: "${TODO_SV}",`,
    `    en: "${TODO_EN}",`,
    '  },',
  ].join('\r\n');
}

function existingDescKeys(source) {
  return new Set([...source.matchAll(/^[ \t]*(desc_[A-Za-z0-9_-]+)\s*:/gm)].map(m => m[1]));
}

function keysStillTodo(source) {
  return [...source.matchAll(/^[ \t]*(desc_[A-Za-z0-9_-]+)\s*:\s*\{[^}]*TODO:/gm)].map(m => m[1]);
}

// Sätts in efter den sista desc_-posten, så beskrivningarna håller ihop och
// resten av filen inte rörs
function insertTranslations(source, keys) {
  const entries = [...source.matchAll(/^[ \t]*desc_[A-Za-z0-9_-]+\s*:\s*\{/gm)];
  if (entries.length === 0) {
    throw new Error('Hittar inga desc_-nycklar i js/translations.js');
  }

  const lastEntry = entries[entries.length - 1];
  const closing = /^[ \t]*\},[ \t]*$/m.exec(source.slice(lastEntry.index));
  if (!closing) {
    throw new Error('Hittar inte slutet på den sista desc_-posten i js/translations.js');
  }

  const insertAt = lastEntry.index + closing.index + closing[0].length;
  return source.slice(0, insertAt) + '\r\n' +
    keys.map(translationEntry).join('\r\n') +
    source.slice(insertAt);
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Hittar inte ${dataPath}`);
    return 1;
  }

  const raw = fs.readFileSync(dataPath, 'utf8');
  let entries;
  try {
    entries = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ data/paintings.json går inte att läsa som JSON: ${err.message}`);
    return 1;
  }

  const known = new Set(entries.map(entry => entry.id));
  const folders = imageFolderIds();
  const candidates = folders.filter(id => !known.has(id));

  const badNames = candidates.filter(id => !VALID_ID.test(id));
  const missing = candidates.filter(id => VALID_ID.test(id));

  if (badNames.length > 0) {
    console.log('⚠️  De här mappnamnen duger inte som id (bara a-z, 0-9, - och _):');
    badNames.forEach(id => console.log(`      ${id}`));
    console.log('   Döp om mappen först — namnet blir en del av adressen till bilderna.\n');
  }

  // Motsatta hållet: en post vars mapp är borta. Bara målningar följer
  // mappkonventionen — bokmärken och lera hämtar sina bilder någon annanstans
  // ifrån (data/bookmarks.json respektive en egen "images"-lista), så de har
  // ingen mapp här och ska inte efterlysas.
  const followsFolderConvention = entry =>
    !entry.images && (!entry.type || entry.type === 'painting');

  const strays = entries
    .filter(entry => followsFolderConvention(entry) && !folders.includes(entry.id))
    .map(entry => entry.id);

  // Borttagning är det enda som raderar något här, så en post som ska bort
  // skrivs ut med det som stod i den. Är det en såld målning eller ett pris
  // man känner igen, märks det innan filen sparas — inte långt efteråt.
  const byId = new Map(entries.map(entry => [entry.id, entry]));

  const describe = entry => {
    if (!entry) return '(okänd post)';
    const price = entry.originalPrice || entry.framedPrice;
    const facts = [
      entry.title,
      price ? `${price} kr` : null,
      entry.status === 'sold' ? 'SÅLD' : null,
    ].filter(Boolean);
    return facts.length > 0 ? `${entry.id}   (${facts.join(', ')})` : entry.id;
  };


  // Varje descKey datafilen pekar på ska finnas som översättning, oavsett om
  // posten är ny eller har legat där ett tag. Poster utan bildmapp hoppas över
  // — de är på väg bort, och en beskrivning till dem vore bara arbete i onödan.
  const stubs = missing.map(stubFor);
  const strayIds = new Set(strays);
  const wantedKeys = [...entries, ...stubs]
    .filter(entry => !strayIds.has(entry.id))
    .map(entry => entry.descKey)
    .filter(key => typeof key === 'string' && /^desc_[A-Za-z0-9_-]+$/.test(key));

  const hasTranslations = fs.existsSync(translationsPath);
  const source = hasTranslations ? fs.readFileSync(translationsPath, 'utf8') : '';
  const already = hasTranslations ? existingDescKeys(source) : new Set();
  const untranslated = [...new Set(wantedKeys)].filter(key => !already.has(key));

  if (!hasTranslations) {
    console.log('⚠️  Hittar inte js/translations.js — beskrivningarna får läggas in för hand.\n');
  }

  // ── Bara rapportera ────────────────────────────────────────────────────────
  if (checkOnly || planOnly) {
    const todo = hasTranslations ? keysStillTodo(source) : [];
    let found = false;

    const rubrik = planOnly
      ? {
          poster: '   LÄGGS TILL       post i data/paintings.json:',
          texter: '   LÄGGS TILL       beskrivning i js/translations.js:',
          todo:   '   VÄNTAR PÅ TEXT   står som TODO i js/translations.js:',
          bort:   '   TAS BORT         posten har ingen bildmapp längre:',
        }
      : {
          poster: '⚠️  De här bildmapparna saknar post i data/paintings.json:',
          texter: '⚠️  De här beskrivningarna saknas i js/translations.js:',
          todo:   '⚠️  De här beskrivningarna står fortfarande som TODO:',
          bort:   '⚠️  De här posterna har ingen bildmapp längre och tas bort:',
        };

    if (strays.length > 0) {
      found = true;
      console.log(rubrik.bort);
      strays.forEach(id => console.log(`      ${describe(byId.get(id))}`));
      console.log('');
    }

    if (missing.length > 0) {
      found = true;
      console.log(rubrik.poster);
      missing.forEach(id => console.log(`      ${id}`));
      console.log('');
    }
    if (untranslated.length > 0) {
      found = true;
      console.log(rubrik.texter);
      untranslated.forEach(key => console.log(`      ${key}`));
      console.log('');
    }
    if (todo.length > 0) {
      found = true;
      console.log(rubrik.todo);
      todo.forEach(key => console.log(`      ${key}`));
      console.log('');
    }

    if (planOnly) {
      if (!found) console.log('   Datafilerna är i takt med bilderna.\n');
      return 0;
    }

    if (!found) {
      console.log('✅ Alla bildmappar har en post och en beskrivning.');
      return 0;
    }
    if (missing.length > 0 || untranslated.length > 0 || strays.length > 0) {
      console.log('   Kör sync_paintings_images.bat och välj [1] så synkas datafilerna.');
    } else {
      // Bara TODO-texter kvar, och dem kan inget script skriva åt dig
      console.log('   Skriv de riktiga texterna i js/translations.js.');
    }
    return 2;
  }

  // ── Skriv ──────────────────────────────────────────────────────────────────
  if (missing.length === 0 && untranslated.length === 0 && strays.length === 0) {
    console.log('✅ Alla bildmappar har en post och en beskrivning.');
    return 0;
  }

  // Borttagningen först, så att en post och en ny placeholder med samma id
  // aldrig kan finnas samtidigt
  let data = raw;
  if (strays.length > 0) {
    data = removeEntries(data, strays, entries.map(entry => entry.id));
  }
  if (stubs.length > 0) {
    data = appendStubs(data, stubs);
  }
  if (data !== raw) {
    fs.writeFileSync(dataPath, data);
  }
  if (untranslated.length > 0 && hasTranslations) {
    fs.writeFileSync(translationsPath, insertTranslations(source, untranslated));
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(strays.length > 0 && stubs.length === 0 && untranslated.length === 0
    ? '🗑️  Poster borttagna'
    : '📝 Datafilerna synkade mot bildmapparna');
  console.log('='.repeat(60));

  if (strays.length > 0) {
    const antal = strays.length === 1 ? '1 post' : `${strays.length} poster`;
    console.log(`   ${antal} togs bort ur data/paintings.json — bildmappen var borta:`);
    strays.forEach(id => console.log(`      ${describe(byId.get(id))}`));
    console.log('');
    console.log('   Beskrivningarna står kvar i js/translations.js. Försvann en');
    console.log('   mapp av misstag: `git checkout data/paintings.json`.');
    console.log('');
  }

  if (stubs.length > 0) {
    const antal = stubs.length === 1 ? '1 ny post' : `${stubs.length} nya poster`;
    console.log(`   ${antal} i data/paintings.json:`);
    missing.forEach(id => console.log(`      ${id}`));
    console.log('');
  }
  if (untranslated.length > 0 && hasTranslations) {
    const antal = untranslated.length === 1
      ? '1 ny beskrivning'
      : `${untranslated.length} nya beskrivningar`;
    console.log(`   ${antal} i js/translations.js, markerade "${TODO_PREFIX}":`);
    untranslated.forEach(key => console.log(`      ${key}`));
    console.log('');
  }

  console.log('   Placeholders är avsiktligt ogiltiga — npm test säger ifrån');
  console.log('   tills de är ifyllda, så att inget hamnar i butiken med');
  console.log('   dummyvärden. Posterna i paintings.json har en "_todo"-rad');
  console.log('   som säger vad som ska fyllas i.');
  console.log('');

  return 2;
}

process.exit(main());
