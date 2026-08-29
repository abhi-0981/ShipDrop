import {
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
} from "react-icons/hi";

function Dashboard() {
  const stats = [
    {
      title: "Total Orders",
      value: "0",
      icon: HiOutlineCube,
      text: "All orders",
    },
    {
      title: "In Transit",
      value: "0",
      icon: HiOutlineTruck,
      text: "Currently moving",
    },
    {
      title: "Delivered",
      value: "0",
      icon: HiOutlineClock,
      text: "Successfully delivered",
    },
    {
      title: "Total Revenue",
      value: "₹0",
      icon: HiOutlineCurrencyRupee,
      text: "This month",
    },
  ];

  return (
    <div className="p-7">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">

        <div>
          <p className="text-xs font-medium text-[#008dd2] mb-1">
            OVERVIEW
          </p>

          <h1 className="text-2xl font-semibold text-slate-900">
            Dashboard
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening with your shipments.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />

          <span className="text-xs font-medium text-slate-600">
            System Online
          </span>
        </div>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-white border border-slate-200/80 rounded-xl p-5 hover:border-[#008dd2]/30 hover:shadow-sm transition"
            >

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {item.title}
                  </p>

                  <h2 className="text-2xl font-semibold text-slate-900 mt-2">
                    {item.value}
                  </h2>
                </div>

                <div className="w-10 h-10 rounded-lg bg-[#008dd2]/10 flex items-center justify-center text-[#008dd2]">
                  <Icon size={21} />
                </div>

              </div>

              <p className="text-[11px] text-slate-400 mt-4">
                {item.text}
              </p>

            </div>
          );
        })}

      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-5">

        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white border border-slate-200/80 rounded-xl">

          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Orders
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Latest shipment activity
              </p>
            </div>

            <button className="text-xs font-medium text-[#008dd2] hover:underline">
              View All
            </button>

          </div>

          <div className="min-h-[230px] flex flex-col items-center justify-center px-5">

            <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <HiOutlineCube size={22} />
            </div>

            <h3 className="text-sm font-medium text-slate-700 mt-4">
              No orders yet
            </h3>

            <p className="text-xs text-slate-400 mt-1 text-center">
              Your recent orders will appear here.
            </p>

          </div>

        </div>

        {/* API Status */}
        <div className="bg-white border border-slate-200/80 rounded-xl">

          <div className="px-5 py-4 border-b border-slate-100">

            <h2 className="text-sm font-semibold text-slate-900">
              API Status
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Connected services
            </p>

          </div>

          <div className="p-5 space-y-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </span>

                <div>
                  <p className="text-xs font-medium text-slate-700">
                    Delhivery API
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Shipping service
                  </p>
                </div>

              </div>

              <span className="text-[11px] font-medium text-emerald-600">
                Connected
              </span>

            </div>

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </span>

                <div>
                  <p className="text-xs font-medium text-slate-700">
                    Database
                  </p>

                  <p className="text-[11px] text-slate-400">
                    MySQL
                  </p>
                </div>

              </div>

              <span className="text-[11px] font-medium text-emerald-600">
                Connected
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;