import banner1 from "../../assets/images/banner-1.webp";
import banner2 from "../../assets/images/Img-2-2.webp";

function Banner() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-20 text-center">
          <h2 className="text-4xl font-extrabold leading-tight text-[#0b2c74]">
            Fast & Friction-Free
            <br />
            <span className="text-[#008dd2]">
              eCommerce Deliveries
            </span>
          </h2>

          <p className="mt-3 text-lg text-slate-600">
            Timely pickups. Fairer weights. Faster deliveries.
          </p>
        </div>

        <div className="grid items-center gap-16 md:grid-cols-2">
          <div className="flex justify-center">
            <img
              src={banner1}
              alt=""
              className="w-[85%] rounded-3xl transition-all duration-300 hover:scale-105"
            />
          </div>

          <div>
            <h3 className="mb-4 text-4xl font-bold text-[#0b2c74]">
              Performance You Can Trust
            </h3>

            <p className="max-w-md text-lg leading-8 text-slate-600">
             98%+ successful pickups, 95%+ successful deliveries, and weight freezing to reduce disputes
            </p>
          </div>
        </div>

        <div className="mt-24 grid items-center gap-16 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-4xl font-bold text-[#0b2c74]">
              Quicker Deliveries & COD Payouts
            </h3>

            <p className="max-w-md text-lg leading-8 text-slate-600">
              Keep your orders growing with same-day delivery and keep your cash
              flowing with early COD payouts.
            </p>
          </div>

          <div className="flex justify-center">
            <img
              src={banner2}
              alt=""
              className="w-[85%] rounded-3xl transition-all duration-300 hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Banner;