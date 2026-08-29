import image from "../../assets/images/abc.webp";

function CTA() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-[32px] bg-gradient-to-r from-[#eef8ff] via-[#f5f9ff] to-[#e8f5ff] px-10 py-10 shadow-lg">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            {/* Left Side */}

            <div>
              <h2 className="text-[42px] font-extrabold leading-tight text-[#0b2c74]">
                Ready to{" "}
                <span className="text-[#008dd2]">
                  Deliver Excellence?
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-[17px] leading-8 text-slate-600">
                Scale faster like thousands of new-age sellers with shipping
                that reduces RTOs, accelerates delivery, and gives you full
                control.
              </p>

              <button className="mt-8 rounded-full bg-[#008dd2] px-8 py-3 text-base font-semibold text-white transition-all duration-300 hover:bg-[#0b2c74]">
                Sign Up
              </button>
            </div>

            {/* Right Side */}

            <div className="flex justify-center lg:justify-end">
              <img
                src={image}
                alt="Delivery"
                className="h-[300px] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;