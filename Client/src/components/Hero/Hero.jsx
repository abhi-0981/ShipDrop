function Hero() {
  return (
    <section className="bg-[#f8fbfd]">
      <div className="mx-auto flex min-h-[650px] max-w-7xl items-center justify-between px-6">
        <div className="w-1/2">
          <h1 className="mb-6 text-6xl font-extrabold leading-tight">
            Heading
          </h1>

          <p className="mb-8 text-xl">
            Description
          </p>

          <button className="rounded-full bg-[#008dd2] px-8 py-4 text-white">
            Get Started
          </button>
        </div>

        <div className="w-1/2">
          Image
        </div>
      </div>
    </section>
  );
}

export default Hero;