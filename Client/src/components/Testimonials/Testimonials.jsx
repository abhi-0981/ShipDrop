import { useEffect, useState } from "react";
import testimonialsData from "./testimonialsData";

function Testimonials() {
  const [current, setCurrent] = useState(0);

  const visibleCards = 4;

  const cards = [
    ...testimonialsData,
    ...testimonialsData.slice(0, visibleCards),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) =>
        prev === testimonialsData.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="overflow-hidden bg-gradient-to-r from-[#0a2d72] via-[#0b4f93] to-[#008dd2] py-14">
      <div className="mx-auto max-w-[1320px] px-4">
        <h2 className="mb-10 text-center text-3xl font-bold text-white">
          We Win When You Do
        </h2>

        <div className="overflow-hidden">
          <div
            className="flex gap-5 transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${current * 315}px)`,
            }}
          >
            {cards.map((item, index) => (
              <div
                key={index}
                className="h-[360px] min-w-[295px] rounded-[24px] bg-white p-6"
              >
                <img
                  src={item.image}
                  alt=""
                  className="mb-5 h-10 rounded-lg bg-slate-100 px-5 py-2"
                />

                <p className="mb-10 text-[14px] leading-8 text-[#1e376d]">
                  {item.text}
                </p>

                <div>
                  <h3 className="text-[16px] font-bold text-[#0b1b4d]">
                    {item.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {item.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {testimonialsData.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                current === index
                  ? "w-8 bg-white"
                  : "w-4 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;