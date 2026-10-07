import { describe, expect, it } from "vitest";
import { humanizeFieldKey } from "~/components/JsonLdEditor/composables/useJsonLdNodeMeta";

describe("humanizeFieldKey", () => {
  it.each([
    // Acronym followed by a word splits before the word
    ["schema:hasURLValue", "Has URL Value"],
    ["schema:totalIPAQScore", "Total IPAQ Score"],
    ["ex:IPAQId", "IPAQ Id"],
    ["ex:URLValue", "URL Value"],
    // Acronyms on their own, or plural, stay whole
    ["ex:SAID", "SAID"],
    ["ex:hasSAID", "Has SAID"],
    ["ex:URLs", "URLs"],
    ["ex:allSAIDs", "All SAIDs"],
    ["ex:URLsList", "URLs List"],
    // Existing behaviour
    ["dcterms:title", "Title"],
    ["dcat:landingPage", "Landing Page"],
    ["ex:eGFR", "eGFR"],
    ["http://oca.example.org/123/glycated_haemoglobin", "Glycated haemoglobin"],
  ])("%s → %s", (key, expected) => {
    expect(humanizeFieldKey(key)).toBe(expected);
  });
});
