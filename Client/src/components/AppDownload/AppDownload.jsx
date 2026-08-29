import phone from "../../assets/images/app-download.png";
import googleStore from "../../assets/images/google-store.png";
import appStore from "../../assets/images/app-store.png";

import {
  FaShippingFast,
  FaMapMarkerAlt,
  FaChartLine,
} from "react-icons/fa";

function AppDownload() {
  const features = [
    {
      icon: <FaShippingFast />,
      title: "Instant Processing",
    },
    {
      icon: <FaMapMarkerAlt />,
      title: "Effortless Tracking",
    },
    {
      icon: <FaChartLine />,
      title: "Real-Time Insights",
    },
  ];

  return (
    <section className="bg-gradient-to-r from-[#eef8ff] via-white to-[#f4f9ff] py-16">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-10">
        {/* Left Side */}

        <div className="max-w-md">
          <h2 className="mb-5 text-4xl font-extrabold leading-tight text-[#0f2b6b]">
            Run it All,
            <br />
            <span className="text-[#008dd2]">Wherever You Are</span>
          </h2>

          <p className="mb-8 text-base leading-7 text-slate-600">
            eCommerce shipping on the move — process, ship and track orders
            instantly from the ShipDrop mobile app.
          </p>

          <div className="mb-8 space-y-4">
            {features.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="text-2xl text-[#008dd2]">{item.icon}</div>

                <h3 className="text-2xl font-bold text-[#0f2b6b]">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <img
              src={googleStore}
              alt=""
              className="h-12 cursor-pointer transition duration-300 hover:scale-105"
            />

            <img
              src={appStore}
              alt=""
              className="h-12 cursor-pointer transition duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Right Side */}

        <div>
          <img
            src={phone}
            alt=""
            className="w-[520px] object-contain"
          />
        </div>
      </div>
    </section>
  );
}

export default AppDownload;