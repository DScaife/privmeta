import Typography from "./Typography";

const Hero = () => {
  return (
    <section>
      <Typography variant="hero" as={"h1"}>
        This app removes targeted privacy-sensitive metadata directly in your browser, without uploading your file, so you can practise
        better digital hygiene.
      </Typography>
    </section>
  );
};

export default Hero;
