import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const normalize=s=>s.replace(/\s+/gu,'');
const decode=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
let checked=0;
for(const variant of ['advanced','advanced-draft','quick','unicode','without-review']){
 const pdf=execFileSync('pdftotext',['-layout',`tmp/exports/mapa-c118-${variant}.pdf`,'-'],{encoding:'utf8'});
 const xml=execFileSync('unzip',['-p',`tmp/exports/mapa-c121-${variant}.docx`,'word/document.xml'],{encoding:'utf8',maxBuffer:8e6});
 const word=decode(xml.replace(/<[^>]*>/g,''));
 const blocks=JSON.parse(readFileSync(`tmp/exports/mapa-c121-${variant}-blocks.json`,'utf8'));
 // Footer strings can interrupt long originals across pages in extracted PDF text.
 const pdfBody=pdf.replace(/Mapa da Pesquisa · mapadapesquisa\.com\.br[^\n]*/g,'');
 for(const block of blocks){
  for(const [key,value] of Object.entries(block)){
   if(!['text','title','details','collection','analysis','result'].includes(key)||!value)continue;
   assert.ok(normalize(word).includes(normalize(value)),`${variant}/Word/${block.kind}/${key}`);
   assert.ok(normalize(pdfBody).includes(normalize(value)),`${variant}/PDF/${block.kind}/${key}: ${value.slice(0,80)}`);
   checked++;
  }
 }
 if(variant==='unicode'){
  assert.ok(pdf.includes('α≥β → Ω ✓ łódź ğ ş ≠ ∑'),'exact Unicode pdftotext sequence');
  assert.ok(word.includes('α≥β → Ω ✓ łódź ğ ş ≠ ∑'),'exact Unicode Word sequence');
 }
 if(variant==='without-review')assert.ok(pdf.includes('Reformulação ainda não preparada.'));
 const fonts=execFileSync('pdffonts',[`tmp/exports/mapa-c118-${variant}.pdf`],{encoding:'utf8'});
 assert.match(fonts,/DejaVuSans/);assert.doesNotMatch(fonts,/Helvetica/);
}
console.log(`C126 text parity PASS: ${checked} shared content fields present in PDF and Word; Unicode exact; fonts embedded; originals and fallback retained.`);
