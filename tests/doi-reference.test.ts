import assert from "node:assert/strict";
import { test } from "node:test";

import { canonicalDoiUrl, EMPTY_REFERENCE_DRAFT, fillReferenceBlanks, normalizeDoi, sameReferenceDoi } from "../modules/research-workflow/doi-reference";
import { createDoiLookup, mapDoiMetadata, metadataText, readBoundedJson } from "../modules/research-workflow/doi-lookup";
import { discoveryReferenceSchema } from "../modules/research-workflow/schema";

const doi = "10.1234/example.1";
const crossref = { message: { DOI: doi, title: ["A <i>real</i> title &amp; data"], author: [{ given: "Ana", family: "Silva" }, { name: "Research Group" }], "container-title": ["Journal"], volume: "12", issue: "2", page: "10-25", published: { "date-parts": [[2024, 1]] }, abstract: "<jats:p>First paragraph.</jats:p><jats:p>Second.</jats:p>" } };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

test("normalizes DOI, prefix and resolver URL without corrupting suffix identity", () => {
  for (const value of ["10.1234/EXAMPLE.1", " doi: 10.1234/example.1 ", "https://doi.org/10.1234%2FEXAMPLE.1", "http://dx.doi.org/10.1234/example.1"]) assert.equal(normalizeDoi(value), doi);
  for (const value of ["http://127.0.0.1/10.1234/a", "https://doi.org.evil.test/10.1234/a", "https://user:pass@doi.org/10.1234/a", "https://doi.org:8080/10.1234/a", "10.1234/white space", "10.1234/<script>", "10.1234/a\u0000", "anything"]) assert.equal(normalizeDoi(value), null);
  assert.equal(normalizeDoi("10.1234/(a);b.c"), "10.1234/(a);b.c");
  assert.ok(sameReferenceDoi(doi, `https://doi.org/${doi.toUpperCase()}`));
  assert.equal(sameReferenceDoi("10.1234/ab-c", "10.1234/a-bc"), false);
  assert.equal(canonicalDoiUrl("10.1234/a?b#c"), "https://doi.org/10.1234/a%3Fb%23c");
});

test("maps Crossref metadata to editable fields and strips markup", () => {
  const result = mapDoiMetadata("Crossref", crossref, doi, new Date("2026-10-01T12:00:00Z"));
  assert.deepEqual(result.metadata, { doi, title: "A real title & data", authors: "Ana Silva; Research Group", journal: "Journal", volumeIssuePages: "v. 12, n. 2, 2024, p. 10-25", abstract: "First paragraph. Second." });
  assert.equal(result.provenance.retrievedAt, "2026-10-01T12:00:00.000Z");
  assert.equal(metadataText("<script>bad()</script><p>&#65; &amp; &#x3b2;</p>"), "A & β");
});

test("partial Crossref record keeps unknown metadata blank", () => {
  const result = mapDoiMetadata("Crossref", { message: { DOI: doi, title: ["Title only"] } }, doi);
  assert.equal(result.metadata.abstract, "");
  assert.equal(result.metadata.journal, "");
  assert.equal(result.metadata.authors, "");
  assert.equal(result.metadata.volumeIssuePages, "");
});

test("DataCite supports personal and organizational creators without inventing a journal", () => {
  const result = mapDoiMetadata("DataCite", { data: { attributes: { doi, titles: [{ title: "Dataset" }], creators: [{ name: "Group" }, { givenName: "Ana", familyName: "Silva" }], publicationYear: 2025, publisher: "Repository", descriptions: [{ descriptionType: "Other", description: "Not an abstract" }, { descriptionType: "Abstract", description: "Dataset description" }] } } }, doi);
  assert.equal(result.metadata.title, "Dataset");
  assert.equal(result.metadata.journal, "");
  assert.equal(result.metadata.authors, "Group; Ana Silva");
  assert.equal(result.metadata.abstract, "Dataset description");
  assert.equal(result.metadata.volumeIssuePages, "2025");
});

test("rejects a provider response for a different DOI", () => {
  assert.throws(() => mapDoiMetadata("Crossref", crossref, "10.1234/different"), /doi_unavailable/);
});

