import Typography from "./Typography";

const Hero = () => {
  return (
    <section className="w-full flex flex-col gap-(--space-md)">
      <Typography variant="hero" as={"h2"}>
        This app removes hidden metadata directly in your browser, so your files stay on your device and you can practice good digital
        hygiene.
      </Typography>
      <Typography variant="legal" muted className="hidden sm:inline">
        JPG · PNG · WEBP · GIF · PDF · DOCX · MP4 · MOV · MKV · AVI · WEBM · MP3 · WAV · FLAC · AAC · OGG · M4A
      </Typography>
    </section>
  );
};

export default Hero;
