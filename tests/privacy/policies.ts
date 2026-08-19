export const supportedExtensions = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "pdf",
  "docx",
  "mp4",
  "mov",
  "webm",
  "mkv",
  "mp3",
  "aac",
  "flac",
  "wav",
  "m4a",
] as const;

export type SupportedExtension = (typeof supportedExtensions)[number];

export type FixtureOverrides = {
  requiredBefore?: string[];
  forbiddenAfter?: string[];
  preserveTags?: string[];
  sentinels?: string[];
  notes?: string;
};

export type FormatPolicy = {
  forbiddenAfter: string[];
  preserveTags: string[];
  browserProbe: "image" | "video" | "audio" | "none";
};

const commonForbidden = [
  "*GPS*",
  "*Location*",
  "*:Author",
  "*:Artist",
  "*:Creator",
  "*:Producer",
  "*:Title",
  "*:Subject",
  "*:Keywords",
  "*:Comment",
  "*:Copyright",
  "*:Software",
  "*:Make",
  "*:Model",
  "*LensModel*",
  "*SerialNumber*",
  "*OwnerName*",
  "*SegmentIdentifier*",
  "*ProductName*",
  "*ProductVersion*",
  "*ProductBuildVersion*",
  "*DetectedFace*",
  "*LivePhotoInfo*",
  "*SceneIlluminance*",
  "*CinematicAudio*",
  "*WritingApp*",
  "*MuxingApp*",
  "*TrackName*",
  "*:Encoder",
  "XMP:*",
];

const imagePreserve = ["FileType", "ImageWidth", "ImageHeight"];
const videoPreserve = ["FileType", "Duration", "ImageSize", "VideoFrameRate", "CompressorID", "Rotation"];
const audioPreserve = ["FileType", "Duration", "AudioSampleRate", "AudioChannels"];

const imagePolicy: FormatPolicy = {
  forbiddenAfter: [...commonForbidden, "EXIF:*", "IPTC:*", "Photoshop:*", "*:UserComment"],
  preserveTags: imagePreserve,
  browserProbe: "image",
};

const policies: Record<SupportedExtension, FormatPolicy> = {
  jpg: imagePolicy,
  jpeg: imagePolicy,
  png: imagePolicy,
  webp: imagePolicy,
  gif: {
    forbiddenAfter: [...commonForbidden, "GIF:Comment", "*:CommentExtension"],
    preserveTags: [...imagePreserve, "FrameCount", "AnimationIterations"],
    browserProbe: "image",
  },
  pdf: {
    forbiddenAfter: [...commonForbidden, "PDF:ID", "PDF:Subject", "PDF:Creator", "PDF:Producer", "PDF:Keywords"],
    preserveTags: ["FileType", "PageCount"],
    browserProbe: "none",
  },
  docx: {
    forbiddenAfter: [
      ...commonForbidden,
      "*:LastModifiedBy",
      "*:Revision",
      "*:Template",
      "*:Manager",
      "*:Company",
    ],
    preserveTags: ["FileType"],
    browserProbe: "none",
  },
  mp4: { forbiddenAfter: commonForbidden, preserveTags: videoPreserve, browserProbe: "video" },
  mov: { forbiddenAfter: commonForbidden, preserveTags: videoPreserve, browserProbe: "video" },
  webm: { forbiddenAfter: commonForbidden, preserveTags: videoPreserve, browserProbe: "video" },
  mkv: { forbiddenAfter: commonForbidden, preserveTags: videoPreserve, browserProbe: "video" },
  mp3: {
    forbiddenAfter: [...commonForbidden, "ID3:*", "ID3v1:*", "ID3v2:*", "APE:*"],
    preserveTags: audioPreserve,
    browserProbe: "audio",
  },
  aac: {
    forbiddenAfter: [...commonForbidden, "ID3:*", "ID3v2:*", "APE:*"],
    preserveTags: audioPreserve,
    browserProbe: "audio",
  },
  flac: {
    forbiddenAfter: [...commonForbidden, "Vorbis:*", "*:Picture*"],
    preserveTags: audioPreserve,
    browserProbe: "audio",
  },
  wav: {
    forbiddenAfter: [...commonForbidden, "RIFF:Comment", "RIFF:Artist", "RIFF:Product", "ID3:*", "ID3v2:*"],
    preserveTags: audioPreserve,
    browserProbe: "audio",
  },
  m4a: { forbiddenAfter: commonForbidden, preserveTags: audioPreserve, browserProbe: "audio" },
};

export function getPolicy(extension: SupportedExtension): FormatPolicy {
  return policies[extension];
}

export function isSupportedExtension(value: string): value is SupportedExtension {
  return supportedExtensions.includes(value as SupportedExtension);
}
