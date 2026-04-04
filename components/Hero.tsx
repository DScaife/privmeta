import Typography from "./Typography";

const Hero = () => {
  return (
    <section className="w-full">
      <Typography variant="hero" as={"h2"}>
        This app removes hidden metadata directly in your browser, so your files stay on your device and you can practice good digital
        hygiene.
      </Typography>
    </section>
  );
};

export default Hero;
