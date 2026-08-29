import { useEffect, useState } from "react";
import sliderData from "../../data/sliderData";

function Slider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const slide = sliderData[currentSlide];

  return (
    <section className="h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-r from-white to-[#f4fbff]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-12">
        <div className="w-1/2">
          <h1 className="text-5xl font-extrabold leading-tight text-slate-900 whitespace-pre-line">
            {slide.title}
          </h1>

          <p className="mt-8 max-w-[500px] text-xl leading-9 text-slate-700">
            {slide.description}
          </p>

          <div className="mt-10 inline-block rounded-2xl bg-white px-8 py-4 text-xl shadow-lg">
            {slide.price}
          </div>

          <div className="mt-10">
            <button className="rounded-full bg-[#008dd2] px-10 py-4 text-lg font-semibold text-white">
              {slide.button}
            </button>
          </div>

          <div className="mt-12 flex gap-3">
            {sliderData.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "w-12 bg-[#008dd2]"
                    : "w-6 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex h-full w-1/2 items-end justify-center">
          <img
            src={slide.image}
            alt=""
            className="max-h-[520px] object-contain"
          />
        </div>
      </div>
    </section>
  );
}

export default Slider;