import first from "../../assets/images/first.png";
import second from "../../assets/images/second.png";
import third from "../../assets/images/third.png";
import fourth from "../../assets/images/fourth.png";

function RTO() {
  const cards = [
    {
      title: "Confirm COD Orders",
      description:
        "Filter out fake or impulsive orders through automated WhatsApp & IVR— before you dispatch",
      image: first,
    },
    {
      title: "Validate Buyer Addresses",
      description:
        "Catch address errors early — let buyers review and correct them before they cost you",
      image: second,
    },
    {
      title: "Notify in Real Time",
      description:
        "Enable automated delivery notifications — fewer surprises mean fewer returns",
      image: third,
    },
    {
      title: "Follow Up Post NDR",
      description:
        "Act fast on failed deliveries with auto follow-ups and reattempts to maximize success rate",
      image: fourth,
    },
  ];

  return (
    <section className="bg-gradient-to-r from-[#0a2d72] via-[#0b4f93] to-[#008dd2] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
  <h2 className="text-4xl font-bold leading-tight text-white">
    Kill RTOs
    <br />
    <span className="text-[#7dd3fc]">
      Before They Kill Your Profits
    </span>
  </h2>

  <p className="mt-3 text-base text-white/80">
    Built-in eCommerce shipping tools trained to prevent
    <br />
    RTO by up to 30%
  </p>
</div>

        <div className="grid gap-8 lg:grid-cols-4">
          {cards.map((card, index) => (
            <div
              key={index}
              className="flex min-h-[420px] flex-col justify-between rounded-[28px] border border-slate-100 bg-white  shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="px-7 py-5">
                <h3 className=" min-h-[45px] text-[20px] font-bold leading-tight text-[#0b2c74]">
                  {card.title}
                </h3>

                <p className="min-h-[110px] text-[16px] leading-7 text-slate-600">
                  {card.description}
                </p>
              </div>

              <img
                src={card.image}
                alt={card.title}
                className="mx-auto h-[240px] w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RTO;