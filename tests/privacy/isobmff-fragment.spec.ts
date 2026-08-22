import { expect, test } from "@playwright/test";
import { stripIsobmffBoxes } from "../../utils/stripIsobmffMetadata";

function uint32(value: number): Uint8Array {
  const result = new Uint8Array(4);
  new DataView(result.buffer).setUint32(0, value);
  return result;
}

function ascii(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function box(type: string, ...payloads: Uint8Array[]): Uint8Array {
  const payload = concat(...payloads);
  return concat(uint32(8 + payload.length), ascii(type), payload);
}

function fullBox(type: string, flags: number, ...payloads: Uint8Array[]): Uint8Array {
  return box(type, Uint8Array.of(0, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff), ...payloads);
}

test("removes a fragmented metadata track and its timed samples", () => {
  const trackId = 7;
  const sentinel = ascii("PRIVMETA_TEST_FRAGMENT_SAMPLE");
  const emptySampleTable = box(
    "stbl",
    fullBox("stsz", 0, uint32(0), uint32(0)),
    fullBox("stco", 0, uint32(0)),
  );
  const metadataTrack = box(
    "trak",
    fullBox("tkhd", 0, uint32(0), uint32(0), uint32(trackId), uint32(0)),
    box(
      "mdia",
      fullBox("mdhd", 0, uint32(0), uint32(0)),
      fullBox("hdlr", 0, uint32(0), ascii("meta")),
      box("minf", emptySampleTable),
    ),
  );
  const trex = fullBox("trex", 0, uint32(trackId), uint32(1), uint32(1), uint32(sentinel.length), uint32(0));
  const moov = box("moov", metadataTrack, box("mvex", trex));

  const tfhd = fullBox("tfhd", 0x020000, uint32(trackId));
  const trunWithPlaceholder = fullBox("trun", 0x000001, uint32(1), uint32(0));
  const moofWithPlaceholder = box("moof", box("traf", tfhd, trunWithPlaceholder));
  const dataOffset = moofWithPlaceholder.length + 8;
  const trun = fullBox("trun", 0x000001, uint32(1), uint32(dataOffset));
  const moof = box("moof", box("traf", tfhd, trun));
  const input = concat(box("ftyp", ascii("isom"), uint32(0), ascii("isom")), moov, moof, box("mdat", sentinel));

  const cleaned = stripIsobmffBoxes(input);
  expect(cleaned).not.toBeNull();
  if (!cleaned) throw new Error("Expected the fragmented fixture to be cleaned");
  expect(cleaned?.length).toBe(input.length);
  expect(new TextDecoder().decode(cleaned)).not.toContain("PRIVMETA_TEST_FRAGMENT_SAMPLE");

  const trackOffset = box("ftyp", ascii("isom"), uint32(0), ascii("isom")).length + 8;
  expect(new TextDecoder("latin1").decode(cleaned?.slice(trackOffset + 4, trackOffset + 8))).toBe("free");
  const moofOffset = input.length - box("mdat", sentinel).length - moof.length;
  const trafOffset = moofOffset + 8;
  expect(new TextDecoder("latin1").decode(cleaned?.slice(trafOffset + 4, trafOffset + 8))).toBe("free");
});

test("fails closed for an ambiguous multi-track implicit fragment base", () => {
  const trackId = 7;
  const sentinel = ascii("PRIVMETA_TEST_FRAGMENT_SAMPLE");
  const stbl = box("stbl", fullBox("stsz", 0, uint32(0), uint32(0)), fullBox("stco", 0, uint32(0)));
  const trak = box(
    "trak",
    fullBox("tkhd", 0, uint32(0), uint32(0), uint32(trackId), uint32(0)),
    box("mdia", fullBox("hdlr", 0, uint32(0), ascii("meta")), box("minf", stbl)),
  );
  const moov = box("moov", trak, box("mvex", fullBox("trex", 0, uint32(trackId), uint32(1), uint32(1), uint32(sentinel.length), uint32(0))));
  const metadataTraf = box("traf", fullBox("tfhd", 0, uint32(trackId)), fullBox("trun", 0, uint32(1)));
  const otherTraf = box("traf", fullBox("tfhd", 0x020000, uint32(1)), fullBox("trun", 0x000001, uint32(0), uint32(0)));
  const input = concat(box("ftyp", ascii("isom")), moov, box("moof", otherTraf, metadataTraf), box("mdat", sentinel));

  expect(stripIsobmffBoxes(input)).toBeNull();
});
