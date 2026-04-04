import Typography from "./Typography";

const DisableInternet = () => {
  return (
    <section className="w-full">
      <Typography variant="body" weight={500}>
        You can safely disable your internet. All files are processed in-browser and never touch a server.
      </Typography>
    </section>
  );
};

export default DisableInternet;