test("reports bounded metadata and preserves more than eight authors", () => {
  const record = { message: { DOI: doi, title: ["x".repeat(510)], abstract: "a".repeat(6000), author: Array.from({ length: 10 }, (_, i) => ({ name: `Author ${i}` })) } };
  const result = mapDoiMetadata("Crossref", record, doi);
  assert.equal(result.metadata.title.length, 500);
  assert.equal(result.metadata.abstract.length, 5000);
  assert.equal(result.metadata.authors.split(";").length, 10);
  assert.equal(result.warnings.length, 2);
  const saved = discoveryReferenceSchema.parse({ abstract: null, authors: result.metadata.authors.split("; "), doi, journal: null, metadataLookup: result.provenance, referenceId: "manual-test", source: "manual", title: "Test", url: canonicalDoiUrl(doi), year: null });
  assert.equal(saved.authors.length, 10);
  assert.deepEqual(saved.metadataLookup, result.provenance);
});

test("autofill preserves existing and concurrently edited fields", () => {
  const current = { ...EMPTY_REFERENCE_DRAFT, title: "My title", abstract: "Typed while loading", doi: `https://doi.org/${doi}` };
  const result = fillReferenceBlanks(current, mapDoiMetadata("Crossref", crossref, doi).metadata);
  assert.equal(result.title, current.title);
  assert.equal(result.abstract, current.abstract);
  assert.equal(result.doi, current.doi);
  assert.equal(result.journal, "Journal");
});

test("uses fixed provider hosts, no redirects, and falls back to DataCite", async () => {
  const calls: string[] = [];
  const lookup = createDoiLookup(async (url, init) => {
    calls.push(String(url));
    assert.equal(init?.redirect, "error");
    assert.equal(init?.cache, "no-store");
    assert.ok(init?.signal);
    return calls.length === 1 ? response({}, 404) : response({ data: { attributes: { doi, titles: [{ title: "Found" }] } } });
  });
  const result = await lookup(doi);
  assert.equal(result.provenance.provider, "DataCite");
  assert.deepEqual(calls, [`https://api.crossref.org/works/${encodeURIComponent(doi)}`, `https://api.datacite.org/dois/${encodeURIComponent(doi)}`]);
});

test("distinguishes not found from provider outage and allows retry", async () => {
  await assert.rejects(createDoiLookup(async () => response({}, 404))(doi), /doi_not_found/);
  let failing = true;
  const lookup = createDoiLookup(async () => failing ? response({}, 429) : response(crossref));
  await assert.rejects(lookup(doi), /doi_unavailable/);
  failing = false;
  assert.equal((await lookup(doi)).metadata.title, "A real title & data");
});

test("caches public metadata, coalesces requests, expires and returns independent copies", async () => {
  let calls = 0;
  let time = 0;
  const lookup = createDoiLookup(async () => { calls++; return response(crossref); }, () => time);
  const [one, two] = await Promise.all([lookup(doi), lookup(`https://doi.org/${doi}`)]);
  assert.equal(calls, 1);
  one.metadata.title = "Edited";
  assert.notEqual(two.metadata.title, "Edited");
  assert.notEqual((await lookup(doi)).metadata.title, "Edited");
  time = 3600001;
  await lookup(doi);
  assert.equal(calls, 2);
});

test("invalid input never causes a network request", async () => {
  const lookup = createDoiLookup(async () => { assert.fail("Must not fetch"); });
  await assert.rejects(lookup("http://localhost/secret"), /invalid_doi/);
});

test("oversized and malformed upstream responses fail safely", async () => {
  await assert.rejects(createDoiLookup(async () => new Response("x".repeat(1048577)))(doi), /doi_unavailable/);
  await assert.rejects(createDoiLookup(async () => new Response("not JSON"))(doi), /doi_unavailable/);
});

test("bounds request bodies by bytes, including streams without content-length", async () => {
  assert.deepEqual(await readBoundedJson(new Request("https://example.test", { method: "POST", body: JSON.stringify({ doi }) }), 1024), { doi });
  await assert.rejects(readBoundedJson(new Response("á".repeat(600)), 1024), /doi_unavailable/);
  await assert.rejects(readBoundedJson(new Response("{}", { headers: { "content-length": "2048" } }), 1024), /doi_unavailable/);
});
